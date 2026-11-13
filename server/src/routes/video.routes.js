/**
 * Video Routes
 * VidTube Platform Architecture - Phase 3 Video Upload & Management Engine
 */
const { Router } = require('express');
const {
  getUploadSignature,
  createVideo,
  completeUpload,
  getPublicVideos,
  getMyVideos,
  getVideoById,
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
  validateVisibilityUpdate
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

// 6. Retrieve Single Video (Public, Unlisted, or Private authenticated owner check)
router.get('/:id', optionalAuthenticate, validateIdParam('id'), getVideoById);

// 7. Update Video Details (Authenticated, Owner only)
router.patch('/:id', authenticate, validateIdParam('id'), validateUpdateVideo, updateVideo);

// 8. Update Video Thumbnail (Authenticated, Owner only)
router.patch('/:id/thumbnail', authenticate, validateIdParam('id'), validateThumbnailUpdate, updateThumbnail);

// 9. Update Video Visibility (Authenticated, Owner only)
router.patch('/:id/visibility', authenticate, validateIdParam('id'), validateVisibilityUpdate, updateVisibility);

// 10. Delete Video & Purge Assets (Authenticated, Owner only)
router.delete('/:id', authenticate, validateIdParam('id'), deleteVideo);

module.exports = router;
