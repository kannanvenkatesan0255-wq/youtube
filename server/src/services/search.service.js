/**
 * Search Service
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
const Video = require('../models/Video');
const Short = require('../models/Short');
const Channel = require('../models/Channel');
const SearchHistory = require('../models/SearchHistory');
const { VIDEO_VISIBILITY, VIDEO_PROCESSING_STATUS } = require('../constants/appConstants');

const escapeRegex = (str) => {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * Execute Search Query Across Videos, Shorts, and Channels
 */
const search = async ({
  q = '',
  type = 'all',
  uploadDate = 'all',
  duration = 'all',
  sortBy = 'relevance',
  category = '',
  page = 1,
  limit = 20,
  user = null
}) => {
  const queryStr = q ? q.trim() : '';
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  // Persist search history for authenticated users
  if (user && queryStr) {
    try {
      await SearchHistory.findOneAndUpdate(
        { user: user._id, query: queryStr.toLowerCase() },
        { query: queryStr, lastSearchedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      // Non-blocking history recording
    }
  }

  // Build Date Filter
  let dateQuery = null;
  const now = Date.now();
  if (uploadDate === 'hour') {
    dateQuery = { $gte: new Date(now - 3600 * 1000) };
  } else if (uploadDate === 'today') {
    dateQuery = { $gte: new Date(now - 24 * 3600 * 1000) };
  } else if (uploadDate === 'week') {
    dateQuery = { $gte: new Date(now - 7 * 24 * 3600 * 1000) };
  } else if (uploadDate === 'month') {
    dateQuery = { $gte: new Date(now - 30 * 24 * 3600 * 1000) };
  } else if (uploadDate === 'year') {
    dateQuery = { $gte: new Date(now - 365 * 24 * 3600 * 1000) };
  }

  // Build Duration Filter for Videos
  let durationQuery = null;
  if (duration === 'under4m') {
    durationQuery = { $lt: 240 };
  } else if (duration === '4to20m') {
    durationQuery = { $gte: 240, $lte: 1200 };
  } else if (duration === 'over20m') {
    durationQuery = { $gt: 1200 };
  }

  // Base video query - exclude non-ready and non-public
  const videoFilter = {
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY
  };

  if (dateQuery) {
    videoFilter.createdAt = dateQuery;
  }
  if (durationQuery) {
    videoFilter.duration = durationQuery;
  }
  if (category && category !== 'All') {
    videoFilter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  }

  // Base short query - exclude non-ready and non-public
  const shortFilter = {
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY
  };
  if (dateQuery) {
    shortFilter.createdAt = dateQuery;
  }

  // Channel query filter
  const channelFilter = {};

  if (queryStr) {
    const rx = new RegExp(escapeRegex(queryStr), 'i');
    videoFilter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    shortFilter.$or = [{ title: rx }, { description: rx }, { tags: rx }];

    const handleClean = queryStr.replace(/^@/, '');
    channelFilter.$or = [
      { name: rx },
      { handle: new RegExp(escapeRegex(handleClean), 'i') },
      { description: rx }
    ];
  }

  // Sort specification
  let videoSort = { createdAt: -1 };
  let shortSort = { createdAt: -1 };
  let channelSort = { subscribersCount: -1 };

  if (sortBy === 'date') {
    videoSort = { createdAt: -1 };
    shortSort = { createdAt: -1 };
  } else if (sortBy === 'views') {
    videoSort = { views: -1, createdAt: -1 };
    shortSort = { views: -1, createdAt: -1 };
  } else if (sortBy === 'rating') {
    videoSort = { likesCount: -1, createdAt: -1 };
    shortSort = { likesCount: -1, createdAt: -1 };
  } else {
    // Relevance - default sort (views + recency)
    videoSort = { views: -1, createdAt: -1 };
    shortSort = { views: -1, createdAt: -1 };
  }

  const results = {
    query: queryStr,
    filters: { type, uploadDate, duration, sortBy, category },
    channels: [],
    videos: [],
    shorts: [],
    items: [],
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total: 0,
      pages: 1
    }
  };

  // Branch by type
  if (type === 'channel') {
    const totalChannels = await Channel.countDocuments(channelFilter);
    const channels = await Channel.find(channelFilter)
      .sort(channelSort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('owner', 'username fullName avatar');

    results.channels = channels;
    results.items = channels.map((c) => ({ type: 'channel', data: c }));
    results.pagination.total = totalChannels;
    results.pagination.pages = Math.ceil(totalChannels / parsedLimit) || 1;
    return results;
  }

  if (type === 'short') {
    const totalShorts = await Short.countDocuments(shortFilter);
    const shorts = await Short.find(shortFilter)
      .sort(shortSort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('channel', 'name handle avatar subscribersCount')
      .populate('owner', 'username fullName avatar');

    results.shorts = shorts;
    results.items = shorts.map((s) => ({ type: 'short', data: s }));
    results.pagination.total = totalShorts;
    results.pagination.pages = Math.ceil(totalShorts / parsedLimit) || 1;
    return results;
  }

  if (type === 'video') {
    const totalVideos = await Video.countDocuments(videoFilter);
    const videos = await Video.find(videoFilter)
      .sort(videoSort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('channel', 'name handle avatar subscribersCount')
      .populate('owner', 'username fullName avatar');

    results.videos = videos;
    results.items = videos.map((v) => ({ type: 'video', data: v }));
    results.pagination.total = totalVideos;
    results.pagination.pages = Math.ceil(totalVideos / parsedLimit) || 1;
    return results;
  }

  // Type === 'all'
  // 1. If page 1, fetch top matching channel(s)
  if (parsedPage === 1 && queryStr) {
    results.channels = await Channel.find(channelFilter)
      .sort(channelSort)
      .limit(2)
      .populate('owner', 'username fullName avatar');
  }

  // 2. Fetch matching shorts (up to 6)
  if (parsedPage === 1) {
    results.shorts = await Short.find(shortFilter)
      .sort(shortSort)
      .limit(6)
      .populate('channel', 'name handle avatar subscribersCount');
  }

  // 3. Fetch matching videos with pagination
  const totalVideos = await Video.countDocuments(videoFilter);
  const videos = await Video.find(videoFilter)
    .sort(videoSort)
    .skip(skip)
    .limit(parsedLimit)
    .populate('channel', 'name handle avatar subscribersCount')
    .populate('owner', 'username fullName avatar');

  results.videos = videos;

  // Build unified items array:
  // Channels first, then first batch of videos, then shorts shelf, then remaining videos
  const items = [];
  results.channels.forEach((c) => items.push({ type: 'channel', data: c }));
  if (results.shorts.length > 0) {
    items.push({ type: 'shorts_shelf', data: results.shorts });
  }
  videos.forEach((v) => items.push({ type: 'video', data: v }));

  results.items = items;
  results.pagination.total = totalVideos;
  results.pagination.pages = Math.ceil(totalVideos / parsedLimit) || 1;

  return results;
};

/**
 * Autocomplete / Live Search Suggestions
 */
const getSuggestions = async (queryStr = '', user = null) => {
  const trimmed = queryStr ? queryStr.trim() : '';
  const suggestions = [];
  const seen = new Set();

  // 1. Recent personal search history (if authenticated)
  if (user) {
    const historyFilter = { user: user._id };
    if (trimmed) {
      historyFilter.query = new RegExp(`^${escapeRegex(trimmed)}`, 'i');
    }
    const historyItems = await SearchHistory.find(historyFilter)
      .sort({ lastSearchedAt: -1 })
      .limit(5);

    historyItems.forEach((h) => {
      const lower = h.query.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        suggestions.push({
          text: h.query,
          type: 'history',
          id: h._id
        });
      }
    });
  }

  // If query is empty and we have user history, return top 10 history queries
  if (!trimmed) {
    return suggestions.slice(0, 10);
  }

  const rx = new RegExp(escapeRegex(trimmed), 'i');

  // 2. Matching Channels
  const channels = await Channel.find({
    $or: [
      { name: rx },
      { handle: new RegExp(escapeRegex(trimmed.replace(/^@/, '')), 'i') }
    ]
  })
    .select('name handle avatar subscribersCount')
    .limit(3);

  channels.forEach((c) => {
    const key = `channel:${c.handle}`;
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push({
        text: c.name,
        handle: c.handle,
        avatar: c.avatar,
        type: 'channel',
        id: c._id
      });
    }
  });

  // 3. Matching Video Titles
  const videos = await Video.find({
    title: rx,
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY
  })
    .select('title')
    .limit(8);

  videos.forEach((v) => {
    const lower = v.title.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      suggestions.push({
        text: v.title,
        type: 'query'
      });
    }
  });

  // 4. Matching Short Titles
  const shorts = await Short.find({
    title: rx,
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY
  })
    .select('title')
    .limit(4);

  shorts.forEach((s) => {
    const lower = s.title.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      suggestions.push({
        text: s.title,
        type: 'query'
      });
    }
  });

  return suggestions.slice(0, 10);
};

/**
 * Get User Search History
 */
const getSearchHistory = async (userId, limit = 20) => {
  return SearchHistory.find({ user: userId })
    .sort({ lastSearchedAt: -1 })
    .limit(limit);
};

/**
 * Delete Single Search History Item
 */
const deleteSearchHistoryItem = async (userId, historyId) => {
  return SearchHistory.findOneAndDelete({ _id: historyId, user: userId });
};

/**
 * Clear All User Search History
 */
const clearSearchHistory = async (userId) => {
  return SearchHistory.deleteMany({ user: userId });
};

module.exports = {
  search,
  getSuggestions,
  getSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory
};
