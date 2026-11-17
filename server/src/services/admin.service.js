/**
 * Administrative Control Center & Content Moderation Service
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const Short = require('../models/Short');
const Comment = require('../models/Comment');
const Subscription = require('../models/Subscription');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const PlatformSetting = require('../models/PlatformSetting');
const Announcement = require('../models/Announcement');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { logAudit } = require('./audit.service');
const { ApiError } = require('../utils/apiError');
const {
  USER_ROLES,
  ACCOUNT_STATUS,
  REPORT_STATUS,
  MODERATION_ACTIONS,
  MODERATION_STATUS,
  AUDIT_ACTIONS
} = require('../constants/appConstants');

/**
 * Platform Dashboard Overview & Statistics
 */
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalChannels,
    totalVideos,
    totalShorts,
    totalComments,
    totalSubscriptions,
    pendingReports,
    suspendedUsers,
    videoViewsSum,
    shortViewsSum,
    recentUsers,
    recentVideos,
    recentReports,
    recentAuditLogs
  ] = await Promise.all([
    User.countDocuments(),
    Channel.countDocuments(),
    Video.countDocuments(),
    Short.countDocuments(),
    Comment.countDocuments(),
    Subscription.countDocuments(),
    Report.countDocuments({ status: REPORT_STATUS.PENDING }),
    User.countDocuments({ accountStatus: { $in: [ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.BANNED] } }),
    Video.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
    Short.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name username email role accountStatus createdAt avatar').lean(),
    Video.find().sort({ createdAt: -1 }).limit(5).populate('channel', 'name handle avatar').select('title views visibility moderationStatus createdAt thumbnailUrl duration').lean(),
    Report.find().sort({ createdAt: -1 }).limit(5).populate('reporter', 'name username').populate('moderator', 'name username').lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(6).populate('admin', 'name username email role').lean()
  ]);

  const totalViews = (videoViewsSum[0]?.total || 0) + (shortViewsSum[0]?.total || 0);

  return {
    metrics: {
      totalUsers,
      totalChannels,
      totalVideos,
      totalShorts,
      totalComments,
      totalSubscriptions,
      totalViews,
      pendingReports,
      suspendedUsers
    },
    recentUsers,
    recentVideos,
    recentReports,
    recentAuditLogs
  };
};

/**
 * Get Paginated User Directory with Search & Filters
 */
const getUsers = async ({ page = 1, limit = 20, q = '', role = '', status = '', sortBy = 'createdAt', order = 'desc' }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.accountStatus = status;

  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { username: rx }, { email: rx }];
  }

  const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('channel', 'name handle avatar subscribersCount')
      .select('-passwordHash -refreshToken -passwordResetToken -passwordResetExpires')
      .lean(),
    User.countDocuments(filter)
  ]);

  return {
    users,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Get Single User Details with Associated Metrics & Reports
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .populate('channel')
    .select('-passwordHash -refreshToken -passwordResetToken -passwordResetExpires')
    .lean();

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const [videoCount, shortCount, commentCount, reportHistory, userAuditLogs] = await Promise.all([
    Video.countDocuments({ owner: userId }),
    Short.countDocuments({ owner: userId }),
    Comment.countDocuments({ user: userId }),
    Report.find({ $or: [{ reportedUser: userId }, { contentId: userId }] })
      .populate('reporter', 'name username')
      .lean(),
    AuditLog.find({ targetId: String(userId), targetType: 'User' })
      .sort({ createdAt: -1 })
      .populate('admin', 'name username')
      .lean()
  ]);

  return {
    user,
    stats: {
      videoCount,
      shortCount,
      commentCount
    },
    reportHistory,
    auditHistory: userAuditLogs
  };
};

/**
 * Update User Account Status (Suspend, Ban, Restore)
 */
