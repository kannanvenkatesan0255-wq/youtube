/**
 * Video Controller
 * VidTube Platform Architecture - Phase 3 Video Upload & Management Engine
 */
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const {
  generateUploadSignature,
  deleteCloudinaryAsset,
  isCloudinaryConfigured
} = require('../services/cloudinary.service');
const { logger } = require('../utils/logger');
const { VIDEO_VISIBILITY, VIDEO_PROCESSING_STATUS } = require('../constants/appConstants');

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

module.exports = {
  getUploadSignature,
  createVideo,
  completeUpload,
  getPublicVideos,
  getMyVideos,
  getVideoById,
  updateVideo,
  updateThumbnail,
  updateVisibility,
  deleteVideo
};
