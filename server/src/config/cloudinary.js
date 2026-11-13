/**
 * Cloudinary Media Storage Configuration
 * VidTube Platform Architecture
 * Prepared for Phase 2/3 video & thumbnail processing
 */
const cloudinary = require('cloudinary').v2;
const { config } = require('./env');
const { logger } = require('../utils/logger');

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
  logger.info('Cloudinary SDK configured.');
} else {
  logger.debug('Cloudinary credentials not yet provided in server/.env (will be used in Phase 2 for uploads).');
}

module.exports = cloudinary;

