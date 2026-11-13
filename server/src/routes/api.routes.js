/**
 * Main API Route Aggregator
 * VidTube Platform Architecture
 */
const { Router } = require('express');
const healthRoutes = require('./health.routes');

const router = Router();

// Mount active Health Check route
router.use('/health', healthRoutes);

/**
 * Architectural Module Placeholders for Subsequent Phases
 * In Phase 1, these define the REST boundaries and respond with standard metadata.
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

// Register architectural route boundaries
router.use('/auth', createPhasePlaceholder('Authentication', 2));
router.use('/users', createPhasePlaceholder('Users', 2));
router.use('/channels', createPhasePlaceholder('Channels', 3));
router.use('/videos', createPhasePlaceholder('Videos', 4));
router.use('/shorts', createPhasePlaceholder('Shorts', 5));
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

