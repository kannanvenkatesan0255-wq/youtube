/**
 * VidTube Express Application Configuration
 * Full-Stack Video Sharing & Streaming Platform
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { config } = require('./config/env');
const apiRoutes = require('./routes/api.routes');
const { requestLogger } = require('./middleware/requestLogger');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Response compression for high-performance payload delivery
app.use(
  compression({
    threshold: 1024, // Only compress responses above 1KB
    level: 6
  })
);

// CORS configuration with credentials support for HttpOnly cookies
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Cookie parsing
app.use(cookieParser());

// Request parsing
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

// Root landing endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    platform: 'VidTube API',
    tagline: 'Professional Full-Stack Video Sharing & Adaptive Streaming Platform',
    version: '1.0.0',
    phase: 'Phase 10 — Production Ready & Optimized',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      videos: '/api/videos',
      shorts: '/api/shorts',
      channels: '/api/channels',
      playlists: '/api/playlists',
      history: '/api/history',
      recommendations: '/api/recommendations',
      studio: '/api/studio',
      admin: '/api/admin',
      apiBase: '/api'
    }
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
