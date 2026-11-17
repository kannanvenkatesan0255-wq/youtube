/**
 * Studio Playlists Management Page
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playlistService } from '../../services/playlistService';

export const StudioPlaylistsPage = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', visibility: 'public' });
  const [creating, setCreating] = useState(false);

  // Edit Modal
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', visibility: 'public' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await playlistService.getUserPlaylists();
      if (res.success) {
        setPlaylists(res.data || []);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await playlistService.createPlaylist(createForm);
      if (res.success) {
        setPlaylists([res.data, ...playlists]);
        setShowCreateModal(false);
        setCreateForm({ title: '', description: '', visibility: 'public' });
      }
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPlaylist) return;
    try {
      setSavingEdit(true);
      const res = await playlistService.updatePlaylist(editingPlaylist._id, editForm);
      if (res.success) {
        setPlaylists((prev) =>
          prev.map((p) => (p._id === editingPlaylist._id ? { ...p, ...res.data } : p))
        );
        setEditingPlaylist(null);
      }
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const res = await playlistService.deletePlaylist(playlistId);
      if (res.success) {
        setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Channel Playlists</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Organize and curate your channel content into public, unlisted, or private playlists.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Playlist</span>
        </button>
      </div>

      {/* Playlists Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              className="bg-white dark:bg-[#282828] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center text-gray-400">
                  {playlist.thumbnailUrl ? (
                    <img src={playlist.thumbnailUrl} alt={playlist.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-0.5 rounded">
                    {(playlist.videos || []).length} videos
                  </span>
                </div>

                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      {playlist.visibility}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(playlist.updatedAt || playlist.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 line-clamp-1">
                    {playlist.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {playlist.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-semibold">
                <Link
                  to={`/playlist/${playlist._id}`}
                  className="text-red-600 hover:underline"
                >
                  View Playlist
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPlaylist(playlist);
                      setEditForm({
                        title: playlist.title,
                        description: playlist.description || '',
                        visibility: playlist.visibility
                      });
                    }}
                    className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    title="Edit Playlist"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(playlist._id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete Playlist"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-[#282828] rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="mb-3">You haven't created any playlists yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
          >
            Create Playlist
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#282828] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Playlist</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Mastery Series"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Playlist description..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Visibility</label>
                <select
                  value={createForm.visibility}
                  onChange={(e) => setCreateForm({ ...createForm, visibility: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPlaylist && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#282828] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Edit Playlist</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
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

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingPlaylist(null)}
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
    </div>
  );
};

export default StudioPlaylistsPage;
