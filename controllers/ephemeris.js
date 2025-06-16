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
  const graus = cuspides.map(c => c.grau);
  graus.push(graus[0] + 360); // casa13

  const signosPresentes = new Set();
  const signosNasCuspides = new Set();
  const casasComInterceptacoes = [];

  for (let i = 0; i < 12; i++) {
    const inicio = graus[i];
    const fim = graus[i + 1];
    const casaSignos = new Set();

    for (let g = Math.floor(inicio); g < fim; g++) {
      const signo = grauParaSigno(g);
      signosPresentes.add(signo);
      casaSignos.add(signo);
    }

    // pega signo da cúspide
    const cuspideSigno = grauParaSigno(cuspides[i].grau);
    signosNasCuspides.add(cuspideSigno);

    cuspides[i].signo = cuspideSigno;
    cuspides[i].interceptado = false;

    // verifica se algum signo está no arco mas não está na cúspide
    for (const signo of casaSignos) {
      if (!signosNasCuspides.has(signo)) {
        cuspides[i].interceptado = true;
        casasComInterceptacoes.push({
          casa: cuspides[i].casa,
          signoInterceptado: signo
        });
      }
    }
  }

  const interceptados = [...signosPresentes].filter(s => !signosNasCuspides.has(s));

  const signosComDuplaRegencia = signos.filter(signo =>
    cuspides.filter(c => c.signo === signo).length > 1
  );

  return {
    signosInterceptados: interceptados,
    signosComDuplaRegencia,
    casasComInterceptacoes: casasComInterceptacoes,
    casasArray: cuspides
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
        const cuspides = [];
        for (let i = 0; i < 12; i++) {
          cuspides.push({
            casa: i + 1,
            grau: res.house[i]
          });
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
