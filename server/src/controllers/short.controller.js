/**
 * Shorts Controller
 * VidTube Platform Architecture - Phase 5 Shorts Engine
 */
const Short = require('../models/Short');
const Channel = require('../models/Channel');
const { ApiError } = require('../utils/apiError');
const { ApiResponse } = require('../utils/apiResponse');
const {
  generateUploadSignature,
  deleteCloudinaryAsset
} = require('../services/cloudinary.service');
const { recordEvent } = require('../services/analytics.service');
const { logger } = require('../utils/logger');
const {
  VIDEO_VISIBILITY,
  VIDEO_PROCESSING_STATUS,
  VIEW_TRACKING
} = require('../constants/appConstants');

// In-memory view deduplication cache for Shorts: key = `${shortId}:${viewerId}`, val = timestamp
const shortViewCache = new Map();

// Periodic cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000;
  for (const [key, timestamp] of shortViewCache.entries()) {
    if (now - timestamp > maxAge) {
      shortViewCache.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * @route   POST /api/shorts/upload-signature
 * @desc    Generate secure upload signature for direct Cloudinary Shorts upload
 * @access  Private (Authenticated creators)
 */
const getShortUploadSignature = async (req, res, next) => {
  try {
    const signatureData = generateUploadSignature({
      folder: 'vidtube/shorts',
      resourceType: 'video'
    });

    return res.status(200).json(
      ApiResponse.success(signatureData, 'Shorts upload signature generated successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/shorts
 * @desc    Create new Short metadata record
 * @access  Private (Authenticated creators)
 */
const createShort = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      videoUrl = '',
      publicId = '',
      thumbnailUrl = '',
      thumbnailPublicId = '',
      duration = 0,
      width = 0,
      height = 0,
      aspectRatio = '9:16',
      format = 'mp4',
      fileSize = 0,
      tags = [],
      visibility = VIDEO_VISIBILITY.PUBLIC,
      soundTitle = 'Original Audio'
    } = req.body;

    let channelId = req.user.channel?._id || req.user.channel;
    if (!channelId) {
      const channel = await Channel.findOne({ owner: req.user._id });
      if (!channel) {
        return next(new ApiError(400, 'User does not possess an active channel to upload Shorts.'));
      }
      channelId = channel._id;
    }

    const isInitialComplete = Boolean(videoUrl && publicId);

    const short = new Short({
      title,
      description,
      videoUrl,
      publicId,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&h=1280&fit=crop',
      thumbnailPublicId,
      duration,
      width,
      height,
      aspectRatio: width && height ? (height >= width ? '9:16' : '16:9') : aspectRatio,
      format,
      fileSize,
      tags,
      visibility,
      soundTitle,
      processingStatus: isInitialComplete ? VIDEO_PROCESSING_STATUS.READY : VIDEO_PROCESSING_STATUS.UPLOADING,
      channel: channelId,
      owner: req.user._id,
      isPublished: visibility !== 'private'
    });

    await short.save();

    const populatedShort = await Short.findById(short._id)
      .populate('channel', 'name handle avatar isVerified subscribersCount')
      .populate('owner', 'name username avatar');

    logger.success(`Short record created [${short._id}]: "${short.title}" by ${req.user.username}`);

    return res.status(201).json(
      ApiResponse.created(populatedShort, 'Short record created successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/shorts/:id/complete
 * @desc    Confirm successful upload and update technical metadata
 * @access  Private (Owner only)
 */
const completeShortUpload = async (req, res, next) => {
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
      format = 'mp4',
      fileSize = 0,
      aspectRatio
    } = req.body;

    const short = await Short.findById(id);
    if (!short) {
      return next(new ApiError(404, 'Short record not found.'));
    }

    if (!short.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Unauthorized. You can only confirm uploads for your own Shorts.'));
    }

    short.videoUrl = videoUrl;
    short.publicId = publicId;
    if (thumbnailUrl) short.thumbnailUrl = thumbnailUrl;
    if (thumbnailPublicId) short.thumbnailPublicId = thumbnailPublicId;
    short.duration = duration;
    short.width = width;
    short.height = height;
    short.aspectRatio = aspectRatio || (width && height && height >= width ? '9:16' : '9:16');
    short.format = format;
    short.fileSize = fileSize;
    short.processingStatus = VIDEO_PROCESSING_STATUS.READY;
    short.isPublished = short.visibility !== 'private';
    short.publishedAt = new Date();

    await short.save();

    const populatedShort = await Short.findById(short._id)
      .populate('channel', 'name handle avatar isVerified subscribersCount')
      .populate('owner', 'name username avatar');

    logger.success(`Short upload confirmed ready [${short._id}]: "${short.title}"`);

    return res.status(200).json(
      ApiResponse.success(populatedShort, 'Short upload marked complete and ready for streaming.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/shorts
 * @desc    Get dedicated Shorts feed (public, ready, paginated)
 * @access  Public
 */
const getShortsFeed = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {
      visibility: VIDEO_VISIBILITY.PUBLIC,
      processingStatus: VIDEO_PROCESSING_STATUS.READY
    };

    const [shorts, total] = await Promise.all([
      Short.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('channel', 'name handle avatar isVerified subscribersCount')
        .populate('owner', 'name username avatar')
        .lean(),
      Short.countDocuments(query)
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          shorts,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total
          }
        },
        'Shorts feed retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/shorts/my-shorts
 * @desc    Get creator's own uploaded Shorts
 * @access  Private (Authenticated creators)
 */
const getMyShorts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { visibility, search } = req.query;
    const query = { owner: req.user._id };

    if (visibility && visibility !== 'all') {
      query.visibility = visibility;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const [shorts, total] = await Promise.all([
      Short.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('channel', 'name handle avatar isVerified subscribersCount')
        .lean(),
      Short.countDocuments(query)
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          shorts,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        },
        'Creator Shorts retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/shorts/:id
 * @desc    Get single Short by ID (enforcing private visibility authorization)
 * @access  Public / Private
 */
const getShortById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const short = await Short.findById(id)
      .populate('channel', 'name handle avatar isVerified subscribersCount')
      .populate('owner', 'name username avatar');

    if (!short) {
      return next(new ApiError(404, 'Short not found.'));
    }

    // Private Short authorization check
    if (short.visibility === VIDEO_VISIBILITY.PRIVATE) {
      const isOwner = req.user && (short.owner._id.equals(req.user._id) || req.user.role === 'admin');
      if (!isOwner) {
        return next(
          new ApiError(403, 'This Short is private. You do not have permission to view it.')
        );
      }
    }

    return res.status(200).json(
      ApiResponse.success(short, 'Short retrieved successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/shorts/:id/view
 * @desc    Record legitimate Short view with cooldown debounce
 * @access  Public (Optional auth)
 */
const trackShortView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { watchTime } = req.body;

    const short = await Short.findById(id);
    if (!short) {
      return next(new ApiError(404, 'Short not found.'));
    }

    if (short.visibility === VIDEO_VISIBILITY.PRIVATE) {
      const isOwner = req.user && (short.owner.equals(req.user._id) || req.user.role === 'admin');
      if (!isOwner) {
        return next(new ApiError(403, 'Cannot track view for unauthorized private Short.'));
      }
    }

    const viewerId = req.user
      ? `user:${req.user._id}`
      : `ip:${req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'}`;
    const cacheKey = `${id}:${viewerId}`;
    const now = Date.now();
    const lastViewed = shortViewCache.get(cacheKey);
    const cooldownMs = VIEW_TRACKING.COOLDOWN_SECONDS * 1000;

    if (lastViewed && (now - lastViewed < cooldownMs)) {
      return res.status(200).json(
        ApiResponse.success(
          {
            views: short.views,
            incremented: false,
            counted: false,
            cooldown: true,
            cooldownRemainingSeconds: Math.ceil((cooldownMs - (now - lastViewed)) / 1000)
          },
          'Short view already recorded recently (cooldown active).'
        )
      );
    }

    // Minimum watch-time for Shorts: at least 2 seconds
    if (watchTime !== undefined && watchTime < 2) {
      return res.status(200).json(
        ApiResponse.success(
          { views: short.views, incremented: false, counted: false },
          'Watch duration must be at least 2s to record Short view.'
        )
      );
    }

    const updatedShort = await Short.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (short.channel) {
      await Channel.findByIdAndUpdate(short.channel, { $inc: { totalViews: 1 } });
      recordEvent({
        channelId: short.channel,
        contentType: 'Short',
        contentId: short._id,
        eventType: 'view',
        value: 1,
        viewer: req.user ? req.user._id : null
      });
      if (watchTime) {
        recordEvent({
          channelId: short.channel,
          contentType: 'Short',
          contentId: short._id,
          eventType: 'watch_time',
          value: watchTime,
          viewer: req.user ? req.user._id : null
        });
      }
    }

    shortViewCache.set(cacheKey, now);

    return res.status(200).json(
      ApiResponse.success(
        { views: updatedShort.views, incremented: true, counted: true },
        'Short view recorded successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/shorts/:id
 * @desc    Update Short metadata (title, description, soundTitle, tags)
 * @access  Private (Owner only)
 */
const updateShort = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, soundTitle, tags } = req.body;

    const short = await Short.findById(id);
    if (!short) {
      return next(new ApiError(404, 'Short not found.'));
    }

    if (!short.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You do not have permission to edit this Short.'));
    }

    if (title !== undefined) short.title = title;
    if (description !== undefined) short.description = description;
    if (soundTitle !== undefined) short.soundTitle = soundTitle;
    if (tags !== undefined) short.tags = tags;

    await short.save();

    const updatedShort = await Short.findById(id)
      .populate('channel', 'name handle avatar isVerified subscribersCount')
      .populate('owner', 'name username avatar');

    logger.info(`Short updated [${id}]: "${short.title}"`);

    return res.status(200).json(
      ApiResponse.success(updatedShort, 'Short updated successfully.')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/shorts/:id/visibility
 * @desc    Update Short visibility (public, unlisted, private)
 * @access  Private (Owner only)
 */
const updateShortVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    const short = await Short.findById(id);
    if (!short) {
      return next(new ApiError(404, 'Short not found.'));
    }

    if (!short.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You do not have permission to modify this Short.'));
    }

    short.visibility = visibility;
    short.isPublished = visibility !== 'private';
    await short.save();

    logger.info(`Short visibility updated [${id}] to "${visibility}"`);

    return res.status(200).json(
      ApiResponse.success(
        { _id: short._id, visibility: short.visibility, isPublished: short.isPublished },
        `Short visibility set to ${visibility}.`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/shorts/:id
 * @desc    Delete Short and purge Cloudinary assets
 * @access  Private (Owner only)
 */
const deleteShort = async (req, res, next) => {
  try {
    const { id } = req.params;

    const short = await Short.findById(id);
    if (!short) {
      return next(new ApiError(404, 'Short not found.'));
    }

    if (!short.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden. You do not have permission to delete this Short.'));
    }

    // Purge asset from Cloudinary
    if (short.publicId) {
      await deleteCloudinaryAsset(short.publicId, 'video').catch((err) => {
        logger.warn(`Failed to delete Cloudinary asset for Short [${id}]: ${err.message}`);
      });
    }

    await Short.findByIdAndDelete(id);

    logger.success(`Short deleted [${id}]: "${short.title}"`);

    return res.status(200).json(
      ApiResponse.success(
        { deletedId: id },
        'Short and associated media successfully deleted.'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShortUploadSignature,
  createShort,
  completeShortUpload,
  getShortsFeed,
  getMyShorts,
  getShortById,
  trackShortView,
  updateShort,
  updateShortVisibility,
  deleteShort
};
