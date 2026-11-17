/**
 * VidTube Admin Comments Moderation & Safety
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminCommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Moderation Modal
  const [modalComment, setModalComment] = useState(null);
  const [modAction, setModAction] = useState('removed');
  const [modReason, setModReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComments = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getComments({
        page,
        limit: 15,
        q: search.trim() || undefined,
        moderationStatus: statusFilter || undefined
      });
      setComments(res?.data?.comments || []);
      setPagination(res?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch comments', err);
      setError('Failed to fetch comments directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComments(1);
  };

  const handleModerationSubmit = async (e) => {
    e.preventDefault();
    if (!modalComment) return;
    setActionLoading(true);

    try {
      await adminService.moderateComment(modalComment._id, {
        action: modAction,
        reason: modReason.trim()
      });
      setModalComment(null);
      setModReason('');
      fetchComments(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to moderate comment');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comments Moderation</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Filter toxic discussion, spam, slurs, and abusive replies across all videos and shorts
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Comments: <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search comment content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-red-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="clean">Clean</option>
          <option value="flagged">Flagged</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {/* Comments List */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-3 text-xs text-gray-400">Loading comments...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500">{error}</div>
        ) : comments.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No comments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Author</th>
                  <th className="px-5 py-3.5">Comment</th>
                  <th className="px-5 py-3.5">Target Content</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {comments.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                          {c.author?.name?.[0] || 'U'}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                          {c.author?.name || 'User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <p className="text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed">
                        {c.text}
                      </p>
                      {c.moderationReason && (
                        <p className="text-[10px] text-red-500 italic mt-0.5">
                          Reason: {c.moderationReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">
                      {c.video?.title ? (
                        <Link to={`/watch/${c.video._id}`} target="_blank" className="hover:underline flex items-center gap-1">
                          <span className="truncate">{c.video.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      ) : c.short?.title ? (
                        <Link to={`/shorts/${c.short._id}`} target="_blank" className="hover:underline flex items-center gap-1">
                          <span className="truncate">{c.short.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="italic">Direct</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.moderationStatus === 'removed'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                          : c.moderationStatus === 'flagged'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                      }`}>
                        {c.moderationStatus || 'clean'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setModalComment(c);
                          setModAction(c.moderationStatus === 'removed' ? 'clean' : 'removed');
                          setModReason('');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition"
                      >
                        {c.moderationStatus === 'removed' ? 'Restore' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchComments(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchComments(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {modalComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Moderate Comment</h3>
              <button onClick={() => setModalComment(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl text-xs text-gray-700 dark:text-gray-300 italic border border-gray-100 dark:border-gray-800">
              "{modalComment.text}"
            </div>

            <form onSubmit={handleModerationSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Action</label>
                <select
                  value={modAction}
                  onChange={(e) => setModAction(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="removed">Remove Comment</option>
                  <option value="flagged">Flag Comment (Under Review)</option>
                  <option value="clean">Restore Clean</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Reason
                </label>
                <textarea
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  rows={2}
                  required={modAction !== 'clean'}
                  placeholder="Spam, harassment, hate speech..."
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalComment(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Apply Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommentsPage;
