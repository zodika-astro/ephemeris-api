'use strict';

var EphemerisCtrl = (function () {
  return {
    getEphemeris: getEphemeris
  };

  function getEphemeris(req, res, next) {
    const now = new Date();

    res.locals.status = 200;
    res.locals.message = 'Ephemerides returned';
    res.locals.results = {
      ephemerisQuery: {
        models: ['geo'],
        planets: [1],
        startDate: now,
        endDate: now,
        count: 1,
        step: 1
      },
      ephemerides: {
        geo: {
          1: [{
            longitude: 273.45,
            latitude: -4.91,
            distance: 0.0026,
            dt: now,
            planet: 1,
            model: 'geo'
          }]
        }
      }
    };
    next();
  }
}());

module.exports = EphemerisCtrl;

