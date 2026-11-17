/**
 * Unified Engagement Controller (Reactions / Likes & Dislikes)
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 * Mutually exclusive, persistent reactions for Videos, Shorts, and Comments with atomic counts
 */
const mongoose = require('mongoose');
const Like = require('../models/Like');
const Video = require('../models/Video');
const Short = require('../models/Short');
const Comment = require('../models/Comment');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const { LIKE_TYPES, NOTIFICATION_TYPES } = require('../constants/appConstants');
const { createNotification } = require('../services/notification.service');
const { emitToContent } = require('../services/socket.service');
const { recordEvent } = require('../services/analytics.service');
const { logger } = require('../utils/logger');

/**
 * Helper to fetch content target document by type
 */
const getTargetModelAndDoc = async (contentType, contentId, user) => {
  let Model;
  let fieldKey;

  switch (contentType) {
    case 'Video':
      Model = Video;
      fieldKey = 'video';
      break;
    case 'Short':
      Model = Short;
      fieldKey = 'short';
      break;
    case 'Comment':
      Model = Comment;
      fieldKey = 'comment';
      break;
    default:
      throw new ApiError(400, `Unsupported content type: ${contentType}`);
  }

  const doc = await Model.findById(contentId);
  if (!doc) {
    throw new ApiError(404, `${contentType} not found.`);
  }

  // Access validation for private content
  if (doc.visibility === 'private') {
    const isOwner = user && (doc.owner?.equals(user._id) || doc.user?.equals(user._id) || user.role === 'admin');
    if (!isOwner) {
      throw new ApiError(403, `Cannot react to private ${contentType}.`);
    }
  }

  return { Model, doc, fieldKey };
};

/**
 * @route   POST /api/engagement/:contentType/:contentId/reaction
 * @desc    Toggle, set, or switch like/dislike reaction on Video, Short, or Comment
 * @access  Private (Authenticated users)
 */
