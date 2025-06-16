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

function identificarInterceptacoes(cuspides) {
  const graus = cuspides.map(c => c.grau);
  graus.push(graus[0] + 360); // fecha o ciclo

  const cuspidesSet = new Set(cuspides.map(c => c.signo));
  const casasComInterceptacoes = [];
  const signosInterceptados = new Set();
  const signosComDuplaRegencia = [];

  // mapa da contagem de signos nas cúspides
  const signoFrequencia = cuspides.reduce((acc, c) => {
    acc[c.signo] = (acc[c.signo] || 0) + 1;
    return acc;
  }, {});
  for (const [signo, count] of Object.entries(signoFrequencia)) {
    if (count > 1) signosComDuplaRegencia.push(signo);
  }

  // percorre as 12 casas
  for (let i = 0; i < 12; i++) {
    const inicio = graus[i];
    const fim = graus[i + 1];
    const signosNaCasa = new Set();

    for (let g = inicio; g < fim; g += 1) {
      const signo = grauParaSigno(g);
      signosNaCasa.add(signo);
    }

    // remove o signo da cúspide (ele não é interceptado)
    signosNaCasa.delete(cuspides[i].signo);

    // se só um signo sobrar e ele não estiver em nenhuma cúspide
    const interceptadosNaCasa = [...signosNaCasa].filter(s => !cuspidesSet.has(s));
    if (interceptadosNaCasa.length === 1) {
      const signo = interceptadosNaCasa[0];
      cuspides[i].interceptado = true;
      casasComInterceptacoes.push({
        casa: cuspides[i].casa,
        signoInterceptado: signo
      });
      signosInterceptados.add(signo);
    } else {
      cuspides[i].interceptado = false;
    }
  }

  return {
    signosInterceptados: [...signosInterceptados],
    signosComDuplaRegencia,
    casasComInterceptacoes,
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
  const jd = swisseph.swe_julday(year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL);

  const cuspides = await new Promise((resolve, reject) => {
    swisseph.swe_houses(jd, latitude, longitude, 'P', (res) => {
      if (res.error || !res.house) {
        reject(new Error("Erro ao calcular casas"));
      } else {
        const output = [];
        for (let i = 0; i < 12; i++) {
          const grau = res.house[i];
          output.push({
            casa: i + 1,
            grau,
            signo: grauParaSigno(grau),
            interceptado: false
          });
        }
        resolve(output);
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
