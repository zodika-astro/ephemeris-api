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
