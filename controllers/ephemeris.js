'use strict';

module.exports = {
  compute: function (req, res, next) {
    try {
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

      // ✅ Garantimos que res.locals existe
      if (!res.locals) res.locals = {};

      res.locals.status = 200;
      res.locals.message = 'Ephemerides returned';
      res.locals.results = result;

      return next();
    } catch (err) {
      // ✅ Garante que 'res' e 'res.locals' sempre existam
      if (!res) res = {};
      if (!res.locals) res.locals = {};

      res.locals.status = 500;
      res.locals.message = err.message || 'Unexpected error in ephemeris controller';
      res.locals.errors = [err];

      return next(err);
    }
  }
};

