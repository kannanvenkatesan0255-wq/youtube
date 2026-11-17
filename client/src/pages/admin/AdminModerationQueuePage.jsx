/**
 * VidTube Admin Moderation Queue Page
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  AlertOctagon,
  CheckCircle,
  Flag,
  Film,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminModerationQueuePage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fast resolution modal
  const [activeReport, setActiveReport] = useState(null);
  const [resAction, setResAction] = useState('content_removed');
  const [resNotes, setResNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getReports({
        status: 'pending',
        limit: 20
      });
      setReports(res?.data?.reports || []);
    } catch (err) {
      console.error('Failed to fetch moderation queue', err);
      setError('Failed to load pending queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!activeReport) return;
    setSubmitting(true);

    try {
      await adminService.resolveReport(activeReport._id, {
        status: 'resolved',
        action: resAction,
        notes: resNotes.trim() || 'Resolved via Moderation Queue'
      });
      setActiveReport(null);
      setResNotes('');
      fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to resolve item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async (rep) => {
    if (!window.confirm('Dismiss this report as false or invalid?')) return;
    try {
      await adminService.resolveReport(rep._id, {
        status: 'dismissed',
        action: 'no_action',
        notes: 'Dismissed by moderator as unsubstantiated.'
      });
      fetchQueue();
    } catch (err) {
      alert('Failed to dismiss');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Moderation Queue</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Priority safety triage queue for content flagged by users or automated detectors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs">
            {reports.length} Urgent Items
          </span>
          <button
            onClick={fetchQueue}
            className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-xl text-xs font-medium hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-gray-400">Loading priority queue...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-2xl text-center text-xs">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base">All Caught Up!</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            There are currently zero pending reports waiting in the moderation triage queue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => {
            const title =
              rep.video?.title ||
              rep.short?.title ||
              rep.comment?.text ||
              rep.channel?.name ||
              rep.reportedUser?.name ||
              'Flagged Resource';
            const link = rep.video?._id ? `/watch/${rep.video._id}` : rep.short?._id ? `/shorts/${rep.short._id}` : null;

            return (
              <div
                key={rep._id}
                className="p-5 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-red-300 dark:hover:border-red-900/50"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                      {rep.contentType}
                    </span>
                    <span className="font-semibold text-xs text-red-600 dark:text-red-400 capitalize">
                      {rep.reason?.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      &bull; Reported by @{rep.reporter?.username || 'user'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate max-w-lg">
                      {title}
                    </h4>
                    {link && (
                      <Link to={link} target="_blank" className="text-gray-400 hover:text-red-600" title="Open preview">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  {rep.description && (
                    <p className="text-xs text-gray-500 italic bg-gray-50 dark:bg-neutral-900 p-2 rounded-lg">
                      "{rep.description}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleDismiss(rep)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setActiveReport(rep);
                      setResAction('content_removed');
                      setResNotes('');
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition"
                  >
                    Take Action
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Enforce Moderation Action</h3>
              <button onClick={() => setActiveReport(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Action to Apply</label>
                <select
                  value={resAction}
                  onChange={(e) => setResAction(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="content_removed">Remove Content (Unpublish Immediately)</option>
                  <option value="content_restricted">Restrict Content (Age-Gate & De-rank)</option>
                  <option value="user_suspended">Suspend User Account</option>
                  <option value="warning_issued">Issue Formal Content Warning</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Moderator Notes (Logged into Audit Trail)
                </label>
                <textarea
                  value={resNotes}
                  onChange={(e) => setResNotes(e.target.value)}
                  rows={3}
                  placeholder="Policy violation summary..."
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Enforce & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModerationQueuePage;
