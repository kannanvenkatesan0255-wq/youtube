/**
 * VidTube Client Route Definitions
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import PlaceholderPage from '../pages/PlaceholderPage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shorts" element={<PlaceholderPage title="VidTube Shorts" phase={5} />} />
        <Route path="/subscriptions" element={<PlaceholderPage title="Subscriptions Feed" phase={7} />} />
        <Route path="/history" element={<PlaceholderPage title="Watch History" phase={9} />} />
        <Route path="/playlists" element={<PlaceholderPage title="Your Playlists" phase={7} />} />
        <Route path="/you" element={<PlaceholderPage title="Your Channel & Profile" phase={3} />} />
        <Route path="/studio/videos" element={<PlaceholderPage title="VidTube Studio — Video Manager" phase={4} />} />
        <Route path="/settings" element={<PlaceholderPage title="Platform Settings" phase={10} />} />
        <Route path="/explore/:category" element={<PlaceholderPage title="Explore Section" phase={8} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRoutes;
