/**
 * Watch History Controller
 * VidTube Platform Architecture - Phase 7 Watch History & Continue Watching
 */
const historyService = require('../services/history.service');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/history/track
 * @desc    Record or update watch progress for video or short
 * @access  Private
 */
const trackProgress = async (req, res, next) => {
  try {
    const { videoId, shortId, contentId, contentType, watchedSeconds, duration, completed } = req.body;
    const targetId = req.validatedTargetId || videoId || shortId || contentId;
    const resolvedType = req.validatedContentType || (shortId ? 'Short' : 'Video');

    const record = await historyService.trackProgress({
      userId: req.user._id,
      targetId,
      contentType: resolvedType,
      watchedSeconds,
      duration,
      completed
    });

    return res.status(200).json(ApiResponse.success(record, 'Watch progress recorded.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/history
 * @desc    Get paginated user watch history with search support
 * @access  Private
 */
const getHistory = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const data = await historyService.getHistory({
      userId: req.user._id,
      q,
      page,
      limit
    });

    return res.status(200).json(ApiResponse.success(data, 'Watch history retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/history/continue-watching
 * @desc    Get partially watched videos
 * @access  Private
 */
const getContinueWatching = async (req, res, next) => {
  try {
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const items = await historyService.getContinueWatching(req.user._id, limit);

    return res.status(200).json(ApiResponse.success(items, 'Continue watching list retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/history/:id
 * @desc    Remove single item from watch history
 * @access  Private
 */
const deleteHistoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await historyService.deleteHistoryEntry(req.user._id, id);

    return res.status(200).json(ApiResponse.success(null, 'History entry deleted.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/history
 * @desc    Clear all user watch history
 * @access  Private
 */
const clearAllHistory = async (req, res, next) => {
  try {
    await historyService.clearAllHistory(req.user._id);

    return res.status(200).json(ApiResponse.success(null, 'All watch history cleared.'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  trackProgress,
  getHistory,
  getContinueWatching,
  deleteHistoryItem,
  clearAllHistory
};
