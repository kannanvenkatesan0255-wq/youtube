/**
 * JWT Token Generation and Cookie Utility
 * VidTube Platform Architecture - Phase 2
 */
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

/**
 * Generate short-lived Access Token (15 minutes)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      username: user.username
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Generate long-lived Refresh Token (7 days)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id
    },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

/**
 * Set secure HttpOnly cookies for access & refresh tokens
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = config.isProduction;

  // Access Token Cookie (15 minutes)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh Token Cookie (7 days)
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/api/auth', // Scoped to auth endpoints to minimize exposure
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
};

/**
 * Clear token cookies on logout
 */
const clearTokenCookies = (res) => {
  const isProd = config.isProduction;

  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0)
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    expires: new Date(0)
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies
};
