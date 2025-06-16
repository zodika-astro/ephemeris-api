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

function identificarSignosInterceptados(cuspidesObj) {
  const graus = Object.values(cuspidesObj).map(c => c.grau);
  graus.push(cuspidesObj.casa1.grau + 360); // fechar o ciclo

  const signosCuspides = Object.values(cuspidesObj).map(c => c.signo);
  const signosPresentes = new Set();

  for (let i = 0; i < 12; i++) {
    const start = graus[i];
    const end = graus[i + 1];
    for (let g = start; g < end; g++) {
      signosPresentes.add(grauParaSigno(g));
    }
  }

  const signosInterceptados = [...signosPresentes].filter(s => !signosCuspides.includes(s));
  const signosComDuplaRegencia = signos.filter(s =>
    signosCuspides.filter(c => c === s).length > 1
  );

  // Reconstruir casas array com info precisa
  const casasArray = [];
  const casasComInterceptacoes = [];

  for (let i = 0; i < 12; i++) {
    const casa = `casa${i + 1}`;
    const grau = graus[i];
    const grauSeguinte = graus[i + 1];
    const signo = grauParaSigno(grau);
    const interceptado = false;

    casasArray.push({
      casa: i + 1,
      grau,
      signo,
      interceptado
    });
  }

  // Corrigir: detectar exatamente onde cada signo interceptado está
  for (let s of signosInterceptados) {
    for (let i = 0; i < 12; i++) {
      const g1 = graus[i];
      const g2 = graus[i + 1];
      const arco = [];

      for (let g = g1; g < g2; g++) {
        arco.push(grauParaSigno(g));
      }

      if (arco.includes(s)) {
        casasComInterceptacoes.push({
          casa: i + 1,
          signoInterceptado: s
        });
        break; // adicionar só uma vez
      }
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

  const cuspidesObj = await new Promise((resolve, reject) => {
    swisseph.swe_houses(jd, latitude, longitude, 'P', (res) => {
      if (res.error || !res.house) return reject(new Error("Erro ao calcular casas"));

      const cuspides = {};
      for (let i = 0; i < 12; i++) {
        const grau = res.house[i];
        cuspides[`casa${i + 1}`] = {
          grau,
          signo: grauParaSigno(grau)
        };
      }
      resolve(cuspides);
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
    const pos = await new Promise(resolve => {
      swisseph.swe_calc_ut(jd, id, swisseph.SEFLG_SWIEPH, res => {
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
  } = identificarSignosInterceptados(cuspidesObj);

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
