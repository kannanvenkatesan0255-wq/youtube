/**
 * VidTube Main Layout Wrapper
 * Handles YouTube responsive margins, header, sidebars, and mobile bottom nav
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MiniSidebar from '../components/layout/MiniSidebar';
import MobileNav from '../components/layout/MobileNav';
import ErrorBoundary from '../components/common/ErrorBoundary';
import AnnouncementBanner from '../components/common/AnnouncementBanner';
import { useSidebar } from '../hooks/useSidebar';

export const MainLayout = ({ children }) => {
  const { isCollapsed, isMobileScreen } = useSidebar();
  const location = useLocation();
  const isWatchPage = location.pathname.startsWith('/watch/');

  // Compute margin left for content based on sidebar state
  const getContentMarginClass = () => {
    if (isMobileScreen || isWatchPage) return 'ml-0';
    return isCollapsed ? 'ml-[72px]' : 'ml-60';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors">
      {/* Fixed Header */}
      <Header />

      {/* Sidebars */}
      <Sidebar />
      <MiniSidebar />

      {/* Main Content Area */}
      <main
        className={`pt-14 pb-16 lg:pb-6 transition-all duration-200 ${getContentMarginClass()}`}
      >
        <AnnouncementBanner />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default MainLayout;
