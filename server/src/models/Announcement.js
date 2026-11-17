/**
 * Announcement Model
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 */
const mongoose = require('mongoose');
const { ANNOUNCEMENT_TYPES } = require('../constants/appConstants');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    type: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_TYPES),
      default: ANNOUNCEMENT_TYPES.INFO
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    priority: {
      type: Number,
      default: 0
    },
    targetAudience: {
      type: String,
      enum: ['all', 'creators', 'users'],
      default: 'all'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

announcementSchema.index({ isActive: 1, createdAt: -1 });

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
