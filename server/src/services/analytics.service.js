/**
 * Analytics Event Recording Service
 * VidTube Platform Architecture - Phase 8 Creator Studio & Channel Analytics
 */
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { logger } = require('../utils/logger');

/**
 * Record an analytics event asynchronously without blocking caller
 */
const recordEvent = async ({
  channelId,
  contentType = 'Video',
  contentId = null,
  eventType,
  value = 1,
  viewer = null,
  ipHash = ''
}) => {
  if (!channelId || !eventType) return;

  try {
    await AnalyticsEvent.create({
      channel: channelId,
      contentType,
      contentId,
      eventType,
      value: typeof value === 'number' && !isNaN(value) ? value : 1,
      viewer: viewer || null,
      ipHash: ipHash || '',
      createdAt: new Date()
    });
  } catch (error) {
    // Non-blocking error logging
    logger.debug(`[AnalyticsEvent Error]: ${error.message}`);
  }
};

module.exports = {
  recordEvent
};
