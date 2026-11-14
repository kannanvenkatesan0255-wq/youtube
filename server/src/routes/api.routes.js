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
router.use('/channels', createPhasePlaceholder('Channels', 4));
router.use('/comments', createPhasePlaceholder('Comments', 6));
router.use('/likes', createPhasePlaceholder('Likes', 6));
router.use('/subscriptions', createPhasePlaceholder('Subscriptions', 7));
router.use('/playlists', createPhasePlaceholder('Playlists', 7));
router.use('/search', createPhasePlaceholder('Search', 8));
router.use('/notifications', createPhasePlaceholder('Notifications', 8));
router.use('/history', createPhasePlaceholder('WatchHistory', 9));
router.use('/analytics', createPhasePlaceholder('Analytics', 9));
router.use('/admin', createPhasePlaceholder('Administration', 10));

module.exports = router;
