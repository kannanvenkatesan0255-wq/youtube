/**
 * User Content Reporting Routes
 * VidTube Platform Architecture - Phase 9 Content Moderation & Platform Security
 */
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { submitReport } = require('../controllers/admin.controller');

const router = Router();

// Submitting content reports requires authenticated user
router.post('/', requireAuth, submitReport);

module.exports = router;
