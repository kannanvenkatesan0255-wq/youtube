/**
 * Comment Controller
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 * Persistent comments, 1-level nested replies, atomic counters, and author permissions
 */
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Video = require('../models/Video');
const Short = require('../models/Short');
const Channel = require('../models/Channel');
const Like = require('../models/Like');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const { NOTIFICATION_TYPES, LIKE_TYPES } = require('../constants/appConstants');
const { createNotification } = require('../services/notification.service');
const { emitToContent } = require('../services/socket.service');
const { logger } = require('../utils/logger');

/**
 * Helper to fetch target Video or Short and verify visibility
 */
const getTargetContent = async (contentType, contentId, user) => {
  const Model = contentType === 'Short' ? Short : Video;
  const doc = await Model.findById(contentId);

  if (!doc) {
    throw new ApiError(404, `${contentType} not found.`);
  }

  if (doc.visibility === 'private') {
    const isOwner = user && (doc.owner.equals(user._id) || user.role === 'admin');
    if (!isOwner) {
      throw new ApiError(403, `Cannot view or comment on private ${contentType}.`);
    }
  }

  return { Model, doc };
};

/**
 * @route   GET /api/comments/:contentType/:contentId
 * @desc    Get top-level comments for a Video or Short (paginated & sorted)
 * @access  Public / Optional Auth
 */
