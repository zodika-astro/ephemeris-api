'use strict';

const swisseph = require('swisseph');

const planetNames = {
  0: 'sol',
  1: 'lua',
  2: 'mercurio',
  3: 'venus',
  4: 'marte',
  5: 'jupiter',
  6: 'saturno',
  7: 'urano',
  8: 'netuno',
  9: 'plutao',
};

const signosZodiaco = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
];

const calcularSigno = (grau) => {
  const index = Math.floor((grau % 360) / 30);
  return signosZodiaco[index];
};

const identificarSignos = (graus) => {
  const cuspides = {};
  const presentes = new Set();
  for (let i = 0; i < 12; i++) {
    const grau = graus[i];
    const signo = calcularSigno(grau);
    cuspides[`casa${i + 1}`] = {
      grau: parseFloat(grau.toFixed(2)),
      signo
    };
    presentes.add(signo);
  }
  const ausentes = signosZodiaco.filter(s => !presentes.has(s));
  return {
    cuspides,
    signosPresentes: Array.from(presentes),
    signosInterceptados: ausentes
  };
};

const compute = async (input) => {
  try {
    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone
    } = input;

    const decimalHoursUTC = (hours - timezone) + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHoursUTC, swisseph.SE_GREG_CAL);
    swisseph.swe_set_topo(longitude, latitude, 0);

    const planetCodes = [
      swisseph.SE_SUN, swisseph.SE_MOON, swisseph.SE_MERCURY,
      swisseph.SE_VENUS, swisseph.SE_MARS, swisseph.SE_JUPITER,
      swisseph.SE_SATURN, swisseph.SE_URANUS, swisseph.SE_NEPTUNE,
      swisseph.SE_PLUTO
    ];

    const ephemerides = { geo: {} };
    const signosPlanetas = {};

    for (const code of planetCodes) {
      const eph = await new Promise((resolve, reject) => {
        swisseph.swe_calc_ut(jd, code, 0, (res) => {
          if (res.error) reject(res.error);
          else resolve(res);
        });
      });
      ephemerides.geo[code] = [{
        longitude: eph.longitude,
        latitude: eph.latitude,
        distance: eph.distance,
        planet: code,
        model: 'geo'
      }];
      const nome = planetNames[code];
      signosPlanetas[nome] = calcularSigno(eph.longitude);
    }

    const casasInfo = await new Promise((resolve, reject) => {
      swisseph.swe_houses(jd, latitude, longitude, 'P', (houses) => {
        if (houses.error || !houses.house) {
          reject(new Error('Erro ao calcular casas'));
        } else {
          resolve(identificarSignos(houses.house));
        }
      });
    });

    return {
      statusCode: 200,
      message: 'Ephemeris computed successfully',
      ephemerisQuery: input,
      ephemerides,
      signos: signosPlanetas,
      casas: {
        cuspides: casasInfo.cuspides,
        signosPresentes: casasInfo.signosPresentes,
        signosInterceptados: casasInfo.signosInterceptados
      }
    };
  } catch (error) {
    console.error('🔥 Internal Ephemeris Error:', error);
    throw error;
  }
};

module.exports = {
  compute
};
