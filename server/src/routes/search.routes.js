/**
 * Search Routes
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
const { Router } = require('express');
const searchController = require('../controllers/search.controller');
const { validateSearchQuery, validateSearchSuggestions } = require('../validators/search.validator');
const { validateIdParam } = require('../validators/common.validator');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');

const router = Router();

// Public / optional auth routes
router.get('/', optionalAuth, validateSearchQuery, searchController.handleSearch);
router.get('/suggestions', optionalAuth, validateSearchSuggestions, searchController.getSuggestions);

// Authenticated search history routes
router.get('/history', requireAuth, searchController.getHistory);
router.delete('/history/:id', requireAuth, validateIdParam('id'), searchController.deleteHistoryItem);
router.delete('/history', requireAuth, searchController.clearHistory);

module.exports = router;
