/**
 * VidTube Main Header Navigation
 * Exact YouTube layout, responsive search, theme toggling, and user auth state
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Mic,
  Video,
  Bell,
  Sun,
  Moon,
  ArrowLeft,
  X,
  UserCircle2,
  Settings,
  LogOut,
  Tv,
  Upload,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useTheme } from '../../hooks/useTheme';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';
import Avatar from '../common/Avatar';
import { NotificationBadge } from '../common/Badge';

export const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const { isConnected } = useHealthCheck();
  const { user, channel, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search query submitted:', searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/');
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

          {/* Right section: Actions, Theme, Status & User Auth */}
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

            {/* If Authenticated: Create Button + Notifications + User Avatar */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  title="Create / Upload video"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#0f0f0f] dark:text-[#f1f1f1] text-sm font-medium transition-colors"
                >
                  <Video className="w-5 h-5 text-[#FF0033]" />
                  <span className="hidden xl:inline">Create</span>
                </Link>

                <div className="relative">
                  <button
                    title="Notifications"
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <NotificationBadge count={3} />
                  </button>
                </div>

                {/* User Profile Avatar with YouTube Dropdown Menu */}
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    title={user?.name || 'Account'}
                    className="flex items-center rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <Avatar
                      src={user?.avatar}
                      name={user?.name || 'User'}
                      size="sm"
                    />
                  </button>

                  {/* YouTube Exact User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-12 w-72 bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700/80 rounded-2xl shadow-xl py-2 z-50 text-[#0f0f0f] dark:text-[#f1f1f1] animate-in fade-in duration-150">
                      {/* User Account Info Header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                        <Avatar src={user?.avatar} name={user?.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate leading-tight">
                            {user?.name}
                          </p>
                          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] truncate mt-0.5">
                            @{user?.username}
                          </p>
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline block mt-1"
                          >
                            Manage your account
                          </Link>
                        </div>
                      </div>

                      {/* Dropdown Items */}
                      <div className="py-1">
                        <Link
                          to="/upload"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition"
                        >
                          <Upload className="w-5 h-5 text-neutral-500" />
                          <span>Upload video</span>
                        </Link>
                        <Link
                          to="/studio/videos"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition"
                        >
                          <Tv className="w-5 h-5 text-neutral-500" />
                          <span>VidTube Studio</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition"
                        >
                          <Settings className="w-5 h-5 text-neutral-500" />
                          <span>Settings & Security</span>
                        </Link>
                      </div>

                      <div className="border-t border-neutral-200 dark:border-neutral-700 my-1" />

                      {/* Sign Out Item */}
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/60 text-red-600 dark:text-red-400 transition"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* If Guest: YouTube Blue Sign In Button + Create link */
              <>
                <Link
                  to="/login"
                  title="Upload video"
                  className="hidden sm:flex items-center gap-2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
                >
                  <Video className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-sm font-semibold transition ml-1"
                >
                  <UserCircle2 className="w-5 h-5" />
                  <span>Sign in</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
