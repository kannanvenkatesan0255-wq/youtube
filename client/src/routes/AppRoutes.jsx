/**
 * VidTube Client Route Definitions
 * Phase 3 - Video Upload, Storage & Management Engine
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProfilePage from '../pages/account/ProfilePage';
import VideoUploadPage from '../pages/studio/VideoUploadPage';
import MyVideosPage from '../pages/studio/MyVideosPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import NotFoundPage from '../pages/NotFoundPage';
import { ProtectedRoute, GuestRoute } from '../components/navigation/RouteGuards';

export const AppRoutes = () => {
  return (
    <MainLayout>
      <Routes>
        {/* Core Discovery */}
        <Route path="/" element={<HomePage />} />

        {/* Guest-only Authentication Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />

        {/* Protected User Account Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Phase 3: Video Upload & Creator Management */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <VideoUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/videos"
          element={
            <ProtectedRoute>
              <MyVideosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-videos"
          element={
            <ProtectedRoute>
              <MyVideosPage />
            </ProtectedRoute>
          }
        />

        {/* Upcoming Phase Roadmap Placeholders */}
        <Route path="/shorts" element={<PlaceholderPage title="VidTube Shorts" phase={5} />} />
        <Route path="/subscriptions" element={<PlaceholderPage title="Subscriptions Feed" phase={7} />} />
        <Route path="/history" element={<PlaceholderPage title="Watch History" phase={9} />} />
        <Route path="/playlists" element={<PlaceholderPage title="Your Playlists" phase={7} />} />
        <Route path="/you" element={<PlaceholderPage title="Your Channel & Profile" phase={4} />} />
        <Route path="/explore/:category" element={<PlaceholderPage title="Explore Section" phase={8} />} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRoutes;
