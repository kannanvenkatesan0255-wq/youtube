/**
 * VidTube Main Header Navigation
 * Exact YouTube layout and responsiveness
 */
import React, { useState } from 'react';
import {
  Menu,
  Search,
  Mic,
  Video,
  Bell,
  Sun,
  Moon,
  ArrowLeft,
  X
} from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useTheme } from '../../hooks/useTheme';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import Logo from '../common/Logo';
import Avatar from '../common/Avatar';
import { NotificationBadge } from '../common/Badge';

export const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const { isConnected } = useHealthCheck();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search query submitted:', searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-[#0f0f0f] border-b border-neutral-200 dark:border-neutral-800 transition-colors select-none">
      {/* Mobile Search Overlay */}
      {isMobileSearchActive ? (
        <div className="flex items-center h-full px-3 gap-2 bg-white dark:bg-[#0f0f0f]">
          <button
            onClick={() => setIsMobileSearchActive(false)}
            aria-label="Back"
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center">
            <div className="flex-1 flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-1.5 border border-neutral-300 dark:border-neutral-700">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search VidTube"
                autoFocus
                className="w-full bg-transparent text-sm text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="ml-2 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1]"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
          <button
            title="Search with your voice"
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1]"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Normal YouTube Header */
        <div className="flex items-center justify-between h-full px-4">
          {/* Left section: Hamburger & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle navigation menu"
              className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Logo />
          </div>

          {/* Center section: Search Bar & Mic (Desktop/Tablet) */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-[720px] px-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-[600px]">
              <div
                className={`flex items-center w-full h-10 border rounded-l-full bg-transparent transition-all pl-4 ${
                  isSearchFocused
                    ? 'border-blue-600 shadow-inner'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
              >
                {isSearchFocused && (
                  <Search className="w-4 h-4 text-neutral-500 mr-2 flex-shrink-0" />
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search"
                  className="w-full bg-transparent text-sm text-[#0f0f0f] dark:text-[#f1f1f1] placeholder-neutral-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 mr-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                title="Search"
                className="h-10 px-6 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-l-0 border-neutral-300 dark:border-neutral-700 rounded-r-full text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>
            </form>

            {/* Voice Search Button */}
            <button
              title="Search with your voice"
              className="ml-3 p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors flex-shrink-0"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Right section: Actions, Theme, Status & User Avatar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchActive(true)}
              className="md:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1]"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Backend API Health Status Indicator */}
            <div
              title={isConnected ? 'Backend API: Online (Connected to MongoDB)' : 'Backend API: Connecting / Offline'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 select-none mr-1"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[#606060] dark:text-[#aaaaaa]">
                {isConnected ? 'API Live' : 'API Sync'}
              </span>
            </div>

            {/* Theme Toggle (Dark/Light) */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Create / Upload Button */}
            <button
              title="Create"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] text-sm font-medium transition-colors"
            >
              <Video className="w-5 h-5 text-[#FF0033]" />
              <span className="hidden xl:inline">Create</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                title="Notifications"
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
              >
                <Bell className="w-5 h-5" />
                <NotificationBadge count={3} />
              </button>
            </div>

            {/* User Profile Avatar */}
            <div className="ml-1">
              <button
                title="Account"
                className="flex items-center rounded-full focus:ring-2 focus:ring-blue-500"
              >
                <Avatar
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  name="Intern Developer"
                  size="sm"
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
