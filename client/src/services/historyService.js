/**
 * Watch History Service
 * VidTube Platform Architecture - Phase 7 Watch History & Continue Watching
 */
import api from './api';

export const historyService = {
  /**
   * Track watch progress for video or short
   */
  trackWatch: (payload) => {
    return api.post('/history/track', payload);
  },

  /**
   * Get paginated watch history with search filter
   */
  getWatchHistory: (params = {}) => {
    return api.get('/history', { params });
  },

  /**
   * Get partially watched videos for Continue Watching
   */
  getContinueWatching: (params = {}) => {
    return api.get('/history/continue-watching', { params });
  },

  /**
   * Delete single history item
   */
  deleteHistoryItem: (id) => {
    return api.delete(`/history/${id}`);
  },

  /**
   * Clear all user watch history
   */
  clearAllHistory: () => {
    return api.delete('/history');
  }
};

export default historyService;
