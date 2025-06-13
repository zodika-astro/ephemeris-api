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
  const casas = Object.values(cuspides)
    .map((c, i) => ({ grau: c.grau, casa: i + 1 }))
    .sort((a, b) => a.casa - b.casa);

  casas.push({ grau: casas[0].grau + 360, casa: 13 });

  const signosAtravessados = new Set();

  for (let i = 0; i < 12; i++) {
    const grauInicio = casas[i].grau;
    const grauFim = casas[i + 1].grau;

    for (let g = grauInicio; g < grauFim; g += 1) {
      const signo = grauParaSigno(g);
      signosAtravessados.add(signo);
    }
  }

  const signosNasCuspides = Object.values(cuspides).map(c => grauParaSigno(c.grau));

  const signosInterceptados = signos.filter(
    signo => signosAtravessados.has(signo) && !signosNasCuspides.includes(signo)
  );

  const signosComDuplaRegencia = signosNasCuspides.filter((signo, index, arr) =>
    arr.indexOf(signo) !== index && arr.lastIndexOf(signo) === index
  );

  return {
    signosPresentes: [...signosAtravessados],
    signosNasCuspides,
    signosInterceptados,
    signosComDuplaRegencia
  };
}

module.exports = {
  compute: async ({
    year, month, date,
    hours, minutes, seconds,
    latitude, longitude, timezone, config
  }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const ephemerides = await getPlanetaryPositions({
          year, month, date,
          hours, minutes, seconds,
          latitude, longitude, timezone
        });

        const signosPlanetas = getSignosDosPlanetas(ephemerides.geo);

        const cuspides = await getCuspides({
          year, month, date,
          hours, minutes, seconds,
          latitude, longitude, timezone
        });

        const signosCasas = {};
        for (const [casa, data] of Object.entries(cuspides)) {
          signosCasas[casa] = {
            grau: data.grau,
            signo: grauParaSigno(data.grau)
          };
        }

        const {
          signosPresentes,
          signosNasCuspides,
          signosInterceptados,
          signosComDuplaRegencia
        } = identificarSignosInterceptados(signosCasas);

        resolve({
          statusCode: 200,
          message: "Ephemeris computed successfully",
          ephemerisQuery: {
            year, month, date,
            hours, minutes, seconds,
            latitude, longitude, timezone, config
          },
          ephemerides,
          signos: signosPlanetas,
          casas: {
            cuspides: signosCasas,
            signosPresentes,
            signosNasCuspides,
            signosInterceptados,
            signosComDuplaRegencia
          }
        });
      } catch (error) {
        reject(new Error("Erro ao calcular casas astrológicas"));
      }
    });
  }
};

// Funções auxiliares (mockups ou sua implementação real)

async function getPlanetaryPositions(params) {
  return {
    geo: {} // Substitua por sua implementação
  };
}

async function getCuspides(params) {
  return {
    casa1: { grau: 180 },
    casa2: { grau: 210 },
    casa3: { grau: 240 },
    casa4: { grau: 270 },
    casa5: { grau: 300 },
    casa6: { grau: 330 },
    casa7: { grau: 0 },
    casa8: { grau: 30 },
    casa9: { grau: 60 },
    casa10: { grau: 90 },
    casa11: { grau: 120 },
    casa12: { grau: 150 }
  };
}

function getSignosDosPlanetas(geo) {
  return {
    sol: "Touro",
    lua: "Gêmeos",
    mercurio: "Áries",
    venus: "Câncer",
    marte: "Câncer",
    jupiter: "Leão",
    saturno: "Aquário",
    urano: "Capricórnio",
    netuno: "Capricórnio",
    plutao: "Escorpião"
  };
}
