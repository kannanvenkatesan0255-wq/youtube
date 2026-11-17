/**
 * Notification Routes
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const { Router } = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notification.controller');
const { validateNotificationIdParam } = require('../validators/notification.validator');
const { requireAuth } = require('../middleware/auth.middleware');

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:notificationId/read', validateNotificationIdParam, markAsRead);
router.delete('/:notificationId', validateNotificationIdParam, deleteNotification);

module.exports = router;
