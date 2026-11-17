/**
 * Creator Studio & Channel Analytics Service
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 * Real database aggregations, daily timeseries zero-fill, content management & formula injection sanitized CSV
 */
const mongoose = require('mongoose');
const Video = require('../models/Video');
const Short = require('../models/Short');
const Channel = require('../models/Channel');
const Comment = require('../models/Comment');
const Subscription = require('../models/Subscription');
const Like = require('../models/Like');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const WatchHistory = require('../models/WatchHistory');
const { ApiError } = require('../utils/apiError');
const { deleteCloudinaryAsset } = require('./cloudinary.service');
const { logger } = require('../utils/logger');

/**
 * Helper to calculate date ranges for analytics periods
 */
const calculateDateRange = (period = '28d', customStart = null, customEnd = null) => {
  const end = customEnd ? new Date(customEnd) : new Date();
  let days = 28;

  if (period === '7d') days = 7;
  else if (period === '28d') days = 28;
  else if (period === '90d') days = 90;
  else if (period === '365d') days = 365;
  else if (period === 'custom' && customStart) {
    const s = new Date(customStart);
    days = Math.max(1, Math.round((end - s) / (1000 * 60 * 60 * 24)));
  }

  const start = customStart && period === 'custom'
    ? new Date(customStart)
    : new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  // Previous period of equal length for delta comparisons
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000);

  return { start, end, days, prevStart, prevEnd };
};

/**
 * Format date as YYYY-MM-DD
 */
const formatDateKey = (d) => {
  return d.toISOString().split('T')[0];
};

/**
 * Sanitize cell values for CSV to strictly prevent Formula Injection (CSV Injection)
 * Prepend single quote (') if string starts with =, +, -, @, tab, or carriage return
 */
const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape internal double quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Get Creator Studio Dashboard
 */
