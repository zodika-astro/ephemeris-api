'use strict';

const swisseph = require('swisseph');

module.exports = {
  compute: function (query) {
    return new Promise((resolve, reject) => {
const year = Number(query.year);
      const month = Number(query.month);
      const date = Number(query.date);
      const hours = Number(query.hours);
      const minutes = Number(query.minutes);
      const seconds = Number(query.seconds);
      const latitude = Number(query.latitude);
      const longitude = Number(query.longitude);
      const jd = swisseph.swe_julday(year, month, date, hours + minutes / 60 + seconds / 3600, swisseph.SE_GREG_CAL);

      swisseph.swe_calc_ut(jd, swisseph.SE_SUN, 0, (err, planet) => {
        if (err) {
          return reject(err);
        }

        const result = {
          ephemerisQuery: query,
          ephemerides: {
            geo: {
              1: [
                {
                  longitude: planet.longitude,
                  latitude: planet.latitude,
                  planet: 1,
                  model: 'geo'
                }
              ]
            }
          }
        };

        resolve(result);
      });
    });
  }
};

