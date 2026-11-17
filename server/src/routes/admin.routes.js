/**
 * Admin Control Center Routes
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 * All endpoints strictly guarded by requireAuth + authorize(ADMIN, SUPER_ADMIN)
 */
const { Router } = require('express');
const { requireAuth, authorize } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../constants/appConstants');
const {
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
  deleteAnnouncement
} = require('../controllers/admin.controller');

const router = Router();

// Strict authorization guard: only authenticated Admin or Super Admin allowed
router.use(requireAuth);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN));

// Admin Dashboard Overview
router.get('/dashboard', getDashboard);

// User Management
router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/role', updateUserRole);

// Channel Management
router.get('/channels', getChannels);
router.patch('/channels/:channelId/status', updateChannelStatus);

// Video Moderation
router.get('/videos', getVideos);
router.patch('/videos/:videoId/moderation', moderateVideo);

// Shorts Moderation
router.get('/shorts', getShorts);
router.patch('/shorts/:shortId/moderation', moderateShort);

// Comment Moderation
router.get('/comments', getComments);
router.patch('/comments/:commentId/moderation', moderateComment);

// Content Reports & Moderation Queue
router.get('/reports', getReports);
router.get('/reports/:reportId', getReportById);
router.patch('/reports/:reportId', resolveReport);

// Audit Logging
router.get('/audit-logs', getAuditLogs);

// Platform Analytics
router.get('/analytics', getPlatformAnalytics);

// Platform Settings
router.get('/settings', getPlatformSettings);
router.patch('/settings', updatePlatformSettings);

// Platform Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.patch('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
