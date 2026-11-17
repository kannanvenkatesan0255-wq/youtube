/**
 * VidTube Admin User Reports & Safety Tickets
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  Flag,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');

  // Resolution Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionAction, setResolutionAction] = useState('content_removed');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getReports({
        page,
        limit: 12,
        status: statusFilter || undefined,
        contentType: contentTypeFilter || undefined
      });
      setReports(res?.data?.reports || []);
      setPagination(res?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch reports', err);
      setError('Failed to fetch user reports queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [statusFilter, contentTypeFilter]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSubmitting(true);

    try {
      await adminService.resolveReport(selectedReport._id, {
        status: resolutionStatus,
        action: resolutionAction,
        notes: resolutionNotes.trim()
      });
      setSelectedReport(null);
      setResolutionNotes('');
      fetchReports(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update report');
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetTitle = (rep) => {
    if (rep.video?.title) return rep.video.title;
    if (rep.short?.title) return rep.short.title;
    if (rep.comment?.text) return `Comment: "${rep.comment.text.slice(0, 40)}..."`;
    if (rep.channel?.name) return `Channel: ${rep.channel.name}`;
    if (rep.reportedUser?.name) return `User: @${rep.reportedUser.username}`;
    return 'Content Target';
  };

  const getTargetLink = (rep) => {
    if (rep.video?._id) return `/watch/${rep.video._id}`;
    if (rep.short?._id) return `/shorts/${rep.short._id}`;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Community Safety Reports</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Process incoming user complaints, enforce community safety, and document resolutions
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Reports: <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={contentTypeFilter}
            onChange={(e) => setContentTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
          >
            <option value="">All Content Types</option>
            <option value="video">Videos</option>
            <option value="short">Shorts</option>
            <option value="comment">Comments</option>
            <option value="channel">Channels</option>
            <option value="user">Users</option>
          </select>
        </div>

        <button
          onClick={() => fetchReports(pagination.page)}
          className="text-xs px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-xl hover:bg-gray-200 transition"
        >
          Refresh Queue
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-3 text-xs text-gray-400">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500">{error}</div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Type & Reason</th>
                  <th className="px-5 py-3.5">Reported Target</th>
                  <th className="px-5 py-3.5">Reporter</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reports.map((r) => {
                  const targetLink = getTargetLink(r);
                  return (
                    <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                            {r.contentType}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {r.reason?.replace('_', ' ')}
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-1 italic">
                            "{r.description}"
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        {targetLink ? (
                          <Link
                            to={targetLink}
                            target="_blank"
                            className="font-medium text-gray-800 dark:text-gray-200 hover:text-red-600 truncate flex items-center gap-1"
                          >
                            <span className="truncate">{getTargetTitle(r)}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300 truncate block">
                            {getTargetTitle(r)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        @{r.reporter?.username || 'user'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'pending'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                            : r.status === 'under_review'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : r.status === 'resolved'
                            ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {r.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedReport(r);
                            setResolutionStatus(r.status === 'pending' ? 'resolved' : r.status);
                            setResolutionAction(r.resolutionAction || 'content_removed');
                            setResolutionNotes(r.resolutionNotes || '');
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                onClick={() => fetchReports(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchReports(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Resolve Report</h3>
              <button onClick={() => setSelectedReport(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl text-xs space-y-1">
              <p><strong className="text-gray-500">Target:</strong> {getTargetTitle(selectedReport)}</p>
              <p><strong className="text-gray-500">Violation:</strong> {selectedReport.reason?.replace('_', ' ')}</p>
              {selectedReport.description && (
                <p><strong className="text-gray-500">Reporter Notes:</strong> "{selectedReport.description}"</p>
              )}
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="resolved">Resolved (Action Taken)</option>
                  <option value="dismissed">Dismissed (No Violation Found)</option>
                  <option value="under_review">Under Review (Escalated)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Resolution Action</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="content_removed">Content Removed</option>
                  <option value="content_restricted">Content Restricted / Age-Gated</option>
                  <option value="user_suspended">User Suspended</option>
                  <option value="warning_issued">Warning Issued to Creator</option>
                  <option value="no_action">No Action (False Report)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Moderator Resolution Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={2}
                  placeholder="Summary of investigation and decision..."
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
