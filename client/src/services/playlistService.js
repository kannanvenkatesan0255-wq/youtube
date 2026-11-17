/**
 * Playlist Service
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
import api from './api';

export const playlistService = {
  /**
   * Create a new playlist
   */
  createPlaylist: (payload) => {
    return api.post('/playlists', payload);
  },

  /**
   * Get playlists for current user or channel
   */
  getUserPlaylists: (userId = null) => {
    const params = userId ? { userId } : {};
    return api.get('/playlists', { params });
  },

  /**
   * Get single playlist details and videos
   */
  getPlaylistById: (id) => {
    return api.get(`/playlists/${id}`);
  },

  /**
   * Update playlist metadata
   */
  updatePlaylist: (id, payload) => {
    return api.patch(`/playlists/${id}`, payload);
  },

  /**
   * Delete custom playlist
   */
  deletePlaylist: (id) => {
    return api.delete(`/playlists/${id}`);
  },

  /**
   * Add video to playlist
   */
  addVideoToPlaylist: (playlistId, videoId) => {
    return api.post(`/playlists/${playlistId}/videos`, { videoId });
  },

  /**
   * Remove video from playlist
   */
  removeVideoFromPlaylist: (playlistId, videoId) => {
    return api.delete(`/playlists/${playlistId}/videos/${videoId}`);
  },

  /**
   * Reorder videos in playlist
   */
  reorderVideos: (playlistId, payload) => {
    return api.patch(`/playlists/${playlistId}/reorder`, payload);
  }
};

export default playlistService;
