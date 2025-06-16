'use strict';
const swisseph = require('swisseph');
swisseph.swe_set_ephe_path(__dirname + '/ephe');

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

const grauParaSigno = (grau) => {
  const normalized = ((grau % 360) + 360) % 360;
  return signos[Math.floor(normalized / 30)];
};

const computeHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`Erro nas casas: ${res.error}`));
      resolve(res.house.slice(0, 12).map((grau, i) => ({ casa: i + 1, grau })));
    });
  });
};

const computePlanets = async (jd) => {
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

  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
  const geo = {};
  const signos = {};

  for (const [nome, id] of Object.entries(planetas)) {
    const res = await new Promise((resolve) =>
      swisseph.swe_calc_ut(jd, id, flags, resolve)
    );
    geo[nome] = res.longitude;
    signos[nome] = grauParaSigno(res.longitude);
    signos[`${nome}_retrogrado`] = res.speed < 0;
  }

  return { geo, signos };
};

const analyzeHouses = (cuspides) => {
  const signosNasCuspides = new Set(cuspides.map(c => grauParaSigno(c.grau)));
  const casasComInterceptacoes = [];
  const signosInterceptados = new Set();

  for (let i = 0; i < cuspides.length; i++) {
    const atual = cuspides[i];
    const proxima = cuspides[(i + 1) % cuspides.length];
    let inicio = atual.grau;
    let fim = proxima.grau > inicio ? proxima.grau : proxima.grau + 360;

    const presentes = new Set();
    for (let deg = inicio; deg < fim; deg++) {
      presentes.add(grauParaSigno(deg));
    }

    presentes.forEach(signo => {
      if (!signosNasCuspides.has(signo)) {
        casasComInterceptacoes.push({ casa: atual.casa, signoInterceptado: signo });
        signosInterceptados.add(signo);
      }
    });
  }

  const contagem = {};
  cuspides.forEach(c => {
    const signo = grauParaSigno(c.grau);
    contagem[signo] = (contagem[signo] || 0) + 1;
  });

  const signosComDuplaRegencia = Object.entries(contagem)
    .filter(([_, count]) => count > 1)
    .map(([signo]) => signo);

  return {
    signosInterceptados: Array.from(signosInterceptados),
    casasComInterceptacoes,
    signosComDuplaRegencia,
    cuspides: cuspides.map(c => ({
      ...c,
      signo: grauParaSigno(c.grau),
      interceptado: casasComInterceptacoes.some(
        i => i.casa === c.casa && i.signoInterceptado === grauParaSigno(c.grau)
      )
    }))
  };
};

const compute = async (reqBody) => {
  try {
    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone,
      config = {}
    } = reqBody;

    const decimalHours = hours + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL);

    const houseSystem = config.house_system || 'P';
    const cuspides = await computeHouses(jd, latitude, longitude, houseSystem);
    const { geo, signos } = await computePlanets(jd);
    const analise = analyzeHouses(cuspides);

    return {
      statusCode: 200,
      message: "Ephemeris computed successfully",
      ephemerisQuery: reqBody,
      ephemerides: { geo },
      signos,
      casas: {
        cuspides: analise.cuspides,
        signosInterceptados: analise.signosInterceptados,
        casasComInterceptacoes: analise.casasComInterceptacoes,
        signosComDuplaRegencia: analise.signosComDuplaRegencia
      }
    };
  } catch (err) {
    console.error("Erro de cálculo:", err);
    return {
      statusCode: 500,
      message: `Erro no cálculo: ${err.message}`
    };
  }
};

module.exports = { compute };
