/**
 * Studio Settings Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import studioService from '../../services/studioService';

export const StudioSettingsPage = () => {
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await studioService.getChannelCustomization();
      if (res.success) {
        setChannel(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Studio Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Channel configuration, default upload permissions, and account identity.
        </p>
      </div>

      <div className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Channel Status & Verification</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your channel identity and security level.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold">Channel ID</span>
            <div className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all select-all">
              {channel?._id || 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold">User Role</span>
            <div className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {user?.role || 'Creator'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold">Default Visibility</span>
            <div className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {channel?.defaultVisibility || 'public'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold">Verification Badge</span>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{channel?.isVerified ? 'Verified Creator' : 'Standard Creator'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioSettingsPage;
