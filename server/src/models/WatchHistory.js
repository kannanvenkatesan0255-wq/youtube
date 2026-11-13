/**
 * Watch History Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    watchedSeconds: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Unique pair user + video with upsert semantics
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, lastWatchedAt: -1 });

const WatchHistory = mongoose.models.WatchHistory || mongoose.model('WatchHistory', watchHistorySchema);
module.exports = WatchHistory;

