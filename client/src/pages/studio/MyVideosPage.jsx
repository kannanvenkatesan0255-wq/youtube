/**
 * VidTube My Videos Management Dashboard
 * Phase 3 - Video Upload, Storage & Management Engine
 * Filter, search, sort, edit metadata, update thumbnails, and delete videos
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Search,
  Filter,
  Edit2,
  Trash2,
  Globe,
  Link2,
  Lock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Film,
  X
} from 'lucide-react';
import { videoService } from '../../services/videoService';
import { formatDuration, formatViews, formatTimeAgo } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

export const MyVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Modals state
  const [editingVideo, setEditingVideo] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch creator's videos
  const fetchMyVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await videoService.getMyVideos({
        page: pagination.page,
        limit: 15,
        search: searchQuery,
        visibility: visibilityFilter,
        processingStatus: statusFilter,
        sortBy
      });

      setVideos(res.data.videos || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load videos.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, searchQuery, visibilityFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchMyVideos();
  }, [fetchMyVideos]);

  // Handle Edit Submit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingVideo) return;

    try {
      setIsSavingEdit(true);
      await videoService.updateVideo(editingVideo._id || editingVideo.id, {
        title: editingVideo.title,
        description: editingVideo.description,
        category: editingVideo.category,
        visibility: editingVideo.visibility
      });

      setSuccessMessage('Video updated successfully.');
      setEditingVideo(null);
      fetchMyVideos();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update video.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete Video
  const handleConfirmDelete = async () => {
    if (!deletingVideo) return;

    try {
      setIsDeleting(true);
      await videoService.deleteVideo(deletingVideo._id || deletingVideo.id);
      setSuccessMessage('Video and associated media assets deleted.');
      setDeletingVideo(null);
      fetchMyVideos();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete video.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for Visibility Badge
  const renderVisibilityBadge = (vis) => {
    switch (vis) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Globe className="w-3 h-3" /> Public
          </span>
        );
      case 'unlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Link2 className="w-3 h-3" /> Unlisted
          </span>
        );
      case 'private':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Lock className="w-3 h-3" /> Private
          </span>
        );
      default:
        return vis;
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        );
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            <Clock className="w-3 h-3 animate-spin" /> Uploading
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="w-3 h-3 animate-spin" /> Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            Channel content
          </h1>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
            Manage your long-form videos, visibility, metadata, and media assets
          </p>
        </div>

        <Link to="/upload">
          <Button
            variant="accent"
            size="md"
            icon={<Upload className="w-4 h-4" />}
            className="font-semibold shadow-sm"
          >
            Upload video
          </Button>
        </Link>
      </div>

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center justify-between border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across your videos..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
          >
            <option value="all">Visibility: All</option>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="uploading">Uploading</option>
            <option value="failed">Failed</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
          >
            <option value="latest">Sort: Latest first</option>
            <option value="oldest">Sort: Oldest first</option>
            <option value="views">Sort: Most views</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Videos List / Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-neutral-500">Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-1">
            No videos found
          </h3>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] max-w-sm mb-6">
            Upload your first video to start growing your channel and audience on VidTube.
          </p>
          <Link to="/upload">
            <Button variant="accent" size="md" icon={<Upload className="w-4 h-4" />}>
              Upload video
            </Button>
          </Link>
        </div>
      ) : (
        /* Video Table */
        <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[320px]">Video</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {videos.map((vid) => (
                  <tr key={vid._id || vid.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition">
                    {/* Video Column (Thumbnail + Title + Details) */}
                    <td className="py-3 px-4">
                      <div className="flex gap-3 items-start">
                        <div className="relative aspect-video w-28 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                            {formatDuration(vid.duration)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-[#0f0f0f] dark:text-[#f1f1f1] truncate" title={vid.title}>
                            {vid.title}
                          </h4>
                          <p className="text-neutral-500 text-[11px] line-clamp-1 mt-0.5">
                            {vid.description || 'No description added'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                            <span>{vid.category}</span>
                            <span>•</span>
                            <span>{vid.resolution || '720p'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Visibility */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderVisibilityBadge(vid.visibility)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(vid.processingStatus)}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                      <div>{new Date(vid.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-neutral-400">{formatTimeAgo(vid.createdAt)}</div>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-700 dark:text-neutral-300">
                      {formatViews(vid.views)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit details */}
                        <button
                          title="Edit video metadata"
                          onClick={() => setEditingVideo({ ...vid })}
                          className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete video */}
                        <button
                          title="Delete video permanently"
                          onClick={() => setDeletingVideo(vid)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT VIDEO MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingVideo(null)}
          />
          <div className="relative bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
                Edit Video Details
              </h3>
              <button onClick={() => setEditingVideo(null)}>
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingVideo.description}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editingVideo.category}
                    onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Visibility
                  </label>
                  <select
                    value={editingVideo.visibility}
                    onChange={(e) => setEditingVideo({ ...editingVideo, visibility: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button variant="ghost" size="sm" onClick={() => setEditingVideo(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSavingEdit}>
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeletingVideo(null)}
          />
          <div className="relative bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
                Delete this video permanently?
              </h3>
              <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong>"{deletingVideo.title}"</strong>? This will permanently delete the video and purge all associated media assets from Cloudinary. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1 justify-center"
                onClick={() => setDeletingVideo(null)}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                size="md"
                className="flex-1 justify-center bg-red-600 hover:bg-red-700 text-white"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyVideosPage;
