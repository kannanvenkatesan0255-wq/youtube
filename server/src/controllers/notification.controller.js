/**
 * Notification Controller
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 * Notification retrieval, unread counting, read state modification, and deletion
 */
const Notification = require('../models/Notification');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for current authenticated user
 * @access  Private (Authenticated users)
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name username avatar')
        .populate('channel', 'name handle avatar isVerified')
        .populate('video', 'title thumbnailUrl duration')
        .populate('short', 'title thumbnailUrl duration')
        .populate('comment', 'content')
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false })
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          notifications,
          unreadCount,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1
          }
        },
        'Notifications retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private (Authenticated users)
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json(
      ApiResponse.success({ unreadCount }, 'Unread notifications count retrieved.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a single notification as read
 * @access  Private (Recipient only)
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return next(new ApiError(404, 'Notification not found.'));
    }

    if (!notification.recipient.equals(req.user._id)) {
      return next(new ApiError(403, 'Forbidden. You do not have access to this notification.'));
    }

    notification.isRead = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json(
      ApiResponse.success(
        { notification, unreadCount },
        'Notification marked as read.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all unread notifications as read for current user
 * @access  Private (Authenticated users)
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json(
      ApiResponse.success(
        { markedCount: result.modifiedCount || 0, unreadCount: 0 },
        'All notifications marked as read.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private (Recipient only)
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return next(new ApiError(404, 'Notification not found.'));
    }

    if (!notification.recipient.equals(req.user._id)) {
      return next(new ApiError(403, 'Forbidden. You do not have permission to delete this notification.'));
    }

    await Notification.findByIdAndDelete(notificationId);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json(
      ApiResponse.success(
        { deletedId: notificationId, unreadCount },
        'Notification deleted successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
