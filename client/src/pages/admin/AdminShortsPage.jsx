/**
 * VidTube Admin Shorts Moderation & Management
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  Smartphone,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminShortsPage = () => {
  const [shorts, setShorts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Moderation Modal
  const [modalShort, setModalShort] = useState(null);
  const [modAction, setModAction] = useState('removed');
  const [modReason, setModReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchShorts = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getShorts({
        page,
        limit: 12,
        q: search.trim() || undefined,
        moderationStatus: statusFilter || undefined
      });
      setShorts(res?.data?.shorts || []);
      setPagination(res?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch shorts', err);
      setError('Failed to fetch shorts directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShorts(1);
  };

  const handleModerationSubmit = async (e) => {
    e.preventDefault();
    if (!modalShort) return;
    setActionLoading(true);

    try {
      await adminService.moderateShort(modalShort._id, {
        action: modAction,
        reason: modReason.trim()
      });
      setModalShort(null);
      setModReason('');
      fetchShorts(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to moderate short');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shorts Moderation</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit vertical short-form video feed, check audio copyright, and filter flagged clips
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Shorts: <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search short titles..."
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
          <option value="restricted">Restricted</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {/* Shorts Grid / Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-3 text-xs text-gray-400">Loading shorts catalog...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500">{error}</div>
        ) : shorts.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No shorts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Short</th>
                  <th className="px-5 py-3.5">Channel</th>
                  <th className="px-5 py-3.5">Mod Status</th>
                  <th className="px-5 py-3.5">Views / Likes</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {shorts.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800 shrink-0">
                          {s.thumbnailUrl ? (
                            <img src={s.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Smartphone className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/shorts/${s._id}`}
                            target="_blank"
                            className="font-semibold text-gray-900 dark:text-gray-100 hover:text-red-600 truncate block max-w-xs"
                          >
                            {s.title}
                          </Link>
                          {s.moderationReason && (
                            <p className="text-[11px] text-red-500 mt-0.5 line-clamp-1 italic">
                              Note: {s.moderationReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">
                      {s.channel?.name || 'Channel'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.moderationStatus === 'removed'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                          : s.moderationStatus === 'restricted'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : s.moderationStatus === 'flagged'
                          ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400'
                          : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                      }`}>
                        {s.moderationStatus || 'clean'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                      {(s.views || 0).toLocaleString()} &bull; {(s.likesCount || 0).toLocaleString()} likes
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setModalShort(s);
                          setModAction(s.moderationStatus === 'removed' ? 'clean' : 'removed');
                          setModReason('');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition"
                      >
                        Moderate
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
                onClick={() => fetchShorts(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchShorts(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {modalShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base truncate pr-2">Moderate Short: {modalShort.title}</h3>
              <button onClick={() => setModalShort(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleModerationSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Action</label>
                <select
                  value={modAction}
                  onChange={(e) => setModAction(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="removed">Remove (Exclude from Vertical Feed)</option>
                  <option value="restricted">Restrict (Suppress Recommendations)</option>
                  <option value="clean">Restore / Clean</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Moderator Reason
                </label>
                <textarea
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  rows={3}
                  required={modAction !== 'clean'}
                  placeholder="Specify violation rationale..."
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalShort(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {actionLoading ? 'Applying...' : 'Apply Enforcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShortsPage;
