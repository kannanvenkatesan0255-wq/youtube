/**
 * Report Model
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 */
const mongoose = require('mongoose');
const { REPORT_REASONS, REPORT_STATUS, MODERATION_ACTIONS } = require('../constants/appConstants');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true
    },
    contentType: {
      type: String,
      enum: ['Video', 'Short', 'Comment', 'Channel', 'User'],
      required: [true, 'Content type is required'],
      index: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target content ID is required'],
      index: true
    },
    // Convenience refs for fast Mongoose population
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      default: null
    },
    short: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Short',
      default: null
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      default: null
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: [true, 'Report reason is required'],
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
      index: true
    },
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
    },
    resolutionAction: {
      type: String,
      enum: Object.values(MODERATION_ACTIONS),
      default: MODERATION_ACTIONS.NONE
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for report queues and duplicate detection
reportSchema.index({ reporter: 1, contentId: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ contentType: 1, contentId: 1 });
reportSchema.index({ reason: 1, createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
module.exports = Report;
