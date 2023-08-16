var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  res.locals.status = 200;
  res.locals.message = 'Ephemeris Usage returned';
  res.locals.results = {message: 'ephemeris-api', usage: '/api/info'};
  next();
});

module.exports = router;
