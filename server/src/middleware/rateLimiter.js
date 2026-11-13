/**
 * Rate Limiting Security Middleware
 * VidTube Platform Architecture - Phase 2
 */
const rateLimit = require('express-rate-limit');
const { ApiError } = require('../utils/apiError');

/**
 * Standard Auth Endpoint Limiter
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication requests from this IP. Please try again later.'));
  }
});

/**
 * Strict Login Limiter to prevent brute-force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many failed login attempts. Please wait 15 minutes before trying again.'));
  }
});

/**
 * Strict Registration Limiter to prevent mass bot registrations
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 accounts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many accounts created from this IP. Please try again after an hour.'));
  }
});

/**
 * Password Reset Limiter to prevent enumeration/abuse
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many password reset requests. Please wait an hour before attempting again.'));
  }
});

module.exports = {
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter
};
