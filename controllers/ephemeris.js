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

      swisseph.swe_set_topo(longitude, latitude, 0);

      const planetCodes = [
        swisseph.SE_SUN,
        swisseph.SE_MOON,
        swisseph.SE_MERCURY,
        swisseph.SE_VENUS,
        swisseph.SE_MARS,
        swisseph.SE_JUPITER,
        swisseph.SE_SATURN,
        swisseph.SE_URANUS,
        swisseph.SE_NEPTUNE,_
