/**
 * Environment Configuration
 * VidTube Platform Architecture - Phase 3
 */
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vidtube',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Authentication & Tokens
  jwtSecret: process.env.JWT_SECRET || 'vidtube_dev_access_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'vidtube_dev_refresh_secret_key_change_in_production_2026',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Cloudinary Media Storage
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    isConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  },

  // Upload Limits (configurable via environment)
  uploads: {
    maxVideoSizeMB: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 100, // 100 MB default
    maxShortSizeMB: parseInt(process.env.MAX_SHORT_SIZE_MB, 10) || 50, // 50 MB default for Shorts
    maxShortDurationSeconds: parseInt(process.env.MAX_SHORT_DURATION_SECONDS, 10) || 60, // 60s default
    maxThumbnailSizeMB: parseInt(process.env.MAX_THUMBNAIL_SIZE_MB, 10) || 5, // 5 MB default
    allowedVideoMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ],
    allowedThumbnailMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg'
    ]
  },

  // SMTP Email Configuration (Password recovery)
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'VidTube Security <noreply@vidtube.com>',
    isConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  }
};

module.exports = { config };
