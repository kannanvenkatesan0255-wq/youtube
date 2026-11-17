/**
 * Playlist Controller
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
const playlistService = require('../services/playlist.service');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/playlists
 * @desc    Create a new playlist
 * @access  Private
 */
const createPlaylist = async (req, res, next) => {
  try {
    const { title, description, visibility, videoId } = req.body;
    const channelId = req.user.channel ? req.user.channel._id : null;

    const playlist = await playlistService.createPlaylist({
      title,
      description,
      visibility,
      videoId,
      userId: req.user._id,
      channelId
    });

    return res.status(201).json(ApiResponse.created(playlist, 'Playlist created successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/playlists
 * @desc    Get user's playlists (or public playlists for a channel)
 * @access  Public / Optional Auth
 */
const getPlaylists = async (req, res, next) => {
  try {
    const targetUserId = req.query.userId || (req.user ? req.user._id : null);
    if (!targetUserId) {
      return res.status(200).json(ApiResponse.success([], 'No user specified.'));
    }

    const playlists = await playlistService.getUserPlaylists(targetUserId, req.user || null);
    return res.status(200).json(ApiResponse.success(playlists, 'Playlists retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/playlists/:id
 * @desc    Get single playlist with populated videos
 * @access  Public (Subject to playlist visibility)
 */
const getPlaylistById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const playlist = await playlistService.getPlaylistById(id, req.user || null);

    return res.status(200).json(ApiResponse.success(playlist, 'Playlist retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/playlists/:id
 * @desc    Update playlist metadata
 * @access  Private (Owner only)
 */
const updatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await playlistService.updatePlaylist(id, req.user._id, req.body);

    return res.status(200).json(ApiResponse.success(updated, 'Playlist updated successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/playlists/:id
 * @desc    Delete custom playlist
 * @access  Private (Owner only)
 */
const deletePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    await playlistService.deletePlaylist(id, req.user._id);

    return res.status(200).json(ApiResponse.success(null, 'Playlist deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/playlists/:id/videos
 * @desc    Add video to playlist
 * @access  Private (Owner only)
 */
const addVideoToPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const videoId = req.validatedVideoId || req.body.videoId;

    const result = await playlistService.addVideoToPlaylist(id, videoId, req.user._id);
    return res.status(200).json(ApiResponse.success(result.playlist, result.message));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/playlists/:id/videos/:videoId
 * @desc    Remove video from playlist
 * @access  Private (Owner only)
 */
const removeVideoFromPlaylist = async (req, res, next) => {
  try {
    const { id, videoId } = req.params;
    const updated = await playlistService.removeVideoFromPlaylist(id, videoId, req.user._id);

    return res.status(200).json(ApiResponse.success(updated, 'Video removed from playlist.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/playlists/:id/reorder
 * @desc    Reorder videos in playlist
 * @access  Private (Owner only)
 */
const reorderVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await playlistService.reorderVideos(id, req.user._id, req.body);

    return res.status(200).json(ApiResponse.success(updated, 'Playlist reordered successfully.'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlaylist,
  getPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  reorderVideos
};
