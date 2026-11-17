import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  UserPlus,
  MessageSquare,
  ThumbsUp,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import Avatar from '../components/common/Avatar';
import { formatTimeAgo } from '../utils/formatters';

export const NotificationsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false, currentFilter = filter) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = {
          page: pageNum,
          limit: 25,
          unreadOnly: currentFilter === 'unread',
        };
        const res = await notificationService.getNotifications(params);
        const items = res?.data?.notifications || [];
        const pagination = res?.data?.pagination || {};

        setNotifications((prev) => (append ? [...prev, ...items] : items));
        setPage(pagination.page || pageNum);
        setHasMore((pagination.page || pageNum) < (pagination.pages || 1));
      } catch (err) {
        console.error('Failed to load notifications page:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, false, filter);
      notificationService
        .getUnreadCount()
        .then((res) => setUnreadCount(res?.data?.unreadCount || 0))
        .catch(() => {});
    }
  }, [isAuthenticated, filter, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClickItem = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error('Error marking as read:', e);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'subscribe':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'video_like':
      case 'short_like':
      case 'like':
        return <ThumbsUp className="w-4 h-4 text-[#FF0033]" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Bell className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in to view your notifications</h2>
        <p className="text-sm text-neutral-500 mb-6">
          See activity on your videos, replies to your comments, and updates from your subscriptions.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#FF0033] text-white font-semibold text-sm hover:bg-[#d9002c] transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage updates, replies, and community activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-white dark:bg-[#1f1f1f] text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'unread'
                  ? 'bg-white dark:bg-[#1f1f1f] text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-primary hover:bg-primary/10 transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/50"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/3" />
                <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border bg-neutral-50 dark:bg-neutral-900/40">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold text-foreground text-lg mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You are all caught up! Switch to All to see your past activity.'
              : 'When you receive comments, replies, or new subscribers, they will show up here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const actor = notif.sender || notif.actor || {};
            return (
              <div
                key={notif._id}
                onClick={() => handleClickItem(notif)}
                className={`group relative flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
                  !notif.isRead
                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                    : 'bg-card border-border hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                {/* Unread indicator */}
                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF0033] flex-shrink-0" />
                )}

                {/* Avatar with icon badge */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={actor.avatar}
                    name={actor.name || actor.username || 'User'}
                    size="md"
                  />
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-card shadow border border-border">
                    {renderIcon(notif.type)}
                  </span>
                </div>

                {/* Message body */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-bold">{actor.name || actor.username || 'Someone'} </span>
                    {notif.message}
                  </p>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {formatTimeAgo(notif.createdAt)}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(e, notif._id)}
                  aria-label="Delete"
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-neutral-200 dark:hover:bg-neutral-700 transition flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="pt-6 text-center">
              <button
                type="button"
                onClick={() => fetchNotifications(page + 1, true, filter)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border hover:bg-muted text-sm font-semibold text-foreground transition disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load more notifications</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
