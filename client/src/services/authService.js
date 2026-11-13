/**
 * Authentication API Service
 * VidTube Platform Architecture - Phase 2
 */
import api from './api';

export const authService = {
  /**
   * Register a new user
   */
  register: (data) => {
    return api.post('/auth/register', data);
  },

  /**
   * Log in user
   */
  login: (identifier, password) => {
    return api.post('/auth/login', { identifier, password });
  },

  /**
   * Log out user
   */
  logout: () => {
    return api.post('/auth/logout');
  },

  /**
   * Fetch current session profile
   */
  getMe: () => {
    return api.get('/auth/me');
  },

  /**
   * Refresh session tokens
   */
  refreshToken: () => {
    return api.post('/auth/refresh');
  },

  /**
   * Request password reset link
   */
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: (token, password, confirmPassword) => {
    return api.post('/auth/reset-password', { token, password, confirmPassword });
  },

  /**
   * Update profile (name, username)
   */
  updateProfile: (data) => {
    return api.patch('/users/profile', data);
  },

  /**
   * Change account password
   */
  changePassword: (currentPassword, newPassword, confirmNewPassword) => {
    return api.post('/users/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword
    });
  },

  /**
   * Update profile avatar URL
   */
  updateAvatar: (avatarUrl) => {
    return api.patch('/users/avatar', { avatarUrl });
  }
};

export default authService;
