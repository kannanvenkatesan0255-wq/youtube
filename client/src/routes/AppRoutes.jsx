/**
 * VidTube Client Route Definitions
 * Phase 8 - Creator Studio, Channel Analytics & Content Management Dashboard
 */
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import StudioLayout from '../layouts/StudioLayout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProfilePage from '../pages/account/ProfilePage';
import VideoUploadPage from '../pages/studio/VideoUploadPage';
import MyVideosPage from '../pages/studio/MyVideosPage';
import WatchPage from '../pages/WatchPage';
import ShortsPage from '../pages/ShortsPage';
import SubscriptionsFeedPage from '../pages/SubscriptionsFeedPage';
import NotificationsPage from '../pages/NotificationsPage';
import SearchPage from '../pages/SearchPage';
import PlaylistPage from '../pages/PlaylistPage';
import PlaylistsPage from '../pages/PlaylistsPage';
import WatchLaterPage from '../pages/WatchLaterPage';
import WatchHistoryPage from '../pages/WatchHistoryPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import NotFoundPage from '../pages/NotFoundPage';

// Studio Dedicated Pages
import StudioDashboardPage from '../pages/studio/StudioDashboardPage';
import StudioContentPage from '../pages/studio/StudioContentPage';
import StudioContentAnalyticsPage from '../pages/studio/StudioContentAnalyticsPage';
import StudioAnalyticsPage from '../pages/studio/StudioAnalyticsPage';
import StudioCommentsPage from '../pages/studio/StudioCommentsPage';
import StudioPlaylistsPage from '../pages/studio/StudioPlaylistsPage';
import StudioCustomizationPage from '../pages/studio/StudioCustomizationPage';
import StudioSettingsPage from '../pages/studio/StudioSettingsPage';

import { ProtectedRoute, GuestRoute } from '../components/navigation/RouteGuards';

export const AppRoutes = () => {
  const location = useLocation();
  const isStudioRoute = location.pathname.startsWith('/studio');

  // Dedicated Creator Studio Application Shell
  if (isStudioRoute) {
    return (
      <ProtectedRoute>
        <StudioLayout>
          <Routes>
            <Route path="/studio" element={<StudioDashboardPage />} />
            <Route path="/studio/content" element={<StudioContentPage />} />
            <Route path="/studio/content/:contentId/analytics" element={<StudioContentAnalyticsPage />} />
            <Route path="/studio/analytics" element={<StudioAnalyticsPage />} />
            <Route path="/studio/comments" element={<StudioCommentsPage />} />
            <Route path="/studio/playlists" element={<StudioPlaylistsPage />} />
            <Route path="/studio/customization" element={<StudioCustomizationPage />} />
            <Route path="/studio/settings" element={<StudioSettingsPage />} />
            <Route path="/studio/videos" element={<StudioContentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </StudioLayout>
      </ProtectedRoute>
    );
  }

  // Standard VidTube Platform Shell
  return (
    <MainLayout>
      <Routes>
        {/* Core Discovery */}
        <Route path="/" element={<HomePage />} />

        {/* Phase 4: Video Watch Page & Adaptive Streaming Engine */}
        <Route path="/watch/:videoId" element={<WatchPage />} />

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

        {/* Video Upload Route */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <VideoUploadPage />
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

        {/* Phase 5: VidTube Shorts Dedicated Feed */}
        <Route path="/shorts" element={<ShortsPage />} />
        <Route path="/shorts/:shortId" element={<ShortsPage />} />

        {/* Phase 6: Subscriptions & Notifications Engine */}
        <Route path="/subscriptions" element={<SubscriptionsFeedPage />} />
        <Route path="/feed/subscriptions" element={<SubscriptionsFeedPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Phase 7: Search, Playlists, Watch History & Watch Later */}
        <Route path="/search" element={<SearchPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlist/watch-later" element={<WatchLaterPage />} />
        <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
        <Route path="/history" element={<WatchHistoryPage />} />

        <Route path="/you" element={<PlaceholderPage title="Your Channel & Profile" phase={4} />} />
        <Route path="/explore/:category" element={<PlaceholderPage title="Explore Section" phase={8} />} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRoutes;