const setReaction = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentType = req.normalizedContentType;
    const { reaction } = req.body; // 'like' or 'dislike'
    const userId = req.user._id;

    const { Model, doc, fieldKey } = await getTargetModelAndDoc(contentType, contentId, req.user);

    // Query for existing reaction by user on this content
    const existing = await Like.findOne({
      user: userId,
      $or: [{ [fieldKey]: contentId }, { contentId, contentType }]
    });

    let currentReaction = null;
    let action = '';

    if (existing) {
      if (existing.type === reaction) {
        // --- CASE 1: TOGGLE OFF (Clicking existing reaction removes it) ---
        await Like.findByIdAndDelete(existing._id);

        const decField = reaction === LIKE_TYPES.LIKE ? 'likesCount' : 'dislikesCount';
        const updated = await Model.findByIdAndUpdate(
          contentId,
          { $inc: { [decField]: -1 } },
          { new: true }
        );

        // Ensure non-negative bounds
        if (updated[decField] < 0) {
          await Model.findByIdAndUpdate(contentId, { [decField]: 0 });
          updated[decField] = 0;
        }

        currentReaction = null;
        action = 'removed';
        doc.likesCount = updated.likesCount;
        doc.dislikesCount = updated.dislikesCount;
      } else {
        // --- CASE 2: SWITCH REACTION (e.g. from like to dislike or vice-versa) ---
        const oldType = existing.type;
        existing.type = reaction;
        await existing.save();

        const decField = oldType === LIKE_TYPES.LIKE ? 'likesCount' : 'dislikesCount';
        const incField = reaction === LIKE_TYPES.LIKE ? 'likesCount' : 'dislikesCount';

        const updated = await Model.findByIdAndUpdate(
          contentId,
          { $inc: { [decField]: -1, [incField]: 1 } },
          { new: true }
        );

        if (updated[decField] < 0) {
          await Model.findByIdAndUpdate(contentId, { [decField]: 0 });
          updated[decField] = 0;
        }

        currentReaction = reaction;
        action = 'switched';
        doc.likesCount = updated.likesCount;
        doc.dislikesCount = updated.dislikesCount;

        if (doc.channel && (contentType === 'Video' || contentType === 'Short')) {
          recordEvent({
            channelId: doc.channel,
            contentType,
            contentId,
            eventType: reaction,
            value: 1,
            viewer: userId
          });
        }

        // Send like notification if switched to like
        if (reaction === LIKE_TYPES.LIKE) {
          const ownerId = doc.owner || doc.user;
          const notifType =
            contentType === 'Short'
              ? NOTIFICATION_TYPES.SHORT_LIKE
              : NOTIFICATION_TYPES.VIDEO_LIKE;

          createNotification({
            recipient: ownerId,
            sender: userId,
            type: notifType,
            contentType,
            contentId,
            video: contentType === 'Video' ? contentId : null,
            short: contentType === 'Short' ? contentId : null,
            comment: contentType === 'Comment' ? contentId : null,
            message: `${req.user.name || req.user.username} liked your ${contentType.toLowerCase()}`,
            link: contentType === 'Short' ? `/shorts/${contentId}` : `/watch/${contentId}`
          });
        }
      }
    } else {
      // --- CASE 3: NEW REACTION ---
      await Like.create({
        user: userId,
        [fieldKey]: contentId,
        contentId,
        contentType,
        type: reaction
      });

      const incField = reaction === LIKE_TYPES.LIKE ? 'likesCount' : 'dislikesCount';
      const updated = await Model.findByIdAndUpdate(
        contentId,
        { $inc: { [incField]: 1 } },
        { new: true }
      );

      currentReaction = reaction;
      action = 'added';
      doc.likesCount = updated.likesCount;
      doc.dislikesCount = updated.dislikesCount;

      if (doc.channel && (contentType === 'Video' || contentType === 'Short')) {
        recordEvent({
          channelId: doc.channel,
          contentType,
          contentId,
          eventType: reaction,
          value: 1,
          viewer: userId
        });
      }

      // Send like notification to creator
      if (reaction === LIKE_TYPES.LIKE) {
        const ownerId = doc.owner || doc.user;
        const notifType =
          contentType === 'Short'
            ? NOTIFICATION_TYPES.SHORT_LIKE
            : NOTIFICATION_TYPES.VIDEO_LIKE;

        createNotification({
          recipient: ownerId,
          sender: userId,
          type: notifType,
          contentType,
          contentId,
          video: contentType === 'Video' ? contentId : null,
          short: contentType === 'Short' ? contentId : null,
          comment: contentType === 'Comment' ? contentId : null,
          message: `${req.user.name || req.user.username} liked your ${contentType.toLowerCase()}`,
          link: contentType === 'Short' ? `/shorts/${contentId}` : `/watch/${contentId}`
        });
      }
    }

    // Broadcast live reaction update to room
    emitToContent(`${contentType}:${contentId}`, 'reaction_updated', {
      contentId,
      contentType,
      likesCount: doc.likesCount,
      dislikesCount: doc.dislikesCount
    });

    return res.status(200).json(
      ApiResponse.success(
        {
          action,
          userReaction: currentReaction,
          reaction: currentReaction,
          likesCount: doc.likesCount,
          dislikesCount: doc.dislikesCount
        },
        `Reaction ${action} successfully.`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/engagement/:contentType/:contentId/reaction
 * @desc    Remove any reaction on the target content
 * @access  Private (Authenticated users)
 */
const removeReaction = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentType = req.normalizedContentType;
    const userId = req.user._id;

    const { Model, doc, fieldKey } = await getTargetModelAndDoc(contentType, contentId, req.user);

    const existing = await Like.findOne({
      user: userId,
      $or: [{ [fieldKey]: contentId }, { contentId, contentType }]
    });

    if (existing) {
      const decField = existing.type === LIKE_TYPES.LIKE ? 'likesCount' : 'dislikesCount';
      await Like.findByIdAndDelete(existing._id);

      const updated = await Model.findByIdAndUpdate(
        contentId,
        { $inc: { [decField]: -1 } },
        { new: true }
      );

      if (updated[decField] < 0) {
        await Model.findByIdAndUpdate(contentId, { [decField]: 0 });
        updated[decField] = 0;
      }

      doc.likesCount = updated.likesCount;
      doc.dislikesCount = updated.dislikesCount;
    }

    return res.status(200).json(
      ApiResponse.success(
        {
          userReaction: null,
          reaction: null,
          likesCount: doc.likesCount,
          dislikesCount: doc.dislikesCount
        },
        'Reaction removed.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/engagement/:contentType/:contentId/reaction
 * @desc    Get current user's reaction for this content
 * @access  Public / Optional Auth
 */
const getUserReaction = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentType = req.normalizedContentType;

    if (!req.user) {
      return res.status(200).json(ApiResponse.success({ userReaction: null, reaction: null }));
    }

    const { fieldKey } = await getTargetModelAndDoc(contentType, contentId, req.user);

    const existing = await Like.findOne({
      user: req.user._id,
      $or: [{ [fieldKey]: contentId }, { contentId, contentType }]
    });

    return res.status(200).json(
      ApiResponse.success({
        userReaction: existing ? existing.type : null,
        reaction: existing ? existing.type : null
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/engagement/:contentType/:contentId/summary
 * @desc    Get total counts and current user's reaction
 * @access  Public / Optional Auth
 */
const getReactionSummary = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentType = req.normalizedContentType;

    const { doc, fieldKey } = await getTargetModelAndDoc(contentType, contentId, req.user);

    let userReaction = null;
    if (req.user) {
      const existing = await Like.findOne({
        user: req.user._id,
        $or: [{ [fieldKey]: contentId }, { contentId, contentType }]
      });
      if (existing) userReaction = existing.type;
    }

    return res.status(200).json(
      ApiResponse.success({
        contentType,
        contentId,
        likesCount: doc.likesCount || 0,
        dislikesCount: doc.dislikesCount || 0,
        userReaction,
        reaction: userReaction
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setReaction,
  removeReaction,
  getUserReaction,
  getReactionSummary
};
