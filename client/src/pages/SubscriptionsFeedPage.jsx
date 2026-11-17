import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Users, PlaySquare, Compass, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../services/subscriptionService';
import VideoCard from '../components/video/VideoCard';
import Avatar from '../components/common/Avatar';
import { VerifiedBadge } from '../components/common/Badge';

export const SubscriptionsFeedPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [channels, setChannels] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // Fetch channels user is subscribed to
  useEffect(() => {
    if (!isAuthenticated) return;

    subscriptionService
      .getMySubscriptions({ limit: 50 })
      .then((res) => {
        const subs = res?.data?.subscriptions || [];
        // Map subscriptions to channel objects
        const channelList = subs.map((s) => s.channel).filter(Boolean);
        setChannels(channelList);
      })
      .catch((err) => console.debug('Failed to load subscriptions list:', err));
  }, [isAuthenticated]);

  // Fetch feed items
  const fetchFeed = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await subscriptionService.getSubscriptionsFeed({
          page: pageNum,
          limit: 24,
        });

        const newItems = res?.data?.items || [];
        const pagination = res?.data?.pagination || {};

        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setPage(pagination.page || pageNum);
        setHasMore((pagination.page || pageNum) < (pagination.pages || 1));
      } catch (err) {
        console.error('Failed to load subscriptions feed:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed(1, false);
    }
  }, [isAuthenticated, fetchFeed]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Don't miss new videos</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Sign in to see updates from your favorite YouTube channels.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#FF0033] text-white font-semibold text-sm hover:bg-[#d9002c] transition shadow-md"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Filter items by selected channel if specified
  const filteredItems = selectedChannelId
    ? items.filter((item) => item.channel?._id === selectedChannelId)
    : items;

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* Subscribed Channels Avatar Carousel */}
      {channels.length > 0 && (
        <div className="mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {/* "All" channel pill */}
            <button
              type="button"
              onClick={() => setSelectedChannelId(null)}
              className={`flex flex-col items-center gap-1.5 flex-shrink-0 group ${
                selectedChannelId === null ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition ${
                  selectedChannelId === null
                    ? 'border-[#FF0033] bg-[#FF0033]/10 text-[#FF0033]'
                    : 'border-transparent bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Tv className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold max-w-[70px] truncate text-center">
                All
              </span>
            </button>

            {/* Individual Subscribed Channels */}
            {channels.map((chan) => {
              const isSelected = selectedChannelId === chan._id;
              return (
                <button
                  key={chan._id}
                  type="button"
                  onClick={() =>
                    setSelectedChannelId(isSelected ? null : chan._id)
                  }
                  className={`flex flex-col items-center gap-1.5 flex-shrink-0 group transition ${
                    isSelected ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`rounded-full p-0.5 border-2 transition ${
                      isSelected ? 'border-[#FF0033]' : 'border-transparent'
                    }`}
                  >
                    <Avatar src={chan.avatar} name={chan.name} size="lg" />
                  </div>
                  <span className="text-xs font-medium max-w-[76px] truncate text-center">
                    {chan.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feed Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {selectedChannelId
              ? `${channels.find((c) => c._id === selectedChannelId)?.name || 'Channel'} Videos`
              : 'Latest Videos'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            New uploads from your subscribed creators
          </p>
        </div>
      </div>

      {/* Feed Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-8 gap-x-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-video w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-24 px-4 rounded-3xl border border-dashed border-border bg-neutral-50 dark:bg-neutral-900/40 max-w-xl mx-auto">
          <Users className="w-14 h-14 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h2 className="text-xl font-bold text-foreground mb-2">No subscriptions yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Subscribe to channels you enjoy to keep up with their latest videos, Shorts, and updates right here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF0033] text-white font-semibold text-sm hover:bg-[#d9002c] transition shadow-md"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Channels</span>
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <PlaySquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold text-foreground text-lg mb-1">
            No recent videos from these channels
          </h3>
          <p className="text-xs text-muted-foreground">
            Check back later when creators upload new content.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-8 gap-x-4">
            {filteredItems.map((item) => (
              <VideoCard key={item._id || item.id} video={item} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && !selectedChannelId && (
            <div className="pt-10 text-center">
              <button
                type="button"
                onClick={() => fetchFeed(page + 1, true)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border hover:bg-muted text-sm font-semibold text-foreground transition disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more uploads...</span>
                  </>
                ) : (
                  <span>Load more</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubscriptionsFeedPage;
