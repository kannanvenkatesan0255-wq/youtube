/**
 * Watch Later Controller
 * VidTube Platform Architecture - Phase 7 Watch Later System
 */
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const { VIDEO_VISIBILITY } = require('../constants/appConstants');

/**
 * Helper to retrieve or lazily create user's Watch Later playlist
 */
const getOrCreateWatchLater = async (userId) => {
  let playlist = await Playlist.findOne({
    owner: userId,
    systemType: 'watch_later'
  });

  if (!playlist) {
    playlist = await Playlist.create({
      title: 'Watch Later',
      description: 'Saved videos to watch later',
      owner: userId,
      visibility: VIDEO_VISIBILITY.PRIVATE,
      isSystem: true,
      systemType: 'watch_later',
      videos: []
    });
  }

  return playlist;
};

/**
 * @route   GET /api/watch-later
 * @desc    Get user's Watch Later playlist with populated video data
 * @access  Private
 */
const getWatchLater = async (req, res, next) => {
  try {
    const playlist = await getOrCreateWatchLater(req.user._id);

    const populated = await Playlist.findById(playlist._id)
      .populate('owner', 'username fullName avatar')
      .populate({
        path: 'videos.video',
        select: 'title description thumbnailUrl videoUrl duration views likesCount createdAt channel',
        populate: { path: 'channel', select: 'name handle avatar subscribersCount' }
      });

    const result = populated.toObject();
    result.videos = result.videos.filter((item) => item.video != null);

    if (!result.thumbnailUrl && result.videos.length > 0 && result.videos[0].video) {
      result.thumbnailUrl = result.videos[0].video.thumbnailUrl;
    }

    return res.status(200).json(ApiResponse.success(result, 'Watch Later playlist retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/watch-later/:videoId
 * @desc    Add video to Watch Later
 * @access  Private
 */
const addToWatchLater = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, 'Video not found.');
    }

    const playlist = await getOrCreateWatchLater(req.user._id);

    const exists = playlist.videos.some(
      (item) => item.video && item.video.toString() === videoId.toString()
    );

    if (!exists) {
      playlist.videos.push({ video: video._id, addedAt: new Date() });
      if (!playlist.thumbnailUrl && video.thumbnailUrl) {
        playlist.thumbnailUrl = video.thumbnailUrl;
      }
      await playlist.save();
    }

    return res.status(200).json(
      ApiResponse.success(
        { isInWatchLater: true },
        exists ? 'Video already in Watch Later.' : 'Video added to Watch Later.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/watch-later/:videoId
 * @desc    Remove video from Watch Later
 * @access  Private
 */
const removeFromWatchLater = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const playlist = await getOrCreateWatchLater(req.user._id);

    playlist.videos = playlist.videos.filter(
      (item) => item.video && item.video.toString() !== videoId.toString()
    );

    await playlist.save();

    return res.status(200).json(
      ApiResponse.success({ isInWatchLater: false }, 'Video removed from Watch Later.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/watch-later/check/:videoId
 * @desc    Check if a video is in user's Watch Later
 * @access  Private
 */
const checkWatchLaterStatus = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const playlist = await Playlist.findOne({
      owner: req.user._id,
      systemType: 'watch_later'
    });

    const isInWatchLater =
      !!playlist &&
      playlist.videos.some(
        (item) => item.video && item.video.toString() === videoId.toString()
      );

    return res.status(200).json(
      ApiResponse.success({ isInWatchLater }, 'Watch Later status checked.')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchLater,
  addToWatchLater,
  removeFromWatchLater,
  checkWatchLaterStatus
};
