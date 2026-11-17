import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import socketService from '../../services/socketService';
import Avatar from '../common/Avatar';
import { formatTimeAgo } from '../../utils/formatters';

export default function NotificationDropdown() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    notificationService
      .getUnreadCount()
      .then((res) => {
        if (isMounted && res?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      })
      .catch((err) => console.debug('Failed to get unread count:', err));

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Connect to real-time socket notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('vidtube_token') || localStorage.getItem('token');
    const socket = socketService.connect(token);

    const handleRealtimeNotif = (newNotif) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [newNotif, ...prev]);
    };

    socketService.onNotification(handleRealtimeNotif);

    return () => {
      socketService.offNotification();
    };
  }, [isAuthenticated, user]);

  // Fetch recent notifications when dropdown opens
  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 12 });
      const items = res?.data?.notifications || [];
      setNotifications(items);
      const unread = items.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchRecentNotifications();
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notifId);
      const target = notifications.find((n) => n._id === notifId);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Render icon based on notification type
  const renderTypeIcon = (type) => {
    switch (type) {
      case 'subscribe':
        return <UserPlus className="w-3.5 h-3.5 text-blue-500" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'video_like':
      case 'short_like':
      case 'like':
        return <ThumbsUp className="w-3.5 h-3.5 text-[#FF0033]" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        title="Notifications"
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF0033] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0f0f0f] animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700/80 rounded-2xl shadow-2xl py-2 z-50 text-[#0f0f0f] dark:text-[#f1f1f1] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF0033]/10 text-[#FF0033] text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF0033]" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 px-4">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  Your notifications live here
                </p>
                <p className="text-xs mt-0.5">
                  Subscribe to your favorite channels to get notified about new activity.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const actor = n.sender || n.actor || {};
                return (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative flex items-start gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer transition ${
                      !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Unread blue dot */}
                    {!n.isRead && (
                      <span className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-[#FF0033]" />
                    )}

                    {/* Actor Avatar with Type badge */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={actor.avatar}
                        name={actor.name || actor.username || 'User'}
                        size="md"
                      />
                      <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-card shadow border border-border">
                        {renderTypeIcon(n.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-snug">
                        <span className="font-bold text-[#0f0f0f] dark:text-white">
                          {actor.name || actor.username || 'Someone'}{' '}
                        </span>
                        {n.message}
                      </p>
                      <span className="text-[11px] text-neutral-500 mt-1 block">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Delete action button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, n._id)}
                      aria-label="Delete notification"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-neutral-400 hover:text-destructive hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: View All Link */}
          <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 py-1"
            >
              <span>See all notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
