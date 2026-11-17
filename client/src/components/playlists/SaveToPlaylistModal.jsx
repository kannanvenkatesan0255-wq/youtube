/**
 * Save to Playlist Modal Component
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
import React, { useState, useEffect } from 'react';
import { X, Plus, Lock, Globe, Clock, Check } from 'lucide-react';
import playlistService from '../../services/playlistService';
import watchLaterService from '../../services/watchLaterService';
import { useAuth } from '../../context/AuthContext';

export const SaveToPlaylistModal = ({
  videoId,
  isOpen,
  onClose
}) => {
  const { isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState('public');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !videoId || !isAuthenticated) return;

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [plRes, wlRes] = await Promise.all([
          playlistService.getUserPlaylists(),
          watchLaterService.checkWatchLater(videoId)
        ]);

        if (mounted) {
          const allPlaylists = plRes?.data || [];
          // Filter out system playlists from the custom list
          const customPlaylists = allPlaylists.filter((p) => !p.isSystem);
          setPlaylists(customPlaylists);
          setIsInWatchLater(!!wlRes?.data?.isInWatchLater);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load playlists.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [isOpen, videoId, isAuthenticated]);

  if (!isOpen) return null;

  const handleToggleWatchLater = async () => {
    try {
      if (isInWatchLater) {
        await watchLaterService.removeFromWatchLater(videoId);
        setIsInWatchLater(false);
      } else {
        await watchLaterService.addToWatchLater(videoId);
        setIsInWatchLater(true);
      }
    } catch (err) {
      console.error('Failed to toggle Watch Later', err);
    }
  };

  const handleTogglePlaylist = async (playlist) => {
    const hasVideo = playlist.videos && playlist.videos.some(
      (v) => (v.video?._id || v.video) === videoId
    );

    try {
      if (hasVideo) {
        await playlistService.removeVideoFromPlaylist(playlist._id, videoId);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? {
                  ...p,
                  videos: p.videos.filter((v) => (v.video?._id || v.video) !== videoId)
                }
              : p
          )
        );
      } else {
        await playlistService.addVideoToPlaylist(playlist._id, videoId);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? {
                  ...p,
                  videos: [...(p.videos || []), { video: videoId, addedAt: new Date() }]
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to update playlist', err);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await playlistService.createPlaylist({
        title: newTitle.trim(),
        visibility: newVisibility,
        videoId
      });

      if (res?.data) {
        setPlaylists((prev) => [...prev, res.data]);
        setNewTitle('');
        setIsCreating(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create playlist.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-base text-[#0f0f0f] dark:text-[#f1f1f1]">
            Save video to...
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {error && <div className="text-xs text-red-500">{error}</div>}

          {loading ? (
            <div className="py-6 text-center text-sm text-neutral-500">Loading playlists...</div>
          ) : (
            <div className="space-y-1">
              {/* Watch Later Item */}
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer select-none">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isInWatchLater
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-neutral-400 dark:border-neutral-600'
                    }`}
                  >
                    {isInWatchLater && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">
                    Watch Later
                  </span>
                </div>
                <Clock className="w-4 h-4 text-neutral-400" />
                <input
                  type="checkbox"
                  checked={isInWatchLater}
                  onChange={handleToggleWatchLater}
                  className="sr-only"
                />
              </label>

              {/* Custom Playlists */}
              {playlists.map((playlist) => {
                const isSaved =
                  playlist.videos &&
                  playlist.videos.some(
                    (v) => (v.video?._id || v.video) === videoId
                  );

                return (
                  <label
                    key={playlist._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSaved
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-neutral-400 dark:border-neutral-600'
                        }`}
                      >
                        {isSaved && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f1f1f1] truncate">
                        {playlist.title}
                      </span>
                    </div>
                    {playlist.visibility === 'private' ? (
                      <Lock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    ) : (
                      <Globe className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    )}
                    <input
                      type="checkbox"
                      checked={!!isSaved}
                      onChange={() => handleTogglePlaylist(playlist)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Create New Playlist */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus className="w-4 h-4" />
              <span>Create new playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter playlist title..."
                  maxLength={100}
                  autoFocus
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Privacy</label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveToPlaylistModal;
