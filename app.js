'use strict';
const express = require('express');
const logger = require('morgan');
const responseHandler = require('./common/responseHandlers');
const basicAuth = require('express-basic-auth');
const helmet = require('helmet'); // Import Helmet middleware

const app = express();

// Apply Helmet to secure HTTP headers, protecting against common web vulnerabilities.
app.use(helmet());

// Middleware to parse JSON bodies from incoming requests.
app.use(express.json());

// HTTP request logger middleware. 'combined' is a standard Apache log format.
app.use(logger('combined'));

// Basic Authentication configuration.
// Retrieves credentials from environment variables for security.
const BASIC_USER = process.env.BASIC_USER;
const BASIC_PASS = process.env.BASIC_PASS;

// Log credentials (for debugging/verification, be cautious in production).
// In production, consider removing or obscuring these logs.
console.log('BASIC_USER:', BASIC_USER ? 'Set' : 'Not Set');
console.log('BASIC_PASS:', BASIC_PASS ? 'Set' : 'Not Set');

// Apply basic authentication to all incoming requests.
app.use(basicAuth({
  users: { [BASIC_USER]: BASIC_PASS }, // Dynamically sets username and password
  challenge: true // Sends 'WWW-Authenticate' header, prompting browser for credentials
}));

// Start the server on the port expected by the hosting environment (e.g., Railway).
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Main API routes.
// The root route ('/') usually serves basic info or redirects.
// '/api' serves the core API endpoints.
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// Global response handling middleware.
// Ensures consistent response formats and error handling across the application.
app.use(responseHandler.handleResponse);
app.use(responseHandler.handleErrorResponse);

module.exports = app;
