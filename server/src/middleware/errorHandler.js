/**
 * Centralized Error Handling Middleware
 * VidTube Platform
 */
const { ApiError } = require('../utils/apiError');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert generic Error to ApiError if necessary
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Log error in development or 500s
  if (config.nodeEnv === 'development' || error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${error.statusCode} ${error.message}`);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || []
  };

  // Include stack trace only in development
  if (config.nodeEnv === 'development') {
    response.stack = error.stack;
  }

  return res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };

