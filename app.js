'use strict';

require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const responseHandler = require('./common/responseHandlers');
const basicAuth = require('express-basic-auth');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Dual authentication support
const authUsers = {};
if (process.env.BASIC_USER && process.env.BASIC_PASS) {
  authUsers[process.env.BASIC_USER] = process.env.BASIC_PASS;
}
// Add Make.com credentials if they differ
authUsers['zodika'] = 'S3cr3tApi!';

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
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
