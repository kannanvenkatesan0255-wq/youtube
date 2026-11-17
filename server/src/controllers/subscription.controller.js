/**
 * Subscription Controller
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 * Channel subscriptions, subscriber counting, status queries, and Subscriptions Feed
 */
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const Short = require('../models/Short');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const { NOTIFICATION_TYPES } = require('../constants/appConstants');
const { createNotification } = require('../services/notification.service');
const { recordEvent } = require('../services/analytics.service');
const { logger } = require('../utils/logger');

/**
 * @route   POST /api/channels/:channelId/subscribe
 * @desc    Subscribe to a target channel
 * @access  Private (Authenticated users)
 */
const subscribeToChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return next(new ApiError(404, 'Channel not found.'));
    }

    // Rule: Cannot subscribe to your own channel
    if (channel.owner.equals(subscriberId)) {
      return next(new ApiError(400, 'You cannot subscribe to your own channel.'));
    }

    // Check if already subscribed
    const existing = await Subscription.findOne({
      subscriber: subscriberId,
      channel: channelId
    });

    if (existing) {
      return res.status(200).json(
        ApiResponse.success(
          { isSubscribed: true, subscribersCount: channel.subscribersCount },
          'Already subscribed to this channel.'
        )
      );
    }

    // Create subscription
    await Subscription.create({
      subscriber: subscriberId,
      channel: channelId
    });

    recordEvent({
      channelId,
      contentType: 'Channel',
      contentId: channelId,
      eventType: 'subscribe',
      value: 1,
      viewer: subscriberId
    });

    // Atomically increment channel subscriber count
    const updatedChannel = await Channel.findByIdAndUpdate(
      channelId,
      { $inc: { subscribersCount: 1 } },
      { new: true }
    );

    // Notify channel owner of the new subscriber
    createNotification({
      recipient: channel.owner,
      sender: subscriberId,
      channel: channelId,
      type: NOTIFICATION_TYPES.NEW_SUBSCRIBER,
      contentType: 'Channel',
      contentId: channelId,
      message: `${req.user.name || req.user.username} subscribed to your channel.`,
      link: `/channel/${channel.handle || channelId}`
    });

    logger.info(`User [${req.user.username}] subscribed to channel [${channel.name}]`);

    return res.status(200).json(
      ApiResponse.success(
        { isSubscribed: true, subscribersCount: updatedChannel.subscribersCount },
        'Subscribed successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/channels/:channelId/subscribe
 * @desc    Unsubscribe from a channel
 * @access  Private (Authenticated users)
 */
const unsubscribeFromChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return next(new ApiError(404, 'Channel not found.'));
    }

    const existing = await Subscription.findOneAndDelete({
      subscriber: subscriberId,
      channel: channelId
    });

    let currentCount = channel.subscribersCount;

    if (existing) {
      recordEvent({
        channelId,
        contentType: 'Channel',
        contentId: channelId,
        eventType: 'unsubscribe',
        value: 1,
        viewer: subscriberId
      });

      const updatedChannel = await Channel.findByIdAndUpdate(
        channelId,
        { $inc: { subscribersCount: -1 } },
        { new: true }
      );

      if (updatedChannel.subscribersCount < 0) {
        await Channel.findByIdAndUpdate(channelId, { subscribersCount: 0 });
        currentCount = 0;
      } else {
        currentCount = updatedChannel.subscribersCount;
      }
    }

    logger.info(`User [${req.user.username}] unsubscribed from channel [${channel.name}]`);

    return res.status(200).json(
      ApiResponse.success(
        { isSubscribed: false, subscribersCount: currentCount },
        'Unsubscribed successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/channels/:channelId/subscription-status
 * @desc    Get subscription status and subscriber count for a channel
 * @access  Public / Optional Auth
 */
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId).select('subscribersCount owner');
    if (!channel) {
      return next(new ApiError(404, 'Channel not found.'));
    }

    let isSubscribed = false;
    let isSelf = false;

    if (req.user) {
      isSelf = channel.owner.equals(req.user._id);
      const sub = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
      });
      isSubscribed = Boolean(sub);
    }

    return res.status(200).json(
      ApiResponse.success({
        isSubscribed,
        isSelf,
        subscribersCount: channel.subscribersCount || 0
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/channels/:channelId/subscribers
 * @desc    Get subscribers of a channel (paginated)
 * @access  Public
 */
const getChannelSubscribers = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return next(new ApiError(404, 'Channel not found.'));
    }

    const [subscribers, total] = await Promise.all([
      Subscription.find({ channel: channelId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscriber', 'name username avatar')
        .lean(),
      Subscription.countDocuments({ channel: channelId })
    ]);

    return res.status(200).json(
      ApiResponse.success({
        subscribers: subscribers.map((s) => s.subscriber).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/my-subscriptions
 * @desc    Get all channels the authenticated user is subscribed to
 * @access  Private (Authenticated users)
 */
const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriberId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      Subscription.find({ subscriber: subscriberId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('channel', 'name handle avatar banner subscribersCount videosCount isVerified')
        .lean(),
      Subscription.countDocuments({ subscriber: subscriberId })
    ]);

    const channels = subscriptions.map((s) => s.channel).filter(Boolean);

    return res.status(200).json(
      ApiResponse.success({
        channels,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/my-subscribers
 * @desc    Get subscribers to current user's channel
 * @access  Private (Authenticated users)
 */
const getMySubscribers = async (req, res, next) => {
  try {
    const userChannel = await Channel.findOne({ owner: req.user._id });
    if (!userChannel) {
      return res.status(200).json(ApiResponse.success({ subscribers: [], total: 0 }));
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [subs, total] = await Promise.all([
      Subscription.find({ channel: userChannel._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscriber', 'name username avatar')
        .lean(),
      Subscription.countDocuments({ channel: userChannel._id })
    ]);

    return res.status(200).json(
      ApiResponse.success({
        subscribers: subs.map((s) => s.subscriber).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/feed
 * @desc    Get chronological feed of public videos & shorts from subscribed channels
 * @access  Private (Authenticated users)
 */
const getSubscriptionsFeed = async (req, res, next) => {
  try {
    const subscriberId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 16));
    const skip = (page - 1) * limit;

    // Find subscribed channel IDs
    const userSubs = await Subscription.find({ subscriber: subscriberId }).select('channel').lean();
    const channelIds = userSubs.map((s) => s.channel);

    if (channelIds.length === 0) {
      return res.status(200).json(
        ApiResponse.success({
          videos: [],
          pagination: { page, limit, total: 0, pages: 1 }
        })
      );
    }

    const query = {
      channel: { $in: channelIds },
      visibility: 'public',
      processingStatus: { $ne: 'failed' }
    };

    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('channel', 'name handle avatar isVerified subscribersCount')
        .populate('owner', 'name username avatar')
        .lean(),
      Video.countDocuments(query)
    ]);

    return res.status(200).json(
      ApiResponse.success({
        videos,
        items: videos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  subscribeToChannel,
  unsubscribeFromChannel,
  getSubscriptionStatus,
  getChannelSubscribers,
  getMySubscriptions,
  getMySubscribers,
  getSubscriptionsFeed
};
