/**
 * User Account & Profile Controller
 * VidTube Platform Architecture - Phase 2
 */
const User = require('../models/User');
const Channel = require('../models/Channel');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/users/profile
 * @desc    Fetch authenticated user's profile and channel
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('channel');
    return res.status(200).json(
      ApiResponse.success({ user, channel: user.channel })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/users/profile
 * @desc    Update permitted profile fields (Name, Username)
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, username } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    // Check if new username is already taken by another account
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return next(new ApiError(409, 'Username is already taken by another creator.'));
      }
      user.username = username;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    // Also synchronize Channel name and handle
    if (user.channel) {
      await Channel.findByIdAndUpdate(user.channel, {
        ...(name && { name }),
        ...(username && { handle: `@${username}` })
      });
    }

    const updatedUser = await User.findById(user._id).populate('channel');

    logger.info(`Profile updated for user: ${user.username}`);

    return res.status(200).json(
      ApiResponse.success(
        { user: updatedUser, channel: updatedUser.channel },
        'Profile updated successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/change-password
 * @desc    Change password after verifying current password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    // Verify current password
    const isMatch = await user.isPasswordCorrect(currentPassword);
    if (!isMatch) {
      return next(new ApiError(400, 'Current password entered is incorrect.'));
    }

    // Set new password (pre-save hook hashes it)
    user.passwordHash = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.username}`);

    return res.status(200).json(
      ApiResponse.success(null, 'Password changed successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/users/avatar
 * @desc    Update user profile picture URL
 * @access  Private
 */
const updateAvatar = async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.startsWith('http')) {
      return next(new ApiError(400, 'A valid image URL is required.'));
    }

    const user = await User.findById(req.user._id);
    user.avatar = avatarUrl.trim();
    await user.save();

    // Also update channel avatar
    if (user.channel) {
      await Channel.findByIdAndUpdate(user.channel, { avatar: avatarUrl.trim() });
    }

    const updatedUser = await User.findById(user._id).populate('channel');

    logger.info(`Avatar updated for user: ${user.username}`);

    return res.status(200).json(
      ApiResponse.success(
        { user: updatedUser, channel: updatedUser.channel },
        'Profile picture updated successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar
};
