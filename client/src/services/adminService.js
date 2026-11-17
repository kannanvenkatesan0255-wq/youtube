/**
 * VidTube Platform Admin & Moderation Frontend Service
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import api from './api';

export const adminService = {
  // 1. Dashboard Overview
  getDashboard: async () => {
    return api.get('/admin/dashboard');
  },

  // 2. User Management
  getUsers: async (params = {}) => {
    return api.get('/admin/users', { params });
  },

  getUserById: async (id) => {
    return api.get(`/admin/users/${id}`);
  },

  updateUserStatus: async (id, data) => {
    return api.patch(`/admin/users/${id}/status`, data);
  },

  updateUserRole: async (id, data) => {
    return api.patch(`/admin/users/${id}/role`, data);
  },

  // 3. Channel Management
  getChannels: async (params = {}) => {
    return api.get('/admin/channels', { params });
  },

  updateChannelStatus: async (id, data) => {
    return api.patch(`/admin/channels/${id}/status`, data);
  },

  // 4. Content Moderation: Videos & Shorts
  getVideos: async (params = {}) => {
    return api.get('/admin/videos', { params });
  },

  moderateVideo: async (id, data) => {
    return api.patch(`/admin/videos/${id}/moderation`, data);
  },

  getShorts: async (params = {}) => {
    return api.get('/admin/shorts', { params });
  },

  moderateShort: async (id, data) => {
    return api.patch(`/admin/shorts/${id}/moderation`, data);
  },

  // 5. Comment Moderation
  getComments: async (params = {}) => {
    return api.get('/admin/comments', { params });
  },

  moderateComment: async (id, data) => {
    return api.patch(`/admin/comments/${id}/moderation`, data);
  },

  // 6. Reports & Moderation Queue
  getReports: async (params = {}) => {
    return api.get('/admin/reports', { params });
  },

  getReportById: async (id) => {
    return api.get(`/admin/reports/${id}`);
  },

  resolveReport: async (id, data) => {
    return api.patch(`/admin/reports/${id}`, data);
  },

  // Public Report Submission (Any Authenticated User)
  submitReport: async (data) => {
    return api.post('/reports', data);
  },

  // 7. Immutable Audit Logs
  getAuditLogs: async (params = {}) => {
    return api.get('/admin/audit-logs', { params });
  },

  // 8. Platform Analytics
  getPlatformAnalytics: async (params = {}) => {
    return api.get('/admin/analytics', { params });
  },

  // 9. Platform Global Settings
  getPlatformSettings: async () => {
    return api.get('/admin/settings');
  },

  updatePlatformSettings: async (data) => {
    return api.patch('/admin/settings', data);
  },

  // 10. Announcements
  getAnnouncements: async (params = {}) => {
    return api.get('/admin/announcements', { params });
  },

  createAnnouncement: async (data) => {
    return api.post('/admin/announcements', data);
  },

  updateAnnouncement: async (id, data) => {
    return api.patch(`/admin/announcements/${id}`, data);
  },

  deleteAnnouncement: async (id) => {
    return api.delete(`/admin/announcements/${id}`);
  },

  // Public active announcement banner
  getActiveAnnouncement: async () => {
    return api.get('/announcements/active');
  }
};

export default adminService;
