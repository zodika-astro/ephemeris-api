'use strict';

const logger = require('./logger'); 
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const responseHandler = require('./common/responseHandlers');
const basicAuth = require('express-basic-auth');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

// trust proxy X-Fowarded-For
app.set('trust proxy', 1);

// express rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
  headers: true,
});

// Security middleware
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/health', require('./routes/health'));

// Dual authentication support
const authUsers = {};
if (process.env.BASIC_USER && process.env.BASIC_PASS) {
  authUsers[process.env.BASIC_USER] = process.env.BASIC_PASS;
}

app.use(basicAuth({
  users: authUsers,
  challenge: true,
  unauthorizedResponse: {
    error: 'Unauthorized',
    documentation: 'https://your-docs-url'
  }
}));

// Routes
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// Error handling
app.use(responseHandler.handleErrorResponse);

// Server start (Railway handles this in production)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
