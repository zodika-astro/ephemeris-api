'use strict';

const swisseph = require('swisseph');

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

function grauParaSigno(grau) {
  const index = Math.floor((grau % 360) / 30);
  return signos[index];
}

function identificarSignosInterceptados(cuspides) {
  const graus = Object.values(cuspides).map(c => c.grau);
  graus.push(cuspides.casa1.grau + 360); // fechar o ciclo

  const casasArray = Object.entries(cuspides).map(([key, { grau }], index) => ({
    casa: index + 1,
    grau,
    signo: grauParaSigno(grau),
    interceptado: false
  }));

  const presentes = new Set();
  const casasComInterceptacoes = [];

  for (let i = 0; i < 12; i++) {
    const inicio = graus[i];
    const fim = graus[i + 1];
    for (let g = inicio; g < fim; g++) {
      presentes.add(grauParaSigno(g));
    }
  }

  const cuspidesSet = new Set(casasArray.map(c => c.signo));
  const interceptados = [...presentes].filter(s => !cuspidesSet.has(s));

  for (let i = 0; i < 12; i++) {
    const inicio = graus[i];
    const fim = graus[i + 1];
    const casa = i + 1;
    const signosNoTrecho = new Set();

    for (let g = inicio; g < fim; g++) {
      signosNoTrecho.add(grauParaSigno(g));
    }

    for (const signo of interceptados) {
      if (signosNoTrecho.has(signo)) {
        casasComInterceptacoes.push({ casa, signoInterceptado: signo });
        casasArray[i].interceptado = true;
      }
    }
  }

  const signosComDuplaRegencia = [...signos].filter(signo =>
    casasArray.filter(c => c.signo === signo).length > 1
  );

  return {
    cuspides: casasArray,
    signosInterceptados: interceptados,
    signosComDuplaRegencia,
    casasComInterceptacoes
  };
}

async function compute(reqBody) {
  const {
    year, month, date,
    hours, minutes, seconds,
    latitude, longitude, timezone
  } = reqBody;

  const decimalHours = hours + minutes / 60 + seconds / 3600;

  const jd = swisseph.swe_julday(
    year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL
  );

  const casas = await new Promise((resolve, reject) => {
    swisseph.swe_houses(jd, latitude, longitude, 'P', (res) => {
      if (res.error || !res.house) {
        reject(new Error("Erro ao calcular casas"));
      } else {
        const cuspides = {};
        for (let i = 0; i < 12; i++) {
          const grau = res.house[i];
          cuspides[`casa${i + 1}`] = { grau };
        }
        resolve(cuspides);
      }
    });
  });

  const planetas = {
    sol: swisseph.SE_SUN,
    lua: swisseph.SE_MOON,
    mercurio: swisseph.SE_MERCURY,
    venus: swisseph.SE_VENUS,
    marte: swisseph.SE_MARS,
    jupiter: swisseph.SE_JUPITER,
    saturno: swisseph.SE_SATURN,
    urano: swisseph.SE_URANUS,
    netuno: swisseph.SE_NEPTUNE,
    plutao: swisseph.SE_PLUTO
  };

  const geo = {};
  const signosPlanetas = {};

  for (const [nome, id] of Object.entries(planetas)) {
    const pos = await new Promise((resolve) => {
      swisseph.swe_calc_ut(jd, id, swisseph.SEFLG_SWIEPH, (res) => {
        resolve(res.longitude);
      });
    });

    geo[nome] = pos;
    signosPlanetas[nome] = grauParaSigno(pos);
  }

  const casasInterpretadas = identificarSignosInterceptados(casas);

  return {
    statusCode: 200,
    message: "Ephemeris computed successfully",
    ephemerisQuery: reqBody,
    ephemerides: { geo },
    signos: signosPlanetas,
    casas: casasInterpretadas
  };
}

module.exports = { compute };
