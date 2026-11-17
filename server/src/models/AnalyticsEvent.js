/**
 * Analytics Event Model
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true
    },
    contentType: {
      type: String,
      enum: ['Video', 'Short', 'Channel'],
      default: 'Video',
      index: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      default: null
    },
    eventType: {
      type: String,
      enum: [
        'view',
        'watch_time',
        'completion',
        'like',
        'dislike',
        'comment',
        'subscribe',
        'unsubscribe',
        'share'
      ],
      required: true,
      index: true
    },
    value: {
      type: Number,
      default: 1
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    ipHash: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false // we use createdAt explicitly
  }
);

// High-performance compound indexes for timeseries and channel aggregations
analyticsEventSchema.index({ channel: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ channel: 1, createdAt: -1 });
analyticsEventSchema.index({ contentId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ channel: 1, contentType: 1, eventType: 1, createdAt: -1 });

const AnalyticsEvent =
  mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;
