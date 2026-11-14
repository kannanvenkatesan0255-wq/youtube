/**
 * Video Model
 * VidTube Platform Architecture - Phase 3 Video Upload & Management Engine
 */
const mongoose = require('mongoose');
const {
  VIDEO_VISIBILITY,
  VIDEO_PROCESSING_STATUS,
  VIDEO_CATEGORIES
} = require('../constants/appConstants');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    videoUrl: {
      type: String,
      default: '' // Can be empty during initial metadata creation before upload completes
    },
    hlsUrl: {
      type: String,
      default: '' // Cloudinary or streaming HLS (.m3u8) adaptive playlist URL
    },
    streamingProfiles: [
      {
        type: String // Available adaptive renditions, e.g. ['auto', '1080p', '720p', '480p', '360p']
      }
    ],
    publicId: {
      type: String,
      default: '' // Cloudinary video asset public ID
    },
    thumbnailUrl: {
      type: String,
      default: '' // Custom or auto-generated Cloudinary thumbnail URL
    },
    thumbnailPublicId: {
      type: String,
      default: '' // Cloudinary thumbnail asset public ID
    },
    duration: {
      type: Number,
      default: 0,
      min: 0 // Duration in seconds
    },
    resolution: {
      type: String,
      default: '' // e.g., '1080p', '720p', '4K'
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
      default: '16:9'
    },
    format: {
      type: String,
      default: '' // e.g., 'mp4', 'webm', 'mov'
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0 // File size in bytes
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
    language: {
      type: String,
      default: 'English'
    },
    location: {
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
    },
    storageProvider: {
      type: String,
      default: 'cloudinary'
    },
    storageCleanedUp: {
      type: Boolean,
      default: false
    },
    cleanupError: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Performance compound indexes
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ channel: 1, createdAt: -1 });
videoSchema.index({ visibility: 1, processingStatus: 1, createdAt: -1 });
videoSchema.index({ category: 1, visibility: 1, processingStatus: 1 });
videoSchema.index({ views: -1 });

// Full-text search index
videoSchema.index(
  {
    title: 'text',
    description: 'text',
    tags: 'text'
  },
  {
    weights: {
      title: 10,
      tags: 5,
      description: 1
    },
    name: 'video_fulltext_search'
  }
);

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);
module.exports = Video;
