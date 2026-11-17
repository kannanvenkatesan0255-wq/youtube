/**
 * Watch Later Service
 * VidTube Platform Architecture - Phase 7 Watch Later System
 */
import api from './api';

export const watchLaterService = {
  /**
   * Get Watch Later playlist
   */
  getWatchLater: () => {
    return api.get('/watch-later');
  },

  /**
   * Add video to Watch Later
   */
  addToWatchLater: (videoId) => {
    return api.post(`/watch-later/${videoId}`);
  },

  /**
   * Remove video from Watch Later
   */
  removeFromWatchLater: (videoId) => {
    return api.delete(`/watch-later/${videoId}`);
  },

  /**
   * Check if a video is saved in Watch Later
   */
  checkWatchLater: (videoId) => {
    return api.get(`/watch-later/check/${videoId}`);
  }
};

export default watchLaterService;
