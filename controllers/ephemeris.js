'use strict';

const swe = require('swisseph');

module.exports = {
  compute: async function (query) {
    return new Promise((resolve, reject) => {
      const {
        year,
        month,
        date,
        hours,
        minutes,
        seconds,
        latitude,
        longitude,
        timezone
      } = query;

      const timeDecimal = hours + minutes / 60 + seconds / 3600;
      const utcOffset = timezone || 0;

      swe.swe_set_ephe_path('./ephe'); // use folder with .se1, .se2 etc. if needed

      swe.swe_julday(year, month, date, timeDecimal - utcOffset, swe.SE_GREG_CAL, (julday) => {
        swe.swe_calc_ut(julday, swe.SE_SUN, swe.FLG_SWIEPH, (planet) => {
          if (planet.error) {
            reject(planet.error);
          } else {
            resolve({
              ephemerisQuery: query,
              ephemerides: {
                geo: {
                  0: [planet] // 0 = Sol
                }
              }
            });
          }
        });
      });
    });
  }
};

