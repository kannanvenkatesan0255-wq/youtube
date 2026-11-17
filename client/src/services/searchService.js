/**
 * Search Service
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
import api from './api';

export const searchService = {
  /**
   * Execute full search query with filtering & pagination
   */
  search: (params = {}) => {
    return api.get('/search', { params });
  },

  /**
   * Get live autocomplete search suggestions
   */
  getSuggestions: (q = '') => {
    return api.get('/search/suggestions', { params: { q } });
  },

  /**
   * Get authenticated user's search history
   */
  getSearchHistory: (params = {}) => {
    return api.get('/search/history', { params });
  },

  /**
   * Delete single search history item
   */
  deleteSearchHistoryItem: (id) => {
    return api.delete(`/search/history/${id}`);
  },

  /**
   * Clear all search history for current user
   */
  clearSearchHistory: () => {
    return api.delete('/search/history');
  }
};

export default searchService;
