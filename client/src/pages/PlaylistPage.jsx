/**
 * Single Playlist View Page
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import playlistService from '../services/playlistService';
import { useAuth } from '../context/AuthContext';
import { Play, Trash2, Edit2, ChevronUp, ChevronDown, Lock, Globe, Share2 } from 'lucide-react';

export const PlaylistPage = () => {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');

  useEffect(() => {
    let mounted = true;
    const fetchPlaylist = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await playlistService.getPlaylistById(playlistId);
        if (mounted && res?.data) {
          setPlaylist(res.data);
          setEditTitle(res.data.title || '');
          setEditDesc(res.data.description || '');
          setEditVisibility(res.data.visibility || 'public');
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to load playlist.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPlaylist();

    return () => {
      mounted = false;
    };
  }, [playlistId]);

  const isOwner = user && playlist && (playlist.owner?._id === user._id || playlist.owner === user._id);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await playlistService.updatePlaylist(playlistId, {
        title: editTitle,
        description: editDesc,
        visibility: editVisibility
      });
      if (res?.data) {
        setPlaylist((prev) => ({ ...prev, ...res.data }));
        setIsEditing(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update playlist.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await playlistService.deletePlaylist(playlistId);
      navigate('/playlists');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete playlist.');
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      await playlistService.removeVideoFromPlaylist(playlistId, videoId);
      setPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => (v.video?._id || v.video) !== videoId)
      }));
    } catch (err) {
      console.error('Failed to remove video', err);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= playlist.videos.length) return;

    const newVideos = [...playlist.videos];
    const [moved] = newVideos.splice(index, 1);
    newVideos.splice(newIndex, 0, moved);

    setPlaylist((prev) => ({ ...prev, videos: newVideos }));

    try {
      const videoIds = newVideos.map((v) => v.video?._id || v.video);
      await playlistService.reorderVideos(playlistId, { videoIds });
    } catch (err) {
      console.error('Failed to save reordered list', err);
    }
  };

  const formatDuration = (seconds = 0) => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${remS < 10 ? '0' : ''}${remS}`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
            <div className="space-y-2 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Playlist Unavailable</h2>
        <p className="text-sm text-neutral-500 mb-6">{error || 'Playlist not found.'}</p>
        <Link
          to="/playlists"
          className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full text-sm font-semibold"
        >
          Back to Playlists
        </Link>
      </div>
    );
  }

  const validVideos = playlist.videos?.filter((v) => v.video != null) || [];
  const firstVideoId = validVideos.length > 0 ? (validVideos[0].video?._id || validVideos[0].video) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Card: Playlist Poster & Actions */}
        <div className="w-full lg:w-88 xl:w-96 lg:sticky lg:top-20 flex-shrink-0 bg-gradient-to-b from-neutral-800/80 to-neutral-900/90 text-white rounded-3xl p-6 shadow-xl backdrop-blur-md">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-800 shadow-md mb-5 group">
            {playlist.thumbnailUrl ? (
              <img
                src={playlist.thumbnailUrl}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Play className="w-12 h-12 opacity-40" />
              </div>
            )}
            {firstVideoId && (
              <Link
                to={`/watch/${firstVideoId}?list=${playlist._id}&index=0`}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <div className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play all</span>
                </div>
              </Link>
            )}
          </div>

          {/* Title & Description */}
          {!isEditing ? (
            <div className="space-y-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {playlist.title}
              </h1>

              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <span className="font-semibold text-white">
                  {playlist.owner?.username || 'VidTube Creator'}
                </span>
                <span>•</span>
                <span>{validVideos.length} videos</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {playlist.visibility === 'private' ? (
                    <>
                      <Lock className="w-3 h-3" /> Private
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3" /> Public
                    </>
                  )}
                </span>
              </div>

              {playlist.description && (
                <p className="text-xs text-neutral-300/90 line-clamp-3 whitespace-pre-line">
                  {playlist.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {firstVideoId && (
                  <Link
                    to={`/watch/${firstVideoId}?list=${playlist._id}&index=0`}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-neutral-950 font-bold text-sm py-2.5 rounded-full hover:bg-neutral-200 transition-colors shadow"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play all</span>
                  </Link>
                )}

                {isOwner && !playlist.isSystem && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      title="Edit playlist"
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDelete}
                      title="Delete playlist"
                      className="p-2.5 rounded-full bg-white/10 hover:bg-red-600/80 text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Inline Edit Form */
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-300">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-300">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full text-sm px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-300">Visibility</label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 rounded-lg bg-neutral-800 border border-white/20 text-white focus:outline-none"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs rounded-lg hover:bg-white/10 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right List: Playlist Videos */}
        <div className="flex-1 w-full space-y-2">
          {validVideos.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              No videos in this playlist yet.
            </div>
          ) : (
            validVideos.map((item, idx) => {
              const video = item.video;
              if (!video) return null;

              return (
                <div
                  key={`${video._id}-${idx}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group"
                >
                  {/* Sequence Number */}
                  <span className="w-6 text-center text-xs font-medium text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                    {idx + 1}
                  </span>

                  {/* Thumbnail */}
                  <Link
                    to={`/watch/${video._id}?list=${playlist._id}&index=${idx}`}
                    className="relative w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Play className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 rounded text-[10px] font-semibold bg-black/80 text-white">
                      {formatDuration(video.duration)}
                    </span>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-2">
                    <Link
                      to={`/watch/${video._id}?list=${playlist._id}&index=${idx}`}
                      className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 leading-snug"
                    >
                      {video.title}
                    </Link>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                      {video.channel?.name || 'VidTube Creator'}
                    </p>
                  </div>

                  {/* Owner Controls (Move up/down, delete) */}
                  {isOwner && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === validVideos.length - 1}
                        title="Move Down"
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveVideo(video._id)}
                        title="Remove from playlist"
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistPage;
