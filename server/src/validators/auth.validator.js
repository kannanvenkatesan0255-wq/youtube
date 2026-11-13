/**
 * Authentication Input Validation Middleware
 * VidTube Platform Architecture - Phase 2
 */
const { ApiError } = require('../utils/apiError');

// Strong password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const validateRegister = (req, res, next) => {
  const { name, username, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long.');
  }

  if (!username || typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
    errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
    errors.push('Please enter a valid email address.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.push('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  // Sanitized values
  req.body.name = name.trim();
  req.body.username = username.trim().toLowerCase();
  req.body.email = email.trim().toLowerCase();
  next();
};

const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;
  const errors = [];

  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    errors.push('Email or username is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Invalid login credentials', errors));
  }

  req.body.identifier = identifier.trim();
  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
    return next(new ApiError(400, 'Please provide a valid email address.'));
  }
  req.body.email = email.trim().toLowerCase();
  next();
};

const validateResetPassword = (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password || typeof password !== 'string') {
    errors.push('New password is required.');
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.push('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { name, username } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    }
  }

  if (username !== undefined) {
    if (typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
      errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores.');
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  if (name) req.body.name = name.trim();
  if (username) req.body.username = username.trim().toLowerCase();
  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required.');
  }

  if (!newPassword || typeof newPassword !== 'string') {
    errors.push('New password is required.');
  } else if (!PASSWORD_REGEX.test(newPassword)) {
    errors.push('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
  }

  if (currentPassword === newPassword) {
    errors.push('New password must be different from current password.');
  }

  if (newPassword !== confirmNewPassword) {
    errors.push('New passwords do not match.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateChangePassword
};
