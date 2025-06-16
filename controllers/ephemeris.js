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
  graus.push(cuspides.casa1.grau + 360); // fecha o ciclo

  const signosPorCasa = [];
  const cuspidesSet = new Set();
  const casasArray = [];
  const casasComInterceptacoes = [];
  const signosComDuplaRegencia = [];

  // coleta signos nas cúspides
  Object.values(cuspides).forEach(c => cuspidesSet.add(c.signo));

  for (let i = 0; i < 12; i++) {
    const casaKey = `casa${i + 1}`;
    const grauInicio = graus[i];
    const grauFim = graus[i + 1];

    const signosNaCasa = new Set();
    for (let g = grauInicio; g < grauFim; g++) {
      signosNaCasa.add(grauParaSigno(g));
    }

    signosPorCasa.push(Array.from(signosNaCasa));

    const signoDaCuspide = grauParaSigno(grauInicio % 360);
    const interceptado = false;

    casasArray.push({
      casa: i + 1,
      grau: cuspides[casaKey].grau,
      signo: signoDaCuspide,
      interceptado
    });
  }

  const todosSignosPresentes = new Set(signosPorCasa.flat());
  const signosInterceptados = [...todosSignosPresentes].filter(signo => !cuspidesSet.has(signo));

  // identificar as casas onde os signos interceptados aparecem
  for (let i = 0; i < signosPorCasa.length; i++) {
    for (const signo of signosPorCasa[i]) {
      if (signosInterceptados.includes(signo)) {
        casasComInterceptacoes.push({
          casa: i + 1,
          signoInterceptado: signo
        });
      }
    }
  }

  // marca cada casa como interceptada ou não
  for (const casa of casasArray) {
    casa.interceptado = signosInterceptados.includes(casa.signo);
  }

  // signos com dupla regência (em mais de uma cúspide)
  for (const signo of signos) {
    const count = casasArray.filter(c => c.signo === signo).length;
    if (count > 1) {
      signosComDuplaRegencia.push(signo);
    }
  }

  return {
    signosInterceptados,
    signosComDuplaRegencia,
    casasComInterceptacoes,
    casasArray
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
          cuspides[`casa${i + 1}`] = {
            grau,
            signo: grauParaSigno(grau)
          };
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

  const {
    signosInterceptados,
    signosComDuplaRegencia,
    casasComInterceptacoes,
    casasArray
  } = identificarSignosInterceptados(casas);

  return {
    statusCode: 200,
    message: "Ephemeris computed successfully",
    ephemerisQuery: reqBody,
    ephemerides: { geo },
    signos: signosPlanetas,
    casas: {
      cuspides: casasArray,
      signosInterceptados,
      signosComDuplaRegencia,
      casasComInterceptacoes
    }
  };
}

module.exports = { compute };
