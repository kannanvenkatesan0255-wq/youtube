/**
 * Cloudinary Media Storage Service
 * VidTube Platform Architecture - Phase 3
 */
const cloudinary = require('../config/cloudinary');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');

/**
 * Generate Secure Upload Signature for Client Direct Upload
 * Allows browser to upload directly to Cloudinary without exposing API Secret
 */
const generateUploadSignature = ({ folder = 'vidtube/videos', resourceType = 'video', tags = [] }) => {
  if (!config.cloudinary.isConfigured) {
    logger.warn('Cloudinary is not fully configured in server/.env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
    return {
      isConfigured: false,
      message: 'Cloudinary credentials are not configured in server/.env'
    };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    folder,
    timestamp
  };

  if (tags && tags.length > 0) {
    paramsToSign.tags = Array.isArray(tags) ? tags.join(',') : tags;
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.cloudinary.apiSecret);

  return {
    isConfigured: true,
    signature,
    timestamp,
    apiKey: config.cloudinary.apiKey,
    cloudName: config.cloudinary.cloudName,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/${resourceType}/upload`
  };
};

/**
 * Server-Side Stream Upload to Cloudinary (Fallback / Internal Multipart Upload)
 */
const uploadStream = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!config.cloudinary.isConfigured) {
      return reject(new Error('Cloudinary credentials are not configured in server/.env'));
    }

    const defaultOptions = {
      folder: 'vidtube/videos',
      resource_type: 'auto',
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
      if (error) {
        logger.error('Cloudinary stream upload error:', error.message);
        return reject(error);
      }
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Delete Asset from Cloudinary
 * Handles both video and image resource types
 */
const deleteCloudinaryAsset = async (publicId, resourceType = 'video') => {
  if (!publicId) return { success: true, message: 'No publicId provided.' };

  if (!config.cloudinary.isConfigured) {
    logger.warn(`Cloudinary not configured. Skipping deletion of asset: ${publicId}`);
    return {
      success: false,
      unconfigured: true,
      message: 'Cloudinary credentials not configured'
    };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });

    logger.info(`Cloudinary asset deleted [${resourceType}]: ${publicId}`, result);
    return {
      success: result.result === 'ok' || result.result === 'not found',
      result
    };
  } catch (error) {
    logger.error(`Failed to delete Cloudinary asset [${publicId}]:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateUploadSignature,
  uploadStream,
  deleteCloudinaryAsset,
  isCloudinaryConfigured: () => config.cloudinary.isConfigured
};
