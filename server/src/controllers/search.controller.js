/**
 * Search Controller
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
const searchService = require('../services/search.service');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');

/**
 * @route   GET /api/search
 * @desc    Full-text / filter search across videos, shorts, and channels
 * @access  Public (Records search history if authenticated)
 */
const handleSearch = async (req, res, next) => {
  try {
    const { q, type, uploadDate, duration, sortBy, category, page, limit } = req.query;

    const data = await searchService.search({
      q,
      type,
      uploadDate,
      duration,
      sortBy,
      category,
      page,
      limit,
      user: req.user || null
    });

    return res.status(200).json(ApiResponse.success(data, 'Search executed successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/search/suggestions
 * @desc    Fast autocomplete search suggestions
 * @access  Public (Integrates history if authenticated)
 */
const getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await searchService.getSuggestions(q, req.user || null);

    return res.status(200).json(ApiResponse.success({ suggestions }, 'Suggestions retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/search/history
 * @desc    Get current user's search history
 * @access  Private
 */
const getHistory = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const history = await searchService.getSearchHistory(req.user._id, limit);

    return res.status(200).json(ApiResponse.success({ history }, 'Search history retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/search/history/:id
 * @desc    Delete single search history item
 * @access  Private
 */
const deleteHistoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await searchService.deleteSearchHistoryItem(req.user._id, id);

    if (!deleted) {
      throw new ApiError(404, 'Search history item not found or unauthorized.');
    }

    return res.status(200).json(ApiResponse.success(null, 'Search history item deleted.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/search/history
 * @desc    Clear all search history for current user
 * @access  Private
 */
const clearHistory = async (req, res, next) => {
  try {
    await searchService.clearSearchHistory(req.user._id);
    return res.status(200).json(ApiResponse.success(null, 'All search history cleared.'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleSearch,
  getSuggestions,
  getHistory,
  deleteHistoryItem,
  clearHistory
};
