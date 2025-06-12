'use strict';

exports.getEphemeris = function (req, res, next) {
  res.locals.status = 200;
  res.locals.message = 'Ephemeris endpoint is working';
  res.locals.results = { info: 'This is just a placeholder response.' };
  next();
};

