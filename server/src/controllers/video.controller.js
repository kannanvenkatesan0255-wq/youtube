/**
 * Video Controller
 * VidTube Platform Architecture - Phase 3 & 4 Video Management, Playback & Streaming Engine
 */
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const WatchHistory = require('../models/WatchHistory');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const {
  generateUploadSignature,
  deleteCloudinaryAsset,
  generateHlsUrl,
  isCloudinaryConfigured
} = require('../services/cloudinary.service');
const { recordEvent } = require('../services/analytics.service');
const { logger } = require('../utils/logger');
const {
  VIDEO_VISIBILITY,
  VIDEO_PROCESSING_STATUS,
  VIEW_TRACKING
} = require('../constants/appConstants');

// In-memory view deduplication cache: key = `${videoId}:${viewerId}`, val = timestamp
const viewCache = new Map();

// Periodic cleanup of viewCache every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000;
  for (const [key, timestamp] of viewCache.entries()) {
    if (now - timestamp > maxAge) {
      viewCache.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * @route   POST /api/videos/upload-signature
 * @desc    Generate secure signature for client-side direct upload to Cloudinary
 * @access  Private (Authenticated users only)
 */
const getUploadSignature = async (req, res, next) => {
  try {
    const { resourceType = 'video', folder = 'vidtube/videos', tags = [] } = req.body;

    const signatureData = generateUploadSignature({
      folder,
      resourceType,
      tags
    });

    if (!signatureData.isConfigured) {
      return res.status(200).json(
        ApiResponse.success(
          {
            isConfigured: false,
            message: 'Cloudinary credentials are not configured in server/.env. Local metadata mode active.'
          },
          'Cloudinary not configured.'
        )
      );
    }

    return res.status(200).json(
      ApiResponse.success(signatureData, 'Upload signature generated successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/videos
 * @desc    Create new video record and metadata
 * @access  Private (Authenticated users only)
 */
const createVideo = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      category = 'All',
      tags = [],
      visibility = 'public',
      language = 'English',
      location = '',
      videoUrl = '',
      publicId = '',
      thumbnailUrl = '',
      thumbnailPublicId = '',
      duration = 0,
      width = 0,
      height = 0,
      format = '',
      fileSize = 0,
      resolution = ''
    } = req.body;

    // Retrieve creator's channel
    let channelId = req.user.channel?._id || req.user.channel;
    if (!channelId) {
      const channel = await Channel.findOne({ owner: req.user._id });
      if (!channel) {
        return next(new ApiError(400, 'User does not possess an active channel to upload videos.'));
      }
      channelId = channel._id;
    }

    const isInitialComplete = Boolean(videoUrl && publicId);

    const video = new Video({
      title,
      description,
      category,
      tags,
      visibility,
      language,
      location,
      videoUrl,
      publicId,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      thumbnailPublicId,
      duration,
      width,
      height,
      format,
      fileSize,
      resolution: resolution || (height >= 1080 ? '1080p' : height >= 720 ? '720p' : '480p'),
      processingStatus: isInitialComplete ? VIDEO_PROCESSING_STATUS.READY : VIDEO_PROCESSING_STATUS.UPLOADING,
      channel: channelId,
      owner: req.user._id,
      isPublished: visibility !== 'private'
    });

    await video.save();

    // If already ready, increment channel videos count
    if (isInitialComplete) {
      await Channel.findByIdAndUpdate(channelId, { $inc: { videosCount: 1 } });
    }

    const populatedVideo = await Video.findById(video._id)
      .populate('channel', 'name handle avatar isVerified')
      .populate('owner', 'name username avatar');

    logger.success(`Video metadata created [${video._id}]: "${video.title}" by ${req.user.username}`);

    return res.status(201).json(
      ApiResponse.created(populatedVideo, 'Video record created successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/videos/:id/complete
 * @desc    Confirm successful upload and update video technical metadata
 * @access  Private (Owner only)
 */
const completeUpload = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      videoUrl,
      publicId,
      thumbnailUrl,
      thumbnailPublicId,
      duration = 0,
      width = 0,
      height = 0,
      format = '',
      fileSize = 0,
      resolution = ''
    } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return next(new ApiError(404, 'Video record not found.'));
    }

    // Verify ownership
    if (!video.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Unauthorized. You can only confirm uploads for your own videos.'));
    }

    const wasReady = video.processingStatus === VIDEO_PROCESSING_STATUS.READY;

    // Update video metadata from Cloudinary response
    video.videoUrl = videoUrl;
    video.publicId = publicId;
    video.hlsUrl = req.body.hlsUrl || generateHlsUrl(publicId, videoUrl);
    if (thumbnailUrl) video.thumbnailUrl = thumbnailUrl;
    if (thumbnailPublicId) video.thumbnailPublicId = thumbnailPublicId;
    video.duration = duration;
    video.width = width;
    video.height = height;
    video.format = format;
    video.fileSize = fileSize;
    video.resolution = resolution || (height >= 1080 ? '1080p' : height >= 720 ? '720p' : '480p');
    video.processingStatus = VIDEO_PROCESSING_STATUS.READY;
    video.isPublished = video.visibility !== 'private';
    video.publishedAt = new Date();

    await video.save();

    // Increment channel video count if not already counted
    if (!wasReady) {
      await Channel.findByIdAndUpdate(video.channel, { $inc: { videosCount: 1 } });
    }

    const updatedVideo = await Video.findById(video._id)
      .populate('channel', 'name handle avatar isVerified')
      .populate('owner', 'name username avatar');

    logger.success(`Video upload completed & verified [${video._id}]: "${video.title}"`);

    return res.status(200).json(
      ApiResponse.success(updatedVideo, 'Video upload finalized and ready for streaming.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/videos
 * @desc    Get public videos with pagination, filtering & search
 * @access  Public
 */
const getPublicVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { category, search, sortBy = 'latest' } = req.query;

    // Strict filter: Public videos only, ready status
    const query = {
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.READY
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'views') {
      sortOptions = { views: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('channel', 'name handle avatar isVerified')
        .populate('owner', 'name username avatar'),
      Video.countDocuments(query)
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          videos,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        },
        'Public videos retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/videos/my-videos
 * @desc    Get authenticated user's uploaded videos (All visibilities & processing states)
 * @access  Private (Authenticated users only)
 */
const getMyVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { visibility, processingStatus, search, sortBy = 'latest' } = req.query;

    const query = { owner: req.user._id };

    if (visibility && visibility !== 'all') {
      query.visibility = visibility;
    }

    if (processingStatus && processingStatus !== 'all') {
      query.processingStatus = processingStatus;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'views') {
      sortOptions = { views: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'title') {
      sortOptions = { title: 1 };
    }

    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('channel', 'name handle avatar isVerified'),
      Video.countDocuments(query)
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          videos,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        },
        'Creator videos retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/videos/:id
 * @desc    Get single video details by ID with visibility authorization
 * @access  Public (Subject to video visibility constraints)
 */
const getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id)
      .populate('channel', 'name handle avatar isVerified subscribersCount')
      .populate('owner', 'name username avatar');

    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // Visibility Access Rule:
    // 1. Private videos can only be accessed by the video owner or admin
    if (video.visibility === VIDEO_VISIBILITY.PRIVATE) {
      if (!req.user || (!video.owner._id.equals(req.user._id) && req.user.role !== 'admin')) {
        return next(
          new ApiError(403, 'This video is private. You do not have permission to view it.')
        );
      }
    }

    // 2. Unlisted & Public videos are accessible directly by URL
    return res.status(200).json(
      ApiResponse.success(video, 'Video details retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/videos/:id
 * @desc    Update video metadata (title, description, category, tags, language, location)
 * @access  Private (Owner only)
 */
const updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, visibility, language, location } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // Verify ownership
    if (!video.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You do not have permission to edit this video.'));
    }

    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (category !== undefined) video.category = category;
    if (tags !== undefined) video.tags = tags;
    if (visibility !== undefined) {
      video.visibility = visibility;
      video.isPublished = visibility !== 'private';
    }
    if (language !== undefined) video.language = language;
    if (location !== undefined) video.location = location;

    await video.save();

    const updatedVideo = await Video.findById(video._id)
      .populate('channel', 'name handle avatar isVerified')
      .populate('owner', 'name username avatar');

    logger.info(`Video updated [${video._id}]: "${video.title}"`);

    return res.status(200).json(
      ApiResponse.success(updatedVideo, 'Video details updated successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/videos/:id/thumbnail
 * @desc    Update video thumbnail URL & Cloudinary public ID
 * @access  Private (Owner only)
 */
const updateThumbnail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { thumbnailUrl, thumbnailPublicId } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // Verify ownership
    if (!video.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You do not have permission to update this video thumbnail.'));
    }

    // If an existing custom Cloudinary thumbnail is being replaced, clean up the old asset
    if (video.thumbnailPublicId && video.thumbnailPublicId !== thumbnailPublicId) {
      await deleteCloudinaryAsset(video.thumbnailPublicId, 'image');
    }

    video.thumbnailUrl = thumbnailUrl;
    if (thumbnailPublicId) video.thumbnailPublicId = thumbnailPublicId;

    await video.save();

    logger.info(`Thumbnail updated for video [${video._id}]`);

    return res.status(200).json(
      ApiResponse.success(video, 'Thumbnail updated successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/videos/:id/visibility
 * @desc    Update video visibility setting (public, unlisted, private)
 * @access  Private (Owner only)
 */
const updateVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // Verify ownership
    if (!video.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You do not have permission to update this video visibility.'));
    }

    video.visibility = visibility;
    video.isPublished = visibility !== 'private';

    await video.save();

    logger.info(`Visibility updated for video [${video._id}] to "${visibility}"`);

    return res.status(200).json(
      ApiResponse.success(video, `Video visibility changed to ${visibility}.`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete video and purge associated assets from Cloudinary
 * @access  Private (Owner only)
 */
const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // Verify ownership
    if (!video.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You do not have permission to delete this video.'));
    }

    let cleanupError = null;

    // 1. Delete Video Asset from Cloudinary
    if (video.publicId) {
      const vidCleanup = await deleteCloudinaryAsset(video.publicId, 'video');
      if (!vidCleanup.success && !vidCleanup.unconfigured) {
        cleanupError = `Failed to purge video asset: ${vidCleanup.error}`;
      }
    }

    // 2. Delete Thumbnail Asset from Cloudinary
    if (video.thumbnailPublicId) {
      const thumbCleanup = await deleteCloudinaryAsset(video.thumbnailPublicId, 'image');
      if (!thumbCleanup.success && !thumbCleanup.unconfigured) {
        cleanupError = (cleanupError ? `${cleanupError}; ` : '') + `Failed to purge thumbnail asset: ${thumbCleanup.error}`;
      }
    }

    // 3. Decrement Channel video count
    await Channel.findByIdAndUpdate(video.channel, {
      $inc: { videosCount: -1 }
    });

    // 4. Remove database record
    await Video.findByIdAndDelete(id);

    logger.success(`Video deleted [${id}]: "${video.title}"`);

    return res.status(200).json(
      ApiResponse.success(
        {
          deletedId: id,
          cleanedUpCloudinary: !cleanupError,
          cleanupWarning: cleanupError
        },
        'Video and associated media assets successfully deleted.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/videos/:id/playback
 * @desc    Get authorized playback stream info, HLS manifest, and player metadata
 * @access  Public / Private (Enforces video visibility rules)
 */
const getPlaybackInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id)
      .populate('channel', 'name handle avatar isVerified subscribersCount')
      .populate('owner', 'name username avatar');

    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // Visibility Check: Private video requires owner or admin
    if (video.visibility === VIDEO_VISIBILITY.PRIVATE) {
      const isOwner = req.user && (video.owner._id.equals(req.user._id) || req.user.role === 'admin');
      if (!isOwner) {
        return next(
          new ApiError(403, 'This video is private. You do not have permission to play it.')
        );
      }
    }

    // Check processing status
    if (video.processingStatus === VIDEO_PROCESSING_STATUS.FAILED) {
      return next(new ApiError(422, 'Video processing failed and media is unavailable for playback.'));
    }

    // Resolve or generate adaptive HLS URL
    const hlsUrl = video.hlsUrl || generateHlsUrl(video.publicId, video.videoUrl);

    // Build authorized playback payload
    const playbackData = {
      _id: video._id,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      hlsUrl: hlsUrl || null,
      hasHls: Boolean(hlsUrl),
      format: video.format || 'mp4',
      duration: video.duration || 0,
      resolution: video.resolution || (video.height >= 1080 ? '1080p' : video.height >= 720 ? '720p' : '480p'),
      width: video.width || 0,
      height: video.height || 0,
      aspectRatio: video.aspectRatio || '16:9',
      thumbnailUrl: video.thumbnailUrl,
      views: video.views,
      likesCount: video.likesCount,
      dislikesCount: video.dislikesCount,
      category: video.category,
      tags: video.tags,
      visibility: video.visibility,
      processingStatus: video.processingStatus,
      channel: video.channel,
      owner: video.owner,
      isOwner: req.user ? (video.owner._id?.equals(req.user._id) || video.owner.equals(req.user._id)) : false,
      publishedAt: video.publishedAt || video.createdAt,
      createdAt: video.createdAt
    };

    return res.status(200).json(
      ApiResponse.success(playbackData, 'Playback details retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/videos/:id/view
 * @desc    Record legitimate video view with server-side debounce and cooldown
 * @access  Public (Optional auth for registered viewers)
 */
const trackVideoView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { watchTime } = req.body;

    const video = await Video.findById(id);
    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // If private, ensure caller is authorized
    if (video.visibility === VIDEO_VISIBILITY.PRIVATE) {
      const isOwner = req.user && (video.owner.equals(req.user._id) || req.user.role === 'admin');
      if (!isOwner) {
        return next(new ApiError(403, 'Cannot track view for unauthorized private video.'));
      }
    }

    // Deduplication check
    const viewerId = req.user
      ? `user:${req.user._id}`
      : `ip:${req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'}`;
    const cacheKey = `${id}:${viewerId}`;
    const now = Date.now();
    const lastViewed = viewCache.get(cacheKey);
    const cooldownMs = VIEW_TRACKING.COOLDOWN_SECONDS * 1000;

    if (lastViewed && (now - lastViewed < cooldownMs)) {
      return res.status(200).json(
        ApiResponse.success(
          {
            views: video.views,
            incremented: false,
            cooldownRemainingSeconds: Math.ceil((cooldownMs - (now - lastViewed)) / 1000)
          },
          'View already counted recently (cooldown active).'
        )
      );
    }

    // Minimum watch-time verification (if provided)
    if (watchTime !== undefined && watchTime < VIEW_TRACKING.MIN_WATCH_SECONDS) {
      return res.status(200).json(
        ApiResponse.success(
          { views: video.views, incremented: false },
          `Watch duration must be at least ${VIEW_TRACKING.MIN_WATCH_SECONDS}s to record view.`
        )
      );
    }

    // Increment video views and channel totalViews atomically
    const updatedVideo = await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (video.channel) {
      await Channel.findByIdAndUpdate(video.channel, { $inc: { totalViews: 1 } });
      recordEvent({
        channelId: video.channel,
        contentType: 'Video',
        contentId: video._id,
        eventType: 'view',
        value: 1,
        viewer: req.user ? req.user._id : null
      });
      if (watchTime) {
        recordEvent({
          channelId: video.channel,
          contentType: 'Video',
          contentId: video._id,
          eventType: 'watch_time',
          value: watchTime,
          viewer: req.user ? req.user._id : null
        });
      }
    }

    viewCache.set(cacheKey, now);

    return res.status(200).json(
      ApiResponse.success(
        {
          views: updatedVideo.views,
          incremented: true
        },
        'Video view recorded successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/videos/:id/progress
 * @desc    Save playback progress for continue-watching and resume
 * @access  Private (Authenticated users only)
 */
const savePlaybackProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress, duration } = req.body;

    const video = await Video.findById(id);
    if (!video) {
      return next(new ApiError(404, 'Video not found.'));
    }

    // Private video check
    if (video.visibility === VIDEO_VISIBILITY.PRIVATE) {
      const isOwner = video.owner.equals(req.user._id) || req.user.role === 'admin';
      if (!isOwner) {
        return next(new ApiError(403, 'Cannot save progress for private video.'));
      }
    }

    const watchedSeconds = Math.max(0, Math.floor(progress));
    const totalDuration = Math.max(0, Math.floor(duration || video.duration || 0));
    const completed = totalDuration > 0 ? (watchedSeconds / totalDuration >= 0.9) : false;

    const history = await WatchHistory.findOneAndUpdate(
      { user: req.user._id, video: id },
      {
        $set: {
          watchedSeconds,
          duration: totalDuration,
          completed,
          lastWatchedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (video.channel) {
      if (watchedSeconds > 0) {
        recordEvent({
          channelId: video.channel,
          contentType: 'Video',
          contentId: video._id,
          eventType: 'watch_time',
          value: watchedSeconds,
          viewer: req.user._id
        });
      }
      if (completed) {
        recordEvent({
          channelId: video.channel,
          contentType: 'Video',
          contentId: video._id,
          eventType: 'completion',
          value: 1,
          viewer: req.user._id
        });
      }
    }

    return res.status(200).json(
      ApiResponse.success(
        {
          videoId: id,
          progress: history.watchedSeconds,
          duration: history.duration,
          completed: history.completed,
          lastWatchedAt: history.lastWatchedAt
        },
        'Playback progress saved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/videos/:id/progress
 * @desc    Retrieve saved playback progress to resume watching
 * @access  Private (Authenticated users only)
 */
const getPlaybackProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await WatchHistory.findOne({
      user: req.user._id,
      video: id
    });

    if (!history) {
      return res.status(200).json(
        ApiResponse.success(
          { progress: 0, duration: 0, completed: false, hasHistory: false },
          'No watch progress found for this video.'
        )
      );
    }

    return res.status(200).json(
      ApiResponse.success(
        {
          videoId: id,
          progress: history.watchedSeconds,
          duration: history.duration,
          completed: history.completed,
          lastWatchedAt: history.lastWatchedAt,
          hasHistory: true
        },
        'Playback progress retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/videos/:id/related
 * @desc    Get related video recommendations excluding current video
 * @access  Public
 */
const getRelatedVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 15));

    const currentVideo = await Video.findById(id);
    if (!currentVideo) {
      return next(new ApiError(404, 'Video not found.'));
    }

    const baseFilter = {
      _id: { $ne: currentVideo._id },
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.READY
    };

    // Primary search: same category or matching tags
    const categoryFilter = {
      ...baseFilter,
      $or: [
        { category: currentVideo.category },
        { tags: { $in: currentVideo.tags || [] } }
      ]
    };

    let related = await Video.find(categoryFilter)
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('channel', 'name handle avatar isVerified')
      .lean();

    // If fewer than limit, backfill with general public ready videos
    if (related.length < limit) {
      const existingIds = [currentVideo._id, ...related.map((v) => v._id)];
      const backfillLimit = limit - related.length;
      const backfill = await Video.find({
        _id: { $nin: existingIds },
        visibility: VIDEO_VISIBILITY.PUBLIC,
        processingStatus: VIDEO_PROCESSING_STATUS.READY
      })
        .sort({ createdAt: -1 })
        .limit(backfillLimit)
        .populate('channel', 'name handle avatar isVerified')
        .lean();

      related = [...related, ...backfill];
    }

    return res.status(200).json(
      ApiResponse.success(
        { videos: related, count: related.length },
        'Related videos retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUploadSignature,
  createVideo,
  completeUpload,
  getPublicVideos,
  getMyVideos,
  getVideoById,
  getPlaybackInfo,
  trackVideoView,
  savePlaybackProgress,
  getPlaybackProgress,
  getRelatedVideos,
  updateVideo,
  updateThumbnail,
  updateVisibility,
  deleteVideo
};
