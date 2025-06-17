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
      // As cúspides são retornadas em ordem (casa 1, casa 2, ...).
      // A cúspide da casa 10 é cuspides[9] e da casa 1 é cuspides[0].
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

// --- CÁLCULO DE ASPECTOS ASTROLÓGICOS ---

const ASPECTOS_DEFINICOES = [
    { nome: "conjuncao", grau: 0 },
    { nome: "sextil", grau: 60 },
    { nome: "quadratura", grau: 90 },
    { nome: "trigono", grau: 120 },
    { nome: "oposicao", grau: 180 }
];

const ORBE_PADRAO = 6; // Graus de tolerância

const PLANETAS_PARA_ASPECTOS = [
    "sol", "lua", "mercurio", "venus", "marte", "jupiter", "saturno",
    "urano", "netuno", "plutao", "nodo_verdadeiro", "lilith", "quiron"
];

async function computeAspects(planetGeoPositions, planetSignosData, orb = ORBE_PADRAO) {
    const aspectosAgrupados = {
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
                    const descricao = `${nomeAspecto.charAt(0).toUpperCase() + nomeAspecto.slice(1)} - ` +
                                      `${planeta1Nome.charAt(0).toUpperCase() + planeta1Nome.slice(1)} - ` +
                                      `casa ${infoPlaneta1.casa} x ` +
                                      `${planeta2Nome.charAt(0).toUpperCase() + planeta2Nome.slice(1)}, ` +
                                      `casa ${infoPlaneta2.casa}`;

                    aspectosAgrupados[nomeAspecto].push({
                        planeta1: { nome: planeta1Nome, casa: infoPlaneta1.casa },
                        planeta2: { nome: planeta2Nome, casa: infoPlaneta2.casa },
                        tipo: nomeAspecto,
                        grauExato: parseFloat(diferencaAngular.toFixed(4)),
                        orbAplicado: parseFloat(Math.abs(diferencaAngular - grauIdeal).toFixed(4)),
                        descricao: descricao
                    });
                }
            }
        }
    }
    return aspectosAgrupados;
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

// --- NOVA FUNCIONALIDADE: ANÁLISE DE ELEMENTOS E QUALIDADES/MODALIDADES (com pontuação ponderada) ---

// Mapeamentos de signos para elementos e qualidades
const SIGNO_ELEMENTO_MAP = {
    "Áries": "fogo", "Leão": "fogo", "Sagitário": "fogo",
    "Touro": "terra", "Virgem": "terra", "Capricórnio": "terra",
    "Gêmeos": "ar", "Libra": "ar", "Aquário": "ar",
    "Câncer": "agua", "Escorpião": "agua", "Peixes": "agua"
};

const SIGNO_QUALIDADE_MAP = {
    "Áries": "cardinal", "Câncer": "cardinal", "Libra": "cardinal", "Capricórnio": "cardinal",
    "Touro": "fixa", "Leão": "fixa", "Escorpião": "fixa", "Aquário": "fixa",
    "Gêmeos": "mutavel", "Virgem": "mutavel", "Sagitário": "mutavel", "Peixes": "mutavel"
};

// --- NOVAS REGRAS DE PONTUAÇÃO PONDERADA ---
const PESO_POR_PONTO = {
    // Grupo: Base da Individualidade (3 pontos cada)
    sol: 3,
    lua: 3,
    ascendente: 3, // O Ascendente é a cúspide da casa 1
    mc: 3,         // O Meio do Céu é a cúspide da casa 10

    // Grupo: Vias de Expressão da Individualidade (2 pontos cada)
    mercurio: 2,
    venus: 2,
    marte: 2,
    jupiter: 2,

    // Grupo: Tendências Geracionais (1 ponto cada)
    saturno: 1,
    urano: 1,
    netuno: 1,
    plutao: 1
    
    // Nodo Verdadeiro, Lilith, Quíron NÃO SÃO INCLUÍDOS na contagem de elementos/qualidades,
    // pois não foram especificados nas regras de pontuação.
};

