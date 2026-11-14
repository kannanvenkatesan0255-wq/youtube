/**
 * Shorts Routes
 * VidTube Platform Architecture - Phase 5 Shorts Engine
 */
const { Router } = require('express');
const {
  getShortUploadSignature,
  createShort,
  completeShortUpload,
  getShortsFeed,
  getMyShorts,
  getShortById,
  trackShortView,
  updateShort,
  updateShortVisibility,
  deleteShort
} = require('../controllers/short.controller');
const {
  validateCreateShort,
  validateCompleteShort,
  validateUpdateShort,
  validateShortVisibility,
  validateShortView
} = require('../validators/short.validator');
const { validateIdParam } = require('../validators/common.validator');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');

const router = Router();

// 1. Shorts Upload Signature Authorization (Authenticated)
router.post('/upload-signature', authenticate, getShortUploadSignature);

// 2. Create Short Metadata Draft (Authenticated)
router.post('/', authenticate, validateCreateShort, createShort);

// 3. Confirm Short Upload Completion (Authenticated, Owner only)
router.post('/:id/complete', authenticate, validateIdParam('id'), validateCompleteShort, completeShortUpload);

// 4. Retrieve Public Shorts Feed (Public)
router.get('/', getShortsFeed);

// 5. Retrieve Creator's Own Shorts (Authenticated)
router.get('/my-shorts', authenticate, getMyShorts);

// 6. Retrieve Single Short Details (Public, Unlisted, or Private owner check)
router.get('/:id', optionalAuthenticate, validateIdParam('id'), getShortById);

// 7. Track Short View with Cooldown (Public, Optional Auth)
router.post('/:id/view', optionalAuthenticate, validateIdParam('id'), validateShortView, trackShortView);

// 8. Update Short Details (Authenticated, Owner only)
router.patch('/:id', authenticate, validateIdParam('id'), validateUpdateShort, updateShort);

// 9. Update Short Visibility (Authenticated, Owner only)
router.patch('/:id/visibility', authenticate, validateIdParam('id'), validateShortVisibility, updateShortVisibility);

// 10. Delete Short & Purge Assets (Authenticated, Owner only)
router.delete('/:id', authenticate, validateIdParam('id'), deleteShort);

module.exports = router;
