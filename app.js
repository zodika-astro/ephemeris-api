// --- Basic Auth ---
var basicAuth = require('express-basic-auth');
var USER = process.env.BASIC_USER;
var PASS = process.env.BASIC_PASS;

app.use(basicAuth({
  users: { [USER]: PASS },
  challenge: true
}));
// -------------------
var express = require('express');
var logger = require('morgan');
var responseHandler = require('./common/responseHandlers');

var app = express();

app.use(logger('combined'));

app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// set response handlers
app.use(responseHandler.handleResponse);
app.use(responseHandler.handleErrorResponse);

// start Server
app.listen(process.env.PORT || 9010);
