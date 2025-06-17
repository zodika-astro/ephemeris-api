'use strict';

require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const responseHandler = require('./common/responseHandlers');
const basicAuth = require('express-basic-auth');
const helmet = require('helmet');

const app = express();

// Apply Helmet to secure HTTP headers
app.use(helmet());

// Parse JSON bodies from requests
app.use(express.json());

// Log incoming requests
app.use(logger('combined'));

// Basic Authentication
const BASIC_USER = process.env.BASIC_USER;
const BASIC_PASS = process.env.BASIC_PASS;

console.log('BASIC_USER:', BASIC_USER ? 'Set' : 'Not Set');
console.log('BASIC_PASS:', BASIC_PASS ? 'Set' : 'Not Set');

app.use(basicAuth({
  users: { [BASIC_USER]: BASIC_PASS },
  challenge: true
}));

// Routing setup
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// Final middleware for formatting responses
app.use(responseHandler.handleResponse);
app.use(responseHandler.handleErrorResponse);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = {
  app
};
