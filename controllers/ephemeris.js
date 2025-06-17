'use strict';
const swisseph = require('swisseph');
const path = require('path');

// Corrige o caminho para a pasta 'ephe' que está na raiz do projeto
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
console.log('SwissEphemeris path set to:', ephePath);


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

const determinarCasaAstrologica = (grauPlaneta, cuspides) => {
    const normalizedGrauPlaneta = ((grauPlaneta % 360) + 360) % 360;

    for (let i = 0; i < 12; i++) {
        const casaAtualCusp = cuspides[i].grau;
        const proximaCasaCusp = cuspides[(i + 1) % 12].grau; 

        if (casaAtualCusp < proximaCasaCusp) {
            if (normalizedGrauPlaneta >= casaAtualCusp && normalizedGrauPlaneta < proximaCasaCusp) {
                return i + 1;
            }
        } else {
            if (normalizedGrauPlaneta >= casaAtualCusp || normalizedGrauPlaneta < proximaCasaCusp) {
                return i + 1;
            }
        }
    }
    return null;
};

// --- CÁLCULO DE ASPECTOS ASTROLÓGICOS COM AGRUPAMENTO E CASAS ---

// Definição dos aspectos e seus ângulos ideais
const ASPECTOS_DEFINICOES = [
    { nome: "conjuncao", grau: 0 },
    { nome: "sextil", grau: 60 },
    { nome: "quadratura", grau: 90 },
    { nome: "trigono", grau: 120 },
    { nome: "oposicao", grau: 180 }
];

// Orbe padrão para os aspectos (agora 6 graus, conforme sua observação)
const ORBE_PADRAO = 6; // Graus de tolerância

// Lista de planetas a serem considerados para aspectos (deve corresponder às chaves em 'geo')
const PLANETAS_PARA_ASPECTOS = [
    "sol", "lua", "mercurio", "venus", "marte", "jupiter", "saturno",
    "urano", "netuno", "plutao", "nodo_verdadeiro", "lilith", "quiron"
];

/**
 * Calcula os aspectos astrológicos entre todos os pares de planetas.
 * A resposta é agrupada por tipo de aspecto e inclui a casa de cada planeta.
 * @param {Object} planetGeoPositions Um objeto com as posições (graus) de cada planeta (vindo de ephemerides.geo).
 * @param {Object} planetSignosData Um objeto com os dados completos de signo, retrogrado e casa de cada planeta (vindo de signos).
 * @param {number} [orb=ORBE_PADRAO] O orbe de tolerância para os aspectos.
 * @returns {Object} Um objeto onde as chaves são os tipos de aspecto e os valores são arrays de aspectos encontrados.
 */
async function computeAspects(planetGeoPositions, planetSignosData, orb = ORBE_PADRAO) {
    const aspectosAgrupados = { // <<< Novo formato de retorno: objeto agrupado
        conjuncao: [],
        sextil: [],
        quadratura: [],
        trigono: [],
        oposicao: []
    };

    const chavesPlanetas = Object.keys(planetGeoPositions).filter(key => PLANETAS_PARA_ASPECTOS.includes(key));

    for (let i = 0; i < chavesPlanetas.length; i++) {
        for (let j = i + 1; j < chavesPlanetas.length; j++) {
            const planeta1Nome = chavesPlanetas[i];
            const planeta2Nome = chavesPlanetas[j];

            const pos1 = planetGeoPositions[planeta1Nome];
            const pos2 = planetGeoPositions[planeta2Nome];

            // Obter informações completas dos planetas para incluir a casa
            const infoPlaneta1 = planetSignosData[planeta1Nome];
            const infoPlaneta2 = planetSignosData[planeta2Nome];

            if (pos1 === undefined || pos2 === undefined || !infoPlaneta1 || !infoPlaneta2) {
                console.warn(`Posição ou informação inválida para ${planeta1Nome} ou ${planeta2Nome} ao calcular aspectos.`);
                continue; 
            }

            let diferencaAngular = Math.abs(pos1 - pos2);

            if (diferencaAngular > 180) {
                diferencaAngular = 360 - diferencaAngular;
            }

            for (const aspectoDef of ASPECTOS_DEFINICOES) {
                const grauIdeal = aspectoDef.grau;
                const nomeAspecto = aspectoDef.nome;

                if (diferencaAngular >= (grauIdeal - orb) && diferencaAngular <= (grauIdeal + orb)) {
                    // Monta a descrição conforme o formato solicitado
                    const descricao = `${nomeAspecto.charAt(0).toUpperCase() + nomeAspecto.slice(1)} - ` +
                                      `${planeta1Nome.charAt(0).toUpperCase() + planeta1Nome.slice(1)} - ` +
                                      `casa ${infoPlaneta1.casa} x ` +
                                      `${planeta2Nome.charAt(0).toUpperCase() + planeta2Nome.slice(1)}, ` +
                                      `casa ${infoPlaneta2.casa}`;

                    aspectosAgrupados[nomeAspecto].push({
                        planeta1: { nome: planeta1Nome, casa: infoPlaneta1.casa }, // <<< Inclui nome e casa
                        planeta2: { nome: planeta2Nome, casa: infoPlaneta2.casa }, // <<< Inclui nome e casa
                        tipo: nomeAspecto,
                        grauExato: parseFloat(diferencaAngular.toFixed(4)),
                        orbAplicado: parseFloat(Math.abs(diferencaAngular - grauIdeal).toFixed(4)),
                        descricao: descricao // <<< Novo campo de descrição formatada
                    });
                }
            }
        }
    }
    return aspectosAgrupados; // <<< Retorna o objeto agrupado
}


async function computePlanets(jd, cuspides) { 
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
    plutao: swisseph.SE_PLUTO,
    nodo_verdadeiro: swisseph.SE_TRUE_NODE,
    lilith: swisseph.SE_MEAN_APOG,
    quiron: swisseph.SE_CHIRON
  };

  const geo = {};
  const signosData = {}; 
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  for (const [nome, id] of Object.entries(planetas)) {
    try {
      const atual = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd, id, flags, resolve)
      );
      const futuro = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd + 0.01, id, flags, resolve)
      );

      const longitudeAtual = atual.longitude ?? atual.position?.[0];
      const longitudeFutura = futuro.longitude ?? futuro.position?.[0];

      if (longitudeAtual == null || longitudeFutura == null) {
        console.warn(`⚠️ Não foi possível obter posição para ${nome}`);
        continue;
      }

      const casaAstrologica = determinarCasaAstrologica(longitudeAtual, cuspides); 

      geo[nome] = longitudeAtual;
      signosData[nome] = { 
        signo: grauParaSigno(longitudeAtual),
        retrogrado: longitudeFutura < longitudeAtual,
        casa: casaAstrologica 
      };
    } catch (err) {
      console.error(`❌ Erro ao calcular ${nome}:`, err.message);
    }
  }

  return { geo, signos: signosData }; 
}

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
    
    // Obter posições geocêntricas (geo) E os dados completos dos signos (com casas)
    const { geo, signos } = await computePlanets(jd, cuspides); 

    // Chama a função de cálculo de aspectos, passando 'geo' e 'signos' (para as casas)
    const aspectos = await computeAspects(geo, signos); // <<< Mudei a chamada aqui

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
      },
      aspectos // <<< Novo campo 'aspectos' na resposta final, agora agrupado
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
