/**
 * Recommendation Routes
 * VidTube Platform Architecture - Phase 7 Recommendation Engine
 */
const { Router } = require('express');
const recommendationController = require('../controllers/recommendation.controller');
const { validateIdParam } = require('../validators/common.validator');
const { optionalAuth } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', optionalAuth, recommendationController.getRecommendations);
router.get('/trending', recommendationController.getTrending);
router.get('/related/:videoId', validateIdParam('videoId'), recommendationController.getRelated);

module.exports = router;