/**
 * NOVOS LIMITES para determinar equilíbrio, excesso ou falta de elementos/qualidades.
 * Baseado em uma soma total de 24 pontos.
 */
const LIMITES_ELEMENTOS_QUALIDADES = {
    faltaMax: 3,        // 3 ou menos pontos = falta
    equilibrioMax: 8    // Entre 4 e 8 pontos = equilíbrio
                        // 9 ou mais pontos = excesso (pelo 'else' implícito)
};

/**
 * Determina o status (falta, equilibrio, excesso) com base na contagem e limites.
 * @param {number} count A contagem de pontos.
 * @returns {string} O status ('falta', 'equilibrio', 'excesso').
 */
const getStatusByCount = (count) => {
    if (count <= LIMITES_ELEMENTOS_QUALIDADES.faltaMax) {
        return "falta";
    } else if (count <= LIMITES_ELEMENTOS_QUALIDADES.equilibrioMax) {
        return "equilibrio";
    } else {
        return "excesso";
    }
};

/**
 * Analisa os elementos e qualidades (modalidades) com base nas posições dos pontos astrológicos e sua pontuação ponderada.
 * @param {Object} planetSignosData Dados dos planetas com seus signos (vindo de signos).
 * @param {Array<Object>} cuspides Array de cúspides de casas (para Asc/MC).
 * @returns {Object} Objeto contendo as análises de elementos e qualidades.
 */
async function analyzeElementalAndModalQualities(planetSignosData, cuspides) {
    const elementCounts = { fogo: 0, terra: 0, ar: 0, agua: 0 };
    const qualityCounts = { cardinal: 0, fixa: 0, mutavel: 0 };

    // Mapeia os dados de cúspides para facilitar o acesso de Ascendente e MC como "pontos"
    const pontosAdicionais = {
        ascendente: { signo: grauParaSigno(cuspides[0]?.grau) },
        mc: { signo: grauParaSigno(cuspides[9]?.grau) }
    };

    // Combina planetas e pontos adicionais para a iteração, considerando apenas aqueles com peso definido
    const todosOsPontos = { ...planetSignosData, ...pontosAdicionais };

    for (const pontoNome in todosOsPontos) {
        // Verifica se o ponto tem um peso definido nas suas regras
        if (PESO_POR_PONTO[pontoNome] !== undefined) {
            const peso = PESO_POR_PONTO[pontoNome];
            const signoDoPonto = todosOsPontos[pontoNome].signo;

            if (SIGNO_ELEMENTO_MAP[signoDoPonto]) {
                elementCounts[SIGNO_ELEMENTO_MAP[signoDoPonto]] += peso;
            }
            if (SIGNO_QUALIDADE_MAP[signoDoPonto]) {
                qualityCounts[SIGNO_QUALIDADE_MAP[signoDoPonto]] += peso;
            }
        }
    }

    // Determinar o status (falta, equilibrio, excesso) para cada
    const elementosResult = {};
    for (const elemento in elementCounts) {
        elementosResult[elemento] = {
            contagem: elementCounts[elemento],
            status: getStatusByCount(elementCounts[elemento])
        };
    }

    const qualidadesResult = {};
    for (const qualidade in qualityCounts) {
        qualidadesResult[qualidade] = {
            contagem: qualityCounts[qualidade],
            status: getStatusByCount(qualityCounts[qualidade])
        };
    }

    return { elementos: elementosResult, qualidades: qualidadesResult };
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
    
    const { geo, signos } = await computePlanets(jd, cuspides); 

    const aspectos = await computeAspects(geo, signos); 

    // --- CHAMADA ATUALIZADA PARA ANÁLISE DE ELEMENTOS E QUALIDADES ---
    // Passamos 'signos' (para os planetas) e 'cuspides' (para Asc/MC)
    const { elementos, qualidades } = await analyzeElementalAndModalQualities(signos, cuspides);

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
      aspectos, 
      elementos, 
      qualidades 
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
