/**
 * VidTube Creator Studio Dedicated Layout
 * Phase 8 Creator Studio & Channel Analytics
 */
import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

export const StudioLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/studio/content?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    {
      to: '/studio',
      label: 'Dashboard',
      end: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      to: '/studio/content',
      label: 'Content',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      to: '/studio/analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      to: '/studio/comments',
      label: 'Comments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      to: '/studio/playlists',
      label: 'Playlists',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      to: '/studio/customization',
      label: 'Customization',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      to: '/studio/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-[#1f1f1f] text-[#0f0f0f] dark:text-[#f1f1f1] flex flex-col transition-colors">
      {/* Studio Topbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#282828] border-b border-gray-200 dark:border-gray-800 z-40 flex items-center justify-between px-4">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            title="Toggle Sidebar"
            aria-label="Toggle Studio Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/studio" className="flex items-center gap-1.5 group">
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center text-white font-black text-xs tracking-tighter">
              VT
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
              VidTube <span className="text-xs font-semibold px-1.5 py-0.5 bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded">Studio</span>
            </span>
          </Link>
        </div>

        {/* Center: Search across channel content */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search across your channel content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#181818] border border-gray-300 dark:border-gray-700 text-sm rounded-full py-1.5 pl-9 pr-4 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Right: Actions, Create, Profile */}
        <div className="flex items-center gap-2 relative">
          {/* Create Button */}
          <div className="relative">
            <button
              onClick={() => setIsCreateOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors shadow-sm"
              aria-expanded={isCreateOpen}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create</span>
            </button>

            {isCreateOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#282828] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 z-50 text-sm"
                onClick={() => setIsCreateOpen(false)}
              >
                <Link
                  to="/upload"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Upload Video</span>
                </Link>
                <Link
                  to="/upload?type=short"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Create Short</span>
                </Link>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="User Profile Menu"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#282828] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 z-50 text-sm"
                onClick={() => setIsProfileOpen(false)}
              >
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name || 'Creator'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username || 'handle'}</p>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/"
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Switch to VidTube</span>
                  </Link>
                  <Link
                    to="/studio/customization"
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Channel Profile</span>
                  </Link>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
                  <button
                    onClick={logout}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Studio Body */}
      <div className="pt-14 flex flex-1">
        {/* Studio Sidebar */}
        <aside
          className={`fixed top-14 left-0 bottom-0 bg-white dark:bg-[#282828] border-r border-gray-200 dark:border-gray-800 z-30 transition-all duration-200 flex flex-col justify-between ${
            isSidebarOpen ? 'w-64' : 'w-18'
          }`}
        >
          <div className="overflow-y-auto py-3">
            {/* Creator Identity Card */}
            {isSidebarOpen && (
              <div className="px-4 py-3 mb-2 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800/80">
                <div className="w-11 h-11 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || 'C'
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Your channel</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{user?.name || 'My Channel'}</p>
                  <p className="text-xs text-gray-500 truncate">@{user?.username || 'handle'}</p>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1 px-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    } ${!isSidebarOpen ? 'justify-center' : ''}`
                  }
                  title={item.label}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bottom Switch back to VidTube */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ${
                !isSidebarOpen ? 'justify-center' : ''
              }`}
              title="Return to VidTube Main"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {isSidebarOpen && <span>Back to VidTube</span>}
            </Link>
          </div>
        </aside>

        {/* Studio Workspace Content Area */}
        <main
          className={`flex-1 transition-all duration-200 min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8 ${
            isSidebarOpen ? 'md:ml-64' : 'md:ml-18'
          }`}
        >
          <ErrorBoundary>
            {children || <Outlet />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default StudioLayout;
