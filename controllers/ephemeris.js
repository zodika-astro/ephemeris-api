'use strict';

module.exports = {
  compute: function (req, res, next) {
    const result = {
      ephemerisQuery: req.body || {},
      ephemerides: {
        geo: {
          1: [
            {
              longitude: 273.45,
              latitude: -4.91,
              planet: 1,
              model: 'geo'
            }
          ]
        }
      }
    };

    res.locals.status = 200;
    res.locals.message = 'Ephemerides returned';
    res.locals.results = result;
    next();
  }
};

