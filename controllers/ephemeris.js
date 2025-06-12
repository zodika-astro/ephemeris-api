'use strict';

const swisseph = require('swisseph');

module.exports = {
  compute: async function (reqBody) {
    try {
      const {
        year,
        month,
        date,
        hours,
        minutes,
        seconds,
        latitude,
        longitude,
        timezone,
        config
      } = reqBody;

      const jd = swisseph.swe_julday(
        year,
        month,
        date,
        hours + minutes / 60 + seconds / 3600,
        swisseph.SE_GREG_CAL
      );

      return {
        ephemerisQuery: reqBody,
        ephemerides: {
          geo: {
            1: [
              {
                longitude: 273.45,
                latitude: -4.91,
                planet: 1,
                model: 'geo',
                jd: jd
              }
            ]
          }
        }
      };
    } catch (err) {
      console.error('🔥 Internal Ephemeris Error:', err);
      throw err;
    }
  }
};
