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

  casas.push({ grau: (casas[0].grau + 360), casa: 13 });

  const signosAtravessados = new Set();

  for (let i = 0; i < 12; i++) {
    const grauInicio = casas[i].grau;
    const grauFim = casas[i + 1].grau;

    for (let g = grauInicio; g < grauFim; g += 1) {
      const signo = grauParaSigno(g);
      signosAtravessados.add(signo);
    }
  }

  const signosNasCuspides = new Set(
    Object.values(cuspides).map(c => grauParaSigno(c.grau))
  );

  const signosInterceptados = [...signosAtravessados]
    .filter(s => !signosNasCuspides.has(s));

  return {
    signosPresentes: [...signosAtravessados],
    signosNasCuspides: [...signosNasCuspides],
    signosInterceptados
  };
}

module.exports = {
  compute: async ({
    year,
    month,
    date,
    hours,
    minutes,
    seconds,
    latitude,
    longitude,
    timezone,
    config
  }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const ephemerides = await getPlanetaryPositions({
          year,
          month,
          date,
          hours,
          minutes,
          seconds,
          latitude,
          longitude,
          timezone
        });

        const signosPlanetas = getSignosDosPlanetas(ephemerides.geo);

        const cuspides = await getCuspides({
          year,
          month,
          date,
          hours,
          minutes,
          seconds,
          latitude,
          longitude,
          timezone
        });

        const signosCasas = {};
        for (const [casa, data] of Object.entries(cuspides)) {
          signosCasas[casa] = {
            grau: data.grau,
            signo: grauParaSigno(data.grau)
          };
        }

        const { signosPresentes, signosNasCuspides, signosInterceptados } = identificarSignosInterceptados(signosCasas);

        resolve({
          statusCode: 200,
          message: "Ephemeris computed successfully",
          ephemerisQuery: {
            year,
            month,
            date,
            hours,
            minutes,
            seconds,
            latitude,
            longitude,
            timezone,
            config
          },
          ephemerides,
          signos: signosPlanetas,
          casas: {
            cuspides: signosCasas,
            signosPresentes,
            signosNasCuspides,
            signosInterceptados
          }
        });
      } catch (error) {
        reject(new Error("Erro ao calcular casas astrológicas"));
      }
    });
  }
};

// Funções auxiliares (mockups ou sua implementação já existente)

async function getPlanetaryPositions(params) {
  // Substitua com sua implementação real que consulta Swiss Ephemeris
  return {
    geo: {} // retornos dos planetas
  };
}

async function getCuspides(params) {
  // Substitua com sua lógica de cálculo das cúspides (casas)
  return {
    casa1: { grau: 217.67 },
    casa2: { grau: 246.02 },
    casa3: { grau: 281.8 },
    casa4: { grau: 320.9 },
    casa5: { grau: 353.79 },
    casa6: { grau: 18.67 },
    casa7: { grau: 37.67 },
    casa8: { grau: 66.02 },
    casa9: { grau: 101.8 },
    casa10: { grau: 140.9 },
    casa11: { grau: 173.79 },
    casa12: { grau: 198.67 }
  };
}

function getSignosDosPlanetas(geo) {
  // Substitua com sua lógica real
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
