/**
 * Watch History Dashboard Page
 * VidTube Platform Architecture - Phase 7 Watch History & Continue Watching
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import historyService from '../services/historyService';
import { useAuth } from '../context/AuthContext';
import { History, Search, Trash2, X, Play, Clock, Flame } from 'lucide-react';

export const WatchHistoryPage = () => {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await historyService.getWatchHistory({ q: query });
      if (res?.data?.history) {
        setHistory(res.data.history);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load watch history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory(searchQuery);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory(searchQuery);
  };

  const handleDeleteItem = async (e, entryId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await historyService.deleteHistoryItem(entryId);
      setHistory((prev) => prev.filter((h) => h._id !== entryId));
    } catch (err) {
      console.error('Failed to remove history item', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all watch history? This cannot be undone.')) return;
    try {
      await historyService.clearAllHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const formatDuration = (seconds = 0) => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${remS < 10 ? '0' : ''}${remS}`;
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 2592000)}mo ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <History className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
        <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
          Keep track of what you watch
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Watch history isn't viewable when signed out. Sign in to see your history.
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 min-h-screen">
      <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
        {/* Main Feed: Watch History Items */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
              Watch history
            </h1>
            <span className="text-xs text-neutral-500">
              {history.length} {history.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {loading ? (
            <div className="space-y-4 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-48 aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-neutral-500">
              <History className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
              <p className="text-sm">
                {searchQuery ? `No history results for "${searchQuery}".` : 'This list has no videos.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {history.map((entry) => {
                const isShort = entry.contentType === 'Short';
                const content = isShort ? entry.short : entry.video;
                if (!content) return null;

                const progressPercent =
                  entry.duration > 0
                    ? Math.min(100, Math.round((entry.watchedSeconds / entry.duration) * 100))
                    : 0;

                const targetUrl = isShort ? `/shorts/${content._id}` : `/watch/${content._id}?t=${Math.floor(entry.watchedSeconds)}`;

                return (
                  <div
                    key={entry._id}
                    className="flex items-start gap-4 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group relative"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={targetUrl}
                      className={`relative rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 ${
                        isShort ? 'w-24 aspect-[9/16]' : 'w-44 sm:w-52 aspect-video'
                      }`}
                    >
                      {content.thumbnailUrl ? (
                        <img
                          src={content.thumbnailUrl}
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Play className="w-6 h-6 opacity-40" />
                        </div>
                      )}

                      {/* Duration Badge */}
                      <span className="absolute bottom-1 right-1 px-1 rounded text-[10px] font-semibold bg-black/80 text-white">
                        {isShort ? 'SHORT' : formatDuration(content.duration)}
                      </span>

                      {/* Red Progress Bar */}
                      {progressPercent > 0 && !entry.completed && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-600/60">
                          <div
                            className="h-full bg-red-600"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </Link>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 pr-8">
                      <Link to={targetUrl}>
                        <h3 className="text-sm sm:text-base font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 leading-snug">
                          {content.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        <span>{content.channel?.name || 'VidTube Creator'}</span>
                        <span>•</span>
                        <span>Watched {formatTimeAgo(entry.lastWatchedAt)}</span>
                      </div>

                      {content.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2 max-w-xl hidden sm:block">
                          {content.description}
                        </p>
                      )}
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      title="Remove from watch history"
                      onClick={(e) => handleDeleteItem(e, entry._id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Controls & Search */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-6 lg:sticky lg:top-20">
          {/* Search inside history */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search watch history"
              className="w-full text-xs pl-9 pr-8 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchHistory('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Action buttons */}
          <div className="space-y-1 text-sm border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <button
              onClick={handleClearAll}
              disabled={history.length === 0}
              className="flex items-center gap-3 w-full py-2 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear all watch history</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchHistoryPage;
