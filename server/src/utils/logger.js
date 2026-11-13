/**
 * Structured Console Logger
 * VidTube Platform
 */

const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = '') => {
    console.log(`\x1b[36m[INFO]\x1b[0m [${formatTimestamp()}] ${message}`, meta || '');
  },
  warn: (message, meta = '') => {
    console.warn(`\x1b[33m[WARN]\x1b[0m [${formatTimestamp()}] ${message}`, meta || '');
  },
  error: (message, error = '') => {
    console.error(`\x1b[31m[ERROR]\x1b[0m [${formatTimestamp()}] ${message}`, error || '');
  },
  success: (message, meta = '') => {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m [${formatTimestamp()}] ${message}`, meta || '');
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\x1b[35m[DEBUG]\x1b[0m [${formatTimestamp()}] ${message}`, meta || '');
    }
  }
};

module.exports = { logger };

