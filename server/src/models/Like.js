/**
 * Like / Dislike Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');
const { LIKE_TYPES } = require('../constants/appConstants');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      index: true
    },
    short: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Short',
      index: true
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      index: true
    },
    type: {
      type: String,
      enum: Object.values(LIKE_TYPES),
      default: LIKE_TYPES.LIKE,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique indexes to prevent multiple likes from same user
likeSchema.index({ user: 1, video: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, short: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });

const Like = mongoose.models.Like || mongoose.model('Like', likeSchema);
module.exports = Like;

