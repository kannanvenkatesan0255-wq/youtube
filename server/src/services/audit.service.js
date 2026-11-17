/**
 * Admin Audit Logging Service
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 */
const AuditLog = require('../models/AuditLog');
const { logger } = require('../utils/logger');

/**
 * Record an administrative action in immutable audit log
 */
const logAudit = async ({
  adminId,
  action,
  targetType,
  targetId,
  reason = '',
  metadata = {},
  req = null
}) => {
  try {
    const ipAddress = req
      ? req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    return await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId: String(targetId),
      reason,
      metadata,
      ipAddress,
      userAgent,
      createdAt: new Date()
    });
  } catch (error) {
    logger.warn(`Failed to create audit log: ${error.message}`);
  }
};

module.exports = {
  logAudit
};
