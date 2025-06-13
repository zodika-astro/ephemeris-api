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
  const grausOrdenados = Object.values(cuspides).map(c => c.grau);
  grausOrdenados.push(cuspides.casa1.grau + 360); // casa13 para fechar ciclo

  const signosPresentes = new Set();
  for (let i = 0; i < 12; i++) {
    const inicio = grausOrdenados[i];
    const fim = grausOrdenados[i + 1];
    for (let g = inicio; g < fim; g++) {
      signosPresentes.add(grauParaSigno(g));
    }
  }

  const signosNasCuspides = new Set(
    Object.values(cuspides).map(c => c.signo)
  );

  const signosInterceptados = [...signosPresentes].filter(s => !signosNasCuspides.has(s));

  const mapaSignoParaCasas = {};
  for (const [casa, { signo }] of Object.entries(cuspides)) {
    if (!mapaSignoParaCasas[signo]) mapaSignoParaCasas[signo] = [];
    mapaSignoParaCasas[signo].push(casa);
  }

  const signosComDuplaRegencia = Object.entries(mapaSignoParaCasas)
    .filter(([_, casas]) => casas.length > 1)
    .map(([signo]) => signo);

  return {
    signosPresentes: [...signosPresentes],
    signosNasCuspides: [...signosNasCuspides],
    signosInterceptados,
    signosComDuplaRegencia
  };
}

module.exports = {
  compute: async function (reqBody) {
    try {
      const {
        year, month, date,
        hours, minutes, seconds,
        latitude, longitude
      } = reqBody;

      const decimalHours = hours + minutes / 60 + seconds / 3600;
      const jd = swisseph.swe_julday(
        year, month, date, decimalHours, swisseph.SE_GREG_CAL
      );

      const cuspides = await new Promise((resolve, reject) => {
        swisseph.swe_houses(jd, latitude, longitude, 'P', (res) => {
          if (res.error || !res.house) {
            reject(new Error("Erro ao calcular casas"));
          } else {
            const result = {};
            for (let i = 0; i < 12; i++) {
              const grau = res.house[i];
              result[`casa${i + 1}`] = {
                grau,
                signo: grauParaSigno(grau)
              };
            }
            resolve(result);
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

      const ephemerides = { geo: {} };
      const signosPlanetas = {};

      for (const [nome, code] of Object.entries(planetas)) {
        const eph = await new Promise((resolve, reject) => {
          swisseph.swe_calc_ut(jd, code, 0, (res) => {
            if (res.error) reject(res.error);
            else resolve(res);
          });
        });
        ephemerides.geo[nome] = eph.longitude;
        signosPlanetas[nome] = grauParaSigno(eph.longitude);
      }

      const { signosPresentes, signosNasCuspides, signosInterceptados, signosComDuplaRegencia } =
        identificarSignosInterceptados(cuspides);

      return {
        statusCode: 200,
        message: "Ephemeris computed successfully",
        ephemerisQuery: reqBody,
        ephemerides,
        signos: signosPlanetas,
        casas: {
          cuspides,
          signosPresentes,
          signosNasCuspides,
          signosInterceptados,
          signosComDuplaRegencia
        }
      };
    } catch (err) {
      console.error('🔥 Internal Ephemeris Error:', err);
      throw err;
    }
  }
};
