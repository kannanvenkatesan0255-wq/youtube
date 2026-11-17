/**
 * Reusable Like / Dislike Reaction Buttons
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 * Mutually exclusive, persistent reactions with optimistic updates and atomic rollback
 */
import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { engagementService } from '../../services/engagementService';
import { formatViews } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const LikeDislikeButtons = ({
  contentType = 'Video',
  contentId,
  initialLikesCount = 0,
  initialDislikesCount = 0,
  initialUserReaction = null,
  onReactionChange,
  compact = false,
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [dislikesCount, setDislikesCount] = useState(initialDislikesCount);
  const [userReaction, setUserReaction] = useState(initialUserReaction);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  useEffect(() => {
    setDislikesCount(initialDislikesCount);
  }, [initialDislikesCount]);

  useEffect(() => {
    setUserReaction(initialUserReaction);
  }, [initialUserReaction]);

  // If user is authenticated and initialUserReaction was null, fetch user reaction
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && contentId && initialUserReaction === null) {
      engagementService
        .getUserReaction(contentType, contentId)
        .then((res) => {
          if (isMounted && res.data?.data?.userReaction) {
            setUserReaction(res.data.data.userReaction);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [contentId, contentType, isAuthenticated, initialUserReaction]);

  const handleReactionClick = async (reactionType) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isLoading || !contentId) return;

    // Snapshot previous state for rollback
    const prevReaction = userReaction;
    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;

    // Calculate optimistic state
    let nextReaction = null;
    let nextLikes = prevLikes;
    let nextDislikes = prevDislikes;

    if (prevReaction === reactionType) {
      // Toggle off
      nextReaction = null;
      if (reactionType === 'like') nextLikes = Math.max(0, nextLikes - 1);
      if (reactionType === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1);
    } else {
      // New or switch
      nextReaction = reactionType;
      if (reactionType === 'like') {
        nextLikes += 1;
        if (prevReaction === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1);
      } else {
        nextDislikes += 1;
        if (prevReaction === 'like') nextLikes = Math.max(0, nextLikes - 1);
      }
    }

    // Apply optimistic update
    setUserReaction(nextReaction);
    setLikesCount(nextLikes);
    setDislikesCount(nextDislikes);

    try {
      setIsLoading(true);
      const res = await engagementService.setReaction(contentType, contentId, reactionType);
      const data = res.data?.data;

      if (data) {
        setUserReaction(data.userReaction);
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);

        if (onReactionChange) {
          onReactionChange({
            userReaction: data.userReaction,
            likesCount: data.likesCount,
            dislikesCount: data.dislikesCount
          });
        }
      }
    } catch (err) {
      // Rollback on network/server error
      console.error('Reaction update failed, rolling back:', err.message);
      setUserReaction(prevReaction);
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
    } finally {
      setIsLoading(false);
    }
  };

  const isLiked = userReaction === 'like';
  const isDisliked = userReaction === 'dislike';

  return (
    <div
      className={`inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden text-xs font-semibold select-none shadow-sm ${className}`}
    >
      {/* Like Button */}
      <button
        type="button"
        onClick={() => handleReactionClick('like')}
        title="I like this"
        className={`flex items-center gap-1.5 transition hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
          compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
        } ${isLiked ? 'text-[#FF0033]' : 'text-[#0f0f0f] dark:text-[#f1f1f1]'}`}
      >
        <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-[#FF0033]' : ''}`} />
        <span>{formatViews(likesCount)}</span>
      </button>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-neutral-300 dark:bg-neutral-700" />

      {/* Dislike Button */}
      <button
        type="button"
        onClick={() => handleReactionClick('dislike')}
        title="I dislike this"
        className={`flex items-center gap-1.5 transition hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
          compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
        } ${isDisliked ? 'text-neutral-900 dark:text-white' : 'text-[#0f0f0f] dark:text-[#f1f1f1]'}`}
      >
        <ThumbsDown
          className={`w-4 h-4 ${isDisliked ? 'fill-neutral-900 dark:fill-white' : ''}`}
        />
        {dislikesCount > 0 && <span className="text-[11px]">{formatViews(dislikesCount)}</span>}
      </button>
    </div>
  );
};

export default LikeDislikeButtons;
