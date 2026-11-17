/**
 * Creator Studio Content Management Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 * Unified table for Videos & Shorts with filters, metadata editor, and asset deletion
 */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import studioService from '../../services/studioService';

export const StudioContentPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'video' | 'short'
  const [visibilityFilter, setVisibilityFilter] = useState(''); // '' | 'public' | 'unlisted' | 'private'
  const [searchQuery, setSearchQuery] = useState(queryParam);

  // Modal States
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', visibility: 'public', tags: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [typeFilter, visibilityFilter, pagination.page, queryParam]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studioService.getStudioContent({
        type: typeFilter,
        visibility: visibilityFilter || undefined,
        page: pagination.page,
        limit: pagination.limit,
        q: queryParam
      });

      if (res.success) {
        setItems(res.data.items);
        setPagination(res.data.pagination);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      visibility: item.visibility,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setSavingEdit(true);
      const res = await studioService.updateStudioContent(editingItem._id, {
        title: editForm.title,
        description: editForm.description,
        visibility: editForm.visibility,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      });
      if (res.success) {
        setItems((prev) =>
          prev.map((it) => (it._id === editingItem._id ? { ...it, ...res.data } : it))
        );
        setEditingItem(null);
      }
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      const res = await studioService.deleteStudioContent(deletingItem._id);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it._id !== deletingItem._id));
        setDeletingItem(null);
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Channel Content</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Manage your long-form videos and shorts in one unified dashboard.
          </p>
        </div>

        <Link
          to="/upload"
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors self-start shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload</span>
        </Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-[#282828] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${typeFilter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
            >
              All Content
            </button>
            <button
              onClick={() => setTypeFilter('video')}
              className={`px-3 py-1.5 rounded-md transition-colors ${typeFilter === 'video' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Videos
            </button>
            <button
              onClick={() => setTypeFilter('short')}
              className={`px-3 py-1.5 rounded-md transition-colors ${typeFilter === 'short' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Shorts
            </button>
          </div>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border-0 text-xs font-semibold rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="">All Visibility</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Filter by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 text-xs rounded-lg py-2 pl-8 pr-4 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-[#282828] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                  <th className="py-3 px-4 font-semibold">Content</th>
                  <th className="py-3 px-4 font-semibold">Visibility</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Views</th>
                  <th className="py-3 px-4 font-semibold">Comments</th>
                  <th className="py-3 px-4 font-semibold">Likes</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors group">
                    {/* Content Column */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="relative w-20 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden shrink-0">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Media</div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-semibold px-1 rounded">
                          {item.contentType === 'Short' ? 'SHORT' : `${Math.floor((item.duration || 0) / 60)}:${String((item.duration || 0) % 60).padStart(2, '0')}`}
                        </span>
                      </div>
                      <div className="overflow-hidden max-w-sm">
                        <Link
                          to={item.contentType === 'Short' ? `/shorts/${item._id}` : `/watch/${item._id}`}
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-red-600 line-clamp-1 text-sm"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.description || 'No description'}</p>
                      </div>
                    </td>

                    {/* Visibility */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.visibility === 'public'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : item.visibility === 'unlisted'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        <span className="capitalize">{item.visibility}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white text-xs">
                      {(item.views || 0).toLocaleString()}
                    </td>

                    {/* Comments */}
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs">
                      {(item.commentsCount || 0).toLocaleString()}
                    </td>

                    {/* Likes */}
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs">
                      {(item.likesCount || 0).toLocaleString()}
                    </td>

                    {/* Row Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit metadata */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* View Analytics */}
                        <Link
                          to={`/studio/content/${item._id}/analytics`}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="View Analytics"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete Content"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400 text-sm">
            No content matches the selected filters.
          </div>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#282828] max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Edit {editingItem.contentType} Metadata
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Visibility</label>
                <select
                  value={editForm.visibility}
                  onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#282828] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Permanently delete this {deletingItem.contentType.toLowerCase()}?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              "{deletingItem.title}" will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioContentPage;