const updateUserStatus = async (adminUser, userId, { status, reason = '' }, req = null) => {
  if (adminUser._id.toString() === userId.toString()) {
    throw new ApiError(400, 'Administrators cannot alter their own account status.');
  }

  const target = await User.findById(userId);
  if (!target) {
    throw new ApiError(404, 'Target user not found.');
  }

  // Super Admin account protection
  if (target.role === USER_ROLES.SUPER_ADMIN && adminUser.role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Only a Super Admin can modify another Super Admin account.');
  }

  const previousStatus = target.accountStatus;
  target.accountStatus = status;

  if (status === ACCOUNT_STATUS.SUSPENDED) {
    target.suspensionReason = reason || 'Suspended by administrator.';
  } else if (status === ACCOUNT_STATUS.BANNED) {
    target.banReason = reason || 'Permanently banned by administrator.';
    target.bannedAt = new Date();
  } else if (status === ACCOUNT_STATUS.ACTIVE) {
    target.suspensionReason = '';
    target.banReason = '';
    target.bannedAt = null;
  }

  await target.save();

  // Determine audit action
  let auditAction = AUDIT_ACTIONS.USER_RESTORE;
  if (status === ACCOUNT_STATUS.SUSPENDED) auditAction = AUDIT_ACTIONS.USER_SUSPEND;
  else if (status === ACCOUNT_STATUS.BANNED) auditAction = AUDIT_ACTIONS.USER_BAN;

  await logAudit({
    adminId: adminUser._id,
    action: auditAction,
    targetType: 'User',
    targetId: userId,
    reason,
    metadata: { previousStatus, newStatus: status, username: target.username },
    req
  });

  return {
    _id: target._id,
    username: target.username,
    accountStatus: target.accountStatus,
    reason: target.suspensionReason || target.banReason
  };
};

/**
 * Update User Role (Promote/Demote) - Super Admin only
 */
const updateUserRole = async (adminUser, targetUserId, { role, reason = '' }, req = null) => {
  if (adminUser.role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Forbidden. Only Super Administrators can alter user roles.');
  }

  if (adminUser._id.toString() === targetUserId.toString()) {
    throw new ApiError(400, 'Super Administrators cannot demote themselves directly.');
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    throw new ApiError(404, 'Target user not found.');
  }

  const previousRole = target.role;
  target.role = role;
  await target.save();

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
    targetType: 'User',
    targetId: targetUserId,
    reason,
    metadata: { previousRole, newRole: role, username: target.username },
    req
  });

  return {
    _id: target._id,
    username: target.username,
    role: target.role
  };
};

/**
 * Channel Management: List Channels
 */
const getChannels = async ({ page = 1, limit = 20, q = '', status = '', sortBy = 'createdAt', order = 'desc' }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (status) filter.status = status;

  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { handle: rx }, { description: rx }];
  }

  const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

  const [channels, total] = await Promise.all([
    Channel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('owner', 'name username email role accountStatus')
      .lean(),
    Channel.countDocuments(filter)
  ]);

  return {
    channels,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Channel Management: Update Channel Status (Suspend/Restore)
 */
const updateChannelStatus = async (adminUser, channelId, { status, reason = '' }, req = null) => {
  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new ApiError(404, 'Channel not found.');
  }

  const previousStatus = channel.status || 'active';
  channel.status = status;
  channel.statusReason = reason;
  await channel.save();

  const auditAction = status === 'active' ? AUDIT_ACTIONS.CHANNEL_RESTORE : AUDIT_ACTIONS.CHANNEL_SUSPEND;

  await logAudit({
    adminId: adminUser._id,
    action: auditAction,
    targetType: 'Channel',
    targetId: channelId,
    reason,
    metadata: { previousStatus, newStatus: status, handle: channel.handle },
    req
  });

  return {
    _id: channel._id,
    name: channel.name,
    handle: channel.handle,
    status: channel.status,
    statusReason: channel.statusReason
  };
};

/**
 * Video Moderation: Get Videos Directory
 */
