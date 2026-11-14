/**
 * VidTube My Videos Management Dashboard
 * Phase 3 - Video Upload, Storage & Management Engine
 * Filter, search, sort, edit metadata, update thumbnails, and delete videos
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Zap,
  Music2,
  X
} from 'lucide-react';
import { videoService } from '../../services/videoService';
import { shortService } from '../../services/shortService';
import { formatDuration, formatViews, formatTimeAgo } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

export const MyVideosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'shorts' ? 'shorts' : 'videos';

  const [items, setItems] = useState([]);
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
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Switch tabs
  const handleTabChange = (tab) => {
    setSearchParams(tab === 'shorts' ? { tab: 'shorts' } : {});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Fetch creator's videos or shorts
  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'shorts') {
        const res = await shortService.getMyShorts({
          page: pagination.page,
          limit: 15,
          search: searchQuery,
          visibility: visibilityFilter,
          processingStatus: statusFilter,
          sortBy
        });
        setItems(res.data.shorts || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
      } else {
        const res = await videoService.getMyVideos({
          page: pagination.page,
          limit: 15,
          search: searchQuery,
          visibility: visibilityFilter,
          processingStatus: statusFilter,
          sortBy
        });
        setItems(res.data.videos || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
      }
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message || `Failed to load ${activeTab}.`);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, pagination.page, searchQuery, visibilityFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Handle Edit Submit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSavingEdit(true);
      const itemId = editingItem._id || editingItem.id;

      if (activeTab === 'shorts') {
        await shortService.updateShort(itemId, {
          title: editingItem.title,
          description: editingItem.description,
          soundTitle: editingItem.soundTitle,
          tags: editingItem.tags
        });
        if (editingItem.visibility) {
          await shortService.updateVisibility(itemId, editingItem.visibility);
        }
        setSuccessMessage('Short updated successfully.');
      } else {
        await videoService.updateVideo(itemId, {
          title: editingItem.title,
          description: editingItem.description,
          category: editingItem.category,
          visibility: editingItem.visibility
        });
        setSuccessMessage('Video updated successfully.');
      }

      setEditingItem(null);
      fetchContent();
    } catch (err) {
      setErrorMessage(err.message || `Failed to update ${activeTab === 'shorts' ? 'Short' : 'video'}.`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      const itemId = deletingItem._id || deletingItem.id;

      if (activeTab === 'shorts') {
        await shortService.deleteShort(itemId);
        setSuccessMessage('Short and associated media asset permanently deleted.');
      } else {
        await videoService.deleteVideo(itemId);
        setSuccessMessage('Video and associated media assets deleted.');
      }

      setDeletingItem(null);
      fetchContent();
    } catch (err) {
      setErrorMessage(err.message || `Failed to delete ${activeTab === 'shorts' ? 'Short' : 'video'}.`);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            Channel content
          </h1>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
            Manage your long-form videos and vertical Shorts, visibility, metadata, and media assets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/upload?type=short">
            <Button
              variant="outline"
              size="md"
              icon={<Zap className="w-4 h-4 text-amber-500 fill-amber-500" />}
              className="font-semibold"
            >
              Upload Short
            </Button>
          </Link>

          <Link to="/upload?type=video">
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
      </div>

      {/* Tabs: Videos vs Shorts */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('videos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'videos'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Film className="w-4 h-4" />
          Videos
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('shorts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'shorts'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          Shorts
        </button>
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
            placeholder={`Search across your ${activeTab === 'shorts' ? 'Shorts' : 'videos'}...`}
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

      {/* Content List / Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-neutral-500">Loading {activeTab}...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
            {activeTab === 'shorts' ? <Zap className="w-8 h-8 text-amber-500" /> : <Film className="w-8 h-8" />}
          </div>
          <h3 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-1">
            No {activeTab === 'shorts' ? 'Shorts' : 'videos'} found
          </h3>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] max-w-sm mb-6">
            {activeTab === 'shorts'
              ? 'Upload your first vertical Short under 60 seconds to connect with the VidTube Shorts community.'
              : 'Upload your first long-form video to start growing your channel and audience on VidTube.'}
          </p>
          <Link to={activeTab === 'shorts' ? '/upload?type=short' : '/upload?type=video'}>
            <Button
              variant="accent"
              size="md"
              icon={activeTab === 'shorts' ? <Zap className="w-4 h-4 fill-white" /> : <Upload className="w-4 h-4" />}
            >
              Upload {activeTab === 'shorts' ? 'Short' : 'video'}
            </Button>
          </Link>
        </div>
      ) : (
        /* Video / Shorts Table */
        <div className="bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[320px]">{activeTab === 'shorts' ? 'Short' : 'Video'}</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {items.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition">
                    {/* Media Column (Thumbnail + Title + Details) */}
                    <td className="py-3 px-4">
                      <div className="flex gap-3 items-start">
                        {activeTab === 'shorts' ? (
                          <div className="relative aspect-[9/16] w-14 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                              {formatDuration(item.duration)}
                            </span>
                          </div>
                        ) : (
                          <div className="relative aspect-video w-28 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                              {formatDuration(item.duration)}
                            </span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <Link
                            to={activeTab === 'shorts' ? `/shorts/${item._id || item.id}` : `/watch/${item._id || item.id}`}
                            className="font-semibold text-sm text-[#0f0f0f] dark:text-[#f1f1f1] truncate block hover:text-red-600 transition"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                          <p className="text-neutral-500 text-[11px] line-clamp-1 mt-0.5">
                            {item.description || 'No description added'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                            {activeTab === 'shorts' ? (
                              <span className="flex items-center gap-1">
                                <Music2 className="w-3 h-3 text-neutral-500" />
                                {item.soundTitle || 'Original Audio'}
                              </span>
                            ) : (
                              <>
                                <span>{item.category}</span>
                                <span>•</span>
                                <span>{item.resolution || '720p'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Visibility */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderVisibilityBadge(item.visibility)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(item.processingStatus)}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                      <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-neutral-400">{formatTimeAgo(item.createdAt)}</div>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-700 dark:text-neutral-300">
                      {formatViews(item.views)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit details */}
                        <button
                          title={`Edit ${activeTab === 'shorts' ? 'Short' : 'video'} metadata`}
                          onClick={() => setEditingItem({ ...item })}
                          className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete video/short */}
                        <button
                          title={`Delete ${activeTab === 'shorts' ? 'Short' : 'video'} permanently`}
                          onClick={() => setDeletingItem(item)}
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

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingItem(null)}
          />
          <div className="relative bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
                Edit {activeTab === 'shorts' ? 'Short' : 'Video'} Details
              </h3>
              <button onClick={() => setEditingItem(null)}>
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
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                />
              </div>

              {activeTab === 'shorts' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Sound Attribution / Audio Title
                  </label>
                  <input
                    type="text"
                    value={editingItem.soundTitle || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, soundTitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {activeTab === 'videos' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Category
                    </label>
                    <select
                      value={editingItem.category || 'Web Development'}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={activeTab === 'shorts' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Visibility
                  </label>
                  <select
                    value={editingItem.visibility}
                    onChange={(e) => setEditingItem({ ...editingItem, visibility: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-[#0f0f0f] dark:text-[#f1f1f1] focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
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
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeletingItem(null)}
          />
          <div className="relative bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
                Delete this {activeTab === 'shorts' ? 'Short' : 'video'} permanently?
              </h3>
              <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong>"{deletingItem.title}"</strong>? This will permanently delete the {activeTab === 'shorts' ? 'Short' : 'video'} and purge all associated media assets from Cloudinary. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1 justify-center"
                onClick={() => setDeletingItem(null)}
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
