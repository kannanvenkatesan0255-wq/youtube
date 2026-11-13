/**
 * Subscription Model
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true
    },
    notificationPreference: {
      type: String,
      enum: ['all', 'personalized', 'none'],
      default: 'all'
    }
  },
  {
    timestamps: true
  }
);

// A user can subscribe to a channel only once
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;

