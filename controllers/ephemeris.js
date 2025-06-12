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

      console.log('📦 Inputs recebidos:');
      console.log('year:', year);
      console.log('month:', month);
      console.log('date:', date);
      console.log('hours:', hours);
      console.log('minutes:', minutes);
      console.log('seconds:', seconds);
      console.log('latitude:', latitude);
      console.log('longitude:', longitude);
      console.log('timezone:', timezone);

      const decimalHours = hours + minutes / 60 + seconds / 3600;

      const jd = swisseph.swe_julday(
        year,
        month,
        date,
        decimalHours,
        swisseph.SE_GREG_CAL
      );

      console.log('🧮 Julian Day calculado:', jd);

      // Exemplo: cálculo para o Sol (planeta 0)
      const eph = await new Promise((resolve, reject) => {
        swisseph.swe_calc(jd, swisseph.SE_SUN, 0, (res) => {
          if (res.error) reject(res.error);
          else resolve(res);
        });
      });

      return {
        ephemerisQuery: reqBody,
        ephemerides: {
          geo: {
            0: [ // Sol
              {
                longitude: eph.longitude,
                latitude: eph.latitude,
                distance: eph.distance,
                planet: 0,
                model: 'geo'
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
