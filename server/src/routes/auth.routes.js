/**
 * Authentication Routes
 * VidTube Platform Architecture - Phase 2
 */
const { Router } = require('express');
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('../validators/auth.validator');
const {
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter
} = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// Registration
router.post('/register', registerLimiter, validateRegister, register);

// Login
router.post('/login', loginLimiter, validateLogin, login);

// Logout
router.post('/logout', logout);

// Get current session user
router.get('/me', authenticate, getMe);

// Refresh access token
router.post('/refresh', authLimiter, refreshToken);

// Forgot Password
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);

// Reset Password
router.post('/reset-password', passwordResetLimiter, validateResetPassword, resetPassword);

module.exports = router;
