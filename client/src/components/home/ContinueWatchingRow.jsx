/**
 * Continue Watching Carousel / Shelf Component
 * VidTube Platform Architecture - Phase 7 Watch History & Continue Watching
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import historyService from '../../services/historyService';

export const ContinueWatchingRow = ({
  items = [],
  onItemRemoved
}) => {
  if (!items || items.length === 0) return null;

  const handleDismiss = async (e, entryId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await historyService.deleteHistoryItem(entryId);
      if (onItemRemoved) onItemRemoved(entryId);
    } catch (err) {
      console.error('Failed to dismiss continue watching item', err);
    }
  };

  const formatDuration = (seconds = 0) => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${remS < 10 ? '0' : ''}${remS}`;
  };

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
          <span>Continue watching</span>
        </h2>
        <Link
          to="/history"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all history
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
        {items.map((entry) => {
          const video = entry.video;
          if (!video) return null;

          const progressPercent =
            entry.duration > 0
              ? Math.min(100, Math.round((entry.watchedSeconds / entry.duration) * 100))
              : 0;

          return (
            <div
              key={entry._id}
              className="flex-shrink-0 w-64 group relative bg-neutral-50 dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 transition-all hover:shadow-md"
            >
              {/* Dismiss button */}
              <button
                type="button"
                title="Remove from history"
                onClick={(e) => handleDismiss(e, entry._id)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/70 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <Link
                to={`/watch/${video._id}?t=${Math.floor(entry.watchedSeconds)}`}
                className="block"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video bg-neutral-200 dark:bg-neutral-800">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <Play className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Red Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-600/60">
                    <div
                      className="h-full bg-red-600 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {video.title}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {video.channel?.name || 'VidTube Creator'}
                  </p>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {formatDuration(entry.watchedSeconds)} / {formatDuration(entry.duration)} watched
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatchingRow;
