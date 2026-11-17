/**
 * Playlist Service
 * VidTube Platform Architecture - Phase 7 Playlist System
 */
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const { ApiError } = require('../utils/apiError');
const { VIDEO_VISIBILITY } = require('../constants/appConstants');

/**
 * Create Playlist
 */
const createPlaylist = async ({
  title,
  description = '',
  visibility = VIDEO_VISIBILITY.PUBLIC,
  videoId = null,
  userId,
  channelId = null
}) => {
  let thumbnailUrl = '';
  const initialVideos = [];

  if (videoId) {
    const video = await Video.findById(videoId);
    if (video) {
      initialVideos.push({ video: video._id, addedAt: new Date() });
      thumbnailUrl = video.thumbnailUrl || '';
    }
  }

  const playlist = await Playlist.create({
    title: title.trim(),
    description: description ? description.trim() : '',
    visibility,
    owner: userId,
    channel: channelId || undefined,
    videos: initialVideos,
    thumbnailUrl,
    isSystem: false,
    systemType: 'custom'
  });

  return playlist;
};

/**
 * Get Playlists for User or Channel
 */
const getUserPlaylists = async (userId, viewerUser = null) => {
  const isOwner = viewerUser && viewerUser._id.toString() === userId.toString();

  const filter = { owner: userId };
  if (!isOwner) {
    filter.visibility = VIDEO_VISIBILITY.PUBLIC;
  }

  const playlists = await Playlist.find(filter)
    .sort({ updatedAt: -1 })
    .populate({
      path: 'videos.video',
      select: 'title thumbnailUrl duration views createdAt channel',
      populate: { path: 'channel', select: 'name handle avatar' }
    });

  // Calculate dynamic thumbnail if not set
  return playlists.map((pl) => {
    const obj = pl.toObject();
    if (!obj.thumbnailUrl && obj.videos && obj.videos.length > 0 && obj.videos[0].video) {
      obj.thumbnailUrl = obj.videos[0].video.thumbnailUrl;
    }
    return obj;
  });
};

/**
 * Get Single Playlist with Populated Video Metadata
 */
const getPlaylistById = async (playlistId, viewerUser = null) => {
  const playlist = await Playlist.findById(playlistId)
    .populate('owner', 'username fullName avatar')
    .populate('channel', 'name handle avatar subscribersCount')
    .populate({
      path: 'videos.video',
      select: 'title description thumbnailUrl videoUrl duration views likesCount createdAt channel',
      populate: { path: 'channel', select: 'name handle avatar subscribersCount' }
    });

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found.');
  }

  if (playlist.visibility === VIDEO_VISIBILITY.PRIVATE) {
    const isOwner = viewerUser && (playlist.owner._id.equals(viewerUser._id) || viewerUser.role === 'admin');
    if (!isOwner) {
      throw new ApiError(403, 'Forbidden. This playlist is private.');
    }
  }

  const result = playlist.toObject();
  // Filter out any dangling deleted videos
  result.videos = result.videos.filter((item) => item.video != null);

  if (!result.thumbnailUrl && result.videos.length > 0 && result.videos[0].video) {
    result.thumbnailUrl = result.videos[0].video.thumbnailUrl;
  }

  return result;
};

/**
 * Update Playlist Details
 */
const updatePlaylist = async (playlistId, userId, updateData) => {
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found.');
  }

  if (!playlist.owner.equals(userId)) {
    throw new ApiError(403, 'Forbidden. You do not own this playlist.');
  }

  if (playlist.isSystem && updateData.title && updateData.title !== playlist.title) {
    throw new ApiError(400, 'Cannot rename system playlists.');
  }

  if (updateData.title) playlist.title = updateData.title.trim();
  if (updateData.description !== undefined) playlist.description = updateData.description.trim();
  if (updateData.visibility) playlist.visibility = updateData.visibility;
  if (updateData.thumbnailUrl) playlist.thumbnailUrl = updateData.thumbnailUrl;

  await playlist.save();
  return playlist;
};

/**
 * Delete Playlist
 */
const deletePlaylist = async (playlistId, userId) => {
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found.');
  }

  if (!playlist.owner.equals(userId)) {
    throw new ApiError(403, 'Forbidden. You do not own this playlist.');
  }

  if (playlist.isSystem) {
    throw new ApiError(400, 'System playlists cannot be deleted.');
  }

  await Playlist.findByIdAndDelete(playlistId);
  return true;
};

/**
 * Add Video to Playlist
 */
const addVideoToPlaylist = async (playlistId, videoId, userId) => {
  const [playlist, video] = await Promise.all([
    Playlist.findById(playlistId),
    Video.findById(videoId)
  ]);

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found.');
  }

  if (!video) {
    throw new ApiError(404, 'Video not found.');
  }

  if (!playlist.owner.equals(userId)) {
    throw new ApiError(403, 'Forbidden. You do not own this playlist.');
  }

  // Deduplicate
  const exists = playlist.videos.some(
    (item) => item.video && item.video.toString() === videoId.toString()
  );

  if (exists) {
    return { playlist, added: false, message: 'Video already in playlist.' };
  }

  playlist.videos.push({ video: video._id, addedAt: new Date() });
  if (!playlist.thumbnailUrl && video.thumbnailUrl) {
    playlist.thumbnailUrl = video.thumbnailUrl;
  }

  await playlist.save();
  return { playlist, added: true, message: 'Video added to playlist.' };
};

/**
 * Remove Video from Playlist
 */
const removeVideoFromPlaylist = async (playlistId, videoId, userId) => {
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found.');
  }

  if (!playlist.owner.equals(userId)) {
    throw new ApiError(403, 'Forbidden. You do not own this playlist.');
  }

  const initialLength = playlist.videos.length;
  playlist.videos = playlist.videos.filter(
    (item) => item.video && item.video.toString() !== videoId.toString()
  );

  if (playlist.videos.length === initialLength) {
    throw new ApiError(404, 'Video not found in playlist.');
  }

  await playlist.save();
  return playlist;
};

/**
 * Reorder Videos in Playlist
 */
const reorderVideos = async (playlistId, userId, { videoIds, fromIndex, toIndex }) => {
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found.');
  }

  if (!playlist.owner.equals(userId)) {
    throw new ApiError(403, 'Forbidden. You do not own this playlist.');
  }

  if (Array.isArray(videoIds)) {
    const videoMap = new Map();
    playlist.videos.forEach((item) => {
      videoMap.set(item.video.toString(), item);
    });

    const newVideos = [];
    videoIds.forEach((id) => {
      const found = videoMap.get(id.toString());
      if (found) {
        newVideos.push(found);
        videoMap.delete(id.toString());
      }
    });

    // Append any unmentioned videos to avoid data loss
    videoMap.forEach((item) => newVideos.push(item));
    playlist.videos = newVideos;
  } else if (fromIndex !== undefined && toIndex !== undefined) {
    if (
      fromIndex < 0 ||
      fromIndex >= playlist.videos.length ||
      toIndex < 0 ||
      toIndex >= playlist.videos.length
    ) {
      throw new ApiError(400, 'Reorder indexes out of range.');
    }
    const [moved] = playlist.videos.splice(fromIndex, 1);
    playlist.videos.splice(toIndex, 0, moved);
  }

  await playlist.save();
  return playlist;
};

module.exports = {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  reorderVideos
};
