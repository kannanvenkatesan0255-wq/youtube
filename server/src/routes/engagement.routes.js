/**
 * Engagement / Reactions Routes
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const { Router } = require('express');
const {
  setReaction,
  removeReaction,
  getUserReaction,
  getReactionSummary
} = require('../controllers/engagement.controller');
const {
  validateContentParams,
  validateReactionPayload
} = require('../validators/engagement.validator');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

const router = Router();

// Support both /reaction and /react
router.post(
  ['/:contentType/:contentId/reaction', '/:contentType/:contentId/react'],
  requireAuth,
  validateContentParams,
  validateReactionPayload,
  setReaction
);

router.delete(
  ['/:contentType/:contentId/reaction', '/:contentType/:contentId/react'],
  requireAuth,
  validateContentParams,
  removeReaction
);

router.get(
  ['/:contentType/:contentId/reaction', '/:contentType/:contentId/react'],
  optionalAuth,
  validateContentParams,
  getUserReaction
);

router.get(
  '/:contentType/:contentId/summary',
  optionalAuth,
  validateContentParams,
  getReactionSummary
);

module.exports = router;
