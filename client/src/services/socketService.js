/**
 * Client Socket.IO Real-Time Service
 * VidTube Platform Architecture - Phase 6 Engagement Engine
 */
import { io } from 'socket.io-client';

let socket = null;

export const socketService = {
  /**
   * Connect socket using current JWT token
   */
  connect: (token) => {
    if (socket && socket.connected) return socket;

    const serverUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : 'http://localhost:5000';

    socket = io(serverUrl, {
      withCredentials: true,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.debug('[VidTube Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.debug('[VidTube Socket] Connection notice:', err.message);
    });

    return socket;
  },

  /**
   * Disconnect socket on logout
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Get active socket instance
   */
  getSocket: () => socket,

  /**
   * Subscribe to new notifications
   */
  onNotification: (callback) => {
    if (!socket) return () => {};
    socket.on('new_notification', callback);
    return () => socket.off('new_notification', callback);
  },

  /**
   * Join a content room for live comments/reactions
   */
  joinContent: (contentKey) => {
    if (socket && socket.connected) {
      socket.emit('join_content', contentKey);
    }
  },

  /**
   * Leave a content room
   */
  leaveContent: (contentKey) => {
    if (socket && socket.connected) {
      socket.emit('leave_content', contentKey);
    }
  }
};

export default socketService;
