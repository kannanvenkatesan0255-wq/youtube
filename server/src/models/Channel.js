/**
 * Channel Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      maxlength: [60, 'Channel name cannot exceed 60 characters']
    },
    handle: {
      type: String,
      required: [true, 'Channel handle is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    avatar: {
      type: String,
      default: ''
    },
    banner: {
      type: String,
      default: ''
    },
    subscribersCount: {
      type: Number,
      default: 0,
      min: 0
    },
    videosCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    featuredVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      default: null
    },
    defaultVisibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'restricted'],
      default: 'active',
      index: true
    },
    statusReason: {
      type: String,
      default: ''
    },
    links: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Search and performance indexes
channelSchema.index(
  {
    name: 'text',
    handle: 'text',
    description: 'text'
  },
  {
    weights: {
      name: 10,
      handle: 8,
      description: 1
    },
    name: 'channel_fulltext_search'
  }
);
channelSchema.index({ subscribersCount: -1 });

const Channel = mongoose.models.Channel || mongoose.model('Channel', channelSchema);
module.exports = Channel;

