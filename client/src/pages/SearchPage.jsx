/**
 * Search Results Page
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import searchService from '../services/searchService';
import SearchFiltersBar from '../components/search/SearchFiltersBar';
import SubscribeButton from '../components/engagement/SubscribeButton';
import { Play, Flame, Search as SearchIcon } from 'lucide-react';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const uploadDate = searchParams.get('uploadDate') || 'all';
  const duration = searchParams.get('duration') || 'all';
  const sortBy = searchParams.get('sortBy') || 'relevance';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    items: [],
    channels: [],
    videos: [],
    shorts: [],
    pagination: { total: 0 }
  });
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await searchService.search({
          q,
          type,
          uploadDate,
          duration,
          sortBy
        });

        if (mounted && res?.data) {
          setData(res.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to execute search.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      mounted = false;
    };
  }, [q, type, uploadDate, duration, sortBy]);

  const handleFilterChange = (newFilters) => {
    const updated = new URLSearchParams(searchParams);
    if (newFilters.type) updated.set('type', newFilters.type);
    if (newFilters.uploadDate) updated.set('uploadDate', newFilters.uploadDate);
    if (newFilters.duration) updated.set('duration', newFilters.duration);
    if (newFilters.sortBy) updated.set('sortBy', newFilters.sortBy);
    setSearchParams(updated);
  };

  const formatViews = (views = 0) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
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
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
    return `${Math.floor(diff / 31536000)} years ago`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 min-h-screen">
      {/* Filters Bar */}
      <SearchFiltersBar
        filters={{ type, uploadDate, duration, sortBy }}
        onFilterChange={handleFilterChange}
      />

      {/* Query header */}
      {q && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Showing results for <span className="font-semibold text-neutral-800 dark:text-neutral-200">"{q}"</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 animate-pulse">
              <div className="w-full sm:w-80 aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && data.items.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
            <SearchIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-1">
            No results found
          </h3>
          <p className="text-sm text-neutral-500 max-w-sm">
            Try different keywords or remove search filters to find what you are looking for.
          </p>
        </div>
      )}

      {/* Results List */}
      {!loading && data.items.length > 0 && (
        <div className="space-y-6">
          {data.items.map((item, idx) => {
            // Render Channel Card
            if (item.type === 'channel') {
              const channel = item.data;
              return (
                <div
                  key={`channel-${channel._id}-${idx}`}
                  className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 transition-colors"
                >
                  <Link to={`/@${channel.handle}`} className="flex-shrink-0">
                    {channel.avatar ? (
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-2xl">
                        {channel.name[0]}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <Link
                      to={`/@${channel.handle}`}
                      className="font-bold text-lg text-[#0f0f0f] dark:text-[#f1f1f1] hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {channel.name}
                    </Link>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      @{channel.handle} • {channel.subscribersCount || 0} subscribers
                    </p>
                    {channel.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2 max-w-xl">
                        {channel.description}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <SubscribeButton
                      channelId={channel._id}
                      initialSubscribersCount={channel.subscribersCount}
                    />
                  </div>
                </div>
              );
            }

            // Render Shorts Shelf
            if (item.type === 'shorts_shelf') {
              const shortsList = item.data || [];
              if (shortsList.length === 0) return null;

              return (
                <div
                  key={`shelf-${idx}`}
                  className="py-4 border-y border-neutral-200 dark:border-neutral-800"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-red-600 fill-red-600" />
                    <h3 className="font-bold text-base text-[#0f0f0f] dark:text-[#f1f1f1]">
                      Shorts
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {shortsList.slice(0, 6).map((short) => (
                      <Link
                        key={short._id}
                        to={`/shorts/${short._id}`}
                        className="group flex flex-col"
                      >
                        <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                          {short.thumbnailUrl ? (
                            <img
                              src={short.thumbnailUrl}
                              alt={short.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <Play className="w-6 h-6 opacity-50" />
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 right-2 text-white drop-shadow">
                            <span className="text-[10px] font-medium bg-black/60 px-1.5 py-0.5 rounded">
                              {formatViews(short.views)}
                            </span>
                          </div>
                        </div>
                        <h4 className="mt-1.5 text-xs font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2 group-hover:text-blue-600">
                          {short.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            // Render Long-form Video Card (Horizontal format)
            if (item.type === 'video') {
              const video = item.data;
              return (
                <div
                  key={`video-${video._id}-${idx}`}
                  className="flex flex-col sm:flex-row gap-4 group"
                >
                  {/* Thumbnail on left */}
                  <Link
                    to={`/watch/${video._id}`}
                    className="relative w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Play className="w-10 h-10 opacity-40" />
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-black/80 text-white">
                      {formatDuration(video.duration)}
                    </span>
                  </Link>

                  {/* Metadata on right */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <Link to={`/watch/${video._id}`}>
                      <h3 className="font-semibold text-base sm:text-lg text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug">
                        {video.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {formatViews(video.views)} • {formatTimeAgo(video.createdAt)}
                    </p>

                    {/* Channel line */}
                    {video.channel && (
                      <Link
                        to={`/@${video.channel.handle || ''}`}
                        className="flex items-center gap-2 mt-2.5 hover:opacity-80"
                      >
                        {video.channel.avatar ? (
                          <img
                            src={video.channel.avatar}
                            alt={video.channel.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold">
                            {video.channel.name?.[0] || 'V'}
                          </div>
                        )}
                        <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium truncate">
                          {video.channel.name}
                        </span>
                      </Link>
                    )}

                    {/* Description snippet */}
                    {video.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2 max-w-2xl">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
