'use strict';

const swisseph = require('swisseph');

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

function grauParaSigno(grau) {
  const index = Math.floor(grau / 30) % 12;
  return signos[index];
}

function grauParaIndiceSigno(grau) {
  const index = Math.floor(grau / 30) % 12;
  return index;
}

function identificarInterceptacoes(cuspides) {
  const cuspDegrees = [];
  const casasArray = [];
  const signosNasCuspides = new Set();
  const signosComDuplaRegencia = [];
  const casasComInterceptacoes = [];
  const interceptadosSet = new Set();

  // Extrair graus das cúspides na ordem
  for (let i = 1; i <= 12; i++) {
    cuspDegrees.push(cuspides[`casa${i}`].grau);
    signosNasCuspides.add(grauParaSigno(cuspides[`casa${i}`].grau));
  }

  // Verificar duplas regências
  const mapaSignosCuspides = {};
  for (let i = 0; i < 12; i++) {
    const signo = grauParaSigno(cuspDegrees[i]);
    mapaSignosCuspides[signo] = (mapaSignosCuspides[signo] || 0) + 1;
  }
  for (const signo in mapaSignosCuspides) {
    if (mapaSignosCuspides[signo] > 1) {
      signosComDuplaRegencia.push(signo);
    }
  }

  // Calcular interceptações entre cúspides consecutivas
  for (let i = 0; i < 12; i++) {
    const grauAtual = cuspDegrees[i];
    const grauProx = cuspDegrees[(i + 1) % 12];

    const signoAtual = grauParaIndiceSigno(grauAtual);
    const signoProx = grauParaIndiceSigno(grauProx);

    let diff = signoProx - signoAtual;
    if (diff <= 0) diff += 12;

    // interceptações se pular 2 ou mais signos
    if (diff > 1) {
      for (let s = 1; s < diff; s++) {
        const signoIndex = (signoAtual + s) % 12;
        const signoNome = signos[signoIndex];

        // Evitar duplicatas
        if (!interceptadosSet.has(signoNome)) {
          interceptadosSet.add(signoNome);
          casasComInterceptacoes.push({
            casa: ((i + 1) % 12) === 0 ? 12 : (i + 1),
            signoInterceptado: signoNome
          });
        }
      }
    }

    // construir casasArray com flag interceptado
    casasArray.push({
      casa: i + 1,
      grau: grauAtual,
      signo: grauParaSigno(grauAtual),
      interceptado: false // será preenchido abaixo se for o caso
    });
  }

  // Atualizar casasArray com flag interceptado
  for (const intercept of casasComInterceptacoes) {
    const index = intercept.casa - 1;
    casasArray[index].interceptado = true;
  }

  return {
    signosInterceptados: [...interceptadosSet],
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

  // Casas (Placidus)
  const cuspides = await new Promise((resolve, reject) => {
    swisseph.swe_houses(jd, latitude, longitude, 'P', (res) => {
      if (res.error || !res.house) {
        reject(new Error("Erro ao calcular casas"));
      } else {
        const cusp = {};
        for (let i = 0; i < 12; i++) {
          cusp[`casa${i + 1}`] = {
            grau: res.house[i],
            signo: grauParaSigno(res.house[i])
          };
        }
        resolve(cusp);
      }
    });
  });

  // Planetas
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
  } = identificarInterceptacoes(cuspides);

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
