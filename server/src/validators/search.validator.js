/**
 * Search Validation Middleware
 * VidTube Platform Architecture - Phase 7 Search Engine
 */
const { ApiError } = require('../utils/apiError');

/**
 * Validate Main Search Query Parameters
 */
const validateSearchQuery = (req, res, next) => {
  const { q, type, uploadDate, duration, sortBy, page, limit } = req.query;

  // Type filter
  const validTypes = ['all', 'video', 'short', 'channel'];
  if (type && !validTypes.includes(type.toLowerCase())) {
    return next(new ApiError(400, `Invalid type filter "${type}". Allowed: ${validTypes.join(', ')}`));
  }

  // Upload date filter
  const validUploadDates = ['all', 'hour', 'today', 'week', 'month', 'year'];
  if (uploadDate && !validUploadDates.includes(uploadDate.toLowerCase())) {
    return next(new ApiError(400, `Invalid uploadDate filter "${uploadDate}". Allowed: ${validUploadDates.join(', ')}`));
  }

  // Duration filter
  const validDurations = ['all', 'under4m', '4to20m', 'over20m'];
  if (duration && !validDurations.includes(duration.toLowerCase())) {
    return next(new ApiError(400, `Invalid duration filter "${duration}". Allowed: ${validDurations.join(', ')}`));
  }

  // Sorting
  const validSorts = ['relevance', 'date', 'views', 'rating'];
  if (sortBy && !validSorts.includes(sortBy.toLowerCase())) {
    return next(new ApiError(400, `Invalid sortBy option "${sortBy}". Allowed: ${validSorts.join(', ')}`));
  }

  // Pagination bounds
  if (page && (isNaN(page) || parseInt(page, 10) < 1)) {
    return next(new ApiError(400, 'Page parameter must be a positive integer.'));
  }

  if (limit && (isNaN(limit) || parseInt(limit, 10) < 1 || parseInt(limit, 10) > 50)) {
    return next(new ApiError(400, 'Limit parameter must be between 1 and 50.'));
  }

  next();
};

/**
 * Validate Autocomplete Suggestions Query
 */
const validateSearchSuggestions = (req, res, next) => {
  const { q } = req.query;
  if (q !== undefined && typeof q !== 'string') {
    return next(new ApiError(400, 'Search suggestions query must be a string.'));
  }
  next();
};

module.exports = {
  validateSearchQuery,
  validateSearchSuggestions
};
