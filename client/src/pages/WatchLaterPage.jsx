/**
 * Watch Later Dedicated Page
 * VidTube Platform Architecture - Phase 7 Watch Later System
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import watchLaterService from '../services/watchLaterService';
import { useAuth } from '../context/AuthContext';
import { Clock, Play, Trash2, X, Lock } from 'lucide-react';

export const WatchLaterPage = () => {
  const { isAuthenticated } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWatchLater = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await watchLaterService.getWatchLater();
      if (res?.data) {
        setPlaylist(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Watch Later playlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchLater();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleRemove = async (videoId) => {
    try {
      await watchLaterService.removeFromWatchLater(videoId);
      setPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => (v.video?._id || v.video) !== videoId)
      }));
    } catch (err) {
      console.error('Failed to remove video from Watch Later', err);
    }
  };

  const formatDuration = (seconds = 0) => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${remS < 10 ? '0' : ''}${remS}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Clock className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
        <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
          Save videos to watch later
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Sign in to access your Watch Later list across all your devices.
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

  const validVideos = playlist?.videos?.filter((v) => v.video != null) || [];
  const firstVideoId = validVideos.length > 0 ? (validVideos[0].video?._id || validVideos[0].video) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Card: Watch Later Poster & Play all */}
        <div className="w-full lg:w-88 xl:w-96 lg:sticky lg:top-20 flex-shrink-0 bg-gradient-to-b from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center mb-5 group shadow-inner">
            {playlist?.thumbnailUrl ? (
              <img
                src={playlist.thumbnailUrl}
                alt="Watch Later"
                className="w-full h-full object-cover"
              />
            ) : (
              <Clock className="w-16 h-16 text-blue-300 opacity-60" />
            )}
            {firstVideoId && (
              <Link
                to={`/watch/${firstVideoId}?list=WL&index=0`}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <div className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play all</span>
                </div>
              </Link>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">Watch Later</h1>
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </span>
              <span>•</span>
              <span>{validVideos.length} videos</span>
            </div>
            <p className="text-xs text-blue-100/80">
              Saved videos to watch at your convenience. Videos are removed once unwatched.
            </p>

            {firstVideoId && (
              <div className="pt-3">
                <Link
                  to={`/watch/${firstVideoId}?list=WL&index=0`}
                  className="w-full flex items-center justify-center gap-2 bg-white text-neutral-950 font-bold text-sm py-2.5 rounded-full hover:bg-neutral-200 transition-colors shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play all</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right List: Videos */}
        <div className="flex-1 w-full space-y-2">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : validVideos.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Clock className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
              <p className="text-sm font-medium">No videos in Watch Later</p>
              <p className="text-xs text-neutral-400 mt-1">
                Click the clock icon or Save button on any video to add it here.
              </p>
            </div>
          ) : (
            validVideos.map((item, idx) => {
              const video = item.video;
              if (!video) return null;

              return (
                <div
                  key={`${video._id}-${idx}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group"
                >
                  <span className="w-6 text-center text-xs font-medium text-neutral-400">
                    {idx + 1}
                  </span>

                  <Link
                    to={`/watch/${video._id}?list=WL&index=${idx}`}
                    className="relative w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Play className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 rounded text-[10px] font-semibold bg-black/80 text-white">
                      {formatDuration(video.duration)}
                    </span>
                  </Link>

                  <div className="flex-1 min-w-0 pr-2">
                    <Link
                      to={`/watch/${video._id}?list=WL&index=${idx}`}
                      className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 leading-snug"
                    >
                      {video.title}
                    </Link>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                      {video.channel?.name || 'VidTube Creator'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemove(video._id)}
                    title="Remove from Watch Later"
                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchLaterPage;
