/**
 * Comment Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    dislikesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

commentSchema.index({ video: 1, createdAt: -1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
module.exports = Comment;

