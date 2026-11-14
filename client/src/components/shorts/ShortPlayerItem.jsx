/**
 * VidTube Short Player Item
 * Exact YouTube Shorts vertical card with autoplay/loop, sound toggle,
 * vertical interaction sidebar (like, dislike, comment, share, sound), and bottom creator overlay.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Music2,
  Disc,
  MoreVertical,
  Check,
  Bell
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { VerifiedBadge } from '../common/Badge';
import { shortService } from '../../services/shortService';
import { formatViews } from '../../utils/formatters';

export const ShortPlayerItem = ({
  short,
  isActive = false,
  isMuted = true,
  onToggleMute,
  onOpenComments,
  onShare
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 - 100
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeState, setLikeState] = useState(null); // 'like' | 'dislike' | null
  const [likesCount, setLikesCount] = useState(short.likesCount || 0);
  const hasTrackedViewRef = useRef(false);

  const shortId = short._id || short.id;

  /**
   * Handle Active State Playback Lifecycle
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      hasTrackedViewRef.current = false;
      video.currentTime = 0;
      video.muted = isMuted;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // If unmuted autoplay is blocked by browser policy, fallback to muted autoplay
            video.muted = true;
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive, isMuted]);

  // Keep mute state in sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100);
    }

    // View tracking: count view after 2 seconds of playback
    if (!hasTrackedViewRef.current && video.currentTime >= 2) {
      hasTrackedViewRef.current = true;
      shortService
        .trackView(shortId, { watchTime: Math.floor(video.currentTime) })
        .catch(() => {});
    }
  };

  const togglePlayPause = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (likeState === 'like') {
      setLikeState(null);
      setLikesCount((c) => Math.max(0, c - 1));
    } else {
      if (likeState === 'dislike') setLikeState('like');
      else setLikeState('like');
      setLikesCount((c) => c + 1);
    }
  };

  const handleDislike = (e) => {
    e.stopPropagation();
    if (likeState === 'dislike') {
      setLikeState(null);
    } else {
      if (likeState === 'like') setLikesCount((c) => Math.max(0, c - 1));
      setLikeState('dislike');
    }
  };

  return (
    <div className="relative flex items-end justify-center w-full h-full max-h-[calc(100vh-80px)] py-2 select-none">
      {/* 9:16 Vertical Video Frame */}
      <div
        onClick={togglePlayPause}
        className="relative w-full max-w-[360px] sm:max-w-[400px] h-full aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center cursor-pointer group"
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={short.videoUrl}
          poster={short.thumbnailUrl}
          playsInline
          loop
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-cover"
        />

        {/* Center Pause Splash Icon */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm shadow-xl">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Sound Toggle Button (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-sm transition active:scale-95"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Bottom Metadata & Creator Overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end text-white">
          {/* Creator Channel Header */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                src={short.channel?.avatar}
                name={short.channel?.name || 'Creator'}
                size="md"
              />
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs sm:text-sm font-bold truncate">
                  {short.channel?.handle || short.channel?.name || '@vidtube'}
                </span>
                {short.channel?.isVerified && <VerifiedBadge />}
              </div>
            </div>

            {/* Subscribe Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSubscribed((s) => !s);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 flex items-center gap-1 ${
                isSubscribed
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              {isSubscribed && <Check className="w-3.5 h-3.5" />}
              <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
            </button>
          </div>

          {/* Short Title & Tags */}
          <div className="mb-2">
            <p
              className={`text-xs sm:text-sm font-medium leading-snug ${
                isTitleExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {short.title}
            </p>
            {short.description && short.description.length > 80 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTitleExpanded((t) => !t);
                }}
                className="text-[11px] font-bold text-neutral-300 hover:text-white mt-0.5"
              >
                {isTitleExpanded ? 'less' : '...more'}
              </button>
            )}
          </div>

          {/* Sound / Audio Track Attribution */}
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Music2 className="w-3.5 h-3.5 text-white flex-shrink-0 animate-pulse" />
            <span className="truncate">{short.soundTitle || 'Original Audio'}</span>
          </div>

          {/* Bottom Scrub Progress Line */}
          <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-[#FF0033] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Vertical Action Panel (YouTube Exact Shorts Sidebar) */}
      <div className="flex flex-col items-center gap-4 ml-3 sm:ml-4 pb-4 select-none z-30">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            aria-label="Like this Short"
            className={`p-3 rounded-full bg-neutral-200/90 dark:bg-neutral-800/90 hover:bg-neutral-300 dark:hover:bg-neutral-700 backdrop-blur-sm transition active:scale-90 shadow-md ${
              likeState === 'like' ? 'text-[#FF0033]' : 'text-[#0f0f0f] dark:text-white'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${likeState === 'like' ? 'fill-[#FF0033]' : ''}`} />
          </button>
          <span className="text-[11px] font-semibold text-[#0f0f0f] dark:text-white">
            {formatViews(likesCount)}
          </span>
        </div>

        {/* Dislike Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleDislike}
            aria-label="Dislike this Short"
            className={`p-3 rounded-full bg-neutral-200/90 dark:bg-neutral-800/90 hover:bg-neutral-300 dark:hover:bg-neutral-700 backdrop-blur-sm transition active:scale-90 shadow-md ${
              likeState === 'dislike' ? 'text-[#FF0033]' : 'text-[#0f0f0f] dark:text-white'
            }`}
          >
            <ThumbsDown className={`w-5 h-5 ${likeState === 'dislike' ? 'fill-[#FF0033]' : ''}`} />
          </button>
          <span className="text-[11px] font-semibold text-[#0f0f0f] dark:text-white">
            Dislike
          </span>
        </div>

        {/* Comments Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(short);
            }}
            aria-label="View comments"
            className="p-3 rounded-full bg-neutral-200/90 dark:bg-neutral-800/90 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-[#0f0f0f] dark:text-white backdrop-blur-sm transition active:scale-90 shadow-md"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-semibold text-[#0f0f0f] dark:text-white">
            {short.commentsCount || 0}
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(short);
            }}
            aria-label="Share Short"
            className="p-3 rounded-full bg-neutral-200/90 dark:bg-neutral-800/90 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-[#0f0f0f] dark:text-white backdrop-blur-sm transition active:scale-90 shadow-md"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-semibold text-[#0f0f0f] dark:text-white">
            Share
          </span>
        </div>

        {/* Sound Vinyl Disc Rotation Indicator */}
        <div className="mt-2">
          <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-[spin_4s_linear_infinite] shadow-lg">
            <Disc className="w-6 h-6 text-[#FF0033]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortPlayerItem;
