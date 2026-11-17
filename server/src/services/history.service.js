/**
 * Watch History Service
 * VidTube Platform Architecture - Phase 7 Watch History & Continue Watching
 */
const WatchHistory = require('../models/WatchHistory');
const Video = require('../models/Video');
const Short = require('../models/Short');
const { recordEvent } = require('./analytics.service');
const { ApiError } = require('../utils/apiError');
const { VIDEO_VISIBILITY } = require('../constants/appConstants');

const escapeRegex = (str) => {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * Record or Update Watch Progress for Video or Short
 */
const trackProgress = async ({
  userId,
  targetId,
  contentType = 'Video',
  watchedSeconds = 0,
  duration = 0,
  completed = false
}) => {
  const isCompleted =
    completed === true ||
    (duration > 0 && watchedSeconds > 0 && watchedSeconds / duration >= 0.9);

  const query = { user: userId };
  const updateData = {
    contentType,
    watchedSeconds: Math.max(0, watchedSeconds),
    duration: Math.max(0, duration),
    completed: isCompleted,
    lastWatchedAt: new Date()
  };

  if (contentType === 'Short') {
    query.short = targetId;
    updateData.short = targetId;
  } else {
    query.video = targetId;
    updateData.video = targetId;
  }

  const record = await WatchHistory.findOneAndUpdate(
    query,
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Asynchronously record watch_time and completion analytics
  (async () => {
    try {
      let targetChannel = null;
      if (contentType === 'Short') {
        const s = await Short.findById(targetId).select('channel');
        if (s) targetChannel = s.channel;
      } else {
        const v = await Video.findById(targetId).select('channel');
        if (v) targetChannel = v.channel;
      }

      if (targetChannel) {
        if (watchedSeconds > 0) {
          recordEvent({
            channelId: targetChannel,
            contentType,
            contentId: targetId,
            eventType: 'watch_time',
            value: watchedSeconds,
            viewer: userId
          });
        }
        if (isCompleted) {
          recordEvent({
            channelId: targetChannel,
            contentType,
            contentId: targetId,
            eventType: 'completion',
            value: 1,
            viewer: userId
          });
        }
      }
    } catch (_) {}
  })();

  return record;
};

/**
 * Get User Watch History with Query Search & Pagination
 */
const getHistory = async ({
  userId,
  q = '',
  page = 1,
  limit = 20
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = { user: userId };

  const historyEntries = await WatchHistory.find(filter)
    .sort({ lastWatchedAt: -1 })
    .populate({
      path: 'video',
      select: 'title description thumbnailUrl duration views visibility createdAt channel',
      populate: { path: 'channel', select: 'name handle avatar subscribersCount' }
    })
    .populate({
      path: 'short',
      select: 'title description thumbnailUrl duration views visibility createdAt channel',
      populate: { path: 'channel', select: 'name handle avatar subscribersCount' }
    });

  // Filter out any where referenced video/short no longer exists
  let validEntries = historyEntries.filter((item) => {
    return (item.contentType === 'Short' && item.short != null) ||
           (item.contentType === 'Video' && item.video != null);
  });

  // In-memory query filter if q is provided
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    validEntries = validEntries.filter((entry) => {
      const target = entry.contentType === 'Short' ? entry.short : entry.video;
      return target && (rx.test(target.title) || rx.test(target.description));
    });
  }

  const total = validEntries.length;
  const paginated = validEntries.slice(skip, skip + parsedLimit);

  return {
    history: paginated,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Get Partially Watched Videos for "Continue Watching"
 */
const getContinueWatching = async (userId, limit = 12) => {
  const parsedLimit = Math.min(30, Math.max(1, parseInt(limit, 10) || 12));

  const entries = await WatchHistory.find({
    user: userId,
    contentType: 'Video',
    completed: false,
    watchedSeconds: { $gt: 5 }
  })
    .sort({ lastWatchedAt: -1 })
    .limit(parsedLimit * 2)
    .populate({
      path: 'video',
      select: 'title description thumbnailUrl duration views visibility createdAt channel',
      populate: { path: 'channel', select: 'name handle avatar' }
    });

  const filtered = entries
    .filter((entry) => {
      if (!entry.video) return false;
      if (entry.video.visibility === VIDEO_VISIBILITY.PRIVATE) return false;
      const progress = entry.duration > 0 ? entry.watchedSeconds / entry.duration : 0;
      return progress < 0.9;
    })
    .slice(0, parsedLimit);

  return filtered;
};

/**
 * Delete a Single History Entry
 */
const deleteHistoryEntry = async (userId, entryId) => {
  const deleted = await WatchHistory.findOneAndDelete({ _id: entryId, user: userId });
  if (!deleted) {
    throw new ApiError(404, 'Watch history entry not found or unauthorized.');
  }
  return true;
};

/**
 * Clear All User Watch History
 */
const clearAllHistory = async (userId) => {
  await WatchHistory.deleteMany({ user: userId });
  return true;
};

module.exports = {
  trackProgress,
  getHistory,
  getContinueWatching,
  deleteHistoryEntry,
  clearAllHistory
};
