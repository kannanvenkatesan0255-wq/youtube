/**
 * Channel Customization Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
import React, { useState, useEffect } from 'react';
import studioService from '../../services/studioService';

export const StudioCustomizationPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    handle: '',
    description: '',
    defaultVisibility: 'public',
    featuredVideo: ''
  });

  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchCustomizationData();
  }, []);

  const fetchCustomizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [customRes, contentRes] = await Promise.all([
        studioService.getChannelCustomization(),
        studioService.getStudioContent({ type: 'video', limit: 50 })
      ]);

      if (customRes.success) {
        const d = customRes.data;
        setForm({
          name: d.name || '',
          handle: d.handle || '',
          description: d.description || '',
          defaultVisibility: d.defaultVisibility || 'public',
          featuredVideo: d.featuredVideo?._id || ''
        });
      }

      if (contentRes.success) {
        setVideos(contentRes.data.items || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load customization details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');

      const res = await studioService.updateChannelCustomization({
        name: form.name.trim(),
        handle: form.handle.trim(),
        description: form.description.trim(),
        defaultVisibility: form.defaultVisibility,
        featuredVideo: form.featuredVideo || null
      });

      if (res.success) {
        setSuccessMsg('Channel customization saved successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to save channel customization');
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Channel Customization</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Customize your channel name, unique handle, description, default visibility, and featured trailer video.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-sm font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#282828] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
            Channel Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g. Code with VidTube"
          />
          <p className="text-[11px] text-gray-400 mt-1">Choose a channel name that represents you and your content.</p>
        </div>

        {/* Handle */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
            Handle
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-semibold text-gray-400">@</span>
            <input
              type="text"
              required
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value.replace(/^@+/, '') })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 pl-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="unique_handle"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Your unique URL will be: <span className="font-semibold text-gray-700 dark:text-gray-300">https://vidtube.com/@{form.handle || 'handle'}</span>
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
            Description
          </label>
          <textarea
            rows="4"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Tell viewers about your channel and what kinds of videos you produce..."
          />
        </div>

        {/* Default Visibility */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
            Default Upload Visibility
          </label>
          <select
            value={form.defaultVisibility}
            onChange={(e) => setForm({ ...form, defaultVisibility: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="public">Public (Everyone can see immediately)</option>
            <option value="unlisted">Unlisted (Anyone with link can see)</option>
            <option value="private">Private (Only you can see)</option>
          </select>
        </div>

        {/* Featured Video Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
            Featured Channel Video
          </label>
          <select
            value={form.featuredVideo}
            onChange={(e) => setForm({ ...form, featuredVideo: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="">None (No featured video)</option>
            {videos.map((vid) => (
              <option key={vid._id} value={vid._id}>
                {vid.title} ({(vid.views || 0).toLocaleString()} views)
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">Highlighted at the top of your channel homepage for visiting subscribers.</p>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Publish Customization'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudioCustomizationPage;
