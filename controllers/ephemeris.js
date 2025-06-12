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

      // ✅ Aqui usamos res corretamente
      res.locals = res.locals || {};
      res.locals.status = 200;
      res.locals.message = 'Ephemerides returned';
      res.locals.results = result;

      next();
    } catch (err) {
      // 🛠 Garante que res.locals existe antes de atribuir
      res.locals = res.locals || {};
      res.locals.status = 500;
      res.locals.message = err.message || 'Unexpected error in ephemeris controller';
      res.locals.errors = [err];

      next(err);
    }
  }
};