const getVideos = async ({ page = 1, limit = 20, q = '', moderationStatus = '', visibility = '', channelId = null }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (moderationStatus) filter.moderationStatus = moderationStatus;
  if (visibility) filter.visibility = visibility;
  if (channelId) filter.channel = channelId;

  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const [videos, total] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('channel', 'name handle avatar')
      .populate('owner', 'name username email')
      .populate('moderatedBy', 'name username')
      .lean(),
    Video.countDocuments(filter)
  ]);

  return {
    videos,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Video Moderation: Apply Moderation Action
 */
const moderateVideo = async (adminUser, videoId, { action, reason = '' }, req = null) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found.');
  }

  const previousModerationStatus = video.moderationStatus || MODERATION_STATUS.CLEAN;
  let newStatus = MODERATION_STATUS.CLEAN;

  if (action === MODERATION_ACTIONS.REMOVED) {
    newStatus = MODERATION_STATUS.REMOVED;
    video.visibility = 'private'; // unpublish from public
  } else if (action === MODERATION_ACTIONS.RESTRICTED) {
    newStatus = MODERATION_STATUS.RESTRICTED;
    video.visibility = 'unlisted';
  } else if (action === MODERATION_ACTIONS.WARNING) {
    newStatus = MODERATION_STATUS.FLAGGED;
  } else if (action === MODERATION_ACTIONS.RESTORED || action === MODERATION_ACTIONS.NONE) {
    newStatus = MODERATION_STATUS.CLEAN;
    video.visibility = 'public';
  }

  video.moderationStatus = newStatus;
  video.moderationReason = reason;
  video.moderatedBy = adminUser._id;
  video.moderatedAt = new Date();

  await video.save();

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.VIDEO_MODERATE,
    targetType: 'Video',
    targetId: videoId,
    reason,
    metadata: {
      action,
      previousModerationStatus,
      newModerationStatus: newStatus,
      videoTitle: video.title
    },
    req
  });

  return {
    _id: video._id,
    title: video.title,
    moderationStatus: video.moderationStatus,
    moderationReason: video.moderationReason,
    visibility: video.visibility
  };
};

/**
 * Shorts Moderation: Get Shorts Directory
 */
const getShorts = async ({ page = 1, limit = 20, q = '', moderationStatus = '', visibility = '', channelId = null }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (moderationStatus) filter.moderationStatus = moderationStatus;
  if (visibility) filter.visibility = visibility;
  if (channelId) filter.channel = channelId;

  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const [shorts, total] = await Promise.all([
    Short.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('channel', 'name handle avatar')
      .populate('owner', 'name username email')
      .populate('moderatedBy', 'name username')
      .lean(),
    Short.countDocuments(filter)
  ]);

  return {
    shorts,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Shorts Moderation: Apply Moderation Action
 */
const moderateShort = async (adminUser, shortId, { action, reason = '' }, req = null) => {
  const short = await Short.findById(shortId);
  if (!short) {
    throw new ApiError(404, 'Short not found.');
  }

  const previousModerationStatus = short.moderationStatus || MODERATION_STATUS.CLEAN;
  let newStatus = MODERATION_STATUS.CLEAN;

  if (action === MODERATION_ACTIONS.REMOVED) {
    newStatus = MODERATION_STATUS.REMOVED;
    short.visibility = 'private';
  } else if (action === MODERATION_ACTIONS.RESTRICTED) {
    newStatus = MODERATION_STATUS.RESTRICTED;
    short.visibility = 'unlisted';
  } else if (action === MODERATION_ACTIONS.WARNING) {
    newStatus = MODERATION_STATUS.FLAGGED;
  } else if (action === MODERATION_ACTIONS.RESTORED || action === MODERATION_ACTIONS.NONE) {
    newStatus = MODERATION_STATUS.CLEAN;
    short.visibility = 'public';
  }

  short.moderationStatus = newStatus;
  short.moderationReason = reason;
  short.moderatedBy = adminUser._id;
  short.moderatedAt = new Date();

  await short.save();

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.SHORT_MODERATE,
    targetType: 'Short',
    targetId: shortId,
    reason,
    metadata: {
      action,
      previousModerationStatus,
      newModerationStatus: newStatus,
      shortTitle: short.title
    },
    req
  });

  return {
    _id: short._id,
    title: short.title,
    moderationStatus: short.moderationStatus,
    moderationReason: short.moderationReason,
    visibility: short.visibility
  };
};

/**
 * Comment Moderation: Get Comments Directory
 */
