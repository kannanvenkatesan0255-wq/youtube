/**
 * Individual Comment Item with Nested Replies & Reactions
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  CheckCircle2
} from 'lucide-react';
import Avatar from '../common/Avatar';
import CommentInput from './CommentInput';
import { commentService } from '../../services/commentService';
import { formatTimeAgo, formatViews } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const CommentItem = ({
  comment,
  onCommentUpdated,
  onCommentDeleted,
  isReply = false
}) => {
  const { user, isAuthenticated } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Reaction State
  const [userReaction, setUserReaction] = useState(comment.userReaction || null);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [dislikesCount, setDislikesCount] = useState(comment.dislikesCount || 0);

  // Author identity
  const authorName = comment.user?.name || comment.channel?.name || 'VidTube Viewer';
  const authorAvatar = comment.user?.avatar || comment.channel?.avatar;
  const isAuthor = user && (user._id === comment.user?._id || user.id === comment.user?._id || user._id === comment.user);

  // Handle Comment Reaction (Like / Dislike)
  const handleReaction = async (reactionType) => {
    if (!isAuthenticated) return;

    const prevReaction = userReaction;
    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;

    let nextReaction = null;
    let nextLikes = prevLikes;
    let nextDislikes = prevDislikes;

    if (prevReaction === reactionType) {
      nextReaction = null;
      if (reactionType === 'like') nextLikes = Math.max(0, nextLikes - 1);
      if (reactionType === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1);
    } else {
      nextReaction = reactionType;
      if (reactionType === 'like') {
        nextLikes += 1;
        if (prevReaction === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1);
      } else {
        nextDislikes += 1;
        if (prevReaction === 'like') nextLikes = Math.max(0, nextLikes - 1);
      }
    }

    setUserReaction(nextReaction);
    setLikesCount(nextLikes);
    setDislikesCount(nextDislikes);

    try {
      const res = await commentService.reactToComment(comment._id, reactionType);
      if (res.data?.data) {
        setUserReaction(res.data.data.userReaction);
        setLikesCount(res.data.data.likesCount);
        setDislikesCount(res.data.data.dislikesCount);
      }
    } catch {
      setUserReaction(prevReaction);
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
    }
  };

  // Load Nested Replies
  const handleToggleReplies = async () => {
    if (!showReplies && !repliesLoaded) {
      try {
        setIsLoadingReplies(true);
        const res = await commentService.getReplies(comment._id);
        setReplies(res.data?.data?.replies || []);
        setRepliesLoaded(true);
      } catch (err) {
        console.error('Failed to load replies:', err);
      } finally {
        setIsLoadingReplies(false);
      }
    }
    setShowReplies((prev) => !prev);
  };

  // Submit a reply
  const handleAddReply = async (text) => {
    const res = await commentService.replyToComment(comment._id, text);
    const newReply = res.data?.data;
    if (newReply) {
      setReplies((prev) => [...prev, newReply]);
      setShowReplies(true);
      setShowReplyInput(false);
      setRepliesLoaded(true);
      if (onCommentUpdated) {
        onCommentUpdated({
          ...comment,
          repliesCount: (comment.repliesCount || 0) + 1
        });
      }
    }
  };

  // Submit Edit
  const handleSaveEdit = async (newText) => {
    const res = await commentService.updateComment(comment._id, newText);
    const updated = res.data?.data;
    if (updated) {
      setIsEditing(false);
      if (onCommentUpdated) {
        onCommentUpdated(updated);
      }
    }
  };

  // Delete Comment
  const handleDeleteComment = async () => {
    if (!window.confirm('Delete this comment permanently?')) return;
    try {
      await commentService.deleteComment(comment._id);
      if (onCommentDeleted) {
        onCommentDeleted(comment._id);
      }
    } catch (err) {
      alert('Failed to delete comment: ' + err.message);
    }
  };

  return (
    <div className={`group flex gap-3 text-xs sm:text-sm ${isReply ? 'mt-3 pl-2 sm:pl-4 border-l-2 border-neutral-200 dark:border-neutral-800' : ''}`}>
      <Avatar
        src={authorAvatar}
        name={authorName}
        size={isReply ? 'xs' : 'sm'}
        className="mt-0.5 flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        {/* Comment Header: Author Name, Verified Badge, Time, Edited */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] truncate">
              {authorName}
            </span>
            {comment.channel?.isVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500 fill-neutral-500 text-white" />
            )}
            <span className="text-[11px] text-neutral-500">
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-[10px] text-neutral-400 font-medium">
                (edited)
              </span>
            )}
          </div>

          {/* Action Menu (Author or Admin) */}
          {(isAuthor || user?.role === 'admin') && !isEditing && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-6 z-20 w-28 bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg py-1 text-xs text-[#0f0f0f] dark:text-[#f1f1f1]">
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleDeleteComment();
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content / Inline Edit Field */}
        {isEditing ? (
          <div className="mt-2">
            <CommentInput
              initialText={comment.content}
              onSubmit={handleSaveEdit}
              buttonLabel="Save"
              onCancel={() => setIsEditing(false)}
              autoFocus
              isReply
            />
          </div>
        ) : (
          <p className="mt-1 text-[#0f0f0f] dark:text-[#e0e0e0] leading-relaxed whitespace-pre-line text-xs sm:text-sm">
            {comment.content}
          </p>
        )}

        {/* Comment Action Bar: Likes, Dislikes, Reply Button */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            {/* Like Button */}
            <button
              type="button"
              onClick={() => handleReaction('like')}
              title="Like comment"
              className={`flex items-center gap-1 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${
                userReaction === 'like' ? 'text-[#FF0033]' : ''
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === 'like' ? 'fill-[#FF0033]' : ''}`} />
              {likesCount > 0 && <span className="text-[11px] font-semibold">{formatViews(likesCount)}</span>}
            </button>

            {/* Dislike Button */}
            <button
              type="button"
              onClick={() => handleReaction('dislike')}
              title="Dislike comment"
              className={`p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${
                userReaction === 'dislike' ? 'text-black dark:text-white' : ''
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === 'dislike' ? 'fill-black dark:fill-white' : ''}`} />
            </button>

            {/* Reply Button (Only on top-level comments) */}
            {!isReply && (
              <button
                type="button"
                onClick={() => setShowReplyInput((prev) => !prev)}
                className="px-2 py-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-[11px] transition"
              >
                Reply
              </button>
            )}
          </div>
        )}

        {/* Inline Reply Input */}
        {showReplyInput && !isReply && (
          <div className="mt-3">
            <CommentInput
              onSubmit={handleAddReply}
              placeholder={`Reply to ${authorName}...`}
              buttonLabel="Reply"
              onCancel={() => setShowReplyInput(false)}
              autoFocus
              isReply
            />
          </div>
        )}

        {/* View Replies Toggle Button */}
        {!isReply && (comment.repliesCount > 0 || replies.length > 0) && (
          <div className="mt-2">
            <button
              type="button"
              onClick={handleToggleReplies}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold transition"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide {replies.length || comment.repliesCount} replies</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>
                    View {replies.length || comment.repliesCount}{' '}
                    {(replies.length || comment.repliesCount) === 1 ? 'reply' : 'replies'}
                  </span>
                </>
              )}
            </button>

            {/* Replies List */}
            {showReplies && (
              <div className="mt-1 space-y-2">
                {isLoadingReplies ? (
                  <div className="py-2 pl-4 text-xs text-neutral-400 animate-pulse">
                    Loading replies...
                  </div>
                ) : (
                  replies.map((reply) => (
                    <CommentItem
                      key={reply._id}
                      comment={reply}
                      isReply={true}
                      onCommentUpdated={(updated) => {
                        setReplies(replies.map((r) => (r._id === updated._id ? updated : r)));
                      }}
                      onCommentDeleted={(deletedId) => {
                        setReplies(replies.filter((r) => r._id !== deletedId));
                        if (onCommentUpdated) {
                          onCommentUpdated({
                            ...comment,
                            repliesCount: Math.max(0, (comment.repliesCount || 1) - 1)
                          });
                        }
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