const getComments = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentType = req.normalizedContentType; // 'Video' or 'Short'
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy === 'newest' ? { createdAt: -1 } : { likesCount: -1, createdAt: -1 };

    await getTargetContent(contentType, contentId, req.user);

    const query = {
      $or: [
        { contentId, contentType, parentComment: null },
        { [contentType.toLowerCase()]: contentId, parentComment: null }
      ]
    };

    const [comments, totalTopLevel] = await Promise.all([
      Comment.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name username avatar')
        .populate('channel', 'name handle avatar isVerified')
        .lean(),
      Comment.countDocuments(query)
    ]);

    // If authenticated, attach user's reaction for each comment
    comments.forEach((c) => {
      c.text = c.content;
    });

    if (req.user && comments.length > 0) {
      const commentIds = comments.map((c) => c._id);
      const userLikes = await Like.find({
        user: req.user._id,
        $or: [{ comment: { $in: commentIds } }, { contentId: { $in: commentIds }, contentType: 'Comment' }]
      }).lean();

      const reactionMap = new Map();
      userLikes.forEach((l) => {
        const id = (l.comment || l.contentId).toString();
        reactionMap.set(id, l.type);
      });

      comments.forEach((c) => {
        c.userReaction = reactionMap.get(c._id.toString()) || null;
      });
    }

    return res.status(200).json(
      ApiResponse.success(
        {
          comments,
          pagination: {
            page,
            limit,
            total: totalTopLevel,
            pages: Math.ceil(totalTopLevel / limit) || 1
          }
        },
        'Comments retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/comments/:contentType/:contentId
 * @desc    Create top-level comment on Video or Short
 * @access  Private (Authenticated users)
 */
const createComment = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentType = req.normalizedContentType;
    const { text } = req.body;
    const userId = req.user._id;

    const { Model, doc } = await getTargetContent(contentType, contentId, req.user);

    // Find author's channel if available
    const userChannel = await Channel.findOne({ owner: userId }).select('_id');

    const comment = await Comment.create({
      content: text,
      user: userId,
      channel: userChannel ? userChannel._id : null,
      contentType,
      contentId,
      [contentType.toLowerCase()]: contentId,
      parentComment: null,
      repliesCount: 0,
      likesCount: 0,
      dislikesCount: 0,
      isEdited: false
    });

    // Increment commentsCount on target content atomically
    await Model.findByIdAndUpdate(contentId, { $inc: { commentsCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate('user', 'name username avatar')
      .populate('channel', 'name handle avatar isVerified')
      .lean();

    populated.userReaction = null;
    populated.text = populated.content;

    // Send notification to content owner (if not self)
    const ownerId = doc.owner;
    createNotification({
      recipient: ownerId,
      sender: userId,
      channel: userChannel ? userChannel._id : null,
      type: contentType === 'Short' ? NOTIFICATION_TYPES.NEW_COMMENT : NOTIFICATION_TYPES.NEW_COMMENT,
      contentType,
      contentId,
      video: contentType === 'Video' ? contentId : null,
      short: contentType === 'Short' ? contentId : null,
      comment: comment._id,
      message: `${req.user.name || req.user.username} commented on your ${contentType.toLowerCase()}: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
      link: contentType === 'Short' ? `/shorts/${contentId}` : `/watch/${contentId}`
    });

    // Broadcast live comment via Socket.IO
    emitToContent(`${contentType}:${contentId}`, 'new_comment', populated);

    logger.info(`Comment created [${comment._id}] on ${contentType} [${contentId}] by ${req.user.username}`);

    const payload = { comment: populated, ...populated };
    return res.status(201).json(ApiResponse.created(payload, 'Comment posted successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/comments/:commentId/replies
 * @desc    Reply to an existing comment (1-level nesting maximum)
 * @access  Private (Authenticated users)
 */
const replyToComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const parent = await Comment.findById(commentId);
    if (!parent) {
      return next(new ApiError(404, 'Parent comment not found.'));
    }

    // Collapse to 1-level depth: if parent is already a reply, point to its root parent
    const rootParentId = parent.parentComment ? parent.parentComment : parent._id;
    const contentType = parent.contentType || 'Video';
    const contentId = parent.contentId || parent.video || parent.short;

    const TargetModel = contentType === 'Short' ? Short : Video;

    const userChannel = await Channel.findOne({ owner: userId }).select('_id');

    const reply = await Comment.create({
      content: text,
      user: userId,
      channel: userChannel ? userChannel._id : null,
      contentType,
      contentId,
      [contentType.toLowerCase()]: contentId,
      parentComment: rootParentId,
      repliesCount: 0,
      likesCount: 0,
      dislikesCount: 0,
      isEdited: false
    });

    // Increment repliesCount on the root parent comment and total commentsCount on content
    await Promise.all([
      Comment.findByIdAndUpdate(rootParentId, { $inc: { repliesCount: 1 } }),
      TargetModel.findByIdAndUpdate(contentId, { $inc: { commentsCount: 1 } })
    ]);

    const populatedReply = await Comment.findById(reply._id)
      .populate('user', 'name username avatar')
      .populate('channel', 'name handle avatar isVerified')
      .lean();

    populatedReply.userReaction = null;
    populatedReply.text = populatedReply.content;

    // Send notification to the comment author being replied to
    const replyRecipientId = parent.user;
    createNotification({
      recipient: replyRecipientId,
      sender: userId,
      channel: userChannel ? userChannel._id : null,
      type: NOTIFICATION_TYPES.COMMENT_REPLY,
      contentType,
      contentId,
      video: contentType === 'Video' ? contentId : null,
      short: contentType === 'Short' ? contentId : null,
      comment: reply._id,
      message: `${req.user.name || req.user.username} replied to your comment: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
      link: contentType === 'Short' ? `/shorts/${contentId}` : `/watch/${contentId}`
    });

    emitToContent(`${contentType}:${contentId}`, 'new_reply', {
      rootParentId,
      reply: populatedReply
    });

    logger.info(`Reply created [${reply._id}] on comment [${rootParentId}] by ${req.user.username}`);

    const payload = { comment: populatedReply, ...populatedReply };
    return res.status(201).json(ApiResponse.created(payload, 'Reply posted successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies for a specific parent comment
 * @access  Public / Optional Auth
 */
const getCommentReplies = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const parent = await Comment.findById(commentId);
    if (!parent) {
      return next(new ApiError(404, 'Parent comment not found.'));
    }

    const query = { parentComment: commentId };

    const [replies, totalReplies] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: 1 }) // Chronological order for replies
        .skip(skip)
        .limit(limit)
        .populate('user', 'name username avatar')
        .populate('channel', 'name handle avatar isVerified')
        .lean(),
      Comment.countDocuments(query)
    ]);

    replies.forEach((r) => {
      r.text = r.content;
    });

    if (req.user && replies.length > 0) {
      const replyIds = replies.map((r) => r._id);
      const userLikes = await Like.find({
        user: req.user._id,
        $or: [{ comment: { $in: replyIds } }, { contentId: { $in: replyIds }, contentType: 'Comment' }]
      }).lean();

      const reactionMap = new Map();
      userLikes.forEach((l) => {
        const id = (l.comment || l.contentId).toString();
        reactionMap.set(id, l.type);
      });

      replies.forEach((r) => {
        r.userReaction = reactionMap.get(r._id.toString()) || null;
      });
    }

    return res.status(200).json(
      ApiResponse.success(
        {
          replies,
          pagination: {
            page,
            limit,
            total: totalReplies,
            pages: Math.ceil(totalReplies / limit) || 1
          }
        },
        'Replies retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/comments/:commentId
 * @desc    Edit existing comment text
 * @access  Private (Author only)
 */
const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new ApiError(404, 'Comment not found.'));
    }

    if (!comment.user.equals(userId) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You can only edit your own comments.'));
    }

    comment.content = text;
    comment.isEdited = true;
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('user', 'name username avatar')
      .populate('channel', 'name handle avatar isVerified')
      .lean();

    populated.text = populated.content;
    const payload = { comment: populated, ...populated };
    return res.status(200).json(ApiResponse.success(payload, 'Comment updated successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete comment (and cascading replies if top-level)
 * @access  Private (Author, Video/Short Owner, or Admin)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new ApiError(404, 'Comment not found.'));
    }

    const contentType = comment.contentType || 'Video';
    const contentId = comment.contentId || comment.video || comment.short;
    const TargetModel = contentType === 'Short' ? Short : Video;
    const targetContent = await TargetModel.findById(contentId);

    // Permission: Comment author, content owner, or admin
    const isAuthor = comment.user.equals(userId);
    const isContentOwner = targetContent && targetContent.owner.equals(userId);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isContentOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden. You do not have permission to delete this comment.'));
    }

    if (comment.parentComment) {
      // It's a reply: decrement repliesCount on parent comment and commentsCount on content
      await Promise.all([
        Comment.findByIdAndDelete(commentId),
        Comment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } }),
        TargetModel.findByIdAndUpdate(contentId, { $inc: { commentsCount: -1 } }),
        Like.deleteMany({ $or: [{ comment: commentId }, { contentId: commentId, contentType: 'Comment' }] })
      ]);
    } else {
      // Top-level comment: cascade delete all its replies
      const repliesCount = await Comment.countDocuments({ parentComment: commentId });
      const totalToDeleteCount = 1 + repliesCount;

      await Promise.all([
        Comment.findByIdAndDelete(commentId),
        Comment.deleteMany({ parentComment: commentId }),
        TargetModel.findByIdAndUpdate(contentId, { $inc: { commentsCount: -totalToDeleteCount } }),
        Like.deleteMany({ $or: [{ comment: commentId }, { contentId: commentId, contentType: 'Comment' }] })
      ]);
    }

    // Ensure non-negative bounds on commentsCount
    const checkTarget = await TargetModel.findById(contentId);
    if (checkTarget && checkTarget.commentsCount < 0) {
      await TargetModel.findByIdAndUpdate(contentId, { commentsCount: 0 });
    }

    return res.status(200).json(
      ApiResponse.success({ deletedCommentId: commentId }, 'Comment deleted successfully.')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  createComment,
  replyToComment,
  getCommentReplies,
  updateComment,
  deleteComment
};
