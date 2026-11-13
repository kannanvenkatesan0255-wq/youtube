/**
 * JWT Authentication & Role-Based Authorization Middleware
 * VidTube Platform Architecture - Phase 2 & 3
 */
const { verifyAccessToken } = require('../utils/token');
const { ApiError } = require('../utils/apiError');
const User = require('../models/User');

/**
 * Verify JWT Access Token from Cookie or Authorization Header
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try reading from HttpOnly Cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Try reading from Authorization Bearer header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new ApiError(401, 'Authentication token is required. Please sign in to access this resource.')
      );
    }

    // Verify token signature and expiration
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Authentication token has expired. Please refresh your session.'));
      }
      return next(new ApiError(401, 'Invalid authentication token.'));
    }

    // Retrieve active user from database with channel populated
    const user = await User.findById(decoded.id).populate('channel');

    if (!user) {
      return next(new ApiError(401, 'User account associated with this token no longer exists.'));
    }

    if (user.accountStatus !== 'active') {
      return next(
        new ApiError(403, `Account is currently ${user.accountStatus}. Please contact support.`)
      );
    }

    // Attach verified user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication: Attaches user if valid token present, otherwise proceeds as guest
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).populate('channel');
        if (user && user.accountStatus === 'active') {
          req.user = user;
        }
      } catch (e) {
        // Ignore invalid/expired token in optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-Based Authorization Guard
 * @param  {...string} roles Allowed roles ('user', 'creator', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User must be authenticated before checking permissions.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'Forbidden. You do not have sufficient permissions to perform this action.')
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize
};
