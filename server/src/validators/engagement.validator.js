/**
 * Engagement & Reaction Validation Middleware
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');
const { LIKE_TYPES } = require('../constants/appConstants');

/**
 * Validate Content Type and Content ID parameters
 */
const validateContentParams = (req, res, next) => {
  const { contentType, contentId } = req.params;
  const errors = [];

  const normalizedType = contentType ? contentType.toLowerCase() : '';
  const validTypes = ['video', 'short', 'comment'];

  if (!normalizedType || !validTypes.includes(normalizedType)) {
    errors.push(`Invalid contentType "${contentType}". Allowed: video, short, comment.`);
  }

  if (!contentId || !mongoose.Types.ObjectId.isValid(contentId)) {
    errors.push(`Invalid contentId "${contentId}". Must be a valid 24-character hexadecimal identifier.`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Engagement parameter validation failed', errors));
  }

  // Normalize for controllers
  req.normalizedContentType = normalizedType === 'video' ? 'Video' : normalizedType === 'short' ? 'Short' : 'Comment';
  next();
};

/**
 * Validate Reaction payload (POST /reaction)
 */
const validateReactionPayload = (req, res, next) => {
  const { reaction } = req.body;
  const validReactions = Object.values(LIKE_TYPES); // ['like', 'dislike']

  if (!reaction || !validReactions.includes(reaction.toLowerCase())) {
    return next(
      new ApiError(400, `Invalid reaction "${reaction}". Allowed: ${validReactions.join(', ')}`)
    );
  }

  req.body.reaction = reaction.toLowerCase();
  next();
};

module.exports = {
  validateContentParams,
  validateReactionPayload
};
