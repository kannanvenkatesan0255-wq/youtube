/**
 * Watch History Routes
 * VidTube Platform Architecture - Phase 7 Watch History & Continue Watching
 */
const { Router } = require('express');
const historyController = require('../controllers/history.controller');
const { validateTrackWatch, validateHistoryEntryId } = require('../validators/history.validator');
const { requireAuth } = require('../middleware/auth.middleware');

const router = Router();

router.use(requireAuth);

router.post('/track', validateTrackWatch, historyController.trackProgress);
router.get('/', historyController.getHistory);
router.get('/continue-watching', historyController.getContinueWatching);
router.delete('/:id', validateHistoryEntryId, historyController.deleteHistoryItem);
router.delete('/', historyController.clearAllHistory);

module.exports = router;
