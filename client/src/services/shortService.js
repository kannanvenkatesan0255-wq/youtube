/**
 * Shorts API Service
 * VidTube Platform Architecture - Phase 5 Shorts Engine
 */
import api from './api';
import axios from 'axios';

export const shortService = {
  /**
   * Request secure signature for direct client-side upload to Cloudinary (folder: vidtube/shorts)
   */
  getUploadSignature: () => {
    return api.post('/shorts/upload-signature');
  },

  /**
   * Create Short metadata draft record
   */
  createShort: (shortData) => {
    return api.post('/shorts', shortData);
  },

  /**
   * Confirm completed Short upload with technical metadata
   */
  completeUpload: (id, payload) => {
    return api.post(`/shorts/${id}/complete`, payload);
  },

  /**
   * Retrieve public Shorts feed (paginated)
   */
  getShortsFeed: (params = {}) => {
    return api.get('/shorts', { params });
  },

  /**
   * Retrieve creator's uploaded Shorts
   */
  getMyShorts: (params = {}) => {
    return api.get('/shorts/my-shorts', { params });
  },

  /**
   * Retrieve single Short by ID
   */
  getShortById: (id) => {
    return api.get(`/shorts/${id}`);
  },

  /**
   * Record legitimate Short view with cooldown
   */
  trackView: (id, payload = {}) => {
    return api.post(`/shorts/${id}/view`, payload);
  },

  /**
   * Update Short metadata (title, description, soundTitle, tags)
   */
  updateShort: (id, shortData) => {
    return api.patch(`/shorts/${id}`, shortData);
  },

  /**
   * Update Short visibility (public, unlisted, private)
   */
  updateVisibility: (id, visibility) => {
    return api.patch(`/shorts/${id}/visibility`, { visibility });
  },

  /**
   * Delete Short and purge Cloudinary media asset
   */
  deleteShort: (id) => {
    return api.delete(`/shorts/${id}`);
  },

  /**
   * Direct Browser Upload to Cloudinary with real percentage progress
   */
  uploadDirectToCloudinary: async (file, signatureData, onProgress, signal) => {
    const { uploadUrl, apiKey, timestamp, signature, folder } = signatureData;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const response = await axios.post(uploadUrl, formData, {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
        }
      }
    });

    return response.data;
  }
};

export default shortService;
