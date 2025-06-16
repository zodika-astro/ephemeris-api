'use strict';
const swisseph = require('swisseph');

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

function grauParaSigno(grau) {
  const index = Math.floor((grau % 360 + 360) % 360 / 30);
  return signos[index];
}

function identificarSignosInterceptados(cuspides) {
  const arcos = cuspides.map((c, i) => {
    const grauInicio = c.grau;
    const grauFim = i < 11 ? cuspides[i + 1].grau : cuspides[0].grau + 360;
    return {
      casa: c.casa,
      grauInicio,
      grauFim,
      signoCuspide: grauParaSigno(c.grau),
    };
  });

  const signosNasCuspides = new Set(arcos.map(a => a.signoCuspide));
  const casasComInterceptacoes = [];
  const signosInterceptados = new Set();

  for (const arco of arcos) {
    const signosNoArco = new Set();

    for (let g = Math.floor(arco.grauInicio); g < arco.grauFim; g++) {
      signosNoArco.add(grauParaSigno(g));
    }

    for (const signo of signosNoArco) {
      if (!signosNasCuspides.has(signo)) {
        // Só adiciona se ainda não está no resultado
        const jáExiste = casasComInterceptacoes.some(c =>
          c.casa === arco.casa && c.signoInterceptado === signo
        );
        if (!jáExiste) {
          casasComInterceptacoes.push({
            casa: arco.casa,
            signoInterceptado: signo
          });
          signosInterceptados.add(signo);
        }
      }
    }
  }

  const signosComDuplaRegencia = signos.filter(signo =>
    arcos.filter(a => a.signoCuspide === signo).length > 1
  );

  const casasArray = cuspides.map(c => {
    const signo = grauParaSigno(c.grau);
    const interceptado = casasComInterceptacoes.some(e => e.casa === c.casa && e.signoInterceptado === signo);
    return {
      casa: c.casa,
      grau: c.grau,
      signo,
      interceptado
    };
  });

  return {
    signosInterceptados: [...signosInterceptados],
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
