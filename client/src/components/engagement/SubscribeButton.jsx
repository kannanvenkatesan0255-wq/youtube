/**
 * Reusable YouTube-Style Channel Subscribe Button
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 * Persistent subscription management, optimistic state toggle, and self-subscription protection
 */
import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../context/AuthContext';

export const SubscribeButton = ({
  channelId,
  channelOwnerId,
  initialSubscribed = false,
  initialSubscribersCount = 0,
  onSubscribedChange,
  size = 'md',
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [subscribersCount, setSubscribersCount] = useState(initialSubscribersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  // Check self-ownership
  useEffect(() => {
    if (user && channelOwnerId && (user._id === channelOwnerId || user.id === channelOwnerId)) {
      setIsSelf(true);
    } else {
      setIsSelf(false);
    }
  }, [user, channelOwnerId]);

  // Sync prop changes
  useEffect(() => {
    setIsSubscribed(initialSubscribed);
  }, [initialSubscribed]);

  useEffect(() => {
    setSubscribersCount(initialSubscribersCount);
  }, [initialSubscribersCount]);

  // Query actual backend status if authenticated
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && channelId) {
      subscriptionService
        .getSubscriptionStatus(channelId)
        .then((res) => {
          if (!isMounted) return;
          const data = res.data?.data || res.data;
          if (data) {
            setIsSubscribed(Boolean(data.isSubscribed));
            if (typeof data.subscribersCount === 'number') {
              setSubscribersCount(data.subscribersCount);
            }
            if (data.isSelf) {
              setIsSelf(true);
            }
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [channelId, isAuthenticated]);

  const handleToggleSubscribe = async (e) => {
    e?.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isSelf || isLoading || !channelId) return;

    // Snapshot state for rollback
    const prevSubscribed = isSubscribed;
    const prevCount = subscribersCount;

    // Optimistic toggle
    const nextSubscribed = !prevSubscribed;
    const nextCount = nextSubscribed ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsSubscribed(nextSubscribed);
    setSubscribersCount(nextCount);

    try {
      setIsLoading(true);
      let res;
      if (nextSubscribed) {
        res = await subscriptionService.subscribe(channelId);
      } else {
        res = await subscriptionService.unsubscribe(channelId);
      }

      const data = res.data?.data || res.data;
      if (data) {
        setIsSubscribed(Boolean(data.isSubscribed));
        if (typeof data.subscribersCount === 'number') {
          setSubscribersCount(data.subscribersCount);
        }

        if (onSubscribedChange) {
          onSubscribedChange({
            isSubscribed: Boolean(data.isSubscribed),
            subscribersCount: data.subscribersCount
          });
        }
      }
    } catch (err) {
      console.error('Subscription toggle failed, rolling back:', err.message);
      setIsSubscribed(prevSubscribed);
      setSubscribersCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  };

  // If user owns this channel, show "You" or disabled pill
  if (isSelf) {
    return (
      <span
        className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-default select-none ${className}`}
      >
        Your Channel
      </span>
    );
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-6 py-2.5 text-sm font-bold'
      : 'px-4 py-2 text-xs font-semibold';

  return (
    <button
      type="button"
      onClick={handleToggleSubscribe}
      disabled={isLoading}
      title={isSubscribed ? 'Click to unsubscribe' : 'Subscribe to this channel'}
      className={`rounded-full transition active:scale-95 flex items-center justify-center gap-1.5 select-none shadow-sm ${sizeClasses} ${
        isSubscribed
          ? 'bg-neutral-200 dark:bg-neutral-800 text-[#0f0f0f] dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700'
          : 'bg-[#0f0f0f] dark:bg-white text-white dark:text-[#0f0f0f] hover:bg-neutral-800 dark:hover:bg-neutral-200'
      } ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isSubscribed ? (
        <>
          <Bell className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
          <span>Subscribed</span>
        </>
      ) : (
        <span>Subscribe</span>
      )}
    </button>
  );
};

export default SubscribeButton;
