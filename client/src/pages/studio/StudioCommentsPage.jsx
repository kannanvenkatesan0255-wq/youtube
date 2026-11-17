/**
 * Studio Comments Management Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import studioService from '../../services/studioService';
import { commentService } from '../../services/commentService';

export const StudioCommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reply state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [pagination.page]);

  const fetchComments = async (query = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const res = await studioService.getStudioComments({
        page: pagination.page,
        limit: pagination.limit,
        q: query
      });

      if (res.success) {
        setComments(res.data.comments);
        setPagination(res.data.pagination);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComments(searchQuery);
  };

  const handleSendReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      const res = await commentService.replyToComment(commentId, replyText.trim());
      if (res.success) {
        setReplyText('');
        setReplyingToId(null);
        // Increment replies count locally
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c))
        );
      }
    } catch (err) {
      alert(`Reply error: ${err.message}`);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await commentService.deleteComment(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Channel Comments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Review, reply, and moderate comments across all your videos and shorts.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search comment text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#282828] border border-gray-300 dark:border-gray-700 text-sm rounded-lg py-2 pl-9 pr-4 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-sm"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>
      </div>

      {/* Comments List */}
      <div className="bg-white dark:bg-[#282828] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : comments.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {comments.map((comment) => (
              <div key={comment._id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {comment.user?.avatar ? (
                      <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.user?.name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {comment.user?.name || 'User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        @{comment.user?.username || 'user'} • {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {comment.text}
                    </p>

                    {/* Content Reference */}
                    <div className="pt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>on {comment.contentType}:</span>
                      <Link
                        to={comment.contentType === 'Short' ? `/shorts/${comment.contentId}` : `/watch/${comment.contentId}`}
                        className="font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 truncate max-w-md"
                      >
                        {comment.contentTitle}
                      </Link>
                    </div>

                    {/* Actions: Reply & Delete */}
                    <div className="flex items-center gap-4 pt-2 text-xs font-semibold">
                      <button
                        onClick={() => {
                          setReplyingToId(replyingToId === comment._id ? null : comment._id);
                          setReplyText('');
                        }}
                        className="text-gray-600 dark:text-gray-400 hover:text-red-600 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>{replyingToId === comment._id ? 'Cancel' : 'Reply'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-400 hover:text-red-600 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>

                    {/* Reply Input Form */}
                    {replyingToId === comment._id && (
                      <div className="pt-3 space-y-2">
                        <textarea
                          rows="2"
                          placeholder="Reply as channel owner..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submittingReply || !replyText.trim()}
                            onClick={() => handleSendReply(comment._id)}
                            className="px-4 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                          >
                            {submittingReply ? 'Sending...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400 text-sm">
            No comments found on your channel.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioCommentsPage;
