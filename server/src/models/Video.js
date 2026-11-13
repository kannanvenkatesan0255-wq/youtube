/**
 * Video Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');
const { VIDEO_VISIBILITY, VIDEO_CATEGORIES } = require('../constants/appConstants');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: 'text'
    },
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    videoUrl: {
      type: String,
      required: [true, 'Video stream URL is required']
    },
    publicId: {
      type: String,
      default: ''
    },
    thumbnailUrl: {
      type: String,
      required: [true, 'Thumbnail image URL is required']
    },
    duration: {
      type: Number,
      default: 0,
      min: 0 // Duration in seconds
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
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
    commentsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    category: {
      type: String,
      enum: VIDEO_CATEGORIES,
      default: 'All',
      index: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    visibility: {
      type: String,
      enum: Object.values(VIDEO_VISIBILITY),
      default: VIDEO_VISIBILITY.PUBLIC,
      index: true
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

videoSchema.index({ createdAt: -1 });
videoSchema.index({ views: -1 });

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);
module.exports = Video;

