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
  graus.push(cuspides.casa1.grau + 360); // casa13

  const presentes = new Set();
  for (let i = 0; i < 12; i++) {
    const inicio = graus[i];
    const fim = graus[i + 1];
    for (let g = inicio; g < fim; g += 1) {
      presentes.add(grauParaSigno(g));
    }
  }

  const cuspidesSet = new Set(
    Object.values(cuspides).map(c => c.signo)
  );

  const interceptados = [...presentes].filter(s => !cuspidesSet.has(s));
  return {
    signosPresentes: [...presentes],
    signosNasCuspides: [...cuspidesSet],
    signosInterceptados: interceptados
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

      const { signosPresentes, signosNasCuspides, signosInterceptados } =
        identificarSignosInterceptados(casas);

      return {
        statusCode: 200,
        message: "Ephemeris computed successfully",
        ephemerisQuery: reqBody,
        ephemerides: {
          geo: {} // Se quiser, adicione os planetas aqui
        },
        signos: {}, // idem acima
        casas: {
          cuspides: casas,
          signosPresentes,
          signosNasCuspides,
          signosInterceptados
        }
      };
    } catch (err) {
      console.error('🔥 Internal Ephemeris Error:', err);
      throw err;
    }
  }
};
