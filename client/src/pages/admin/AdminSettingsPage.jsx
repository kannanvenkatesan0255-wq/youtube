/**
 * VidTube Admin Global Platform Settings
 * Phase 9 Admin Control Center, Content Moderation & Platform Security
 */
import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Spinner from '../../components/common/Spinner';
import {
  Settings,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
  FileCheck,
  Power
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    allowNewRegistrations: true,
    maintenanceMode: false,
    maintenanceMessage: '',
    maxVideoUploadSizeMb: 500,
    maxShortUploadDurationSec: 60,
    allowedVideoFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    autoFlagThresholdReports: 5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getPlatformSettings();
      if (res?.data) {
        setSettings({
          allowNewRegistrations: res.data.allowNewRegistrations ?? true,
          maintenanceMode: res.data.maintenanceMode ?? false,
          maintenanceMessage: res.data.maintenanceMessage || '',
          maxVideoUploadSizeMb: res.data.maxVideoUploadSizeMb || 500,
          maxShortUploadDurationSec: res.data.maxShortUploadDurationSec || 60,
          allowedVideoFormats: res.data.allowedVideoFormats || ['mp4', 'mov', 'avi', 'mkv', 'webm'],
          autoFlagThresholdReports: res.data.autoFlagThresholdReports || 5
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
      setError('Failed to fetch platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await adminService.updatePlatformSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-3 text-xs text-gray-400">Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Global Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Configure upload thresholds, system availability, auto-moderation rules, and registration policies
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Platform settings successfully saved and applied immediately across cluster.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Availability & Registration Card */}
        <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm border-b border-gray-100 dark:border-gray-800 pb-3">
            <Power className="w-4 h-4 text-red-600" />
            <span>Platform Access & Registration</span>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Allow Public Registration
                </p>
                <p className="text-[11px] text-gray-500">
                  When toggled off, visitors cannot create new accounts. Existing users can still sign in.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowNewRegistrations}
                onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Maintenance Mode
                </p>
                <p className="text-[11px] text-gray-500">
                  Display system maintenance banner and prevent public write operations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
              />
            </label>

            {settings.maintenanceMode && (
              <div className="pt-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Maintenance Advisory Message
                </label>
                <input
                  type="text"
                  value={settings.maintenanceMessage}
                  onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                  placeholder="VidTube is undergoing scheduled maintenance..."
                  className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Upload Storage & Limits Card */}
        <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm border-b border-gray-100 dark:border-gray-800 pb-3">
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Upload Capacities & Media Constraints</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Max Long-form Video Upload Size (MB)
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                value={settings.maxVideoUploadSizeMb}
                onChange={(e) => setSettings({ ...settings, maxVideoUploadSizeMb: Number(e.target.value) })}
                className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Max Shorts Duration (Seconds)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                value={settings.maxShortUploadDurationSec}
                onChange={(e) => setSettings({ ...settings, maxShortUploadDurationSec: Number(e.target.value) })}
                className="w-full text-xs mt-1 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Safety & Auto-Moderation Card */}
        <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm border-b border-gray-100 dark:border-gray-800 pb-3">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Safety & Automatic Guardrails</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Auto-Flag Reports Threshold
            </label>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Number of distinct user reports required to automatically escalate content to 'flagged' status.
            </p>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.autoFlagThresholdReports}
              onChange={(e) => setSettings({ ...settings, autoFlagThresholdReports: Number(e.target.value) })}
              className="w-48 text-xs mt-1.5 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
