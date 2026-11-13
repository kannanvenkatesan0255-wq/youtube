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

playlistSchema.index({ owner: 1, createdAt: -1 });

const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;