const getComments = async ({ page = 1, limit = 20, q = '', moderationStatus = '' }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (moderationStatus) filter.moderationStatus = moderationStatus;

  if (q && q.trim()) {
    filter.content = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
  }

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('user', 'name username avatar email')
      .populate('video', 'title')
      .populate('short', 'title')
      .populate('moderatedBy', 'name username')
      .lean(),
    Comment.countDocuments(filter)
  ]);

  return {
    comments,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Comment Moderation: Apply Moderation Action
 */
const moderateComment = async (adminUser, commentId, { action, reason = '' }, req = null) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found.');
  }

  const previousModerationStatus = comment.moderationStatus || MODERATION_STATUS.CLEAN;
  let newStatus = MODERATION_STATUS.CLEAN;

  if (action === MODERATION_ACTIONS.REMOVED) {
    newStatus = MODERATION_STATUS.REMOVED;
  } else if (action === MODERATION_ACTIONS.RESTRICTED || action === MODERATION_ACTIONS.WARNING) {
    newStatus = MODERATION_STATUS.FLAGGED;
  } else if (action === MODERATION_ACTIONS.RESTORED || action === MODERATION_ACTIONS.NONE) {
    newStatus = MODERATION_STATUS.CLEAN;
  }

  comment.moderationStatus = newStatus;
  comment.moderationReason = reason;
  comment.moderatedBy = adminUser._id;
  comment.moderatedAt = new Date();

  await comment.save();

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.COMMENT_MODERATE,
    targetType: 'Comment',
    targetId: commentId,
    reason,
    metadata: { action, previousModerationStatus, newModerationStatus: newStatus },
    req
  });

  return {
    _id: comment._id,
    content: comment.content,
    moderationStatus: comment.moderationStatus,
    moderationReason: comment.moderationReason
  };
};

/**
 * Content Reporting: Submit a Report (Authenticated Users)
 */
const createReport = async ({ reporterId, contentType, contentId, reason, description = '' }) => {
  // Validate target existence
  let targetDoc = null;
  const cId = new mongoose.Types.ObjectId(contentId);

  const rawType = (contentType || '').trim();
  const lowerType = rawType.toLowerCase();
  let normalizedType = rawType;
  if (lowerType === 'video') normalizedType = 'Video';
  else if (lowerType === 'short') normalizedType = 'Short';
  else if (lowerType === 'comment') normalizedType = 'Comment';
  else if (lowerType === 'channel') normalizedType = 'Channel';
  else if (lowerType === 'user') normalizedType = 'User';

  const reportPayload = {
    reporter: reporterId,
    contentType: normalizedType,
    contentId: cId,
    reason,
    description: description.trim()
  };

  if (normalizedType === 'Video') {
    targetDoc = await Video.findById(cId);
    reportPayload.video = cId;
  } else if (normalizedType === 'Short') {
    targetDoc = await Short.findById(cId);
    reportPayload.short = cId;
  } else if (normalizedType === 'Comment') {
    targetDoc = await Comment.findById(cId);
    reportPayload.comment = cId;
  } else if (normalizedType === 'Channel') {
    targetDoc = await Channel.findById(cId);
    reportPayload.channel = cId;
  } else if (normalizedType === 'User') {
    targetDoc = await User.findById(cId);
    reportPayload.reportedUser = cId;
  }

  if (!targetDoc) {
    throw new ApiError(404, `Reported ${normalizedType} does not exist.`);
  }

  // Duplicate report prevention: Check if user already submitted a pending report for this target
  const existingReport = await Report.findOne({
    reporter: reporterId,
    contentId: cId,
    status: { $in: [REPORT_STATUS.PENDING, REPORT_STATUS.UNDER_REVIEW] }
  });

  if (existingReport) {
    throw new ApiError(409, 'You have already submitted a pending report for this content.');
  }

  const report = await Report.create(reportPayload);
  return report;
};

/**
 * Admin Reports: Get Reports List
 */
