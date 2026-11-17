/**
 * Socket.IO Real-Time Service
 * VidTube Platform Architecture - Phase 6 Engagement & Notification Engine
 * Provides authenticated WebSockets, user-isolated notification rooms, and event dispatch
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');
const User = require('../models/User');

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication Middleware for Incoming Sockets
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also check handshake headers or cookies
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token && socket.handshake.headers?.cookie) {
        const match = socket.handshake.headers.cookie.match(/accessToken=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }

      if (!token) {
        // Allow unauthenticated socket connections for public room events if needed,
        // but mark as guest without a user room
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('_id username name avatar');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.debug(`Socket authentication skipped or failed: ${err.message}`);
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.user) {
      const userRoom = `user:${socket.user._id}`;
      socket.join(userRoom);
      logger.debug(`Socket connected [${socket.id}] - Joined user room: ${userRoom}`);
    } else {
      logger.debug(`Socket connected [${socket.id}] as guest`);
    }

    // Join content-specific room (for real-time comments on a video or short)
    socket.on('join_content', (contentKey) => {
      if (contentKey && typeof contentKey === 'string') {
        socket.join(`content:${contentKey}`);
      }
    });

    socket.on('leave_content', (contentKey) => {
      if (contentKey && typeof contentKey === 'string') {
        socket.leave(`content:${contentKey}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected [${socket.id}] - Reason: ${reason}`);
    });
  });

  logger.info('Socket.IO real-time notification engine initialized.');
  return io;
};

/**
 * Get active IO instance
 */
const getIO = () => io;

/**
 * Emit event to a specific user's private notification room
 */
const emitToUser = (userId, event, data) => {
  if (!io || !userId) return;
  const userRoom = `user:${userId.toString()}`;
  io.to(userRoom).emit(event, data);
};

/**
 * Emit event to a specific content room (e.g. comments on a video/short)
 */
const emitToContent = (contentKey, event, data) => {
  if (!io || !contentKey) return;
  io.to(`content:${contentKey}`).emit(event, data);
};

/**
 * Broadcast event to all connected clients
 */
const emitGlobal = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToContent,
  emitGlobal
};
