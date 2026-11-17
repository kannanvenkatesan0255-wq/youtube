/**
 * Creator Studio Controller
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
const Channel = require('../models/Channel');
const User = require('../models/User');
const studioService = require('../services/studio.service');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const { logger } = require('../utils/logger');

/**
 * Resolve or initialize creator channel for authenticated user
 */
const resolveUserChannel = async (req) => {
  let channel = null;

  if (req.user.channel) {
    channel = await Channel.findById(req.user.channel);
  }

  if (!channel) {
    channel = await Channel.findOne({ owner: req.user._id });
  }

  if (!channel) {
    // Auto-create creator channel if not yet existing
    const baseHandle = (req.user.username || `creator_${req.user._id.toString().slice(-6)}`).toLowerCase();
    channel = await Channel.create({
      name: req.user.name || req.user.username || 'My Channel',
      handle: baseHandle,
      owner: req.user._id,
      avatar: req.user.avatar || '',
      banner: req.user.banner || '',
      defaultVisibility: 'public'
    });

    await User.findByIdAndUpdate(req.user._id, { channel: channel._id });
    req.user.channel = channel._id;
  }

  return channel;
};

/**
 * @route   GET /api/studio/dashboard
 * @desc    Get studio dashboard overview, latest content, top videos & shorts, comments, subscribers
 * @access  Private (Creator only)
 */
const getDashboard = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const dashboard = await studioService.getDashboard(channel._id);
    return res.status(200).json(ApiResponse.success(dashboard, 'Studio dashboard retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/analytics/overview
 * @desc    Get analytics overview with period (7d, 28d, 90d, 365d, custom) and delta comparison
 * @access  Private (Creator only)
 */
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const overview = await studioService.getAnalyticsOverview(channel._id, req.query);
    return res.status(200).json(ApiResponse.success(overview, 'Analytics overview retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/analytics/timeseries
 * @desc    Get daily timeseries with zero-fill continuity for chart visualization
 * @access  Private (Creator only)
 */
const getTimeseries = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const timeseries = await studioService.getTimeseries(channel._id, req.query);
    return res.status(200).json(ApiResponse.success(timeseries, 'Analytics timeseries retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/analytics/top-content
 * @desc    Get top performing videos and shorts ranked by views, likes, comments
 * @access  Private (Creator only)
 */
const getTopContent = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const topContent = await studioService.getTopContent(channel._id, req.query);
    return res.status(200).json(ApiResponse.success(topContent, 'Top content retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/analytics/audience
 * @desc    Get audience demographics (sub vs non-sub, video vs short ratio)
 * @access  Private (Creator only)
 */
const getAudience = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const audience = await studioService.getAudience(channel._id, req.query);
    return res.status(200).json(ApiResponse.success(audience, 'Audience metrics retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/analytics/subscribers
 * @desc    Get subscriber analytics and list of recent subscribers
 * @access  Private (Creator only)
 */
const getSubscriberAnalytics = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const subs = await studioService.getSubscriberAnalytics(channel._id, req.query);
    return res.status(200).json(ApiResponse.success(subs, 'Subscriber analytics retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/analytics/content/:contentId
 * @desc    Get deep-dive metrics and view trend for individual video/short
 * @access  Private (Creator only)
 */
const getContentAnalytics = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const { contentId } = req.params;
    const analytics = await studioService.getContentAnalytics(channel._id, contentId);
    return res.status(200).json(ApiResponse.success(analytics, 'Content analytics retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/content
 * @desc    Unified creator content list (Videos & Shorts) with filters, search, and pagination
 * @access  Private (Creator only)
 */
const getStudioContent = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const result = await studioService.getStudioContent(channel._id, req.query);
    return res.status(200).json(ApiResponse.success(result, 'Studio content retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/studio/content/:contentId
 * @desc    Update video or short metadata (title, description, visibility, tags)
 * @access  Private (Creator only)
 */
const updateStudioContent = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const { contentId } = req.params;
    const updated = await studioService.updateStudioContent(channel._id, contentId, req.body);
    return res.status(200).json(ApiResponse.success(updated, 'Content updated successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/studio/content/:contentId
 * @desc    Delete video or short and purge assets
 * @access  Private (Creator only)
 */
const deleteStudioContent = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const { contentId } = req.params;
    const result = await studioService.deleteStudioContent(channel._id, contentId);
    return res.status(200).json(ApiResponse.success(result, 'Content deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/comments
 * @desc    Get comments across all creator content with search, filters, pagination
 * @access  Private (Creator only)
 */
const getStudioComments = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const result = await studioService.getStudioComments(channel._id, req.query);
    return res.status(200).json(ApiResponse.success(result, 'Studio comments retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/channel
 * @desc    Get channel customization details
 * @access  Private (Creator only)
 */
const getChannelCustomization = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const customization = await studioService.getChannelCustomization(channel._id);
    return res.status(200).json(ApiResponse.success(customization, 'Channel customization retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/studio/channel
 * @desc    Update channel customization (name, handle, description, avatar, banner, featuredVideo, defaultVisibility)
 * @access  Private (Creator only)
 */
const updateChannelCustomization = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const updated = await studioService.updateChannelCustomization(channel._id, req.user._id, req.body);
    return res.status(200).json(ApiResponse.success(updated, 'Channel customization updated.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/studio/analytics/export
 * @desc    Export channel analytics to RFC 4180 CSV with formula injection defense
 * @access  Private (Creator only)
 */
const exportAnalyticsCSV = async (req, res, next) => {
  try {
    const channel = await resolveUserChannel(req);
    const { type = 'overview', period = '28d' } = req.query;
    const csvData = await studioService.exportAnalyticsCSV(channel._id, { type, period });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="vidtube-analytics-${type}-${period}.csv"`);
    return res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  resolveUserChannel,
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
};
