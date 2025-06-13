'use strict';

const swisseph = require('swisseph');

const planetNames = {
  0: 'sol', 1: 'lua', 2: 'mercurio', 3: 'venus', 4: 'marte',
  5: 'jupiter', 6: 'saturno', 7: 'urano', 8: 'netuno', 9: 'plutao'
};

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

function getSigno(longitude) {
  const index = Math.floor((longitude % 360) / 30);
  return signos[index];
}

module.exports = {
  compute: async function (reqBody) {
    try {
      const {
        year, month, date,
        hours, minutes, seconds,
        latitude, longitude, timezone
      } = reqBody;

      const decimalHoursLocal = hours + minutes / 60 + seconds / 3600;
      const decimalHoursUTC = decimalHoursLocal - timezone;

      const jd = swisseph.swe_julday(year, month, date, decimalHoursUTC, swisseph.SE_GREG_CAL);

      swisseph.swe_set_topo(longitude, latitude, 0);

      // ☀️ PLANETAS
      const planetCodes = [
        swisseph.SE_SUN, swisseph.SE_MOON, swisseph.SE_MERCURY,
        swisseph.SE_VENUS, swisseph.SE_MARS, swisseph.SE_JUPITER,
        swisseph.SE_SATURN, swisseph.SE_URANUS, swisseph.SE_NEPTUNE,
        swisseph.SE_PLUTO
      ];

      const ephemerides = {};
      const signosResultado = {};

      for (const code of planetCodes) {
        const eph = await new Promise((resolve, reject) => {
          swisseph.swe_calc(jd, code, 0, (res) => {
            if (res.error) reject(res.error);
            else resolve(res);
          });
        });

        ephemerides[code] = [{
          longitude: eph.longitude,
          latitude: eph.latitude,
          distance: eph.distance,
          planet: code,
          model: 'geo'
        }];

        const nome = planetNames[code];
        const signo = getSigno(eph.longitude);
        signosResultado[nome] = signo;
      }

      // ⬆️ ASCENDENTE
      const ascendenteGrau = await new Promise((resolve, reject) => {
        swisseph.swe_houses(jd, latitude, longitude, 'P', (houses) => {
          if (houses && houses.ascendant) {
            resolve(houses.ascendant);
          } else {
            reject("Erro ao calcular ascendente");
          }
        });
      });

      const ascSignIndex = Math.floor((ascendenteGrau % 360) / 30);
      const casasSignos = {};
      for (let i = 0; i < 12; i++) {
        const signoIndex = (ascSignIndex + i) % 12;
        casasSignos[`casa${i + 1}`] = signos[signoIndex];
      }

      return {
        ephemerisQuery: reqBody,
        ephemerides: { geo: ephemerides },
        signos: signosResultado,
        casas: casasSignos
      };

    } catch (err) {
      console.error('🔥 Internal Ephemeris Error:', err);
      throw err;
    }
  }
};
