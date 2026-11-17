/**
 * VidTube Creator Studio & Analytics Frontend Service
 * Phase 8 Creator Studio & Channel Analytics
 */
import api from './api';

export const studioService = {
  // Studio Dashboard
  getDashboard: async () => {
    return api.get('/studio/dashboard');
  },

  // Analytics Overview
  getAnalyticsOverview: async (params = {}) => {
    return api.get('/studio/analytics/overview', { params });
  },

  // Timeseries
  getTimeseries: async (params = {}) => {
    return api.get('/studio/analytics/timeseries', { params });
  },

  // Top Content
  getTopContent: async (params = {}) => {
    return api.get('/studio/analytics/top-content', { params });
  },

  // Audience Demographics
  getAudience: async (params = {}) => {
    return api.get('/studio/analytics/audience', { params });
  },

  // Subscriber Analytics
  getSubscriberAnalytics: async (params = {}) => {
    return api.get('/studio/analytics/subscribers', { params });
  },

  // Content Deep-Dive Analytics
  getContentAnalytics: async (contentId) => {
    return api.get(`/studio/analytics/content/${contentId}`);
  },

  // Studio Content Management
  getStudioContent: async (params = {}) => {
    return api.get('/studio/content', { params });
  },

  // Update Content Metadata
  updateStudioContent: async (contentId, data) => {
    return api.patch(`/studio/content/${contentId}`, data);
  },

  // Delete Content
  deleteStudioContent: async (contentId) => {
    return api.delete(`/studio/content/${contentId}`);
  },

  // Studio Comments
  getStudioComments: async (params = {}) => {
    return api.get('/studio/comments', { params });
  },

  // Channel Customization
  getChannelCustomization: async () => {
    return api.get('/studio/channel');
  },

  updateChannelCustomization: async (data) => {
    return api.patch('/studio/channel', data);
  },

  // Export Analytics CSV
  exportAnalyticsCSV: async (type = 'overview', period = '28d') => {
    const response = await fetch(`/api/studio/analytics/export?type=${type}&period=${period}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidtube-analytics-${type}-${period}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export default studioService;