const getReports = async ({ page = 1, limit = 20, status = '', contentType = '', reason = '', sortBy = 'createdAt', order = 'desc' }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (status) filter.status = status;
  if (contentType) filter.contentType = contentType;
  if (reason) filter.reason = reason;

  const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .populate('reporter', 'name username email')
      .populate('moderator', 'name username')
      .populate('video', 'title thumbnailUrl visibility')
      .populate('short', 'title thumbnailUrl visibility')
      .populate('comment', 'content')
      .populate('channel', 'name handle avatar')
      .populate('reportedUser', 'name username email')
      .lean(),
    Report.countDocuments(filter)
  ]);

  return {
    reports,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Admin Reports: Get Single Report by ID
 */
const getReportById = async (reportId) => {
  const report = await Report.findById(reportId)
    .populate('reporter', 'name username email')
    .populate('moderator', 'name username')
    .populate('video')
    .populate('short')
    .populate('comment')
    .populate('channel')
    .populate('reportedUser')
    .lean();

  if (!report) {
    throw new ApiError(404, 'Report not found.');
  }

  return report;
};

/**
 * Admin Reports: Resolve or Reject Report with Action
 */
const resolveReport = async (adminUser, reportId, { status, resolutionNotes = '', resolutionAction = 'none' }, req = null) => {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ApiError(404, 'Report not found.');
  }

  const previousStatus = report.status;
  report.status = status;
  report.moderator = adminUser._id;
  report.resolutionNotes = resolutionNotes.trim();
  report.resolutionAction = resolutionAction;
  report.resolvedAt = new Date();

  await report.save();

  // If a moderation action was chosen, execute it on the target content
  if (resolutionAction !== 'none') {
    if (report.contentType === 'Video') {
      await moderateVideo(adminUser, report.contentId, { action: resolutionAction, reason: resolutionNotes }, req);
    } else if (report.contentType === 'Short') {
      await moderateShort(adminUser, report.contentId, { action: resolutionAction, reason: resolutionNotes }, req);
    } else if (report.contentType === 'Comment') {
      await moderateComment(adminUser, report.contentId, { action: resolutionAction, reason: resolutionNotes }, req);
    }
  }

  const auditAction = status === REPORT_STATUS.RESOLVED ? AUDIT_ACTIONS.REPORT_RESOLVE : AUDIT_ACTIONS.REPORT_REJECT;

  await logAudit({
    adminId: adminUser._id,
    action: auditAction,
    targetType: 'Report',
    targetId: reportId,
    reason: resolutionNotes,
    metadata: {
      previousStatus,
      newStatus: status,
      resolutionAction,
      contentType: report.contentType,
      contentId: report.contentId
    },
    req
  });

  return report;
};

/**
 * Audit Logs: Query Audit History
 */
