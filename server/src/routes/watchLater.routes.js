/**
 * Watch Later Routes
 * VidTube Platform Architecture - Phase 7 Watch Later System
 */
const { Router } = require('express');
const watchLaterController = require('../controllers/watchLater.controller');
const { validateIdParam } = require('../validators/common.validator');
const { requireAuth } = require('../middleware/auth.middleware');

const router = Router();

router.use(requireAuth);

router.get('/', watchLaterController.getWatchLater);
router.get('/check/:videoId', validateIdParam('videoId'), watchLaterController.checkWatchLaterStatus);
router.post('/:videoId', validateIdParam('videoId'), watchLaterController.addToWatchLater);
router.delete('/:videoId', validateIdParam('videoId'), watchLaterController.removeFromWatchLater);

module.exports = router;
