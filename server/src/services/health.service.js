/**
 * Health Check Service
 * VidTube Platform
 */
const { getDatabaseStatus } = require('../config/db');
const { config } = require('../config/env');

const getSystemHealth = () => {
  const dbStatus = getDatabaseStatus();

  return {
    success: true,
    message: 'VidTube API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus.status,
      connected: dbStatus.isConnected
    },
    version: '1.0.0'
  };
};

module.exports = { getSystemHealth };

