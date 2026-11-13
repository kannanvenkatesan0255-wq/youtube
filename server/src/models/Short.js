/**
 * Short Model (Vertical Video)
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');

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
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required']
    },
    thumbnailUrl: {
      type: String,
      required: [true, 'Thumbnail URL is required']
    },
    duration: {
      type: Number,
      required: true,
      max: [60, 'Shorts duration cannot exceed 60 seconds']
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
    commentsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    soundTitle: {
      type: String,
      default: 'Original Audio'
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
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

shortSchema.index({ createdAt: -1 });

const Short = mongoose.models.Short || mongoose.model('Short', shortSchema);
module.exports = Short;

