/**
 * VidTube Admin Dashboard Page
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  Users,
  Tv,
  Film,
  Smartphone,
  MessageSquare,
  Eye,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle,
  FileText,
  AlertOctagon
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await adminService.getDashboard();
      setData(res?.data || null);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
      setError('Failed to fetch administrator statistics. Please verify backend connectivity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-xs text-gray-500">Loading system metrics and telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        <button
          onClick={() => fetchDashboard(true)}
          className="px-4 py-2 text-xs bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, recentUsers, recentVideos, recentAudits, pendingReportsList } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Control Center & Moderation
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time platform telemetry, safety operations, and system administration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/moderation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Review Queue ({metrics?.pendingReports || 0})</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Users
            </p>
            <h3 className="text-2xl font-bold mt-1">{metrics?.totalUsers?.toLocaleString() || 0}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Registered accounts</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Channels */}
        <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Channels
            </p>
            <h3 className="text-2xl font-bold mt-1">{metrics?.totalChannels?.toLocaleString() || 0}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Active creator hubs</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
            <Tv className="w-5 h-5" />
          </div>
        </div>

        {/* Videos & Shorts */}
        <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Uploaded Media
            </p>
            <h3 className="text-2xl font-bold mt-1">
              {((metrics?.totalVideos || 0) + (metrics?.totalShorts || 0)).toLocaleString()}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {metrics?.totalVideos || 0} vids &bull; {metrics?.totalShorts || 0} shorts
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Film className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Reports */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
          (metrics?.pendingReports || 0) > 0
            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
            : 'bg-white dark:bg-[#1e1e1e] border-gray-200/80 dark:border-gray-800'
        }`}>
          <div>
            <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Pending Reports
            </p>
            <h3 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {metrics?.pendingReports || 0}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Needs moderation review</p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Secondary Row: Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
          <span className="text-gray-400">Total Views</span>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {metrics?.totalViews?.toLocaleString() || 0}
          </p>
        </div>
        <div className="p-3.5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
          <span className="text-gray-400">Comments Posted</span>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {metrics?.totalComments?.toLocaleString() || 0}
          </p>
        </div>
        <div className="p-3.5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
          <span className="text-gray-400">Suspended Users</span>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {metrics?.suspendedUsers?.toLocaleString() || 0}
          </p>
        </div>
        <div className="p-3.5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
          <span className="text-gray-400">Removed Content</span>
          <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">
            {((metrics?.removedVideos || 0) + (metrics?.removedShorts || 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Sections: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reports Queue Preview */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-sm">Priority Moderation Queue</h3>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {(!pendingReportsList || pendingReportsList.length === 0) ? (
            <div className="py-8 text-center text-xs text-gray-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p>Queue is clean! No pending content reports.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pendingReportsList.slice(0, 5).map((rep) => (
                <div key={rep._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                        {rep.contentType}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                        {rep.reason?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 truncate mt-1">
                      Reported by @{rep.reporter?.username || 'user'} &bull; {new Date(rep.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/admin/reports`}
                    className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 rounded-lg text-xs font-medium transition shrink-0"
                  >
                    Investigate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Admin Audit Activity */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-sm">Recent Audit Log Activity</h3>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Full Trail</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {(!recentAudits || recentAudits.length === 0) ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No recent administrative actions recorded.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentAudits.slice(0, 5).map((log) => (
                <div key={log._id} className="py-2.5 text-xs flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                      <span className="text-gray-500">@{log.admin?.username || 'system'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-neutral-800">
                        {log.action}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-gray-500 dark:text-gray-400 truncate mt-0.5 text-[11px]">
                        "{log.reason}"
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Third Row: Recent Users & Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Recent Signups</h3>
            <Link
              to="/admin/users"
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <span>Directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentUsers?.map((u) => (
              <div key={u._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-gray-700 dark:text-gray-300 shrink-0">
                    {u.name?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.name}</p>
                    <p className="text-gray-400 text-[11px] truncate">@{u.username} &bull; {u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.accountStatus === 'active'
                      ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                  }`}>
                    {u.accountStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Recent Media Uploads</h3>
            <Link
              to="/admin/videos"
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Content</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentVideos?.map((v) => (
              <div key={v._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{v.title}</p>
                  <p className="text-gray-400 text-[11px] truncate">
                    Channel: {v.channel?.name || 'Channel'} &bull; {v.views || 0} views
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                  v.moderationStatus === 'removed'
                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                    : v.moderationStatus === 'restricted'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                }`}>
                  {v.moderationStatus || 'clean'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
