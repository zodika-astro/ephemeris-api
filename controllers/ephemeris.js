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

  const signosPresentes = new Set();
  for (let i = 0; i < 12; i++) {
    const inicio = graus[i];
    const fim = graus[i + 1];
    for (let g = Math.floor(inicio); g < Math.floor(fim); g++) {
      signosPresentes.add(grauParaSigno(g));
    }
  }

  const signosNasCuspides = new Set(Object.values(cuspides).map(c => c.signo));
  const signosInterceptados = [...signosPresentes].filter(s => !signosNasCuspides.has(s));

  const casasArray = [];
  const casasComInterceptacoes = [];

  for (let i = 0; i < 12; i++) {
    const casaKey = `casa${i + 1}`;
    const info = cuspides[casaKey];
    casasArray.push({
      casa: i + 1,
      grau: info.grau,
      signo: info.signo,
      interceptado: false
    });
  }

  // Verifica onde os signos interceptados caem
  for (const signo of signosInterceptados) {
    for (let i = 0; i < 12; i++) {
      const inicio = graus[i];
      const fim = graus[i + 1];
      for (let g = Math.floor(inicio); g < Math.floor(fim); g++) {
        if (grauParaSigno(g) === signo) {
          casasComInterceptacoes.push({
            casa: i + 1,
            signoInterceptado: signo
          });
          break;
        }
      }
    }
  }

  // Ajusta flag interceptado nas casas com interceptação
  for (const { casa } of casasComInterceptacoes) {
    const index = casasArray.findIndex(c => c.casa === casa);
    if (index !== -1) casasArray[index].interceptado = true;
  }

  const signosComDuplaRegencia = signos.filter(signo =>
    casasArray.filter(c => c.signo === signo).length > 1
  );

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
