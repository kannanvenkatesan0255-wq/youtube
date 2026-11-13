/**
 * User Account & Profile Routes
 * VidTube Platform Architecture - Phase 2
 */
const { Router } = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar
} = require('../controllers/user.controller');
const {
  validateUpdateProfile,
  validateChangePassword
} = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile retrieval & updates
router.get('/profile', getProfile);
router.patch('/profile', validateUpdateProfile, updateProfile);

// Password modification
router.post('/change-password', validateChangePassword, changePassword);

// Avatar modification
router.patch('/avatar', updateAvatar);

module.exports = router;
