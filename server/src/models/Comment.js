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
    contentType: {
      type: String,
      enum: ['Video', 'Short'],
      default: 'Video',
      index: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
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
    repliesCount: {
      type: Number,
      default: 0,
      min: 0
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
    },
    pinnedAt: {
      type: Date
    },
    moderationStatus: {
      type: String,
      enum: ['clean', 'flagged', 'restricted', 'removed'],
      default: 'clean',
      index: true
    },
    moderationReason: {
      type: String,
      default: ''
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    moderatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

commentSchema.virtual('text')
  .get(function () {
    return this.content;
  })
  .set(function (val) {
    this.content = val;
  });

commentSchema.index({ video: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ short: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ contentId: 1, contentType: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
module.exports = Comment;

