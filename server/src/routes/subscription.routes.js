/**
 * Subscriptions User Routes
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
const { Router } = require('express');
const {
  getMySubscriptions,
  getMySubscribers,
  getSubscriptionsFeed
} = require('../controllers/subscription.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = Router();

router.get('/my-subscriptions', requireAuth, getMySubscriptions);
router.get('/my-subscribers', requireAuth, getMySubscribers);
router.get('/feed', requireAuth, getSubscriptionsFeed);

module.exports = router;
