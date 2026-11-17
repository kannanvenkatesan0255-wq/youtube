/**
 * Channel Routes
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const { Router } = require('express');
const {
  subscribeToChannel,
  unsubscribeFromChannel,
  getSubscriptionStatus,
  getChannelSubscribers
} = require('../controllers/subscription.controller');
const { validateChannelIdParam } = require('../validators/subscription.validator');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const Channel = require('../models/Channel');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');

const router = Router();

// Channel Subscription Endpoints
router.post(
  '/:channelId/subscribe',
  requireAuth,
  validateChannelIdParam,
  subscribeToChannel
);

router.delete(
  '/:channelId/subscribe',
  requireAuth,
  validateChannelIdParam,
  unsubscribeFromChannel
);

router.get(
  '/:channelId/subscription-status',
  optionalAuth,
  validateChannelIdParam,
  getSubscriptionStatus
);

router.get(
  '/:channelId/subscribers',
  validateChannelIdParam,
  getChannelSubscribers
);

// Channel Profile Information
router.get('/:channelId', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    let channel;

    if (channelId.startsWith('@')) {
      channel = await Channel.findOne({ handle: channelId.toLowerCase() }).populate('owner', 'name username avatar');
    } else {
      channel = await Channel.findById(channelId).populate('owner', 'name username avatar');
    }

    if (!channel) {
      return next(new ApiError(404, 'Channel not found.'));
    }

    return res.status(200).json(ApiResponse.success(channel));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
