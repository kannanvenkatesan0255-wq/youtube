/**
 * Core Application Constants
 * VidTube Platform Architecture - Phase 3
 */

const USER_ROLES = Object.freeze({
  USER: 'user',
  CREATOR: 'creator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
});

const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  DEACTIVATED: 'deactivated'
});

const REPORT_REASONS = Object.freeze([
  'spam',
  'harassment',
  'hate',
  'impersonation',
  'copyright',
  'inappropriate',
  'misleading',
  'other'
]);

const REPORT_STATUS = Object.freeze({
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated'
});

const MODERATION_ACTIONS = Object.freeze({
  NONE: 'none',
  WARNING: 'warning',
  RESTRICTED: 'restricted',
  REMOVED: 'removed',
  RESTORED: 'restored'
});

const MODERATION_STATUS = Object.freeze({
  CLEAN: 'clean',
  FLAGGED: 'flagged',
  RESTRICTED: 'restricted',
  REMOVED: 'removed'
});

const AUDIT_ACTIONS = Object.freeze({
  USER_SUSPEND: 'user_suspend',
  USER_RESTORE: 'user_restore',
  USER_BAN: 'user_ban',
  USER_ROLE_CHANGE: 'user_role_change',
  CHANNEL_SUSPEND: 'channel_suspend',
  CHANNEL_RESTORE: 'channel_restore',
  VIDEO_MODERATE: 'video_moderate',
  SHORT_MODERATE: 'short_moderate',
  COMMENT_MODERATE: 'comment_moderate',
  REPORT_RESOLVE: 'report_resolve',
  REPORT_REJECT: 'report_reject',
  REPORT_ESCALATE: 'report_escalate',
  SETTINGS_UPDATE: 'settings_update',
  ANNOUNCEMENT_CREATE: 'announcement_create',
  ANNOUNCEMENT_UPDATE: 'announcement_update',
  ANNOUNCEMENT_DELETE: 'announcement_delete'
});

const ANNOUNCEMENT_TYPES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  MAINTENANCE: 'maintenance',
  UPDATE: 'update'
});

const VIDEO_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
  PRIVATE: 'private'
});

const VIDEO_PROCESSING_STATUS = Object.freeze({
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed'
});

const VIDEO_CATEGORIES = Object.freeze([
  'All',
  'Gaming',
  'Music',
  'Web Development',
  'Programming',
  'JavaScript',
  'React',
  'Node.js',
  'Podcasts',
  'Tech & Gadgets',
  'Technology',
  'AI & Machine Learning',
  'News & Politics',
  'Sports',
  'Entertainment',
  'Science & Education',
  'Education',
  'Film & Animation',
  'Comedy',
  'Howto & Style',
  'Travel & Events',
  'People & Blogs',
  'Personal',
  'Other'
]);

const LIKE_TYPES = Object.freeze({
  LIKE: 'like',
  DISLIKE: 'dislike'
});

const NOTIFICATION_TYPES = Object.freeze({
  NEW_VIDEO: 'new_video',
  NEW_SHORT: 'new_short',
  NEW_COMMENT: 'new_comment',
  COMMENT_REPLY: 'comment_reply',
  NEW_SUBSCRIBER: 'new_subscriber',
  VIDEO_LIKE: 'video_like',
  SHORT_LIKE: 'short_like',
  SYSTEM: 'system'
});

const VIEW_TRACKING = Object.freeze({
  MIN_WATCH_SECONDS: 5,
  COOLDOWN_SECONDS: 30
});

const STREAMING_RESOLUTIONS = Object.freeze([
  'auto',
  '1080p',
  '720p',
  '480p',
  '360p',
  '240p'
]);

module.exports = {
  USER_ROLES,
  ACCOUNT_STATUS,
  REPORT_REASONS,
  REPORT_STATUS,
  MODERATION_ACTIONS,
  MODERATION_STATUS,
  AUDIT_ACTIONS,
  ANNOUNCEMENT_TYPES,
  VIDEO_VISIBILITY,
  VIDEO_PROCESSING_STATUS,
  VIDEO_CATEGORIES,
  LIKE_TYPES,
  NOTIFICATION_TYPES,
  VIEW_TRACKING,
  STREAMING_RESOLUTIONS
};
