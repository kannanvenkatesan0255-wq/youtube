/**
 * Main API Route Aggregator
 * VidTube Platform Architecture - Phase 3 Video Upload & Management Engine
 */
const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const videoRoutes = require('./video.routes');
const shortRoutes = require('./short.routes');
const engagementRoutes = require('./engagement.routes');
const commentRoutes = require('./comment.routes');
const channelRoutes = require('./channel.routes');
const subscriptionRoutes = require('./subscription.routes');
const notificationRoutes = require('./notification.routes');
const searchRoutes = require('./search.routes');
const playlistRoutes = require('./playlist.routes');
const watchLaterRoutes = require('./watchLater.routes');
const historyRoutes = require('./history.routes');
const recommendationRoutes = require('./recommendation.routes');
const studioRoutes = require('./studio.routes');

const router = Router();

// Mount active Health Check route
router.use('/health', healthRoutes);

// Mount active Phase 2 Authentication & User Account routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Mount active Phase 3 Video Upload, Storage & Management Engine routes
router.use('/videos', videoRoutes);

// Mount active Phase 5 Shorts Upload & Vertical Feed Engine routes
router.use('/shorts', shortRoutes);

// Mount active Phase 6 Engagement, Comments, Subscriptions & Notification Engine routes
router.use('/engagement', engagementRoutes);
router.use('/likes', engagementRoutes);
router.use('/comments', commentRoutes);
router.use('/channels', channelRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/notifications', notificationRoutes);

// Mount active Phase 7 Search, Playlists, Watch History & Recommendations
router.use('/search', searchRoutes);
router.use('/playlists', playlistRoutes);
router.use('/watch-later', watchLaterRoutes);
router.use('/history', historyRoutes);
router.use('/recommendations', recommendationRoutes);

// Mount active Phase 8 Creator Studio & Channel Analytics
router.use('/studio', studioRoutes);
router.use('/analytics', studioRoutes);

/**
 * Architectural Module Placeholders for Subsequent Phases
 */
const createPhasePlaceholder = (moduleName, targetPhase) => {
  const subRouter = Router();
  subRouter.all('*', (req, res) => {
    res.status(200).json({
      success: true,
      module: moduleName,
      message: `${moduleName} API boundary initialized. Core business endpoints scheduled for Phase ${targetPhase}.`,
      phase: targetPhase,
      method: req.method,
      path: req.originalUrl,
      status: 'pending_phase_implementation'
    });
  });
  return subRouter;
};

// Register architectural route boundaries for upcoming phases
router.use('/admin', createPhasePlaceholder('Administration', 9));

module.exports = router;
