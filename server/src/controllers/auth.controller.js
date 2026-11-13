/**
 * Authentication Controller
 * VidTube Platform Architecture - Phase 2
 */
const crypto = require('crypto');
const User = require('../models/User');
const Channel = require('../models/Channel');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies
} = require('../utils/token');
const { sendPasswordResetEmail } = require('../services/email.service');
const { logger } = require('../utils/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and auto-create default channel
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if email already registered
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return next(new ApiError(409, 'An account with this email address already exists.'));
    }

    // Check if username already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return next(new ApiError(409, 'Username is already taken. Please choose another.'));
    }

    // 1. Create User
    const user = new User({
      name,
      username,
      email,
      passwordHash: password
    });

    await user.save();

    // 2. Automatically create default Channel for the new user
    const channel = new Channel({
      name: user.name,
      handle: `@${user.username}`,
      owner: user._id,
      description: `Welcome to ${user.name}'s official VidTube channel!`,
      avatar: user.avatar || ''
    });

    await channel.save();

    // Link channel to user
    user.channel = channel._id;

    // 3. Generate Access and Refresh Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Set secure HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    logger.success(`User registered: ${user.username} (${user.email}) with channel ${channel.handle}`);

    return res.status(201).json(
      ApiResponse.created(
        {
          user,
          channel,
          accessToken
        },
        'Account and channel successfully created.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT tokens
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Query user by email OR username (case insensitive)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    })
      .select('+passwordHash +refreshToken')
      .populate('channel');

    if (!user) {
      return next(new ApiError(401, 'Invalid email/username or password.'));
    }

    // Verify bcrypt password
    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) {
      return next(new ApiError(401, 'Invalid email/username or password.'));
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return next(
        new ApiError(403, `Your account has been ${user.accountStatus}. Please contact support.`)
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set secure HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    logger.info(`User logged in: ${user.username}`);

    return res.status(200).json(
      ApiResponse.success(
        {
          user,
          channel: user.channel,
          accessToken
        },
        'Logged in successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Clear session & invalidate refresh token
 * @access  Public / Authenticated
 */
const logout = async (req, res, next) => {
  try {
    // If authenticated user, clear refresh token in database
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }

    // Clear client cookies
    clearTokenCookies(res);

    return res.status(200).json(
      ApiResponse.success(null, 'Logged out successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user & channel profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json(
      ApiResponse.success(
        {
          user: req.user,
          channel: req.user.channel
        },
        'Session validated.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Generate new access token using refresh token
 * @access  Public (via Refresh Token)
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return next(new ApiError(401, 'Refresh token is required.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearTokenCookies(res);
      return next(new ApiError(401, 'Refresh token is expired or invalid. Please sign in again.'));
    }

    // Find user with matching refresh token
    const user = await User.findById(decoded.id).select('+refreshToken').populate('channel');

    if (!user || user.refreshToken !== token) {
      clearTokenCookies(res);
      return next(new ApiError(401, 'Refresh token has been revoked or invalidated.'));
    }

    if (user.accountStatus !== 'active') {
      clearTokenCookies(res);
      return next(new ApiError(403, `Account is ${user.accountStatus}.`));
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json(
      ApiResponse.success(
        {
          accessToken: newAccessToken,
          user,
          channel: user.channel
        },
        'Session token refreshed.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Initiate password recovery workflow
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user && user.accountStatus === 'active') {
      // Generate cryptographically secure reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // Send email (or log link if SMTP not configured)
      await sendPasswordResetEmail(user.email, resetToken, user.name);
    }

    // Always return generic success message to prevent user enumeration
    return res.status(200).json(
      ApiResponse.success(
        null,
        'If an account exists with that email address, a password reset link has been sent.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using valid reset token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return next(new ApiError(400, 'Password reset token is required.'));
    }

    // Hash the token from request to compare against stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and valid expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordHash');

    if (!user) {
      return next(
        new ApiError(400, 'Password reset link is invalid or has expired. Please request a new one.')
      );
    }

    // Update password (pre-save hook will hash it)
    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // Invalidate all prior sessions

    await user.save();

    // Auto-login: generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    logger.success(`Password successfully reset for user: ${user.username}`);

    return res.status(200).json(
      ApiResponse.success(
        {
          user,
          accessToken
        },
        'Your password has been reset successfully. You are now signed in.'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword
};
