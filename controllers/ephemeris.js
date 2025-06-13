'use strict';

const swisseph = require('swisseph');

// Lista dos 12 signos zodiacais em ordem
const signosZodiacais = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

// Função que converte grau zodiacal para signo
function grauParaSigno(grau) {
  const index = Math.floor((grau % 360) / 30);
  return signosZodiacais[index];
}

// Função que identifica signos presentes e interceptados
function identificarSignosInterceptados(cuspides) {
  const graus = Object.values(cuspides).map(c => c.grau);
  graus.push(cuspides.casa1.grau + 360); // casa13 fictícia para fechar ciclo

  const presentes = new Set();
  for (let i = 0; i < 12; i++) {
    const inicio = graus[i];
    const fim = graus[i + 1];
    for (let g = Math.floor(inicio); g < Math.floor(fim); g++) {
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

      // Cálculo do Julian Day
      const jd = swisseph.swe_julday(
        year, month, date, decimalHours, swisseph.SE_GREG_CAL
      );

      // Cálculo das casas
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

      // Identificação dos signos presentes, cuspides e interceptados
      const { signosPresentes, signosNasCuspides, signosInterceptados } =
        identificarSignosInterceptados(casas);

      // Planetas principais e seus índices no Swiss Ephemeris
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
      const signos = {};

      for (const [nome, idx] of Object.entries(planetas)) {
        const result = swisseph.swe_calc_ut(jd, idx, swisseph.SEFLG_SWIEPH);
        if (result.error) {
          throw new Error(`Erro ao calcular ${nome}: ${result.error}`);
        }
        geo[nome] = result.longitude;
        signos[nome] = grauParaSigno(result.longitude);
      }

      return {
        statusCode: 200,
        message: "Ephemeris computed successfully",
        ephemerisQuery: reqBody,
        ephemerides: {
          geo
        },
        signos,
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
