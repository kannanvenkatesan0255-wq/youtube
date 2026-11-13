/**
 * Health Controller
 * VidTube Platform
 */
const { getSystemHealth } = require('../services/health.service');

/**
 * @route   GET /api/health
 * @desc    Health check endpoint returning system status
 * @access  Public
 */
const checkHealth = (req, res) => {
  const healthData = getSystemHealth();
  return res.status(200).json(healthData);
};

module.exports = { checkHealth };

