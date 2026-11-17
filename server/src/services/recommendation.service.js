/**
 * Recommendation Service
 * VidTube Platform Architecture - Phase 7 Recommendation Engine
 */
const Video = require('../models/Video');
const WatchHistory = require('../models/WatchHistory');
const Subscription = require('../models/Subscription');
const { VIDEO_VISIBILITY, VIDEO_PROCESSING_STATUS } = require('../constants/appConstants');

/**
 * Get Personalized or General Video Recommendations
 */
const getRecommendations = async ({
  user = null,
  category = 'All',
  page = 1,
  limit = 20
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  // Base filter for candidate videos
  const baseFilter = {
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY
  };

  if (category && category !== 'All') {
    baseFilter.category = new RegExp(`^${category}$`, 'i');
  }

  // If user is not authenticated or has no history, return trending/top-performing videos
  if (!user) {
    const total = await Video.countDocuments(baseFilter);
    const videos = await Video.find(baseFilter)
      .sort({ views: -1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('channel', 'name handle avatar subscribersCount')
      .populate('owner', 'username fullName avatar');

    return {
      videos,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit) || 1
      }
    };
  }

  // For authenticated users:
  // 1. Gather watched video IDs to avoid recommending already-completed videos on page 1
  const historyEntries = await WatchHistory.find({ user: user._id, contentType: 'Video' })
    .sort({ lastWatchedAt: -1 })
    .limit(30)
    .populate('video', 'category tags channel');

  const watchedVideoIds = [];
  const categoryFreq = {};
  const tagsSet = new Set();

  historyEntries.forEach((entry) => {
    if (entry.video) {
      watchedVideoIds.push(entry.video._id);
      if (entry.video.category) {
        categoryFreq[entry.video.category] = (categoryFreq[entry.video.category] || 0) + 1;
      }
      if (Array.isArray(entry.video.tags)) {
        entry.video.tags.forEach((t) => tagsSet.add(t.toLowerCase()));
      }
    }
  });

  // Top preferred category
  const preferredCategories = Object.keys(categoryFreq).sort(
    (a, b) => categoryFreq[b] - categoryFreq[a]
  );

  // 2. Subscribed channels
  const subs = await Subscription.find({ subscriber: user._id }).select('channel');
  const subscribedChannelIds = subs.map((s) => s.channel);

  // If user has preferred category and no explicit category filter was passed
  const query = { ...baseFilter };
  if (!category || category === 'All') {
    if (preferredCategories.length > 0 || subscribedChannelIds.length > 0) {
      query.$or = [];
      if (preferredCategories.length > 0) {
        query.$or.push({ category: { $in: preferredCategories.slice(0, 3) } });
      }
      if (subscribedChannelIds.length > 0) {
        query.$or.push({ channel: { $in: subscribedChannelIds } });
      }
      // Also fallback to popular
      query.$or.push({ views: { $gte: 0 } });
    }
  }

  const total = await Video.countDocuments(query);
  const candidateVideos = await Video.find(query)
    .sort({ views: -1, createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit * 2)
    .populate('channel', 'name handle avatar subscribersCount')
    .populate('owner', 'username fullName avatar');

  // Score candidates with weights:
  // - Subscribed channel: +40
  // - Preferred category: +25
  // - Tag match: +10 per tag
  // - Already completed: -50
  // - Recency bonus: up to +15
  const scored = candidateVideos.map((vid) => {
    let score = 10;
    const isSubscribed = subscribedChannelIds.some((id) => vid.channel && vid.channel._id.equals(id));
    if (isSubscribed) score += 40;

    if (preferredCategories.includes(vid.category)) {
      score += 25;
    }

    if (Array.isArray(vid.tags)) {
      vid.tags.forEach((t) => {
        if (tagsSet.has(t.toLowerCase())) score += 10;
      });
    }

    if (watchedVideoIds.some((id) => id.equals(vid._id))) {
      score -= 30;
    }

    const ageHours = (Date.now() - new Date(vid.createdAt).getTime()) / (1000 * 3600);
    if (ageHours < 24) score += 15;
    else if (ageHours < 72) score += 10;
    else if (ageHours < 168) score += 5;

    score += Math.min(vid.views || 0, 50);

    return { video: vid, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const paginatedVideos = scored.slice(0, parsedLimit).map((item) => item.video);

  return {
    videos: paginatedVideos,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Get Trending Videos (high view velocity / recency)
 */
const getTrending = async (limit = 20) => {
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  // Try fetching videos uploaded within the last 7 days first
  const recentWindow = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  let trending = await Video.find({
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY,
    createdAt: { $gte: recentWindow }
  })
    .sort({ views: -1, likesCount: -1, createdAt: -1 })
    .limit(parsedLimit)
    .populate('channel', 'name handle avatar subscribersCount')
    .populate('owner', 'username fullName avatar');

  // Fallback if low count
  if (trending.length < 5) {
    trending = await Video.find({
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.READY
    })
      .sort({ views: -1, likesCount: -1, createdAt: -1 })
      .limit(parsedLimit)
      .populate('channel', 'name handle avatar subscribersCount')
      .populate('owner', 'username fullName avatar');
  }

  return trending;
};

/**
 * Get Related Videos for Watch Page Sidebar
 */
const getRelated = async (videoId, limit = 15) => {
  const parsedLimit = Math.min(30, Math.max(1, parseInt(limit, 10) || 15));

  const targetVideo = await Video.findById(videoId);
  if (!targetVideo) {
    return [];
  }

  const query = {
    _id: { $ne: targetVideo._id },
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY
  };

  const orClauses = [];
  if (targetVideo.category) {
    orClauses.push({ category: targetVideo.category });
  }
  if (targetVideo.channel) {
    orClauses.push({ channel: targetVideo.channel });
  }
  if (Array.isArray(targetVideo.tags) && targetVideo.tags.length > 0) {
    orClauses.push({ tags: { $in: targetVideo.tags } });
  }

  if (orClauses.length > 0) {
    query.$or = orClauses;
  }

  let related = await Video.find(query)
    .sort({ views: -1, createdAt: -1 })
    .limit(parsedLimit)
    .populate('channel', 'name handle avatar subscribersCount')
    .populate('owner', 'username fullName avatar');

  // If not enough related videos found, fill with other public videos
  if (related.length < parsedLimit) {
    const existingIds = [targetVideo._id, ...related.map((r) => r._id)];
    const additional = await Video.find({
      _id: { $nin: existingIds },
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.READY
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(parsedLimit - related.length)
      .populate('channel', 'name handle avatar subscribersCount')
      .populate('owner', 'username fullName avatar');

    related = related.concat(additional);
  }

  return related;
};

module.exports = {
  getRecommendations,
  getTrending,
  getRelated
};
