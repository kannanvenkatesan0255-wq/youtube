import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, ThumbsUp, Trash2, Reply, MessageSquare, Loader2, ArrowUpDown } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import commentService from '../../services/commentService';
import engagementService from '../../services/engagementService';
import socketService from '../../services/socketService';
import { formatTimeAgo, formatViews } from '../../utils/formatters';

export const ShortsCommentsDrawer = ({
  isOpen = false,
  onClose,
  shortId,
  commentsCount = 0,
  shortTitle = 'Short'
}) => {
  const { user, isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(commentsCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({}); // { [commentId]: repliesArray }
  const [loadingReplies, setLoadingReplies] = useState({});

  // Sync count from props
  useEffect(() => {
    if (commentsCount !== undefined && commentsCount !== null) {
      setTotalCount(commentsCount);
    }
  }, [commentsCount]);

  // Fetch comments when drawer opens
  const fetchComments = useCallback(async () => {
    if (!shortId || !isOpen) return;
    setLoading(true);
    setError(null);

    try {
      const res = await commentService.getComments('Short', shortId, { page: 1, limit: 30 });
      const items = res?.data?.comments || [];
      const pagination = res?.data?.pagination;
      setComments(items);
      if (pagination?.total !== undefined) {
        setTotalCount(pagination.total);
      }
    } catch (err) {
      console.error('Failed to load Short comments:', err);
      setError('Could not load comments.');
    } finally {
      setLoading(false);
    }
  }, [shortId, isOpen]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time socket room
  useEffect(() => {
    if (!shortId || !isOpen) return;

    socketService.joinContentRoom('Short', shortId);

    const handleLiveComment = (newComment) => {
      if (newComment && !newComment.parentComment) {
        setComments((prev) => {
          if (prev.some((c) => c._id === newComment._id)) return prev;
          return [newComment, ...prev];
        });
        setTotalCount((c) => c + 1);
      }
    };

    socketService.onCommentAdded(handleLiveComment);

    return () => {
      socketService.leaveContentRoom('Short', shortId);
      socketService.offCommentAdded();
    };
  }, [shortId, isOpen]);

  // Post new top-level comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    if (!isAuthenticated) {
      alert('Please sign in to leave a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await commentService.createComment('Short', shortId, newCommentText.trim());
      const created = res?.data?.comment;
      if (created) {
        setComments((prev) => [created, ...prev]);
        setTotalCount((c) => c + 1);
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reply to comment
  const handleSendReply = async (parentCommentId) => {
    if (!replyText.trim() || submittingReply) return;

    if (!isAuthenticated) {
      alert('Please sign in to reply');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await commentService.replyToComment(parentCommentId, replyText.trim());
      const newReply = res?.data?.comment;
      if (newReply) {
        setExpandedReplies((prev) => ({
          ...prev,
          [parentCommentId]: [...(prev[parentCommentId] || []), newReply],
        }));
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentCommentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c
          )
        );
        setTotalCount((c) => c + 1);
        setReplyingToId(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
      alert('Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Toggle load replies
  const handleToggleReplies = async (commentId) => {
    if (expandedReplies[commentId]) {
      // Collapse
      const next = { ...expandedReplies };
      delete next[commentId];
      setExpandedReplies(next);
      return;
    }

    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await commentService.getCommentReplies(commentId, { page: 1, limit: 20 });
      setExpandedReplies((prev) => ({
        ...prev,
        [commentId]: res?.data?.replies || [],
      }));
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // React to a comment
  const handleCommentLike = async (comment) => {
    if (!isAuthenticated) {
      alert('Please sign in to like this comment');
      return;
    }

    try {
      if (comment.userReaction === 'like') {
        const res = await engagementService.removeReaction('Comment', comment._id);
        updateLocalCommentReaction(comment._id, null, res?.data?.likesCount);
      } else {
        const res = await engagementService.setReaction('Comment', comment._id, 'like');
        updateLocalCommentReaction(comment._id, 'like', res?.data?.likesCount);
      }
    } catch (err) {
      console.error('Failed to react to comment:', err);
    }
  };

  const updateLocalCommentReaction = (commentId, reaction, likesCount) => {
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? {
              ...c,
              userReaction: reaction,
              likesCount: likesCount !== undefined ? likesCount : c.likesCount,
            }
          : c
      )
    );
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentService.deleteComment(commentId);
      const deleted = comments.find((c) => c._id === commentId);
      const decrementAmount = 1 + (deleted?.repliesCount || 0);

      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setTotalCount((c) => Math.max(0, c - decrementAmount));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Could not delete comment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Semi-transparent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#181818] shadow-2xl flex flex-col text-[#0f0f0f] dark:text-[#f1f1f1] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">Comments</h3>
            <span className="text-xs text-neutral-500 font-medium">
              {Number(totalCount || 0).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comments"
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Scrollable Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF0033]" />
              <span className="text-xs">Loading comments...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive text-sm">
              <p>{error}</p>
              <button
                onClick={fetchComments}
                className="mt-2 text-xs font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                No comments yet
              </p>
              <p className="text-xs">Be the first to comment on this Short!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const commentAuthor = comment.user || {};
              const isOwner = user && (user._id === commentAuthor._id || user.id === commentAuthor._id);
              const replies = expandedReplies[comment._id];
              const isLoadingReplies = loadingReplies[comment._id];

              return (
                <div key={comment._id} className="group flex items-start gap-3 text-xs sm:text-sm">
                  <Avatar
                    src={commentAuthor.avatar}
                    name={commentAuthor.name || commentAuthor.username || 'User'}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-[#0f0f0f] dark:text-[#f1f1f1]">
                          {commentAuthor.name || commentAuthor.username || 'VidTuber'}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                        {comment.isEdited && (
                          <span className="text-[10px] text-neutral-400">(edited)</span>
                        )}
                      </div>

                      {/* Delete comment if owner */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment._id)}
                          aria-label="Delete comment"
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-destructive transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-neutral-800 dark:text-neutral-200 leading-snug whitespace-pre-wrap">
                      {comment.text}
                    </p>

                    {/* Actions: Like, Reply */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <button
                        type="button"
                        onClick={() => handleCommentLike(comment)}
                        className={`flex items-center gap-1 transition ${
                          comment.userReaction === 'like'
                            ? 'text-[#FF0033]'
                            : 'hover:text-[#FF0033]'
                        }`}
                      >
                        <ThumbsUp
                          className={`w-3.5 h-3.5 ${
                            comment.userReaction === 'like' ? 'fill-[#FF0033]' : ''
                          }`}
                        />
                        <span className="text-[11px]">
                          {comment.likesCount > 0 ? formatViews(comment.likesCount) : ''}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(replyingToId === comment._id ? null : comment._id);
                          setReplyText('');
                        }}
                        className="text-[11px] font-semibold hover:underline"
                      >
                        Reply
                      </button>

                      {/* View replies toggle */}
                      {comment.repliesCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleToggleReplies(comment._id)}
                          className="text-[11px] font-semibold text-primary hover:underline ml-auto"
                        >
                          {replies
                            ? 'Hide replies'
                            : `View ${comment.repliesCount} ${
                                comment.repliesCount === 1 ? 'reply' : 'replies'
                              }`}
                        </button>
                      )}
                    </div>

                    {/* Inline Reply Input */}
                    {replyingToId === comment._id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${commentAuthor.name || 'comment'}...`}
                          className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-xs px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-[#FF0033]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(comment._id)}
                          disabled={!replyText.trim() || submittingReply}
                          className="px-3 py-1.5 rounded-full bg-[#FF0033] text-white text-xs font-semibold disabled:opacity-40"
                        >
                          {submittingReply ? 'Sending...' : 'Reply'}
                        </button>
                      </div>
                    )}

                    {/* Loaded Replies List */}
                    {isLoadingReplies && (
                      <div className="mt-2 text-xs text-neutral-400">Loading replies...</div>
                    )}
                    {replies && replies.length > 0 && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-neutral-200 dark:border-neutral-800">
                        {replies.map((r) => {
                          const rAuthor = r.user || {};
                          return (
                            <div key={r._id} className="flex items-start gap-2 text-xs">
                              <Avatar
                                src={rAuthor.avatar}
                                name={rAuthor.name || 'User'}
                                size="xs"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[11px]">
                                    {rAuthor.name || 'VidTuber'}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    {formatTimeAgo(r.createdAt)}
                                  </span>
                                </div>
                                <p className="text-neutral-700 dark:text-neutral-300">{r.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input Footer */}
        <form
          onSubmit={handleAddComment}
          className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5 bg-neutral-50 dark:bg-[#121212]"
        >
          <Avatar src={user?.avatar} name={user?.name || 'You'} size="sm" />
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment..."
            disabled={isSubmitting}
            className="flex-1 bg-neutral-200/80 dark:bg-neutral-800 text-xs sm:text-sm px-3.5 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-[#FF0033] text-[#0f0f0f] dark:text-white disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="p-2 rounded-full bg-[#FF0033] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d9002c] transition flex-shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShortsCommentsDrawer;
