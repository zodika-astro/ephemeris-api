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
  9: 'plutao'
};

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

function getSigno(longitude) {
  const index = Math.floor(longitude / 30) % 12;
  return signos[index];
}

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

      const planetCodes = [
        swisseph.SE_SUN,
        swisseph.SE_MOON,
        swisseph.SE_MERCURY,
        swisseph.SE_VENUS,
        swisseph.SE_MARS,
        swisseph.SE_JUPITER,
        swisseph.SE_SATURN,
        swisseph.SE_URANUS,
        swisseph.SE_NEPTUNE,
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

        const nome =
