/**
 * Admin Controller
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 */
const adminService = require('../services/admin.service');
const { ApiResponse } = require('../utils/apiResponse');

// Dashboard Overview
const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json(ApiResponse.success(stats, 'Admin dashboard overview retrieved.'));
  } catch (error) {
    next(error);
  }
};

// User Management
const getUsers = async (req, res, next) => {
  try {
    const data = await adminService.getUsers(req.query);
    return res.status(200).json(ApiResponse.success(data, 'User directory retrieved.'));
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.userId);
    return res.status(200).json(ApiResponse.success(user, 'User details retrieved.'));
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const result = await adminService.updateUserStatus(req.user, req.params.userId, req.body, req);
    return res.status(200).json(ApiResponse.success(result, 'User status updated successfully.'));
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const result = await adminService.updateUserRole(req.user, req.params.userId, req.body, req);
    return res.status(200).json(ApiResponse.success(result, 'User role updated successfully.'));
  } catch (error) {
    next(error);
  }
};

// Channel Management
const getChannels = async (req, res, next) => {
  try {
    const data = await adminService.getChannels(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Channel directory retrieved.'));
  } catch (error) {
    next(error);
  }
};

const updateChannelStatus = async (req, res, next) => {
  try {
    const result = await adminService.updateChannelStatus(req.user, req.params.channelId, req.body, req);
    return res.status(200).json(ApiResponse.success(result, 'Channel status updated successfully.'));
  } catch (error) {
    next(error);
  }
};

// Video Moderation
const getVideos = async (req, res, next) => {
  try {
    const data = await adminService.getVideos(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Video moderation list retrieved.'));
  } catch (error) {
    next(error);
  }
};

const moderateVideo = async (req, res, next) => {
  try {
    const result = await adminService.moderateVideo(req.user, req.params.videoId, req.body, req);
    return res.status(200).json(ApiResponse.success(result, 'Video moderation applied successfully.'));
  } catch (error) {
    next(error);
  }
};

// Shorts Moderation
const getShorts = async (req, res, next) => {
  try {
    const data = await adminService.getShorts(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Shorts moderation list retrieved.'));
  } catch (error) {
    next(error);
  }
};

const moderateShort = async (req, res, next) => {
  try {
    const result = await adminService.moderateShort(req.user, req.params.shortId, req.body, req);
    return res.status(200).json(ApiResponse.success(result, 'Short moderation applied successfully.'));
  } catch (error) {
    next(error);
  }
};

// Comment Moderation
const getComments = async (req, res, next) => {
  try {
    const data = await adminService.getComments(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Comment moderation list retrieved.'));
  } catch (error) {
    next(error);
  }
};

const moderateComment = async (req, res, next) => {
  try {
    const result = await adminService.moderateComment(req.user, req.params.commentId, req.body, req);
    return res.status(200).json(ApiResponse.success(result, 'Comment moderation applied successfully.'));
  } catch (error) {
    next(error);
  }
};

// User Reporting
const submitReport = async (req, res, next) => {
  try {
    const report = await adminService.createReport({
      reporterId: req.user._id,
      ...req.body
    });
    return res.status(201).json(ApiResponse.created(report, 'Report submitted successfully. Our moderation team will review it.'));
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const data = await adminService.getReports(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Reports list retrieved.'));
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await adminService.getReportById(req.params.reportId);
    return res.status(200).json(ApiResponse.success(report, 'Report details retrieved.'));
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const result = await adminService.resolveReport(req.user, req.params.reportId, req.body, req);
    return res.status(200).json(ApiResponse.success(result, 'Report resolved successfully.'));
  } catch (error) {
    next(error);
  }
};

// Audit Logs
const getAuditLogs = async (req, res, next) => {
  try {
    const data = await adminService.getAuditLogs(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Audit logs retrieved.'));
  } catch (error) {
    next(error);
  }
};

// Platform Analytics
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getPlatformAnalytics(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Platform analytics retrieved.'));
  } catch (error) {
    next(error);
  }
};

// Platform Settings
const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await adminService.getPlatformSettings();
    return res.status(200).json(ApiResponse.success(settings, 'Platform settings retrieved.'));
  } catch (error) {
    next(error);
  }
};

const updatePlatformSettings = async (req, res, next) => {
  try {
    const settings = await adminService.updatePlatformSettings(req.user, req.body, req);
    return res.status(200).json(ApiResponse.success(settings, 'Platform settings updated successfully.'));
  } catch (error) {
    next(error);
  }
};

// Announcements
const getAnnouncements = async (req, res, next) => {
  try {
    const data = await adminService.getAnnouncements(req.query);
    return res.status(200).json(ApiResponse.success(data, 'Announcements list retrieved.'));
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await adminService.createAnnouncement(req.user, req.body, req);
    return res.status(201).json(ApiResponse.created(announcement, 'Announcement created successfully.'));
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await adminService.updateAnnouncement(req.user, req.params.id, req.body, req);
    return res.status(200).json(ApiResponse.success(announcement, 'Announcement updated successfully.'));
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const result = await adminService.deleteAnnouncement(req.user, req.params.id, req);
    return res.status(200).json(ApiResponse.success(result, 'Announcement deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

const getActiveAnnouncement = async (req, res, next) => {
  try {
    const active = await adminService.getActiveAnnouncement();
    return res.status(200).json(ApiResponse.success(active, 'Active announcement retrieved.'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
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
  submitReport,
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
