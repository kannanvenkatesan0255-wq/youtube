/**
 * Notification Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants/appConstants');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true
    },
    message: {
      type: String,
      default: ''
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    short: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Short'
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    contentType: {
      type: String,
      enum: ['Video', 'Short', 'Comment', 'Channel', 'system'],
      default: 'Video'
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual alias: actor -> sender
notificationSchema.virtual('actor').get(function () {
  return this.sender;
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
module.exports = Notification;

