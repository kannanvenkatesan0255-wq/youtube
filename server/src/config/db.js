/**
 * MongoDB Atlas / Mongoose Connection Utility
 * VidTube Platform Architecture
 */
const mongoose = require('mongoose');
const { config } = require('./env');
const { logger } = require('../utils/logger');

let isConnected = false;
let connectionError = null;

/**
 * Connect to MongoDB Atlas / Local MongoDB
 */
const connectDB = async () => {
  if (!config.mongodbUri || config.mongodbUri === 'your_mongodb_connection_string') {
    logger.warn('MONGODB_URI is not configured in server/.env. Database operations will be deferred until configured.');
    isConnected = false;
    connectionError = 'MONGODB_URI not configured';
    return false;
  }

  try {
    const connectionOptions = {
      autoIndex: config.nodeEnv === 'development',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(config.mongodbUri, connectionOptions);

    isConnected = true;
    connectionError = null;
    logger.success(`MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    logger.error('MongoDB connection error:', error.message);
    logger.warn('VidTube server running in decoupled mode. Provide a valid MONGODB_URI in server/.env to enable live persistence.');
    return false;
  }
};

// Monitor connection events
mongoose.connection.on('connected', () => {
  isConnected = true;
  connectionError = null;
  logger.info('Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  connectionError = err.message;
  logger.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('Mongoose connection disconnected.');
});

/**
 * Get current database status
 */
const getDatabaseStatus = () => {
  const readyStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;

  return {
    isConnected: stateCode === 1,
    status: readyStates[stateCode] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    error: connectionError
  };
};

/**
 * Close database connection gracefully
 */
const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully.');
  }
};

module.exports = {
  connectDB,
  closeDB,
  getDatabaseStatus
};

