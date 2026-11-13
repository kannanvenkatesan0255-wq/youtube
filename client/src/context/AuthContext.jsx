/**
 * Authentication Context & Provider
 * VidTube Platform Architecture - Phase 2
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Verify existing session on initial load
   */
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authService.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        setChannel(res.data.channel || res.data.user.channel);
        setAuthError(null);
      } else {
        setUser(null);
        setChannel(null);
      }
    } catch (err) {
      setUser(null);
      setChannel(null);
      // Non-critical session expiration error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Sign In
   */
  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const res = await authService.login(identifier, password);
      const authenticatedUser = res.data.user;
      const userChannel = res.data.channel || authenticatedUser.channel;

      setUser(authenticatedUser);
      setChannel(userChannel);
      return { success: true, user: authenticatedUser };
    } catch (error) {
      const message = error.message || 'Failed to sign in. Please check your credentials.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Register New Account
   */
  const register = async (formData) => {
    setAuthError(null);
    try {
      const res = await authService.register(formData);
      const newUser = res.data.user;
      const newChannel = res.data.channel || newUser.channel;

      setUser(newUser);
      setChannel(newChannel);
      return { success: true, user: newUser };
    } catch (error) {
      const message = error.message || 'Failed to create account.';
      const errors = error.errors || [];
      setAuthError(message);
      return { success: false, error: message, errors };
    }
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout network error (clearing local state):', err);
    } finally {
      setUser(null);
      setChannel(null);
      setAuthError(null);
    }
  };

  /**
   * Update Profile (Name, Username)
   */
  const updateProfile = async (data) => {
    try {
      const res = await authService.updateProfile(data);
      setUser(res.data.user);
      if (res.data.channel) setChannel(res.data.channel);
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update profile.' };
    }
  };

  /**
   * Change Password
   */
  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      const res = await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to change password.' };
    }
  };

  /**
   * Update Profile Picture / Avatar
   */
  const updateAvatar = async (avatarUrl) => {
    try {
      const res = await authService.updateAvatar(avatarUrl);
      setUser(res.data.user);
      if (res.data.channel) setChannel(res.data.channel);
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update profile picture.' };
    }
  };

  /**
   * Forgot Password
   */
  const forgotPassword = async (email) => {
    try {
      const res = await authService.forgotPassword(email);
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to process request.' };
    }
  };

  /**
   * Reset Password
   */
  const resetPassword = async (token, password, confirmPassword) => {
    try {
      const res = await authService.resetPassword(token, password, confirmPassword);
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.channel) setChannel(res.data.channel);
      }
      return { success: true, message: res.message };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to reset password.' };
    }
  };

  const value = {
    user,
    channel,
    isAuthenticated: Boolean(user),
    isLoading,
    authError,
    clearAuthError: () => setAuthError(null),
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateAvatar,
    forgotPassword,
    resetPassword,
    checkSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
