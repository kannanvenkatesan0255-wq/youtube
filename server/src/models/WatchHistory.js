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
    contentType: {
      type: String,
      enum: ['Video', 'Short'],
      default: 'Video',
      index: true
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: function () {
        return !this.short;
      },
      index: true
    },
    short: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Short',
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

// Unique pair user + content with upsert semantics
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true, sparse: true });
watchHistorySchema.index({ user: 1, short: 1 }, { unique: true, sparse: true });
watchHistorySchema.index({ user: 1, lastWatchedAt: -1 });
watchHistorySchema.index({ user: 1, completed: 1, lastWatchedAt: -1 });

const WatchHistory = mongoose.models.WatchHistory || mongoose.model('WatchHistory', watchHistorySchema);
module.exports = WatchHistory;

