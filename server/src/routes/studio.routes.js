/**
 * Creator Studio Routes
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  getDashboard,
  getAnalyticsOverview,
  getTimeseries,
  getTopContent,
  getAudience,
  getSubscriberAnalytics,
  getContentAnalytics,
  getStudioContent,
  updateStudioContent,
  deleteStudioContent,
  getStudioComments,
  getChannelCustomization,
  updateChannelCustomization,
  exportAnalyticsCSV
} = require('../controllers/studio.controller');

const router = Router();

// All studio and analytics routes require authentication
router.use(requireAuth);

// Studio Dashboard
router.get('/dashboard', getDashboard);

// Analytics Overview & Metrics (supports both /analytics/overview and /overview when mounted under /analytics)
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/overview', getAnalyticsOverview);

// Daily Timeseries
router.get('/analytics/timeseries', getTimeseries);
router.get('/timeseries', getTimeseries);

// Top Content
router.get('/analytics/top-content', getTopContent);
router.get('/top-content', getTopContent);

// Audience Demographics
router.get('/analytics/audience', getAudience);
router.get('/audience', getAudience);

// Subscribers Analytics
router.get('/analytics/subscribers', getSubscriberAnalytics);
router.get('/subscribers', getSubscriberAnalytics);

// Content Deep-Dive Analytics
router.get('/analytics/content/:contentId', getContentAnalytics);
router.get('/content/:contentId/analytics', getContentAnalytics);

// CSV Export
router.get('/analytics/export', exportAnalyticsCSV);
router.get('/export', exportAnalyticsCSV);

// Studio Unified Content Management
router.get('/content', getStudioContent);
router.patch('/content/:contentId', updateStudioContent);
router.delete('/content/:contentId', deleteStudioContent);

// Studio Unified Comments Management
router.get('/comments', getStudioComments);

// Channel Customization
router.get('/channel', getChannelCustomization);
router.patch('/channel', updateChannelCustomization);

module.exports = router;
