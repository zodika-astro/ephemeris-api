'use strict';

module.exports = {
  compute: function (req, res) {
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

      res.status(200).json({
        outcome: {
          statusCode: 200,
          message: 'Ephemerides returned'
        },
        content: result
      });

    } catch (err) {
      res.status(500).json({
        outcome: {
          statusCode: 500,
          message: err.message || 'Unexpected error in ephemeris controller',
          errors: [err]
        }
      });
    }
  }
};