const getAuditLogs = async ({ page = 1, limit = 20, action = '', targetType = '', adminId = null, startDate = null, endDate = null }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (adminId) filter.admin = adminId;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('admin', 'name username email role')
      .lean(),
    AuditLog.countDocuments(filter)
  ]);

  return {
    logs,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

/**
 * Platform Analytics: Aggregated Platform Trends
 */
const getPlatformAnalytics = async ({ period = '28d' }) => {
  let days = 28;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;
  else if (period === '365d') days = 365;

  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [userGrowth, videoUploads, shortUploads, reportVolume, viewsOverTime] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: now } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
    ]),
    Video.aggregate([
      { $match: { createdAt: { $gte: start, $lte: now } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
    ]),
    Short.aggregate([
      { $match: { createdAt: { $gte: start, $lte: now } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
    ]),
    Report.aggregate([
      { $match: { createdAt: { $gte: start, $lte: now } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
    ]),
    AnalyticsEvent.aggregate([
      { $match: { eventType: 'view', createdAt: { $gte: start, $lte: now } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
    ])
  ]);

  const mapToDict = (arr) => {
    const m = new Map();
    arr.forEach((it) => m.set(it._id, it.count));
    return m;
  };

  const uMap = mapToDict(userGrowth);
  const vMap = mapToDict(videoUploads);
  const sMap = mapToDict(shortUploads);
  const rMap = mapToDict(reportVolume);
  const wMap = mapToDict(viewsOverTime);

  const timeline = [];
  const cur = new Date(start.getTime());
  while (cur <= now) {
    const dStr = cur.toISOString().split('T')[0];
    timeline.push({
      date: dStr,
      newUsers: uMap.get(dStr) || 0,
      newVideos: vMap.get(dStr) || 0,
      newShorts: sMap.get(dStr) || 0,
      reports: rMap.get(dStr) || 0,
      views: wMap.get(dStr) || 0
    });
    cur.setDate(cur.getDate() + 1);
  }

  return {
    period,
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    timeline
  };
};

/**
 * Platform Settings: Get Global Configurations
 */
const getPlatformSettings = async () => {
  let settings = await PlatformSetting.findOne({ key: 'platform_config' }).lean();
  if (!settings) {
    settings = await PlatformSetting.create({ key: 'platform_config' });
  }
  return settings;
};

/**
 * Platform Settings: Update Global Configurations
 */
const updatePlatformSettings = async (adminUser, updateData, req = null) => {
  let settings = await PlatformSetting.findOne({ key: 'platform_config' });
  if (!settings) {
    settings = new PlatformSetting({ key: 'platform_config' });
  }

  const {
    maxVideoUploadSizeMb,
    maxShortDurationSeconds,
    allowedVideoFormats,
    allowedImageFormats,
    registrationEnabled,
    maintenanceMode,
    reportingEnabled,
    requireEmailVerification
  } = updateData;

  const previousSettings = settings.toObject();

  if (maxVideoUploadSizeMb !== undefined) settings.maxVideoUploadSizeMb = Number(maxVideoUploadSizeMb);
  if (maxShortDurationSeconds !== undefined) settings.maxShortDurationSeconds = Number(maxShortDurationSeconds);
  if (allowedVideoFormats !== undefined && Array.isArray(allowedVideoFormats)) settings.allowedVideoFormats = allowedVideoFormats;
  if (allowedImageFormats !== undefined && Array.isArray(allowedImageFormats)) settings.allowedImageFormats = allowedImageFormats;
  if (registrationEnabled !== undefined) settings.registrationEnabled = Boolean(registrationEnabled);
  if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
  if (reportingEnabled !== undefined) settings.reportingEnabled = Boolean(reportingEnabled);
  if (requireEmailVerification !== undefined) settings.requireEmailVerification = Boolean(requireEmailVerification);

  settings.updatedBy = adminUser._id;
  await settings.save();

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.SETTINGS_UPDATE,
    targetType: 'PlatformSetting',
    targetId: 'platform_config',
    reason: 'Platform settings updated',
    metadata: { previous: previousSettings, updated: settings.toObject() },
    req
  });

  return settings;
};

/**
 * Announcements Management
 */
const getAnnouncements = async ({ page = 1, limit = 20, activeOnly = false }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};
  if (activeOnly) {
    filter.isActive = true;
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  }

  const [announcements, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('createdBy', 'name username')
      .lean(),
    Announcement.countDocuments(filter)
  ]);

  return {
    announcements,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

const createAnnouncement = async (adminUser, data, req = null) => {
  const { title, message, type = 'info', priority = 0, targetAudience = 'all', expiresAt = null } = data;

  const announcement = await Announcement.create({
    title: title.trim(),
    message: message.trim(),
    type,
    priority: Number(priority) || 0,
    targetAudience,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    createdBy: adminUser._id
  });

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.ANNOUNCEMENT_CREATE,
    targetType: 'Announcement',
    targetId: announcement._id,
    reason: `Created announcement: ${title}`,
    req
  });

  return announcement;
};

const updateAnnouncement = async (adminUser, id, data, req = null) => {
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new ApiError(404, 'Announcement not found.');
  }

  const { title, message, type, isActive, priority, targetAudience, expiresAt } = data;
  if (title !== undefined) announcement.title = title.trim();
  if (message !== undefined) announcement.message = message.trim();
  if (type !== undefined) announcement.type = type;
  if (isActive !== undefined) announcement.isActive = Boolean(isActive);
  if (priority !== undefined) announcement.priority = Number(priority);
  if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
  if (expiresAt !== undefined) announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;

  await announcement.save();

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.ANNOUNCEMENT_UPDATE,
    targetType: 'Announcement',
    targetId: announcement._id,
    reason: `Updated announcement: ${announcement.title}`,
    req
  });

  return announcement;
};

const deleteAnnouncement = async (adminUser, id, req = null) => {
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) {
    throw new ApiError(404, 'Announcement not found.');
  }

  await logAudit({
    adminId: adminUser._id,
    action: AUDIT_ACTIONS.ANNOUNCEMENT_DELETE,
    targetType: 'Announcement',
    targetId: id,
    reason: `Deleted announcement: ${announcement.title}`,
    req
  });

  return { success: true, message: 'Announcement deleted.' };
};

const getActiveAnnouncement = async () => {
  const now = new Date();
  const announcement = await Announcement.findOne({
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  return announcement;
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getChannels,
  updateChannelStatus,
  getVideos,
  moderateVideo,
  getShorts,
  moderateShort,
  getComments,
  moderateComment,
  createReport,
  getReports,
  getReportById,
  resolveReport,
  getAuditLogs,
  getPlatformAnalytics,
  getPlatformSettings,
  updatePlatformSettings,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncement
};
