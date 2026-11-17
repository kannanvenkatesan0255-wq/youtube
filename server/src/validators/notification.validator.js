/**
 * Notification Validation Middleware
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');

/**
 * Validate Notification ID Parameter
 */
const validateNotificationIdParam = (req, res, next) => {
  const { notificationId } = req.params;

  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    return next(new ApiError(400, `Invalid notificationId "${notificationId}". Must be a valid identifier.`));
  }

  next();
};

module.exports = {
  validateNotificationIdParam
};
