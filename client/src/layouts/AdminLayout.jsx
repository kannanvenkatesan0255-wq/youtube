/**
 * VidTube Admin Control Center Dedicated Layout
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  ShieldAlert,
  LayoutDashboard,
  AlertOctagon,
  Flag,
  Users,
  Tv,
  Film,
  Smartphone,
  MessageSquare,
  BarChart2,
  FileText,
  Bell,
  Settings,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        {
          to: '/admin',
          label: 'Dashboard',
          end: true,
          icon: <LayoutDashboard className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'MODERATION & SAFETY',
      items: [
        {
          to: '/admin/moderation',
          label: 'Moderation Queue',
          icon: <AlertOctagon className="w-4 h-4 text-red-500" />
        },
        {
          to: '/admin/reports',
          label: 'User Reports',
          icon: <Flag className="w-4 h-4 text-amber-500" />
        }
      ]
    },
    {
      title: 'CONTENT & DIRECTORIES',
      items: [
        {
          to: '/admin/users',
          label: 'Users Directory',
          icon: <Users className="w-4 h-4" />
        },
        {
          to: '/admin/channels',
          label: 'Channels',
          icon: <Tv className="w-4 h-4" />
        },
        {
          to: '/admin/videos',
          label: 'Videos',
          icon: <Film className="w-4 h-4" />
        },
        {
          to: '/admin/shorts',
          label: 'Shorts',
          icon: <Smartphone className="w-4 h-4" />
        },
        {
          to: '/admin/comments',
          label: 'Comments',
          icon: <MessageSquare className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'SYSTEM & SECURITY',
      items: [
        {
          to: '/admin/analytics',
          label: 'Platform Analytics',
          icon: <BarChart2 className="w-4 h-4" />
        },
        {
          to: '/admin/audit-logs',
          label: 'Audit Trail',
          icon: <FileText className="w-4 h-4" />
        },
        {
          to: '/admin/announcements',
          label: 'Announcements',
          icon: <Bell className="w-4 h-4" />
        },
        {
          to: '/admin/settings',
          label: 'Global Settings',
          icon: <Settings className="w-4 h-4" />
        }
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121212] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 z-40 flex items-center justify-between px-4">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full text-gray-600 dark:text-gray-300"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                VidTube
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick jump to Studio */}
          <Link
            to="/studio"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
            title="Open Creator Studio"
          >
            Creator Studio
          </Link>

          {/* Quick jump to public site */}
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
            title="Open Public VidTube in New Tab"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name?.[0] || 'A'}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2 z-50 text-xs animate-fadeIn"
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                    {user?.role}
                  </span>
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public VidTube</span>
                </Link>
                <Link
                  to="/studio"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Creator Studio</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex pt-14 flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed top-14 bottom-0 left-0 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 z-30 transition-all duration-200 overflow-y-auto ${
            isSidebarOpen ? 'w-60' : 'w-16'
          }`}
        >
          <div className="p-3 space-y-6">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {isSidebarOpen && (
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-3 tracking-wider">
                    {section.title}
                  </h4>
                )}
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-gray-200'
                      } ${!isSidebarOpen ? 'justify-center' : ''}`
                    }
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    {item.icon}
                    {isSidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main
          className={`flex-1 transition-all duration-200 p-4 sm:p-6 lg:p-8 min-w-0 ${
            isSidebarOpen ? 'ml-60' : 'ml-16'
          }`}
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
