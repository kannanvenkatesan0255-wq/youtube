import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ArrowUpDown, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import commentService from '../../services/commentService';
import socketService from '../../services/socketService';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

/**
 * VidTube CommentSection
 * Handles top-level comments, sorting (top vs newest), pagination, and real-time updates.
 */
export default function CommentSection({
  contentType = 'Video',
  contentId,
  commentsCount = 0,
}) {
  const { user, isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(commentsCount);
  const [sort, setSort] = useState('newest'); // 'newest' | 'top'
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [error, setError] = useState(null);

  // Sync initial comments count from prop if updated
  useEffect(() => {
    if (commentsCount !== undefined && commentsCount !== null) {
      setTotalComments(commentsCount);
    }
  }, [commentsCount]);

  // Fetch comments
  const fetchComments = useCallback(
    async (pageNum = 1, append = false, currentSort = sort) => {
      if (!contentId) return;
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const res = await commentService.getComments(contentType, contentId, {
          page: pageNum,
          limit: 20,
          sort: currentSort,
        });

        const newItems = res?.data?.comments || [];
        const pagination = res?.data?.pagination || {};

        setComments((prev) => (append ? [...prev, ...newItems] : newItems));
        setPage(pagination.page || pageNum);
        setHasMore((pagination.page || pageNum) < (pagination.pages || 1));
        if (pagination.total !== undefined) {
          setTotalComments(pagination.total);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
        setError('Failed to load comments. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [contentType, contentId, sort]
  );

  // Initial fetch and sort change
  useEffect(() => {
    fetchComments(1, false, sort);
  }, [fetchComments, sort]);

  // Real-time socket room subscription
  useEffect(() => {
    if (!contentId) return;

    // Join room
    socketService.joinContentRoom(contentType, contentId);

    // Listen for live comments added
    const handleLiveComment = (newComment) => {
      if (newComment && (!newComment.parentComment)) {
        // Prepend if not already present
        setComments((prev) => {
          if (prev.some((c) => c._id === newComment._id)) return prev;
          return [newComment, ...prev];
        });
        setTotalComments((prev) => prev + 1);
      }
    };

    socketService.onCommentAdded(handleLiveComment);

    return () => {
      socketService.leaveContentRoom(contentType, contentId);
      socketService.offCommentAdded();
    };
  }, [contentType, contentId]);

  // Handle new top-level comment submit
  const handleCreateComment = async (text) => {
    try {
      const res = await commentService.createComment(contentType, contentId, text);
      const created = res?.data?.comment;
      if (created) {
        setComments((prev) => [created, ...prev]);
        setTotalComments((prev) => prev + 1);
      }
      return created;
    } catch (err) {
      console.error('Failed to post comment:', err);
      throw err;
    }
  };

  // Handle comment delete (cascade count decrement)
  const handleDeleteComment = (commentId) => {
    const deleted = comments.find((c) => c._id === commentId);
    const countToDecrement = 1 + (deleted?.repliesCount || 0);

    setComments((prev) => prev.filter((c) => c._id !== commentId));
    setTotalComments((prev) => Math.max(0, prev - countToDecrement));
  };

  // Handle comment update
  const handleUpdateComment = (updatedComment) => {
    setComments((prev) =>
      prev.map((c) => (c._id === updatedComment._id ? { ...c, ...updatedComment } : c))
    );
  };

  // Handle sort select
  const handleSortChange = (newSort) => {
    if (sort === newSort) {
      setIsSortOpen(false);
      return;
    }
    setSort(newSort);
    setIsSortOpen(false);
  };

  return (
    <div className="w-full mt-6 pt-6 border-t border-border/40">
      {/* Header: Total Comments & Sort By */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-foreground">
            {Number(totalComments || 0).toLocaleString()} Comments
          </h2>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 py-1 px-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>{sort === 'top' ? 'Top comments' : 'Newest first'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {isSortOpen && (
              <div className="absolute left-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => handleSortChange('top')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    sort === 'top' ? 'font-semibold text-primary' : 'text-foreground'
                  }`}
                >
                  Top comments
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange('newest')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    sort === 'newest' ? 'font-semibold text-primary' : 'text-foreground'
                  }`}
                >
                  Newest first
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Comment Input */}
      <div className="mb-8">
        <CommentInput
          onSubmit={handleCreateComment}
          placeholder="Add a comment..."
          autoFocus={false}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchComments(1, false, sort)}
            className="font-medium underline hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/6" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/50 bg-muted/20">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-foreground mb-1">No comments yet</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to share what you think!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              contentType={contentType}
              contentId={contentId}
              onDelete={handleDeleteComment}
              onUpdate={handleUpdateComment}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => fetchComments(page + 1, true, sort)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:bg-muted text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span>Loading more comments...</span>
                  </>
                ) : (
                  <span>Load more comments</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
