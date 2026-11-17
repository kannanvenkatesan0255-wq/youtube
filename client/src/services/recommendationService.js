/**
 * Recommendation Service
 * VidTube Platform Architecture - Phase 7 Recommendation Engine
 */
import api from './api';

export const recommendationService = {
  /**
   * Get personalized or general video recommendations
   */
  getRecommendations: (params = {}) => {
    return api.get('/recommendations', { params });
  },

  /**
   * Get trending videos
   */
  getTrending: (params = {}) => {
    return api.get('/recommendations/trending', { params });
  },

  /**
   * Get context-aware related videos for watch page
   */
  getRelated: (videoId, params = {}) => {
    return api.get(`/recommendations/related/${videoId}`, { params });
  }
};

export default recommendationService;
