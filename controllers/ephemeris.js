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
  'Áries',
  'Touro',
  'Gêmeos',
  'Câncer',
  'Leão',
  'Virgem',
  'Libra',
  'Escorpião',
  'Sagitário',
  'Capricórnio',
  'Aquário',
  'Peixes',
];

const casasSignos = (casas) => {
  const casasEmGraus = casas.map((grau) => grau % 360);
  const signos = casasEmGraus.map((grau) => signosZodiaco[Math.floor(grau / 30)]);

  const signosDuplicados = [];
  const signosUnicos = new Set();
  const ocorrencias = {};

  signos.forEach((signo) => {
    ocorrencias[signo] = (ocorrencias[signo] || 0) + 1;
  });

  Object.entries(ocorrencias).forEach(([signo, count]) => {
    if (count === 2) signosDuplicados.push(signo);
  });

  signosZodiaco.forEach((signo) => signosUnicos.add(signo));
  signos.forEach((signo) => signosUnicos.delete(signo));
  const signosAusentes = Array.from(signosUnicos);

  const casasComSignos = {};
  signos.forEach((signo, index) => {
    casasComSignos[`casa${index + 1}`] = signo;
  });

  return {
    casas: casasComSignos,
    signosDuplicados,
    signosAusentes,
  };
};

const calcularSigno = (longitude) => {
  return signosZodiaco[Math.floor(longitude / 30) % 12];
};

const compute = async (input) => {
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
    } = input;

    const julianDayUT = swisseph.swe_julday(
      year,
      month,
      date,
      hours + minutes / 60 + seconds / 3600 - timezone,
      swisseph.SE_GREG_CAL
    );

    const ephemerides = { geo: {} };

    for (let i = 0; i <= 9; i++) {
      const planet = swisseph.swe_calc_ut(julianDayUT, i, swisseph.SEFLG_SWIEPH);
      ephemerides.geo[i] = [{
        longitude: planet.longitude,
        latitude: planet.latitude,
        distance: planet.distance,
        planet: i,
        model: 'geo',
      }];
    }

    const casasRaw = swisseph.swe_houses(julianDayUT, latitude, longitude, 'P');
    const casasGraus = casasRaw.house;

    const planetasComSignos = {};
    Object.entries(ephemerides.geo).forEach(([index, [dados]]) => {
      const nome = planetNames[index];
      planetasComSignos[nome] = calcularSigno(dados.longitude);
    });

    const casasInterpretadas = casasSignos(casasGraus);

    return {
      statusCode: 200,
      message: 'Ephemeris computed successfully',
      ephemerisQuery: input,
      ephemerides,
      signos: planetasComSignos,
      casas: casasInterpretadas.casas,
      signosDuplicados: casasInterpretadas.signosDuplicados,
      signosAusentes: casasInterpretadas.signosAusentes,
    };
  } catch (error) {
    console.error('🔥 Internal Ephemeris Error:', error);
    throw new Error('Erro ao calcular efemérides');
  }
};

module.exports = {
  compute,
};
