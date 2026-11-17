/**
 * Comments API Service
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
import api from './api';

export const commentService = {
  /**
   * Get paginated comments for Video or Short
   * @param {string} contentType - 'Video' or 'Short'
   * @param {string} contentId
   * @param {object} params - { page, limit, sortBy: 'top' | 'newest' }
   */
  getComments: (contentType, contentId, params = {}) => {
    return api.get(`/comments/${contentType.toLowerCase()}/${contentId}`, { params });
  },

  /**
   * Create top-level comment
   */
  createComment: (contentType, contentId, text) => {
    return api.post(`/comments/${contentType.toLowerCase()}/${contentId}`, { text });
  },

  /**
   * Reply to an existing comment
   */
  replyToComment: (commentId, text) => {
    return api.post(`/comments/${commentId}/replies`, { text });
  },

  /**
   * Get replies for a parent comment
   */
  getReplies: (commentId, params = {}) => {
    return api.get(`/comments/${commentId}/replies`, { params });
  },

  /**
   * Update existing comment text
   */
  updateComment: (commentId, text) => {
    return api.patch(`/comments/${commentId}`, { text });
  },

  /**
   * Delete comment
   */
  deleteComment: (commentId) => {
    return api.delete(`/comments/${commentId}`);
  },

  /**
   * React (like/dislike) to a comment
   */
  reactToComment: (commentId, reaction) => {
    return api.post(`/comments/${commentId}/reaction`, { reaction });
  }
};

export default commentService;
