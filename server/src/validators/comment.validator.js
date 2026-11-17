/**
 * Comment Validation Middleware
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');

/**
 * Validate Content Target Parameters for Comments
 */
const validateCommentTargetParams = (req, res, next) => {
  const { contentType, contentId } = req.params;
  const errors = [];

  const normalizedType = contentType ? contentType.toLowerCase() : '';
  const validTypes = ['video', 'short'];

  if (!normalizedType || !validTypes.includes(normalizedType)) {
    errors.push(`Invalid contentType "${contentType}". Allowed: video, short.`);
  }

  if (!contentId || !mongoose.Types.ObjectId.isValid(contentId)) {
    errors.push(`Invalid contentId "${contentId}". Must be a valid identifier.`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Comment target validation failed', errors));
  }

  req.normalizedContentType = normalizedType === 'short' ? 'Short' : 'Video';
  next();
};

/**
 * Validate Comment ID Parameter
 */
const validateCommentIdParam = (req, res, next) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    return next(new ApiError(400, `Invalid commentId "${commentId}". Must be a valid identifier.`));
  }

  next();
};

/**
 * Validate Comment Creation Payload
 */
const validateCreateComment = (req, res, next) => {
  const text = req.body.text || req.body.content;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return next(new ApiError(400, 'Comment text cannot be empty.'));
  }

  if (text.trim().length > 2000) {
    return next(new ApiError(400, 'Comment text cannot exceed 2000 characters.'));
  }

  req.body.text = text.trim();
  next();
};

/**
 * Validate Comment Update Payload
 */
const validateUpdateComment = (req, res, next) => {
  const text = req.body.text || req.body.content;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return next(new ApiError(400, 'Updated comment text cannot be empty.'));
  }

  if (text.trim().length > 2000) {
    return next(new ApiError(400, 'Comment text cannot exceed 2000 characters.'));
  }

  req.body.text = text.trim();
  next();
};

module.exports = {
  validateCommentTargetParams,
  validateCommentIdParam,
  validateCreateComment,
  validateUpdateComment
};
