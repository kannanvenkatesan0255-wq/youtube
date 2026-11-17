/**
 * Comment Routes
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const { Router } = require('express');
const {
  getComments,
  createComment,
  replyToComment,
  getCommentReplies,
  updateComment,
  deleteComment
} = require('../controllers/comment.controller');
const {
  setReaction,
  getUserReaction
} = require('../controllers/engagement.controller');
const {
  validateCommentTargetParams,
  validateCommentIdParam,
  validateCreateComment,
  validateUpdateComment
} = require('../validators/comment.validator');
const {
  validateReactionPayload
} = require('../validators/engagement.validator');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

const router = Router();

// 1. Replies to Comments (Must be defined before generic :contentType/:contentId)
router.post(
  '/:commentId/replies',
  requireAuth,
  validateCommentIdParam,
  validateCreateComment,
  replyToComment
);

router.get(
  '/:commentId/replies',
  optionalAuth,
  validateCommentIdParam,
  getCommentReplies
);

// 2. Direct Comment Reactions
router.post(
  ['/:commentId/reaction', '/:commentId/react'],
  requireAuth,
  validateCommentIdParam,
  validateReactionPayload,
  (req, res, next) => {
    req.params.contentType = 'comment';
    req.params.contentId = req.params.commentId;
    req.normalizedContentType = 'Comment';
    return setReaction(req, res, next);
  }
);

router.get(
  ['/:commentId/reaction', '/:commentId/react'],
  optionalAuth,
  validateCommentIdParam,
  (req, res, next) => {
    req.params.contentType = 'comment';
    req.params.contentId = req.params.commentId;
    req.normalizedContentType = 'Comment';
    return getUserReaction(req, res, next);
  }
);

// 3. Edit & Delete Existing Comments
router.patch(
  '/:commentId',
  requireAuth,
  validateCommentIdParam,
  validateUpdateComment,
  updateComment
);

router.delete(
  '/:commentId',
  requireAuth,
  validateCommentIdParam,
  deleteComment
);

// 4. Target-Specific Comments (Videos and Shorts)
router.get(
  '/:contentType/:contentId',
  optionalAuth,
  validateCommentTargetParams,
  getComments
);

router.post(
  '/:contentType/:contentId',
  requireAuth,
  validateCommentTargetParams,
  validateCreateComment,
  createComment
);

module.exports = router;
