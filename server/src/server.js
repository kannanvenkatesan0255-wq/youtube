/**
 * VidTube Server Entry Point
 * Bootstraps Database, Express Application, and Server Listeners
 */
const app = require('./app');
const { config } = require('./config/env');
const { connectDB, closeDB } = require('./config/db');
const { logger } = require('./utils/logger');
const { initSocket } = require('./services/socket.service');

let server;

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();

    // Start HTTP Server
    server = app.listen(config.port, () => {
      console.log('\n==================================================');
      console.log('   VIDTUBE API SERVER — PHASE 10 PRODUCTION READY');
      console.log('==================================================');
      logger.info(`Server running in [${config.nodeEnv}] mode on port: ${config.port}`);
      logger.info(`Health check available at: http://localhost:${config.port}/api/health`);
      logger.info(`Client origin allowed: ${config.clientUrl}`);
      console.log('==================================================\n');
    });

    // Initialize Socket.IO real-time notification engine
    initSocket(server);
  } catch (error) {
    logger.error('Failed to start VidTube server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const handleGracefulShutdown = (signal) => {
  logger.info(`${signal} signal received. Shutting down VidTube gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeDB();
      logger.info('VidTube process terminated cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise);
  logger.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();

