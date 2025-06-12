'use strict';

const swisseph = require('swisseph');

module.exports = {
  compute: async function (input) {
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
      } = input;

      const jd = swisseph.swe_julday(
        Number(year),
        Number(month),
        Number(date),
        Number(hours) + Number(minutes) / 60 + Number(seconds) / 3600,
        swisseph.SE_GREG_CAL
      );

      // Aqui você pode adicionar os cálculos com swisseph.swe_calc() depois

      return {
        ephemerisQuery: input,
        ephemerides: {
          geo: {
            1: [
              {
                julianDate: jd,
                planet: 1,
                model: 'geo'
              }
            ]
          }
        }
      };
    } catch (err) {
      console.error('💥 Error inside compute:', err);
      throw err;
    }
  }
};

