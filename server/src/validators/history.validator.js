/**
 * Watch History Validation Middleware
 * VidTube Platform Architecture - Phase 7 Watch History & Continue Watching
 */
const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');

/**
 * Validate Progress Tracking Payload
 */
const validateTrackWatch = (req, res, next) => {
  const { videoId, shortId, contentId, contentType, watchedSeconds, duration, completed } = req.body;
  const targetId = videoId || shortId || contentId;

  if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
    return next(new ApiError(400, 'Valid videoId, shortId, or contentId is required.'));
  }

  const rawType = (contentType || (shortId ? 'Short' : 'Video')).toLowerCase();
  if (rawType !== 'video' && rawType !== 'short') {
    return next(new ApiError(400, 'contentType must be either "Video" or "Short".'));
  }

  req.validatedTargetId = targetId;
  req.validatedContentType = rawType === 'short' ? 'Short' : 'Video';

  if (watchedSeconds !== undefined && (typeof watchedSeconds !== 'number' || watchedSeconds < 0)) {
    return next(new ApiError(400, 'watchedSeconds must be a non-negative number.'));
  }

  if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
    return next(new ApiError(400, 'duration must be a non-negative number.'));
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return next(new ApiError(400, 'completed must be a boolean.'));
  }

  next();
};

/**
 * Validate History Entry ID Parameter
 */
const validateHistoryEntryId = (req, res, next) => {
  const entryId = req.params.entryId || req.params.id;

  if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) {
    return next(new ApiError(400, 'Invalid history entry identifier.'));
  }

  next();
};

module.exports = {
  validateTrackWatch,
  validateHistoryEntryId
};
