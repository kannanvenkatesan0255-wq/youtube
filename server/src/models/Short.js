/**
 * Short Model (Vertical Video)
 * VidTube Platform Architecture - Phase 5 Shorts Engine
 */
const mongoose = require('mongoose');
const {
  VIDEO_VISIBILITY,
  VIDEO_PROCESSING_STATUS
} = require('../constants/appConstants');

const shortSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Short title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    videoUrl: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: '' // Cloudinary video asset public ID
    },
    thumbnailUrl: {
      type: String,
      default: '' // Cloudinary vertical video thumbnail
    },
    thumbnailPublicId: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
      max: [180, 'Short duration cannot exceed 180 seconds']
    },
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    aspectRatio: {
      type: String,
      default: '9:16'
    },
    format: {
      type: String,
      default: 'mp4'
    },
    fileSize: {
      type: Number,
      default: 0
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
    processingStatus: {
      type: String,
      enum: Object.values(VIDEO_PROCESSING_STATUS),
      default: VIDEO_PROCESSING_STATUS.READY,
      index: true
    },
    processingError: {
      type: String,
      default: ''
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
    soundTitle: {
      type: String,
      default: 'Original Audio',
      trim: true
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
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// High-throughput performance compound indexes
shortSchema.index({ visibility: 1, processingStatus: 1, createdAt: -1 });
shortSchema.index({ owner: 1, createdAt: -1 });
shortSchema.index({ channel: 1, createdAt: -1 });
shortSchema.index({ views: -1 });

const Short = mongoose.models.Short || mongoose.model('Short', shortSchema);
module.exports = Short;
