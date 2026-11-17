/**
 * VidTube Admin Audit Logs & Security Forensics
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Terminal,
  Info
} from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter || undefined,
        targetType: targetTypeFilter || undefined
      });
      setLogs(res?.data?.logs || []);
      setPagination(res?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
      setError('Failed to fetch platform audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, targetTypeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Audit Trail</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Immutable log of all administrative operations, moderation decisions, and system setting changes
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Logged Events: <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_RESTORED">USER_RESTORED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="VIDEO_REMOVED">VIDEO_REMOVED</option>
            <option value="VIDEO_RESTORED">VIDEO_RESTORED</option>
            <option value="SHORT_MODERATED">SHORT_MODERATED</option>
            <option value="COMMENT_REMOVED">COMMENT_REMOVED</option>
            <option value="REPORT_RESOLVED">REPORT_RESOLVED</option>
            <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
            <option value="ANNOUNCEMENT_CREATED">ANNOUNCEMENT_CREATED</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none"
          >
            <option value="">All Target Types</option>
            <option value="User">User</option>
            <option value="Channel">Channel</option>
            <option value="Video">Video</option>
            <option value="Short">Short</option>
            <option value="Comment">Comment</option>
            <option value="Report">Report</option>
            <option value="PlatformSetting">PlatformSetting</option>
            <option value="Announcement">Announcement</option>
          </select>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="text-xs px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-xl hover:bg-gray-200 transition"
        >
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-3 text-xs text-gray-400">Loading audit records...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No audit log records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Admin</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Target</th>
                  <th className="px-5 py-3.5">Reason / Notes</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr 
                    key={log._id} 
                    className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition cursor-pointer"
                    onClick={() => setSelectedLog(selectedLog?._id === log._id ? null : log)}
                  >
                    <td className="px-5 py-3.5 font-sans font-medium text-gray-900 dark:text-gray-100">
                      @{log.admin?.username || 'system'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 font-sans">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{log.targetType}:</span>{' '}
                      <span className="text-[10px] text-gray-400 font-mono">{log.targetId?.slice(-8) || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5 font-sans max-w-xs truncate text-gray-700 dark:text-gray-300">
                      {log.reason || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-[10px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-[10px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Log Inspector */}
        {selectedLog && (
          <div className="p-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span>Event Metadata Inspector: {selectedLog.action}</span>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">Close</button>
            </div>
            <pre className="p-3 bg-white dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto text-[11px] font-mono text-gray-800 dark:text-gray-200">
              {JSON.stringify({
                id: selectedLog._id,
                action: selectedLog.action,
                admin: selectedLog.admin,
                targetType: selectedLog.targetType,
                targetId: selectedLog.targetId,
                reason: selectedLog.reason,
                metadata: selectedLog.metadata,
                userAgent: selectedLog.userAgent,
                ipAddress: selectedLog.ipAddress,
                timestamp: selectedLog.createdAt
              }, null, 2)}
            </pre>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
