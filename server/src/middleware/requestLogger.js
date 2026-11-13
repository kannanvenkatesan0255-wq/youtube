/**
 * Request Logging Middleware
 * VidTube Platform
 */
const { logger } = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMethod = res.statusCode >= 400 ? logger.warn : logger.info;
    logMethod(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};

module.exports = { requestLogger };

