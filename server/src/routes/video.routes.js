/**
 * Video Routes
 * VidTube Platform Architecture - Phase 3 & 4 Video Management, Playback & Streaming Engine
 */
const { Router } = require('express');
const {
  getUploadSignature,
  createVideo,
  completeUpload,
  getPublicVideos,
  getMyVideos,
  getVideoById,
  getPlaybackInfo,
  trackVideoView,
  savePlaybackProgress,
  getPlaybackProgress,
  getRelatedVideos,
  updateVideo,
  updateThumbnail,
  updateVisibility,
  deleteVideo
} = require('../controllers/video.controller');
const {
  validateCreateVideo,
  validateUpdateVideo,
  validateCompleteUpload,
  validateThumbnailUpdate,
  validateVisibilityUpdate,
  validatePlaybackProgress,
  validateViewTracking
} = require('../validators/video.validator');
const { validateIdParam } = require('../validators/common.validator');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');

const router = Router();

// 1. Upload Signature Authorization (Authenticated)
router.post('/upload-signature', authenticate, getUploadSignature);

// 2. Create Video Metadata Record (Authenticated)
router.post('/', authenticate, validateCreateVideo, createVideo);

// 3. Confirm Video Upload Completion (Authenticated, Owner only)
router.post('/:id/complete', authenticate, validateIdParam('id'), validateCompleteUpload, completeUpload);

// 4. Retrieve Public Videos (Public discovery feed)
router.get('/', getPublicVideos);

// 5. Creator's Uploaded Videos (Authenticated creator dashboard)
router.get('/my-videos', authenticate, getMyVideos);

// 6. Retrieve Single Video Details
router.get('/:id', optionalAuthenticate, validateIdParam('id'), getVideoById);

// 7. Playback Stream Info (HLS / MP4 streaming parameters with authorization check)
router.get('/:id/playback', optionalAuthenticate, validateIdParam('id'), getPlaybackInfo);

// 8. Record Legitimate Video View (with cooldown debounce)
router.post('/:id/view', optionalAuthenticate, validateIdParam('id'), validateViewTracking, trackVideoView);

// 9. Save Playback Watch Progress (Authenticated)
router.post('/:id/progress', authenticate, validateIdParam('id'), validatePlaybackProgress, savePlaybackProgress);

// 10. Retrieve Saved Playback Watch Progress (Authenticated)
router.get('/:id/progress', authenticate, validateIdParam('id'), getPlaybackProgress);

// 11. Related Video Recommendations
router.get('/:id/related', validateIdParam('id'), getRelatedVideos);

// 12. Update Video Details (Authenticated, Owner only)
router.patch('/:id', authenticate, validateIdParam('id'), validateUpdateVideo, updateVideo);

// 13. Update Video Thumbnail (Authenticated, Owner only)
router.patch('/:id/thumbnail', authenticate, validateIdParam('id'), validateThumbnailUpdate, updateThumbnail);

// 14. Update Video Visibility (Authenticated, Owner only)
router.patch('/:id/visibility', authenticate, validateIdParam('id'), validateVisibilityUpdate, updateVisibility);

// 15. Delete Video & Purge Assets (Authenticated, Owner only)
router.delete('/:id', authenticate, validateIdParam('id'), deleteVideo);

module.exports = router;
