/**
 * Common Request Validation Helpers
 * VidTube Platform
 */
const { ApiError } = require('../utils/apiError');

/**
 * Validate MongoDB ObjectId string format
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Middleware to validate URL params containing IDs
 */
const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isValidObjectId(id)) {
      return next(ApiError.badRequest(`Invalid ${paramName} identifier format.`));
    }
    next();
  };
};

module.exports = {
  isValidObjectId,
  validateIdParam
};

