/**
 * VidTube Admin Users Directory & Account Status Management
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  CheckCircle,
  MoreVertical,
  Key
} from 'lucide-react';

export const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [roleModalUser, setRoleModalUser] = useState(null);
  const [targetRole, setTargetRole] = useState('creator');

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getUsers({
        page,
        limit: 12,
        q: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined
      });
      setUsers(res?.data?.users || []);
      setPagination(res?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Failed to fetch users directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalUser) return;
    setActionLoading(true);

    try {
      await adminService.updateUserStatus(statusModalUser._id, {
        status: targetStatus,
        reason: statusReason.trim()
      });
      setStatusModalUser(null);
      setStatusReason('');
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setActionLoading(true);

    try {
      await adminService.updateUserRole(roleModalUser._id, {
        role: targetRole
      });
      setRoleModalUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users Directory</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage account status, investigate infractions, and assign administrative roles
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Users: <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-red-500 text-gray-800 dark:text-gray-200"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="creator">Creator</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="mt-3 text-xs text-gray-400">Loading user records...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No users match your search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Channel</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => {
                  const isCurrent = u._id === currentAdmin?._id;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold uppercase shrink-0">
                              {u.name?.[0] || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                            <p className="text-gray-400 text-[11px] truncate">@{u.username} &bull; {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'super_admin'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : u.role === 'admin'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                            : u.role === 'creator'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                        }`}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.accountStatus === 'active'
                            ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                            : u.accountStatus === 'suspended'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                        }`}>
                          {u.accountStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                        {u.channel?.name ? (
                          <span className="truncate max-w-[150px] inline-block font-medium">
                            {u.channel.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Status action */}
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                setStatusModalUser(u);
                                setTargetStatus(u.accountStatus === 'active' ? 'suspended' : 'active');
                                setStatusReason('');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                                u.accountStatus === 'active'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                                  : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-100'
                              }`}
                            >
                              {u.accountStatus === 'active' ? 'Suspend' : 'Restore'}
                            </button>
                          )}

                          {/* Super Admin Role Assignment */}
                          {isSuperAdmin && !isCurrent && (
                            <button
                              onClick={() => {
                                setRoleModalUser(u);
                                setTargetRole(u.role);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition"
                              title="Assign User Role"
                            >
                              Role
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Status Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">
                Update Account Status: @{statusModalUser.username}
              </h3>
              <button onClick={() => setStatusModalUser(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Target Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="suspended">Suspended (Blocked from All Actions)</option>
                  <option value="banned">Banned (Permanent Platform Ban)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Reason for Action (Recorded in Audit Trail)
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  required={targetStatus !== 'active'}
                  placeholder="Specify violation rationale or support ticket..."
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Assignment Modal (Super Admin Only) */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">
                Assign System Role: @{roleModalUser.username}
              </h3>
              <button onClick={() => setRoleModalUser(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Security Clearance Level</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                >
                  <option value="user">User (Standard Consumer)</option>
                  <option value="creator">Creator (Studio Publishing Rights)</option>
                  <option value="admin">Admin (Moderation & Safety Access)</option>
                  <option value="super_admin">Super Admin (Unrestricted System Root)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1">
                <p className="font-semibold">Security Warning:</p>
                <p>Elevating a user to Admin grants access to sensitive platform logs, moderation controls, and user account management.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Assign Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
