/**
 * Recommendation Controller
 * VidTube Platform Architecture - Phase 7 Recommendation Engine
 */
const recommendationService = require('../services/recommendation.service');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/recommendations
 * @desc    Personalized or trending video feed with category filtering
 * @access  Public / Optional Auth
 */
const getRecommendations = async (req, res, next) => {
  try {
    const { category, page, limit } = req.query;
    const data = await recommendationService.getRecommendations({
      user: req.user || null,
      category,
      page,
      limit
    });

    return res.status(200).json(ApiResponse.success(data, 'Recommendations retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/recommendations/trending
 * @desc    Trending videos (high view velocity)
 * @access  Public
 */
const getTrending = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const trending = await recommendationService.getTrending(limit);

    return res.status(200).json(ApiResponse.success(trending, 'Trending videos retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/recommendations/related/:videoId
 * @desc    Context-aware related videos for watch page
 * @access  Public
 */
const getRelated = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { limit } = req.query;
    const related = await recommendationService.getRelated(videoId, limit);

    return res.status(200).json(ApiResponse.success(related, 'Related videos retrieved.'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getTrending,
  getRelated
};
