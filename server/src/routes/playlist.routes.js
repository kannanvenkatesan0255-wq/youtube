/**
 * Playlist Routes
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
const { Router } = require('express');
const playlistController = require('../controllers/playlist.controller');
const {
  validateCreatePlaylist,
  validateUpdatePlaylist,
  validateAddVideoToPlaylist,
  validateReorderPlaylist
} = require('../validators/playlist.validator');
const { validateIdParam } = require('../validators/common.validator');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

const router = Router();

// Collection routes
router.post('/', requireAuth, validateCreatePlaylist, playlistController.createPlaylist);
router.get('/', optionalAuth, playlistController.getPlaylists);

// Single playlist routes
router.get('/:id', optionalAuth, validateIdParam('id'), playlistController.getPlaylistById);
router.patch('/:id', requireAuth, validateIdParam('id'), validateUpdatePlaylist, playlistController.updatePlaylist);
router.delete('/:id', requireAuth, validateIdParam('id'), playlistController.deletePlaylist);

// Video management inside playlist
router.post('/:id/videos', requireAuth, validateIdParam('id'), validateAddVideoToPlaylist, playlistController.addVideoToPlaylist);
router.delete('/:id/videos/:videoId', requireAuth, validateIdParam('id'), validateIdParam('videoId'), playlistController.removeVideoFromPlaylist);
router.patch('/:id/reorder', requireAuth, validateIdParam('id'), validateReorderPlaylist, playlistController.reorderVideos);

module.exports = router;
