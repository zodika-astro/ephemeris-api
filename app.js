'use strict';

require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const responseHandler = require('./common/responseHandlers');
const basicAuth = require('express-basic-auth');
const helmet = require('helmet');
const cors = require('cors'); // Add CORS protection
const rateLimit = require('express-rate-limit'); // Add rate limiting

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false
});

// Parse JSON bodies from requests
app.use(express.json({ limit: '10kb' }));

// Log incoming requests
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic Authentication Configuration (for admin routes only)
const BASIC_USER = process.env.BASIC_USER;
const BASIC_PASS = process.env.BASIC_PASS;

if (!BASIC_USER || !BASIC_PASS) {
  console.warn('⚠️ Basic Auth credentials not set! Admin routes will be unprotected');
}

const basicAuthMiddleware = basicAuth({
  users: { [BASIC_USER]: BASIC_PASS },
  challenge: true,
  unauthorizedResponse: () => 'Unauthorized. Admin credentials required.'
});

// Public Routes (no authentication)
app.use('/', require('./routes/index'));

// API Routes (some public, some protected)
app.use('/api', apiLimiter); // Apply rate limiting to all API routes
app.use('/api', require('./routes/api')); // API key auth handled in routes/api.js

// Admin Routes (protected with Basic Auth)
app.use('/admin', basicAuthMiddleware, require('./routes/admin'));

// Final middleware for formatting responses
app.use(responseHandler.handleResponse);
app.use(responseHandler.handleErrorResponse);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = {
  app,
  server
};
