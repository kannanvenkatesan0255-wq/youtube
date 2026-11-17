/**
 * VidTube Client Route Definitions
 * Phase 10 - Code-Split Route Architecture & Production Optimization
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import StudioLayout from '../layouts/StudioLayout';
import AdminLayout from '../layouts/AdminLayout';
import Spinner from '../components/common/Spinner';
import { ProtectedRoute, GuestRoute, AdminRoute } from '../components/navigation/RouteGuards';

// Lazy-loaded Core Platform Pages
const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const ProfilePage = lazy(() => import('../pages/account/ProfilePage'));
const VideoUploadPage = lazy(() => import('../pages/studio/VideoUploadPage'));
const MyVideosPage = lazy(() => import('../pages/studio/MyVideosPage'));
const WatchPage = lazy(() => import('../pages/WatchPage'));
const ShortsPage = lazy(() => import('../pages/ShortsPage'));
const SubscriptionsFeedPage = lazy(() => import('../pages/SubscriptionsFeedPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const PlaylistPage = lazy(() => import('../pages/PlaylistPage'));
const PlaylistsPage = lazy(() => import('../pages/PlaylistsPage'));
const WatchLaterPage = lazy(() => import('../pages/WatchLaterPage'));
const WatchHistoryPage = lazy(() => import('../pages/WatchHistoryPage'));
const PlaceholderPage = lazy(() => import('../pages/PlaceholderPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Lazy-loaded Creator Studio Dedicated Pages
const StudioDashboardPage = lazy(() => import('../pages/studio/StudioDashboardPage'));
const StudioContentPage = lazy(() => import('../pages/studio/StudioContentPage'));
const StudioContentAnalyticsPage = lazy(() => import('../pages/studio/StudioContentAnalyticsPage'));
const StudioAnalyticsPage = lazy(() => import('../pages/studio/StudioAnalyticsPage'));
const StudioCommentsPage = lazy(() => import('../pages/studio/StudioCommentsPage'));
const StudioPlaylistsPage = lazy(() => import('../pages/studio/StudioPlaylistsPage'));
const StudioCustomizationPage = lazy(() => import('../pages/studio/StudioCustomizationPage'));
const StudioSettingsPage = lazy(() => import('../pages/studio/StudioSettingsPage'));

// Lazy-loaded Admin Dedicated Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminModerationQueuePage = lazy(() => import('../pages/admin/AdminModerationQueuePage'));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminChannelsPage = lazy(() => import('../pages/admin/AdminChannelsPage'));
const AdminVideosPage = lazy(() => import('../pages/admin/AdminVideosPage'));
const AdminShortsPage = lazy(() => import('../pages/admin/AdminShortsPage'));
const AdminCommentsPage = lazy(() => import('../pages/admin/AdminCommentsPage'));
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AdminAuditLogsPage'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminAnnouncementsPage = lazy(() => import('../pages/admin/AdminAnnouncementsPage'));

const PageFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center">
    <Spinner size="lg" />
    <span className="sr-only">Loading page...</span>
  </div>
);

export const AppRoutes = () => {
  const location = useLocation();
  const isStudioRoute = location.pathname.startsWith('/studio');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Dedicated Admin Control Center & Safety Shell
  if (isAdminRoute) {
    return (
      <AdminRoute>
        <AdminLayout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/moderation" element={<AdminModerationQueuePage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/channels" element={<AdminChannelsPage />} />
              <Route path="/admin/videos" element={<AdminVideosPage />} />
              <Route path="/admin/shorts" element={<AdminShortsPage />} />
              <Route path="/admin/comments" element={<AdminCommentsPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AdminLayout>
      </AdminRoute>
    );
  }

  // Dedicated Creator Studio Application Shell
  if (isStudioRoute) {
    return (
      <ProtectedRoute>
        <StudioLayout>
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
        </StudioLayout>
      </ProtectedRoute>
    );
  }

  // Standard VidTube Platform Shell
  return (
    <MainLayout>
      <Suspense fallback={<PageFallback />}>
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
      </Suspense>
    </MainLayout>
  );
};

export default AppRoutes;
