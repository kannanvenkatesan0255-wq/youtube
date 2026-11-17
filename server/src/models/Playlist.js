/**
 * Playlist Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');
const { VIDEO_VISIBILITY } = require('../constants/appConstants');

const playlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Playlist title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    videos: [
      {
        video: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Video',
          required: true
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    thumbnailUrl: {
      type: String,
      default: ''
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true
    },
    systemType: {
      type: String,
      enum: ['custom', 'watch_later', 'liked_videos'],
      default: 'custom',
      index: true
    },
    visibility: {
      type: String,
      enum: Object.values(VIDEO_VISIBILITY),
      default: VIDEO_VISIBILITY.PUBLIC
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for video count
playlistSchema.virtual('videoCount').get(function () {
  return this.videos ? this.videos.length : 0;
});

playlistSchema.index({ owner: 1, createdAt: -1 });
playlistSchema.index({ owner: 1, systemType: 1 });
playlistSchema.index({ visibility: 1, createdAt: -1 });

const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;