const getDashboard = async (channelId) => {
  const channel = await Channel.findById(channelId)
    .populate('featuredVideo', 'title duration thumbnailUrl views')
    .lean();

  if (!channel) {
    throw new ApiError(404, 'Channel not found.');
  }

  const { start: last28Start, end: now } = calculateDateRange('28d');

  // Aggregated overview statistics
  const [
    videoCount,
    shortCount,
    viewsEvents,
    watchTimeEvents,
    recentSubsCount,
    latestVideo,
    latestShort,
    topVideos,
    topShorts,
    recentComments,
    recentSubscribers
  ] = await Promise.all([
    Video.countDocuments({ channel: channelId }),
    Short.countDocuments({ channel: channelId }),
    AnalyticsEvent.countDocuments({
      channel: channelId,
      eventType: 'view',
      createdAt: { $gte: last28Start, $lte: now }
    }),
    AnalyticsEvent.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
          eventType: 'watch_time',
          createdAt: { $gte: last28Start, $lte: now }
        }
      },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]),
    Subscription.countDocuments({
      channel: channelId,
      createdAt: { $gte: last28Start, $lte: now }
    }),
    Video.findOne({ channel: channelId }).sort({ createdAt: -1 }).lean(),
    Short.findOne({ channel: channelId }).sort({ createdAt: -1 }).lean(),
    Video.find({ channel: channelId, visibility: 'public' })
      .sort({ views: -1 })
      .limit(5)
      .lean(),
    Short.find({ channel: channelId, visibility: 'public' })
      .sort({ views: -1 })
      .limit(5)
      .lean(),
    Comment.find({
      $or: [
        { video: { $in: await Video.find({ channel: channelId }).distinct('_id') } },
        { short: { $in: await Short.find({ channel: channelId }).distinct('_id') } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name username avatar')
      .populate('video', 'title')
      .populate('short', 'title')
      .lean(),
    Subscription.find({ channel: channelId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('subscriber', 'name username avatar')
      .lean()
  ]);

  const watchTimeSeconds = watchTimeEvents.length > 0 ? watchTimeEvents[0].total : 0;

  // Determine latest published piece of content
  let latestContent = null;
  if (latestVideo && latestShort) {
    latestContent = new Date(latestVideo.createdAt) > new Date(latestShort.createdAt)
      ? { ...latestVideo, contentType: 'Video' }
      : { ...latestShort, contentType: 'Short' };
  } else if (latestVideo) {
    latestContent = { ...latestVideo, contentType: 'Video' };
  } else if (latestShort) {
    latestContent = { ...latestShort, contentType: 'Short' };
  }

  return {
    channel: {
      _id: channel._id,
      name: channel.name,
      handle: channel.handle,
      avatar: channel.avatar,
      banner: channel.banner,
      subscribersCount: channel.subscribersCount || 0,
      totalViews: channel.totalViews || 0,
      videosCount: videoCount,
      shortsCount: shortCount,
      featuredVideo: channel.featuredVideo || null
    },
    overview28d: {
      views: viewsEvents > 0 ? viewsEvents : channel.totalViews || 0,
      watchTimeSeconds,
      watchTimeHours: +(watchTimeSeconds / 3600).toFixed(2),
      subscribersGained: recentSubsCount,
      currentSubscribers: channel.subscribersCount || 0
    },
    latestContent,
    topVideos,
    topShorts,
    recentComments: recentComments.map((c) => ({
      _id: c._id,
      text: c.content || c.text,
      user: c.user,
      contentTitle: c.video?.title || c.short?.title || 'Content',
      contentType: c.video ? 'Video' : 'Short',
      contentId: c.video?._id || c.short?._id,
      createdAt: c.createdAt
    })),
    recentSubscribers: recentSubscribers.map((s) => ({
      _id: s._id,
      user: s.subscriber,
      subscribedAt: s.createdAt
    }))
  };
};

/**
 * Get Channel Analytics Overview with Period & Delta Comparisons
 */
const getAnalyticsOverview = async (channelId, { period = '28d', startDate, endDate }) => {
  const { start, end, prevStart, prevEnd } = calculateDateRange(period, startDate, endDate);
  const chId = new mongoose.Types.ObjectId(channelId);

  // Aggregate current period events
  const [currentEvents, prevEvents, channel, currentPublishedVideos, prevPublishedVideos, currentPublishedShorts, prevPublishedShorts] = await Promise.all([
    AnalyticsEvent.aggregate([
      {
        $match: {
          channel: chId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$eventType',
          totalCount: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          channel: chId,
          createdAt: { $gte: prevStart, $lte: prevEnd }
        }
      },
      {
        $group: {
          _id: '$eventType',
          totalCount: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]),
    Channel.findById(channelId).select('subscribersCount totalViews').lean(),
    Video.countDocuments({ channel: channelId, createdAt: { $gte: start, $lte: end } }),
    Video.countDocuments({ channel: channelId, createdAt: { $gte: prevStart, $lte: prevEnd } }),
    Short.countDocuments({ channel: channelId, createdAt: { $gte: start, $lte: end } }),
    Short.countDocuments({ channel: channelId, createdAt: { $gte: prevStart, $lte: prevEnd } })
  ]);

  const mapEvents = (events) => {
    const res = {
      views: 0,
      watchTime: 0,
      completion: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
      subscribes: 0,
      unsubscribes: 0,
      shares: 0
    };
    events.forEach((ev) => {
      if (ev._id === 'view') res.views = ev.totalCount;
      else if (ev._id === 'watch_time') res.watchTime = ev.totalValue;
      else if (ev._id === 'completion') res.completion = ev.totalCount;
      else if (ev._id === 'like') res.likes = ev.totalCount;
      else if (ev._id === 'dislike') res.dislikes = ev.totalCount;
      else if (ev._id === 'comment') res.comments = ev.totalCount;
      else if (ev._id === 'subscribe') res.subscribes = ev.totalCount;
      else if (ev._id === 'unsubscribe') res.unsubscribes = ev.totalCount;
      else if (ev._id === 'share') res.shares = ev.totalCount;
    });
    return res;
  };

  const curr = mapEvents(currentEvents);
  const prev = mapEvents(prevEvents);

  const calculateDelta = (currentVal, previousVal) => {
    const diff = currentVal - previousVal;
    let percentChange = 0;
    if (previousVal > 0) {
      percentChange = +((diff / previousVal) * 100).toFixed(1);
    } else if (currentVal > 0) {
      percentChange = 100;
    }
    return {
      current: currentVal,
      previous: previousVal,
      diff,
      percentChange
    };
  };

  return {
    period,
    dateRange: {
      start: formatDateKey(start),
      end: formatDateKey(end),
      prevStart: formatDateKey(prevStart),
      prevEnd: formatDateKey(prevEnd)
    },
    metrics: {
      views: calculateDelta(curr.views, prev.views),
      watchTimeSeconds: calculateDelta(curr.watchTime, prev.watchTime),
      watchTimeHours: calculateDelta(+(curr.watchTime / 3600).toFixed(2), +(prev.watchTime / 3600).toFixed(2)),
      subscribersGained: calculateDelta(curr.subscribes, prev.subscribes),
      subscribersLost: calculateDelta(curr.unsubscribes, prev.unsubscribes),
      subscribersNet: calculateDelta(curr.subscribes - curr.unsubscribes, prev.subscribes - prev.unsubscribes),
      likes: calculateDelta(curr.likes, prev.likes),
      comments: calculateDelta(curr.comments, prev.comments),
      shares: calculateDelta(curr.shares, prev.shares),
      contentPublished: calculateDelta(
        currentPublishedVideos + currentPublishedShorts,
        prevPublishedVideos + prevPublishedShorts
      )
    },
    channelTotals: {
      subscribersCount: channel ? channel.subscribersCount : 0,
      totalViews: channel ? channel.totalViews : 0
    }
  };
};

/**
 * Get Daily Timeseries with Guaranteed Zero-Fill Continuity
 */
const getTimeseries = async (channelId, { period = '28d', metric = 'views', startDate, endDate }) => {
  const { start, end, days } = calculateDateRange(period, startDate, endDate);
  const chId = new mongoose.Types.ObjectId(channelId);

  // Map metric to AnalyticsEvent eventType
  let eventType = 'view';
  let isSumValue = false;

  if (metric === 'watchTime') {
    eventType = 'watch_time';
    isSumValue = true;
  } else if (metric === 'likes') {
    eventType = 'like';
  } else if (metric === 'comments') {
    eventType = 'comment';
  } else if (metric === 'shares') {
    eventType = 'share';
  } else if (metric === 'subscribers') {
    eventType = 'subscribe';
  }

  // Aggregate daily records from DB
  const rawEvents = await AnalyticsEvent.aggregate([
    {
      $match: {
        channel: chId,
        eventType: metric === 'subscribers' ? { $in: ['subscribe', 'unsubscribe'] } : eventType,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$eventType'
        },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    }
  ]);

  // Build lookup dictionary by date
  const dateMap = new Map();
  rawEvents.forEach((item) => {
    const d = item._id.date;
    if (!dateMap.has(d)) {
      dateMap.set(d, { count: 0, totalValue: 0, gained: 0, lost: 0 });
    }
    const entry = dateMap.get(d);
    if (metric === 'subscribers') {
      if (item._id.type === 'subscribe') entry.gained += item.count;
      if (item._id.type === 'unsubscribe') entry.lost += item.count;
    } else {
      entry.count += item.count;
      entry.totalValue += item.totalValue;
    }
  });

  // Zero-fill all calendar days in range without gaps
  const timeseries = [];
  const currentCursor = new Date(start.getTime());

  while (currentCursor <= end) {
    const dateKey = formatDateKey(currentCursor);
    const recorded = dateMap.get(dateKey);

    let val = 0;
    if (recorded) {
      if (metric === 'subscribers') {
        val = recorded.gained - recorded.lost;
      } else if (isSumValue) {
        val = recorded.totalValue;
      } else {
        val = recorded.count;
      }
    }

    timeseries.push({
      date: dateKey,
      value: val,
      metric
    });

    // Advance 1 day
    currentCursor.setDate(currentCursor.getDate() + 1);
  }

  const total = timeseries.reduce((acc, curr) => acc + curr.value, 0);
  const average = timeseries.length > 0 ? +(total / timeseries.length).toFixed(2) : 0;
  const max = timeseries.reduce((m, curr) => Math.max(m, curr.value), 0);

  return {
    metric,
    period,
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
    total,
    average,
    max,
    data: timeseries
  };
};

/**
 * Get Top Content (Videos / Shorts)
 */
const getTopContent = async (channelId, { period = '28d', type = 'all', sortBy = 'views', limit = 10 }) => {
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const sortOption = {};
  if (sortBy === 'likes') sortOption.likesCount = -1;
  else if (sortBy === 'comments') sortOption.commentsCount = -1;
  else sortOption.views = -1;

  let videos = [];
  let shorts = [];

  if (type === 'all' || type === 'video') {
    videos = await Video.find({ channel: channelId })
      .sort(sortOption)
      .limit(parsedLimit)
      .lean();
  }

  if (type === 'all' || type === 'short') {
    shorts = await Short.find({ channel: channelId })
      .sort(sortOption)
      .limit(parsedLimit)
      .lean();
  }

  // Combine and unify format
  const unified = [
    ...videos.map((v) => ({ ...v, contentType: 'Video' })),
    ...shorts.map((s) => ({ ...s, contentType: 'Short' }))
  ];

  // Re-sort combined
  unified.sort((a, b) => {
    const valA = a[sortBy === 'likes' ? 'likesCount' : sortBy === 'comments' ? 'commentsCount' : 'views'] || 0;
    const valB = b[sortBy === 'likes' ? 'likesCount' : sortBy === 'comments' ? 'commentsCount' : 'views'] || 0;
    return valB - valA;
  });

  return unified.slice(0, parsedLimit).map((item) => ({
    _id: item._id,
    contentType: item.contentType,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    duration: item.duration || 0,
    views: item.views || 0,
    likesCount: item.likesCount || 0,
    commentsCount: item.commentsCount || 0,
    visibility: item.visibility,
    createdAt: item.createdAt
  }));
};

/**
 * Get Audience Breakdown
 */
const getAudience = async (channelId, { period = '28d' }) => {
  const { start, end } = calculateDateRange(period);
  const chId = new mongoose.Types.ObjectId(channelId);

  // 1. Content Type Breakdown: Videos vs Shorts
  const [videoStats, shortStats] = await Promise.all([
    Video.aggregate([
      { $match: { channel: chId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
          count: { $sum: 1 }
        }
      }
    ]),
    Short.aggregate([
      { $match: { channel: chId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const vViews = videoStats[0]?.totalViews || 0;
  const sViews = shortStats[0]?.totalViews || 0;
  const totalViews = vViews + sViews;

  // 2. Subscriber vs Non-Subscriber Views in Period
  const activeSubscribers = await Subscription.find({ channel: channelId }).distinct('subscriber');
  const [subViewsCount, nonSubViewsCount] = await Promise.all([
    AnalyticsEvent.countDocuments({
      channel: channelId,
      eventType: 'view',
      createdAt: { $gte: start, $lte: end },
      viewer: { $in: activeSubscribers }
    }),
    AnalyticsEvent.countDocuments({
      channel: channelId,
      eventType: 'view',
      createdAt: { $gte: start, $lte: end },
      $or: [{ viewer: { $nin: activeSubscribers } }, { viewer: null }]
    })
  ]);

  const totalPeriodViews = subViewsCount + nonSubViewsCount;
  const subPercent = totalPeriodViews > 0 ? +((subViewsCount / totalPeriodViews) * 100).toFixed(1) : 0;
  const nonSubPercent = totalPeriodViews > 0 ? +((nonSubViewsCount / totalPeriodViews) * 100).toFixed(1) : 0;

  return {
    contentDistribution: {
      videos: {
        count: videoStats[0]?.count || 0,
        views: vViews,
        percent: totalViews > 0 ? +((vViews / totalViews) * 100).toFixed(1) : 0
      },
      shorts: {
        count: shortStats[0]?.count || 0,
        views: sViews,
        percent: totalViews > 0 ? +((sViews / totalViews) * 100).toFixed(1) : 0
      }
    },
    subscriberVsNonSubscriber: {
      subscriberViews: subViewsCount,
      nonSubscriberViews: nonSubViewsCount,
      subscriberPercent: subPercent,
      nonSubscriberPercent: nonSubPercent
    }
  };
};

/**
 * Get Subscriber Analytics & History
 */
const getSubscriberAnalytics = async (channelId, { period = '28d' }) => {
  const { start, end } = calculateDateRange(period);
  const chId = new mongoose.Types.ObjectId(channelId);

  const [channel, gainedCount, lostCount, recentSubscribers] = await Promise.all([
    Channel.findById(channelId).select('subscribersCount').lean(),
    AnalyticsEvent.countDocuments({
      channel: chId,
      eventType: 'subscribe',
      createdAt: { $gte: start, $lte: end }
    }),
    AnalyticsEvent.countDocuments({
      channel: chId,
      eventType: 'unsubscribe',
      createdAt: { $gte: start, $lte: end }
    }),
    Subscription.find({ channel: channelId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('subscriber', 'name username avatar')
      .lean()
  ]);

  return {
    totalSubscribers: channel ? channel.subscribersCount : 0,
    gained: gainedCount,
    lost: lostCount,
    net: gainedCount - lostCount,
    recentSubscribers: recentSubscribers.map((s) => ({
      _id: s._id,
      subscriber: s.subscriber,
      subscribedAt: s.createdAt
    }))
  };
};

/**
 * Get Single Content Analytics Deep-Dive
 */
const getContentAnalytics = async (channelId, contentId) => {
  let content = await Video.findOne({ _id: contentId, channel: channelId }).lean();
  let contentType = 'Video';

  if (!content) {
    content = await Short.findOne({ _id: contentId, channel: channelId }).lean();
    contentType = 'Short';
  }

  if (!content) {
    throw new ApiError(404, 'Content not found or does not belong to your channel.');
  }

  const { start, end } = calculateDateRange('28d');
  const cId = new mongoose.Types.ObjectId(contentId);

  // Daily views timeseries for this specific video/short
  const rawEvents = await AnalyticsEvent.aggregate([
    {
      $match: {
        contentId: cId,
        eventType: 'view',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        views: { $sum: 1 }
      }
    }
  ]);

  const viewMap = new Map();
  rawEvents.forEach((ev) => viewMap.set(ev._id, ev.views));

  const timeseries = [];
  const cur = new Date(start.getTime());
  while (cur <= end) {
    const dStr = formatDateKey(cur);
    timeseries.push({
      date: dStr,
      views: viewMap.get(dStr) || 0
    });
    cur.setDate(cur.getDate() + 1);
  }

  return {
    content: {
      _id: content._id,
      contentType,
      title: content.title,
      description: content.description,
      thumbnailUrl: content.thumbnailUrl,
      videoUrl: content.videoUrl,
      duration: content.duration || 0,
      views: content.views || 0,
      likesCount: content.likesCount || 0,
      dislikesCount: content.dislikesCount || 0,
      commentsCount: content.commentsCount || 0,
      visibility: content.visibility,
      createdAt: content.createdAt
    },
    timeseries28d: timeseries
  };
};

/**
 * Studio Content Management: Unified Video & Shorts List
 */
const getStudioContent = async (channelId, {
  type = 'all',
  visibility,
  status,
  sortBy = 'createdAt',
  order = 'desc',
  page = 1,
  limit = 20,
  q = ''
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const baseFilter = { channel: channelId };
  if (visibility) baseFilter.visibility = visibility;
  if (status) baseFilter.processingStatus = status;

  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    baseFilter.$or = [{ title: rx }, { description: rx }];
  }

  let videos = [];
  let shorts = [];

  if (type === 'all' || type === 'video') {
    videos = await Video.find(baseFilter).lean();
  }
  if (type === 'all' || type === 'short') {
    shorts = await Short.find(baseFilter).lean();
  }

  const combined = [
    ...videos.map((v) => ({ ...v, contentType: 'Video' })),
    ...shorts.map((s) => ({ ...s, contentType: 'Short' }))
  ];

  // In-memory sort combined list
  const isDesc = order === 'desc';
  combined.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (typeof valA === 'string') {
      return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
    } else {
      valA = valA || 0;
      valB = valB || 0;
    }

    return isDesc ? valB - valA : valA - valB;
  });

  const total = combined.length;
  const paginated = combined.slice(skip, skip + parsedLimit);

  return {
    items: paginated.map((item) => ({
      _id: item._id,
      contentType: item.contentType,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      videoUrl: item.videoUrl,
      duration: item.duration || 0,
      views: item.views || 0,
      likesCount: item.likesCount || 0,
      dislikesCount: item.dislikesCount || 0,
      commentsCount: item.commentsCount || 0,
      visibility: item.visibility,
      processingStatus: item.processingStatus || 'completed',
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Update Content Metadata (Owner Only)
 */
const updateStudioContent = async (channelId, contentId, updateData) => {
  let doc = await Video.findOne({ _id: contentId, channel: channelId });
  let isVideo = true;

  if (!doc) {
    doc = await Short.findOne({ _id: contentId, channel: channelId });
    isVideo = false;
  }

  if (!doc) {
    throw new ApiError(404, 'Content not found or you do not have permission to edit it.');
  }

  const { title, description, visibility, tags, soundTitle } = updateData;

  if (title !== undefined) doc.title = title.trim();
  if (description !== undefined) doc.description = description.trim();
  if (visibility !== undefined) {
    doc.visibility = visibility;
    doc.isPublished = visibility !== 'private';
  }
  if (tags !== undefined) {
    doc.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (!isVideo && soundTitle !== undefined) {
    doc.soundTitle = soundTitle.trim();
  }

  await doc.save();
  return {
    _id: doc._id,
    contentType: isVideo ? 'Video' : 'Short',
    title: doc.title,
    description: doc.description,
    visibility: doc.visibility,
    tags: doc.tags,
    updatedAt: doc.updatedAt
  };
};

/**
 * Delete Content (Owner Only)
 */
const deleteStudioContent = async (channelId, contentId) => {
  let doc = await Video.findOne({ _id: contentId, channel: channelId });
  let isVideo = true;

  if (!doc) {
    doc = await Short.findOne({ _id: contentId, channel: channelId });
    isVideo = false;
  }

  if (!doc) {
    throw new ApiError(404, 'Content not found or you do not have permission to delete it.');
  }

  // Purge Cloudinary assets
  if (doc.publicId) {
    await deleteCloudinaryAsset(doc.publicId, 'video').catch((err) => {
      logger.warn(`Failed to delete Cloudinary asset [${doc.publicId}]: ${err.message}`);
    });
  }

  if (isVideo) {
    await Video.findByIdAndDelete(contentId);
  } else {
    await Short.findByIdAndDelete(contentId);
  }

  // Delete associated comments and likes
  await Promise.all([
    Comment.deleteMany({ [isVideo ? 'video' : 'short']: contentId }),
    Like.deleteMany({ contentId })
  ]);

  return { success: true, message: `${isVideo ? 'Video' : 'Short'} deleted successfully.` };
};

/**
 * Get Creator Studio Comments across owned content
 */
const getStudioComments = async (channelId, { contentId, contentType, page = 1, limit = 20, q = '' }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  let contentFilter = {};

  if (contentId) {
    contentFilter = { $or: [{ video: contentId }, { short: contentId }] };
  } else {
    // Collect all owned video and short IDs
    const [ownedVideoIds, ownedShortIds] = await Promise.all([
      Video.find({ channel: channelId }).distinct('_id'),
      Short.find({ channel: channelId }).distinct('_id')
    ]);

    contentFilter = {
      $or: [
        { video: { $in: ownedVideoIds } },
        { short: { $in: ownedShortIds } }
      ]
    };
  }

  if (q && q.trim()) {
    contentFilter.content = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
  }

  const [comments, total] = await Promise.all([
    Comment.find(contentFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('user', 'name username avatar')
      .populate('video', 'title thumbnailUrl')
      .populate('short', 'title thumbnailUrl')
      .lean(),
    Comment.countDocuments(contentFilter)
  ]);

  return {
    comments: comments.map((c) => ({
      _id: c._id,
      text: c.content || c.text,
      user: c.user,
      contentTitle: c.video?.title || c.short?.title || 'Unknown Content',
      contentThumbnail: c.video?.thumbnailUrl || c.short?.thumbnailUrl || '',
      contentType: c.video ? 'Video' : 'Short',
      contentId: c.video?._id || c.short?._id,
      likesCount: c.likesCount || 0,
      repliesCount: c.repliesCount || 0,
      parentComment: c.parentComment || null,
      createdAt: c.createdAt
    })),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Get Channel Customization Profile
 */
const getChannelCustomization = async (channelId) => {
  const channel = await Channel.findById(channelId)
    .populate('featuredVideo', 'title duration thumbnailUrl views createdAt')
    .lean();

  if (!channel) {
    throw new ApiError(404, 'Channel not found.');
  }

  return {
    _id: channel._id,
    name: channel.name,
    handle: channel.handle,
    description: channel.description || '',
    avatar: channel.avatar || '',
    banner: channel.banner || '',
    featuredVideo: channel.featuredVideo || null,
    defaultVisibility: channel.defaultVisibility || 'public',
    links: channel.links || [],
    socialLinks: channel.socialLinks || {},
    subscribersCount: channel.subscribersCount || 0,
    totalViews: channel.totalViews || 0,
    isVerified: channel.isVerified || false
  };
};

/**
 * Update Channel Customization (Owner Only)
 */
const updateChannelCustomization = async (channelId, userId, updateData) => {
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new ApiError(404, 'Channel not found.');
  }

  if (!channel.owner.equals(userId)) {
    throw new ApiError(403, 'Forbidden. You do not own this channel.');
  }

  const {
    name,
    handle,
    description,
    avatar,
    banner,
    featuredVideo,
    defaultVisibility,
    links,
    socialLinks
  } = updateData;

  if (name !== undefined) channel.name = name.trim();
  if (handle !== undefined) {
    const cleanHandle = handle.trim().replace(/^@+/, '');
    // Check uniqueness if changed
    if (cleanHandle !== channel.handle) {
      const existing = await Channel.findOne({ handle: cleanHandle, _id: { $ne: channelId } });
      if (existing) {
        throw new ApiError(409, 'This channel handle is already taken.');
      }
      channel.handle = cleanHandle;
    }
  }
  if (description !== undefined) channel.description = description.trim();
  if (avatar !== undefined) channel.avatar = avatar;
  if (banner !== undefined) channel.banner = banner;
  if (featuredVideo !== undefined) {
    if (featuredVideo === null || featuredVideo === '') {
      channel.featuredVideo = null;
    } else {
      const v = await Video.findOne({ _id: featuredVideo, channel: channelId });
      if (!v) {
        throw new ApiError(400, 'Featured video must belong to your channel.');
      }
      channel.featuredVideo = v._id;
    }
  }
  if (defaultVisibility !== undefined) {
    if (['public', 'unlisted', 'private'].includes(defaultVisibility)) {
      channel.defaultVisibility = defaultVisibility;
    }
  }
  if (links !== undefined && Array.isArray(links)) {
    channel.links = links;
  }
  if (socialLinks !== undefined && typeof socialLinks === 'object') {
    channel.socialLinks = socialLinks;
  }

  await channel.save();

  return await getChannelCustomization(channelId);
};

/**
 * Export Channel Analytics to RFC 4180 CSV with Formula Injection Sanitization
 */
const exportAnalyticsCSV = async (channelId, { type = 'overview', period = '28d' }) => {
  const channel = await Channel.findById(channelId).select('name handle').lean();
  if (!channel) {
    throw new ApiError(404, 'Channel not found.');
  }

  if (type === 'timeseries') {
    const timeseries = await getTimeseries(channelId, { period, metric: 'views' });
    const rows = [
      ['Date', 'Views', 'Metric', 'Channel'],
      ...timeseries.data.map((row) => [
        row.date,
        row.value,
        row.metric,
        channel.name
      ])
    ];

    return rows.map((r) => r.map(sanitizeCsvCell).join(',')).join('\r\n');
  }

  if (type === 'content') {
    const content = await getStudioContent(channelId, { type: 'all', limit: 100 });
    const rows = [
      ['Title', 'Content Type', 'Views', 'Likes', 'Comments', 'Visibility', 'Created At'],
      ...content.items.map((item) => [
        item.title,
        item.contentType,
        item.views,
        item.likesCount,
        item.commentsCount,
        item.visibility,
        item.createdAt ? new Date(item.createdAt).toISOString() : ''
      ])
    ];

    return rows.map((r) => r.map(sanitizeCsvCell).join(',')).join('\r\n');
  }

  // Default: Overview Summary
  const overview = await getAnalyticsOverview(channelId, { period });
  const rows = [
    ['Metric', 'Current Period', 'Previous Period', 'Difference', 'Percentage Change'],
    ['Views', overview.metrics.views.current, overview.metrics.views.previous, overview.metrics.views.diff, `${overview.metrics.views.percentChange}%`],
    ['Watch Time (Hours)', overview.metrics.watchTimeHours.current, overview.metrics.watchTimeHours.previous, overview.metrics.watchTimeHours.diff, `${overview.metrics.watchTimeHours.percentChange}%`],
    ['Subscribers Gained', overview.metrics.subscribersGained.current, overview.metrics.subscribersGained.previous, overview.metrics.subscribersGained.diff, `${overview.metrics.subscribersGained.percentChange}%`],
    ['Subscribers Lost', overview.metrics.subscribersLost.current, overview.metrics.subscribersLost.previous, overview.metrics.subscribersLost.diff, `${overview.metrics.subscribersLost.percentChange}%`],
    ['Net Subscribers', overview.metrics.subscribersNet.current, overview.metrics.subscribersNet.previous, overview.metrics.subscribersNet.diff, `${overview.metrics.subscribersNet.percentChange}%`],
    ['Likes', overview.metrics.likes.current, overview.metrics.likes.previous, overview.metrics.likes.diff, `${overview.metrics.likes.percentChange}%`],
    ['Comments', overview.metrics.comments.current, overview.metrics.comments.previous, overview.metrics.comments.diff, `${overview.metrics.comments.percentChange}%`],
    ['Content Published', overview.metrics.contentPublished.current, overview.metrics.contentPublished.previous, overview.metrics.contentPublished.diff, `${overview.metrics.contentPublished.percentChange}%`]
  ];

  return rows.map((r) => r.map(sanitizeCsvCell).join(',')).join('\r\n');
};

module.exports = {
  calculateDateRange,
  sanitizeCsvCell,
  getDashboard,
  getAnalyticsOverview,
  getTimeseries,
  getTopContent,
  getAudience,
  getSubscriberAnalytics,
  getContentAnalytics,
  getStudioContent,
  updateStudioContent,
  deleteStudioContent,
  getStudioComments,
  getChannelCustomization,
  updateChannelCustomization,
  exportAnalyticsCSV
};
