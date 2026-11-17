/**
 * VidTube Admin Platform Announcements Manager
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  X,
  AlertTriangle,
  Info,
  Wrench,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 1,
    isActive: true,
    dismissible: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAnnouncements();
      setAnnouncements(res?.data?.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements', err);
      setError('Failed to fetch platform announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 1,
      isActive: true,
      dismissible: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type,
      priority: item.priority || 1,
      isActive: item.isActive,
      dismissible: item.dismissible ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingItem) {
        await adminService.updateAnnouncement(editingItem._id, formData);
      } else {
        await adminService.createAnnouncement(formData);
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement permanently?')) return;

    try {
      await adminService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const toggleActive = async (item) => {
    try {
      await adminService.updateAnnouncement(item._id, { isActive: !item.isActive });
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Announcements</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Broadcast emergency alerts, maintenance advisories, and feature updates across VidTube
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-gray-400">Loading announcements...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-2xl text-center text-xs">
          {error}
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 text-center space-y-3 shadow-sm">
          <Bell className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="font-bold text-sm">No Active Announcements</h3>
          <p className="text-xs text-gray-400">
            Publish a banner to alert users of upcoming features, maintenance, or security advisories.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item._id}
              className={`p-5 rounded-2xl border transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                item.isActive
                  ? 'bg-white dark:bg-[#1e1e1e] border-gray-200/80 dark:border-gray-800'
                  : 'bg-gray-50 dark:bg-neutral-900/50 border-gray-200 dark:border-gray-800 opacity-60'
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.type === 'critical' || item.type === 'maintenance'
                      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                      : item.type === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      : item.type === 'feature'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Priority: {item.priority}
                  </span>
                  <span className={`text-[11px] font-bold ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    &bull; {item.isActive ? 'Active Broadcast' : 'Draft / Inactive'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition"
                  title={item.isActive ? 'Deactivate' : 'Activate'}
                >
                  {item.isActive ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-500 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#212121] rounded-2xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingItem ? 'Edit Announcement' : 'Publish Announcement'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Scheduled Maintenance Tonight"
                  className="w-full mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Detailed announcement text..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">Category Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="critical">Critical (Red)</option>
                    <option value="feature">Feature Update (Green)</option>
                    <option value="maintenance">Maintenance (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">Priority (Higher First)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span>Active immediately</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dismissible}
                    onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span>Allow users to dismiss</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementsPage;
