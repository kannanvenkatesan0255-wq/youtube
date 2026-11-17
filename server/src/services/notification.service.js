/**
 * Notification Service
 * VidTube Platform Architecture - Phase 6 Engagement & Notification Engine
 * Handles persistent notification creation, unread counting, and real-time socket delivery
 */
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../constants/appConstants');
const { emitToUser } = require('./socket.service');
const { logger } = require('../utils/logger');

/**
 * Dispatch a notification to a user
 */
const createNotification = async ({
  recipient,
  sender,
  type,
  message = '',
  video = null,
  short = null,
  comment = null,
  contentId = null,
  contentType = 'Video',
  channel = null,
  link = ''
}) => {
  try {
    if (!recipient || !type) return null;

    // Do not notify a user of their own actions
    if (sender && recipient.toString() === sender.toString()) {
      return null;
    }

    const newNotification = await Notification.create({
      recipient,
      sender,
      channel,
      type,
      message,
      video,
      short,
      comment,
      contentId: contentId || video || short || comment,
      contentType,
      link,
      isRead: false
    });

    const populated = await Notification.findById(newNotification._id)
      .populate('sender', 'name username avatar')
      .populate('channel', 'name handle avatar isVerified')
      .populate('video', 'title thumbnailUrl duration')
      .populate('short', 'title thumbnailUrl duration')
      .populate('comment', 'content');

    // Real-time dispatch via Socket.IO
    emitToUser(recipient, 'new_notification', populated);

    logger.debug(`Notification [${type}] created for user: ${recipient}`);
    return populated;
  } catch (error) {
    logger.error('Failed to create notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
