/**
 * Engagement / Reactions API Service
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
import api from './api';

export const engagementService = {
  /**
   * Set, toggle, or switch reaction on Video, Short, or Comment
   * @param {string} contentType - 'Video', 'Short', or 'Comment'
   * @param {string} contentId - Document ID
   * @param {'like' | 'dislike'} reaction
   */
  setReaction: (contentType, contentId, reaction) => {
    return api.post(`/engagement/${contentType.toLowerCase()}/${contentId}/reaction`, { reaction });
  },

  /**
   * Remove reaction on target content
   */
  removeReaction: (contentType, contentId) => {
    return api.delete(`/engagement/${contentType.toLowerCase()}/${contentId}/reaction`);
  },

  /**
   * Get current user's reaction
   */
  getUserReaction: (contentType, contentId) => {
    return api.get(`/engagement/${contentType.toLowerCase()}/${contentId}/reaction`);
  },

  /**
   * Get reaction counts summary and current user's reaction
   */
  getReactionSummary: (contentType, contentId) => {
    return api.get(`/engagement/${contentType.toLowerCase()}/${contentId}/summary`);
  }
};

export default engagementService;
