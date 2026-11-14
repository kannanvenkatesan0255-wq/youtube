/**
 * Short Request Validation Middleware
 * VidTube Platform Architecture - Phase 5 Shorts Engine
 */
const { ApiError } = require('../utils/apiError');
const { VIDEO_VISIBILITY } = require('../constants/appConstants');
const { config } = require('../config/env');

/**
 * Validate Short Creation Payload
 */
const validateCreateShort = (req, res, next) => {
  const { title, description, duration, visibility, soundTitle, tags } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Short title is required.');
  } else if (title.trim().length > 100) {
    errors.push('Short title cannot exceed 100 characters.');
  }

  if (description && typeof description === 'string' && description.length > 2000) {
    errors.push('Description cannot exceed 2000 characters.');
  }

  const maxDuration = config.uploads?.maxShortDurationSeconds || 60;
  if (duration !== undefined) {
    if (typeof duration !== 'number' || duration <= 0) {
      errors.push('Duration must be a positive number of seconds.');
    } else if (duration > maxDuration) {
      errors.push(`Short duration cannot exceed ${maxDuration} seconds.`);
    }
  }

  if (visibility && !Object.values(VIDEO_VISIBILITY).includes(visibility)) {
    errors.push(`Invalid visibility. Allowed: ${Object.values(VIDEO_VISIBILITY).join(', ')}`);
  }

  if (soundTitle && typeof soundTitle === 'string' && soundTitle.length > 100) {
    errors.push('Sound title cannot exceed 100 characters.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Short validation failed', errors));
  }

  // Sanitization
  req.body.title = title.trim();
  if (description) req.body.description = description.trim();
  if (visibility) req.body.visibility = visibility.trim();
  if (soundTitle) req.body.soundTitle = soundTitle.trim();

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
 * Validate Short Completion Confirmation
 */
const validateCompleteShort = (req, res, next) => {
  const { videoUrl, publicId, duration } = req.body;
  const errors = [];
  const maxDuration = config.uploads?.maxShortDurationSeconds || 60;

  if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.startsWith('http')) {
    errors.push('A valid video URL is required.');
  }

  if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
    errors.push('A valid storage public ID is required.');
  }

  if (duration !== undefined && duration !== null) {
    if (typeof duration !== 'number' || duration <= 0) {
      errors.push('Duration must be a positive number.');
    } else if (duration > maxDuration) {
      errors.push(`Short duration cannot exceed ${maxDuration} seconds.`);
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Short completion validation failed', errors));
  }

  next();
};

/**
 * Validate Short Update
 */
const validateUpdateShort = (req, res, next) => {
  const { title, description, soundTitle, visibility, tags } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Short title cannot be empty.');
    } else if (title.trim().length > 100) {
      errors.push('Short title cannot exceed 100 characters.');
    }
    req.body.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description === 'string' && description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters.');
    }
    req.body.description = description ? description.trim() : '';
  }

  if (soundTitle !== undefined) {
    if (typeof soundTitle === 'string' && soundTitle.length > 100) {
      errors.push('Sound title cannot exceed 100 characters.');
    }
    req.body.soundTitle = soundTitle ? soundTitle.trim() : 'Original Audio';
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
    return next(new ApiError(400, 'Short update validation failed', errors));
  }

  next();
};

/**
 * Validate Short Visibility Toggle
 */
const validateShortVisibility = (req, res, next) => {
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
 * Validate Short View Tracking
 */
const validateShortView = (req, res, next) => {
  const { watchTime } = req.body;

  if (watchTime !== undefined && (typeof watchTime !== 'number' || isNaN(watchTime) || watchTime < 0)) {
    return next(new ApiError(400, 'watchTime must be a positive number.'));
  }

  next();
};

module.exports = {
  validateCreateShort,
  validateCompleteShort,
  validateUpdateShort,
  validateShortVisibility,
  validateShortView
};
