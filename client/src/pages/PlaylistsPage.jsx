/**
 * User Playlists Management Page
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import playlistService from '../services/playlistService';
import { useAuth } from '../context/AuthContext';
import { Plus, ListVideo, Lock, Globe, Play, Clock } from 'lucide-react';
import SaveToPlaylistModal from '../components/playlists/SaveToPlaylistModal';

export const PlaylistsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPlaylists = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await playlistService.getUserPlaylists();
        if (mounted && res?.data) {
          setPlaylists(res.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to load playlists.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPlaylists();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ListVideo className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
        <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
          Enjoy your favorite playlists
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Sign in to access playlists you’ve created and saved.
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            Playlists
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your personal video collections and Watch Later
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-full text-sm font-semibold transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New playlist</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Grid of Playlists */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Dedicated Watch Later Card */}
          <Link
            to="/playlist/watch-later"
            className="group flex flex-col rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-all"
          >
            <div className="relative aspect-video bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white">
              <Clock className="w-12 h-12 opacity-80 group-hover:scale-110 transition-transform" />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-xs">
                <ListVideo className="w-3.5 h-3.5" />
                <span>Saved</span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-base text-[#0f0f0f] dark:text-[#f1f1f1] group-hover:text-blue-600">
                  Watch Later
                </h3>
                <p className="text-xs text-neutral-500 mt-1">System playlist</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> View playlist
              </span>
            </div>
          </Link>

          {/* User Custom Playlists */}
          {playlists
            .filter((p) => p.systemType !== 'watch_later')
            .map((playlist) => {
              const videoCount = playlist.videos?.length || 0;

              return (
                <Link
                  key={playlist._id}
                  to={`/playlist/${playlist._id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-all"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    {playlist.thumbnailUrl ? (
                      <img
                        src={playlist.thumbnailUrl}
                        alt={playlist.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <ListVideo className="w-12 h-12 opacity-40" />
                      </div>
                    )}

                    {/* Bottom Right Pill: Video count overlay */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-semibold">
                      <ListVideo className="w-3.5 h-3.5" />
                      <span>{videoCount} videos</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-base text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-1 group-hover:text-blue-600 leading-snug">
                        {playlist.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
                        {playlist.visibility === 'private' ? (
                          <>
                            <Lock className="w-3 h-3" /> <span>Private</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3" /> <span>Public</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" /> View playlist
                    </span>
                  </div>
                </Link>
              );
            })}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <SaveToPlaylistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PlaylistsPage;
