/**
 * 404 Not Found Middleware
 * VidTube Platform
 */
const { ApiError } = require('../utils/apiError');

const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Resource not found - Cannot ${req.method} ${req.originalUrl}`);
  next(error);
};

module.exports = { notFound };

