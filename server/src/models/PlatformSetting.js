/**
 * Platform Setting Model
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 */
const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'platform_config',
      index: true
    },
    maxVideoUploadSizeMb: {
      type: Number,
      default: 500,
      min: 10,
      max: 5000
    },
    maxShortDurationSeconds: {
      type: Number,
      default: 60,
      min: 5,
      max: 120
    },
    allowedVideoFormats: {
      type: [String],
      default: ['mp4', 'webm', 'mov', 'mkv']
    },
    allowedImageFormats: {
      type: [String],
      default: ['jpg', 'jpeg', 'png', 'webp', 'gif']
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    reportingEnabled: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const PlatformSetting = mongoose.models.PlatformSetting || mongoose.model('PlatformSetting', platformSettingSchema);
module.exports = PlatformSetting;
