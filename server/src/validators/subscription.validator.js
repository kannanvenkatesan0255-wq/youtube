/**
 * Subscription Validation Middleware
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');

/**
 * Validate Channel ID Parameter
 */
const validateChannelIdParam = (req, res, next) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    return next(new ApiError(400, `Invalid channelId "${channelId}". Must be a valid identifier.`));
  }

  next();
};

module.exports = {
  validateChannelIdParam
};
