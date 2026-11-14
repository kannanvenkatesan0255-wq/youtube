/**
 * Video Request Validation Middleware
 * VidTube Platform Architecture - Phase 3
 */
const { ApiError } = require('../utils/apiError');
const { VIDEO_VISIBILITY, VIDEO_CATEGORIES } = require('../constants/appConstants');

/**
 * Validate Video Metadata Creation
 */
const validateCreateVideo = (req, res, next) => {
  const { title, description, category, tags, visibility } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Video title is required.');
  } else if (title.trim().length > 100) {
    errors.push('Video title cannot exceed 100 characters.');
  }

  if (description && typeof description === 'string' && description.length > 5000) {
    errors.push('Description cannot exceed 5000 characters.');
  }

  if (category && !VIDEO_CATEGORIES.includes(category)) {
    errors.push(`Invalid category. Allowed: ${VIDEO_CATEGORIES.join(', ')}`);
  }

  if (visibility && !Object.values(VIDEO_VISIBILITY).includes(visibility)) {
    errors.push(`Invalid visibility. Allowed: ${Object.values(VIDEO_VISIBILITY).join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Video validation failed', errors));
  }

  // Sanitization
  req.body.title = title.trim();
  if (description) req.body.description = description.trim();
  if (category) req.body.category = category.trim();
  if (visibility) req.body.visibility = visibility.trim();

  // Normalize tags
  if (tags) {
    if (typeof tags === 'string') {
      req.body.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      req.body.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    }
  }

  next();
};

/**
 * Validate Video Metadata Update
 */
const validateUpdateVideo = (req, res, next) => {
  const { title, description, category, tags, visibility } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Video title cannot be empty.');
    } else if (title.trim().length > 100) {
      errors.push('Video title cannot exceed 100 characters.');
    }
    req.body.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description === 'string' && description.length > 5000) {
      errors.push('Description cannot exceed 5000 characters.');
    }
    req.body.description = description ? description.trim() : '';
  }

  if (category !== undefined) {
    if (!VIDEO_CATEGORIES.includes(category)) {
      errors.push(`Invalid category. Allowed: ${VIDEO_CATEGORIES.join(', ')}`);
    }
    req.body.category = category.trim();
  }

  if (visibility !== undefined) {
    if (!Object.values(VIDEO_VISIBILITY).includes(visibility)) {
      errors.push(`Invalid visibility. Allowed: ${Object.values(VIDEO_VISIBILITY).join(', ')}`);
    }
    req.body.visibility = visibility.trim();
  }

  if (tags !== undefined) {
    if (typeof tags === 'string') {
      req.body.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      req.body.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Video update validation failed', errors));
  }

  next();
};

/**
 * Validate Upload Completion Confirmation
 */
const validateCompleteUpload = (req, res, next) => {
  const { videoUrl, publicId } = req.body;
  const errors = [];

  if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.startsWith('http')) {
    errors.push('A valid video URL is required.');
  }

  if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
    errors.push('A valid storage public ID is required.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Upload completion payload validation failed', errors));
  }

  next();
};

/**
 * Validate Thumbnail Update
 */
const validateThumbnailUpdate = (req, res, next) => {
  const { thumbnailUrl } = req.body;

  if (!thumbnailUrl || typeof thumbnailUrl !== 'string' || !thumbnailUrl.startsWith('http')) {
    return next(new ApiError(400, 'A valid thumbnail URL is required.'));
  }

  next();
};

/**
 * Validate Visibility Update
 */
const validateVisibilityUpdate = (req, res, next) => {
  const { visibility } = req.body;

  if (!visibility || !Object.values(VIDEO_VISIBILITY).includes(visibility)) {
    return next(
      new ApiError(
        400,
        `Invalid visibility setting. Must be one of: ${Object.values(VIDEO_VISIBILITY).join(', ')}`
      )
    );
  }

  next();
};

/**
 * Validate Playback Progress Update
 */
const validatePlaybackProgress = (req, res, next) => {
  const { progress, duration } = req.body;

  if (progress === undefined || typeof progress !== 'number' || isNaN(progress) || progress < 0) {
    return next(new ApiError(400, 'Valid progress in seconds (number >= 0) is required.'));
  }

  if (duration !== undefined && (typeof duration !== 'number' || isNaN(duration) || duration < 0)) {
    return next(new ApiError(400, 'Duration must be a positive number of seconds.'));
  }

  next();
};

/**
 * Validate View Tracking
 */
const validateViewTracking = (req, res, next) => {
  const { watchTime } = req.body;

  if (watchTime !== undefined && (typeof watchTime !== 'number' || isNaN(watchTime) || watchTime < 0)) {
    return next(new ApiError(400, 'watchTime must be a positive number.'));
  }

  next();
};

module.exports = {
  validateCreateVideo,
  validateUpdateVideo,
  validateCompleteUpload,
  validateThumbnailUpdate,
  validateVisibilityUpdate,
  validatePlaybackProgress,
  validateViewTracking
};
