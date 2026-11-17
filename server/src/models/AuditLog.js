/**
 * Audit Log Model
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 * Immutable audit trail of all sensitive administrative operations
 */
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin reference is required'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true
    },
    targetType: {
      type: String,
      enum: ['User', 'Channel', 'Video', 'Short', 'Comment', 'Report', 'PlatformSetting', 'Announcement'],
      required: [true, 'Target entity type is required'],
      index: true
    },
    targetId: {
      type: String,
      required: [true, 'Target ID is required'],
      index: true
    },
    reason: {
      type: String,
      default: '',
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
