/**
 * Notifications API Service
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
import api from './api';

export const notificationService = {
  /**
   * Get paginated notifications for current user
   */
  getNotifications: (params = {}) => {
    return api.get('/notifications', { params });
  },

  /**
   * Get current unread notification count
   */
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: (notificationId) => {
    return api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () => {
    return api.patch('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  deleteNotification: (notificationId) => {
    return api.delete(`/notifications/${notificationId}`);
  }
};

export default notificationService;
