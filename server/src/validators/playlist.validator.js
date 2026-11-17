/**
 * Playlist Validation Middleware
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');
const { VIDEO_VISIBILITY } = require('../constants/appConstants');

const validVisibilities = Object.values(VIDEO_VISIBILITY);

/**
 * Validate Playlist Creation
 */
const validateCreatePlaylist = (req, res, next) => {
  const { title, description, visibility } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Playlist title is required.');
  } else if (title.trim().length > 100) {
    errors.push('Playlist title cannot exceed 100 characters.');
  }

  if (description && (typeof description !== 'string' || description.length > 1000)) {
    errors.push('Playlist description cannot exceed 1000 characters.');
  }

  if (visibility && !validVisibilities.includes(visibility.toLowerCase())) {
    errors.push(`Invalid visibility "${visibility}". Allowed: ${validVisibilities.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Playlist validation failed', errors));
  }

  next();
};

/**
 * Validate Playlist Update
 */
const validateUpdatePlaylist = (req, res, next) => {
  const { title, description, visibility } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      errors.push('Playlist title cannot be empty.');
    } else if (title.trim().length > 100) {
      errors.push('Playlist title cannot exceed 100 characters.');
    }
  }

  if (description !== undefined && (typeof description !== 'string' || description.length > 1000)) {
    errors.push('Playlist description cannot exceed 1000 characters.');
  }

  if (visibility !== undefined && !validVisibilities.includes(visibility.toLowerCase())) {
    errors.push(`Invalid visibility "${visibility}". Allowed: ${validVisibilities.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Playlist update validation failed', errors));
  }

  next();
};

/**
 * Validate Adding Video to Playlist
 */
const validateAddVideoToPlaylist = (req, res, next) => {
  const videoId = req.body.videoId || req.params.videoId;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    return next(new ApiError(400, 'Valid videoId is required.'));
  }

  req.validatedVideoId = videoId;
  next();
};

/**
 * Validate Reordering Playlist Videos
 */
const validateReorderPlaylist = (req, res, next) => {
  const { videoIds, fromIndex, toIndex } = req.body;

  if (Array.isArray(videoIds)) {
    for (const vid of videoIds) {
      if (!mongoose.Types.ObjectId.isValid(vid)) {
        return next(new ApiError(400, `Invalid video id in reorder list: ${vid}`));
      }
    }
    return next();
  }

  if (fromIndex !== undefined && toIndex !== undefined) {
    if (
      typeof fromIndex !== 'number' ||
      typeof toIndex !== 'number' ||
      fromIndex < 0 ||
      toIndex < 0
    ) {
      return next(new ApiError(400, 'fromIndex and toIndex must be non-negative integers.'));
    }
    return next();
  }

  return next(new ApiError(400, 'Reorder requires either videoIds array or fromIndex and toIndex integers.'));
};

module.exports = {
  validateCreatePlaylist,
  validateUpdatePlaylist,
  validateAddVideoToPlaylist,
  validateReorderPlaylist
};
