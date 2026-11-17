/**
 * VidTube Admin Platform Analytics & Growth Telemetry
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  BarChart2,
  TrendingUp,
  Users,
  Film,
  Smartphone,
  Flag,
  Calendar,
  Eye
} from 'lucide-react';

export const AdminAnalyticsPage = () => {
  const [period, setPeriod] = useState('28d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getPlatformAnalytics({ period });
      setData(res?.data || null);
    } catch (err) {
      console.error('Failed to fetch platform analytics', err);
      setError('Failed to fetch platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const timeline = data?.timeline || [];

  // Find max values for simple inline visual scaling
  const maxSignups = Math.max(...timeline.map((t) => t.newUsers || 0), 1);
  const maxVideos = Math.max(...timeline.map((t) => t.newVideos || 0), 1);
  const maxReports = Math.max(...timeline.map((t) => t.reports || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Analytics & Growth</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Macro-level registration curves, media publishing velocity, and platform health telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['7d', '28d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                period === p
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              Last {p === '7d' ? '7 Days' : p === '28d' ? '28 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-gray-400">Aggregating telemetry from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-2xl text-center text-xs">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">New Signups ({period})</span>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                {timeline.reduce((acc, t) => acc + (t.newUsers || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">New Videos ({period})</span>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {timeline.reduce((acc, t) => acc + (t.newVideos || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">New Shorts ({period})</span>
              <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                {timeline.reduce((acc, t) => acc + (t.newShorts || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">User Reports ({period})</span>
              <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {timeline.reduce((acc, t) => acc + (t.reports || 0), 0).toLocaleString()}
              </h3>
            </div>
          </div>

          {/* Timeline Table / Visualization */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm">Growth & Publishing Velocity Timeline</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">New Accounts</th>
                    <th className="px-4 py-3">New Videos</th>
                    <th className="px-4 py-3">New Shorts</th>
                    <th className="px-4 py-3">Reports Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {timeline.slice(-14).reverse().map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        {day.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8">{day.newUsers}</span>
                          <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.max((day.newUsers / maxSignups) * 100, 4)}px` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8">{day.newVideos}</span>
                          <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${Math.max((day.newVideos / maxVideos) * 100, 4)}px` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{day.newShorts}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          day.reports > 0 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400' : 'text-gray-400'
                        }`}>
                          {day.reports}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
