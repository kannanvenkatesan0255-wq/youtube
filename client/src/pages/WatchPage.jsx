/**
 * VidTube Watch Page
 * Complete YouTube-exact video watching experience with adaptive video player,
 * theater mode, channel header, action buttons, expandable description, and related video recommendations.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Share2,
  Bookmark,
  MoreHorizontal,
  Check,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import VideoPlayer from '../components/player/VideoPlayer';
import Avatar from '../components/common/Avatar';
import { VerifiedBadge, DurationBadge } from '../components/common/Badge';
import LikeDislikeButtons from '../components/engagement/LikeDislikeButtons';
import SubscribeButton from '../components/engagement/SubscribeButton';
import CommentSection from '../components/comments/CommentSection';
import { videoService } from '../services/videoService';
import { useAuth } from '../context/AuthContext';
import { formatViews, formatTimeAgo, formatDuration } from '../utils/formatters';
import { SAMPLE_VIDEOS } from '../utils/sampleData';

export const WatchPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Video State
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resume Progress
  const [initialTime, setInitialTime] = useState(0);
  const [resumeToast, setResumeToast] = useState(null);

  // Related Videos
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  // UI States
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // View tracking and progress save refs
  const hasTrackedViewRef = useRef(false);
  const lastProgressSavedRef = useRef(0);
  const currentProgressRef = useRef({ currentTime: 0, duration: 0 });

  /**
   * 1. Load Video Playback Details & Saved Resume Progress
   */
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    hasTrackedViewRef.current = false;

    const fetchVideoData = async () => {
      try {
        // Fetch authorized playback info
        const res = await videoService.getPlaybackInfo(videoId);
        if (!isMounted) return;

        const videoData = res.data?.data;
        setVideo(videoData);

        // If authenticated, fetch saved watch progress
        if (user) {
          try {
            const progRes = await videoService.getProgress(videoId);
            if (progRes.data?.data?.hasHistory && progRes.data.data.progress > 5) {
              const savedSecs = progRes.data.data.progress;
              setInitialTime(savedSecs);
              setResumeToast(`Resumed from ${formatDuration(savedSecs)}`);
              setTimeout(() => setResumeToast(null), 4000);
            }
          } catch (e) {
            console.debug('No prior watch history:', e.message);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        const msg =
          err.response?.data?.message ||
          (err.response?.status === 403
            ? 'This video is private. You do not have permission to view it.'
            : 'Video could not be loaded.');
        setError({
          status: err.response?.status || 500,
          message: msg
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideoData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [videoId, user]);

  /**
   * 2. Load Related Video Recommendations
   */
  useEffect(() => {
    let isMounted = true;
    setRelatedLoading(true);

    const fetchRelated = async () => {
      try {
        const res = await videoService.getRelatedVideos(videoId, { limit: 15 });
        if (!isMounted) return;

        let list = res.data?.data?.videos || [];

        // If backend returned fewer than 4 videos, backfill with sample videos
        if (list.length < 4) {
          const sampleBackfill = SAMPLE_VIDEOS.filter(
            (sv) => sv.id !== videoId && !list.some((lv) => lv._id === sv.id)
          );
          list = [...list, ...sampleBackfill];
        }

        setRelatedVideos(list);
      } catch {
        if (!isMounted) return;
        // Fallback to sample videos excluding current video
        const fallback = SAMPLE_VIDEOS.filter((sv) => sv.id !== videoId);
        setRelatedVideos(fallback);
      } finally {
        if (isMounted) setRelatedLoading(false);
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  /**
   * 3. Handle Time Updates: Track Legitimate View & Debounced Progress Save
   */
  const handleTimeUpdate = useCallback(
    (currentTime, duration) => {
      currentProgressRef.current = { currentTime, duration };

      // Legitimate View Tracking: Count view after 5s of cumulative playback
      if (!hasTrackedViewRef.current && currentTime >= 5) {
        hasTrackedViewRef.current = true;
        videoService
          .trackView(videoId, { watchTime: Math.floor(currentTime) })
          .then((res) => {
            if (res.data?.data?.incremented) {
              setVideo((prev) => (prev ? { ...prev, views: res.data.data.views } : prev));
            }
          })
          .catch((err) => console.debug('View tracking notice:', err.message));
      }

      // Save watch progress every 15 seconds if authenticated
      if (user && duration > 0) {
        const nowSec = Math.floor(currentTime);
        if (Math.abs(nowSec - lastProgressSavedRef.current) >= 15) {
          lastProgressSavedRef.current = nowSec;
          videoService
            .saveProgress(videoId, {
              progress: nowSec,
              duration: Math.floor(duration)
            })
            .catch(() => {});
        }
      }
    },
    [videoId, user]
  );

  /**
   * 4. Save Final Progress on Unmount or Page Navigation
   */
  useEffect(() => {
    return () => {
      if (user && currentProgressRef.current.duration > 0) {
        const finalSecs = Math.floor(currentProgressRef.current.currentTime);
        if (finalSecs > 3) {
          videoService
            .saveProgress(videoId, {
              progress: finalSecs,
              duration: Math.floor(currentProgressRef.current.duration)
            })
            .catch(() => {});
        }
      }
    };
  }, [videoId, user]);

  /**
   * Interactive Action Handlers
   */
  const handleShare = () => {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      })
      .catch(() => {
        alert(`Video link: ${window.location.href}`);
      });
  };

  const handleNextVideo = () => {
    if (relatedVideos.length > 0) {
      const next = relatedVideos[0];
      navigate(`/watch/${next._id || next.id}`);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-[#FF0033] animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Loading VidTube watch stream...</p>
      </div>
    );
  }

  // Error State (e.g. 403 Private Video or 404 Not Found)
  if (error || !video) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4 text-[#FF0033]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Video Unavailable</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          {error?.message || 'The requested video could not be found or has been removed.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF0033] text-white text-xs font-semibold hover:bg-[#d9002c] transition shadow-md"
        >
          Return to VidTube Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      {/* Resume Toast Notification */}
      {resumeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] text-white text-xs font-medium shadow-2xl border border-neutral-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Sparkles className="w-4 h-4 text-[#FF0033]" />
          <span>{resumeToast}</span>
        </div>
      )}

      {/* Share Copied Toast */}
      {shareCopied && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f0f0f] text-white text-xs font-medium shadow-2xl border border-neutral-700 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Link copied to clipboard</span>
        </div>
      )}

      {/* Theater Mode Top Player Container */}
      {isTheaterMode && (
        <div className="w-full bg-black mb-6">
          <div className="max-w-[1700px] mx-auto">
            <VideoPlayer
              src={video.videoUrl}
              hlsUrl={video.hlsUrl}
              poster={video.thumbnailUrl}
              title={video.title}
              initialTime={initialTime}
              isTheaterMode={true}
              onToggleTheater={() => setIsTheaterMode(false)}
              onTimeUpdate={handleTimeUpdate}
              onNextVideo={handleNextVideo}
            />
          </div>
        </div>
      )}

      {/* Main Watch Page Content Container */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Primary Video & Details */}
          <div className="flex-1 min-w-0">
            {/* Standard Mode Player */}
            {!isTheaterMode && (
              <div className="w-full mb-4">
                <VideoPlayer
                  src={video.videoUrl}
                  hlsUrl={video.hlsUrl}
                  poster={video.thumbnailUrl}
                  title={video.title}
                  initialTime={initialTime}
                  isTheaterMode={false}
                  onToggleTheater={() => setIsTheaterMode(true)}
                  onTimeUpdate={handleTimeUpdate}
                  onNextVideo={handleNextVideo}
                />
              </div>
            )}

            {/* Video Title */}
            <h1 className="text-lg sm:text-xl font-bold leading-snug text-[#0f0f0f] dark:text-[#f1f1f1] mb-3">
              {video.title}
            </h1>

            {/* Channel Info & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
              {/* Channel Profile & Subscribe */}
              <div className="flex items-center gap-3">
                <Avatar
                  src={video.channel?.avatar}
                  name={video.channel?.name || 'Channel'}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-[#0f0f0f] dark:text-[#f1f1f1]">
                      {video.channel?.name || 'VidTube Creator'}
                    </span>
                    {video.channel?.isVerified && <VerifiedBadge />}
                  </div>
                  <span className="text-xs text-neutral-500">
                    {formatViews(video.channel?.subscribersCount || 0)} subscribers
                  </span>
                </div>

                <div className="ml-2">
                  <SubscribeButton
                    channelId={video.channel?._id}
                    channelOwnerId={video.owner?._id || video.owner}
                    initialSubscribersCount={video.channel?.subscribersCount}
                    initialIsSubscribed={video.channel?.isSubscribed}
                  />
                </div>
              </div>

              {/* Action Buttons: Like/Dislike, Share, Save */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {/* Unified Mutual Like / Dislike Pill Group */}
                <LikeDislikeButtons
                  contentType="Video"
                  contentId={video._id}
                  initialLikesCount={video.likesCount}
                  initialDislikesCount={video.dislikesCount}
                />

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-xs font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                {/* Save Button */}
                <button
                  type="button"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-xs font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Save</span>
                </button>

                {/* More Options */}
                <button
                  type="button"
                  aria-label="More actions"
                  className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-[#0f0f0f] dark:text-[#f1f1f1]"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Video Description Box */}
            <div className="mt-4 p-3 sm:p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
                <span>{formatViews(video.views)} views</span>
                <span>•</span>
                <span>{formatTimeAgo(video.publishedAt || video.createdAt)}</span>
                {video.category && (
                  <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-xs">
                    {video.category}
                  </span>
                )}
                {video.visibility === 'unlisted' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    Unlisted
                  </span>
                )}
                {video.visibility === 'private' && (
                  <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
                    Private
                  </span>
                )}
              </div>

              {/* Description Body */}
              <div
                className={`text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line ${
                  isDescriptionExpanded ? '' : 'line-clamp-3'
                }`}
              >
                {video.description || 'No description provided by the creator.'}
              </div>

              {/* Tags List */}
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700/60">
                  {video.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Toggle More/Less Button */}
              {video.description && video.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((p) => !p)}
                  className="mt-2 text-xs font-bold text-[#0f0f0f] dark:text-[#f1f1f1] hover:underline"
                >
                  {isDescriptionExpanded ? 'Show less' : '...more'}
                </button>
              )}
            </div>

            {/* Community Comments Section */}
            <CommentSection
              contentType="Video"
              contentId={video._id}
              commentsCount={video.commentsCount || 0}
            />
          </div>

          {/* Right Column: Related Video Recommendations */}
          <div className="w-full lg:w-96 xl:w-[410px] flex-shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3 px-1">
              Related Videos
            </h3>

            {relatedLoading ? (
              <div className="flex items-center justify-center py-12 text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {relatedVideos.map((rec) => {
                  const recId = rec._id || rec.id;
                  const durationFormatted =
                    typeof rec.duration === 'number'
                      ? formatDuration(rec.duration)
                      : rec.duration;

                  return (
                    <Link
                      key={recId}
                      to={`/watch/${recId}`}
                      className="group flex gap-2.5 rounded-xl p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition"
                    >
                      {/* Compact Thumbnail (16:9 ratio, fixed 168px width) */}
                      <div className="relative w-40 sm:w-44 flex-shrink-0 aspect-video rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                        <img
                          src={rec.thumbnailUrl}
                          alt={rec.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        <DurationBadge durationText={durationFormatted} />
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h4
                          className="text-xs sm:text-sm font-semibold line-clamp-2 leading-tight text-[#0f0f0f] dark:text-[#f1f1f1] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                          title={rec.title}
                        >
                          {rec.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-500 hover:text-[#0f0f0f] dark:hover:text-white transition">
                          <span className="truncate">{rec.channel?.name || 'VidTube Creator'}</span>
                          {rec.channel?.isVerified && <VerifiedBadge />}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          <span>{formatViews(rec.views || 0)} views</span>
                          <span className="mx-1">•</span>
                          <span>{formatTimeAgo(rec.publishedAt || rec.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
