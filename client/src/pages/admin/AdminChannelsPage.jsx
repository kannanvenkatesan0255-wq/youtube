/**
 * VidTube Admin Channels Directory & Status Control
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  Tv,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminChannelsPage = () => {
  const [channels, setChannels] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Status Modal
  const [modalChannel, setModalChannel] = useState(null);
  const [targetStatus, setTargetStatus] = useState('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChannels = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getChannels({
        page,
        limit: 12,
        q: search.trim() || undefined,
        status: statusFilter || undefined
      });
      setChannels(res?.data?.channels || []);
      setPagination(res?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch channels', err);
      setError('Failed to fetch channels directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchChannels(1);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!modalChannel) return;
    setActionLoading(true);

    try {
      await adminService.updateChannelStatus(modalChannel._id, {
        status: targetStatus,
        reason: statusReason.trim()
      });
      setModalChannel(null);
      setStatusReason('');
      fetchChannels(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update channel status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channels Directory</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit creator channels, enforce broadcasting compliance, and moderate channel visibility
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Channels: <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search channel name or handle..."
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
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      {/* Channels Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-3 text-xs text-gray-400">Loading channel records...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500">{error}</div>
        ) : channels.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No channels found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Channel</th>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Subscribers</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {channels.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold uppercase shrink-0">
                            {c.name?.[0] || 'C'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                          <p className="text-gray-400 text-[11px] truncate">{c.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                      {c.owner?.username ? (
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          @{c.owner.username}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'active'
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                          : c.status === 'restricted'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                      }`}>
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                      {c.subscribersCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setModalChannel(c);
                          setTargetStatus(c.status === 'active' ? 'suspended' : 'active');
                          setStatusReason('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                          c.status === 'active'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                            : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-100'
                        }`}
                      >
                        {c.status === 'active' ? 'Suspend' : 'Restore'}
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
                onClick={() => fetchChannels(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchChannels(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Channel Status Modal */}
      {modalChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Channel Status: {modalChannel.name}</h3>
              <button onClick={() => setModalChannel(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Target Channel Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="active">Active (Normal Visibility)</option>
                  <option value="restricted">Restricted (Age-Gated & Limited Reach)</option>
                  <option value="suspended">Suspended (Channel Hidden from Search & Public)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Moderation Rationale (Audit Trail)
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  required={targetStatus !== 'active'}
                  placeholder="Reason for suspension or restriction..."
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalChannel(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update Channel Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChannelsPage;
