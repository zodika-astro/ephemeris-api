'use strict';
const swisseph = require('swisseph');
const path = require('path');

// Set Swiss Ephemeris path to 'ephe' directory at project root.
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath); // Corrected: removed hyphen
console.log('Swiss Ephemeris path set:', ephePath);


const zodiacSigns = [ // Corrected to camelCase
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

// Get zodiac sign from degree.
const degreeToSign = (degree) => { // Corrected to camelCase
  const normalized = ((degree % 360) + 360) % 360;
  return zodiacSigns[Math.floor(normalized / 30)]; // Using correct const name
};

// Calculate house cusps.
const getHouses = (jd, lat, lng, houseSystem = 'P') => { // Corrected to camelCase
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`House calc error: ${res.error}`));
      resolve(res.house.slice(0, 12).map((degree, i) => ({ house: i + 1, degree })));
    });
  });
};

// Determine astrological house for planet degree based on cusps.
const determinarCasaAstrologica = (grauPlaneta, cuspides) => {
    const normalizedGrauPlaneta = ((grauPlaneta % 360) + 360) % 360;

    for (let i = 0; i < 12; i++) {
        const casaAtualCusp = cuspides[i].degree;
        const proximaCasaCusp = cuspides[(i + 1) % 12].degree;

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

// --- ASTROLOGICAL ASPECTS CALCULATION ---

const aspectDefs = [ // Corrected to camelCase
    { name: "conjuncao", degree: 0 },
    { name: "sextil", degree: 60 },
    { name: "quadratura", degree: 90 },
    { name: "trigono", degree: 120 },
    { name: "oposicao", degree: 180 }
];

const defaultOrb = 6; // Corrected to camelCase

const planetsForAspects = [ // Corrected to camelCase
    "sol", "lua", "mercurio", "venus", "marte", "jupiter", "saturno",
    "urano", "netuno", "plutao", "nodo_verdadeiro", "lilith", "quiron"
];

async function getAspects(planetGeoPos, planetData, orb = defaultOrb) { // Corrected to camelCase
    const groupedAspects = { // Corrected to camelCase
        conjuncao: [],
        sextil: [],
        quadratura: [],
        trigono: [],
        oposicao: []
    };

    const planetKeys = Object.keys(planetGeoPos).filter(key => planetsForAspects.includes(key)); // Corrected to camelCase

    for (let i = 0; i < planetKeys.length; i++) {
        for (let j = i + 1; j < planetKeys.length; j++) {
            const planet1Name = planetKeys[i]; // Corrected to camelCase
            const planet2Name = planetKeys[j]; // Corrected to camelCase

            const pos1Deg = planetGeoPos[planet1Name]; // Corrected to camelCase
            const pos2Deg = planetGeoPos[planet2Name]; // Corrected to camelCase

            const planet1Info = planetData[planet1Name]; // Corrected to camelCase
            const planet2Info = planetData[planet2Name]; // Corrected to camelCase

            if (pos1Deg === undefined || pos2Deg === undefined || !planet1Info || !planet2Info) {
                console.warn(`Aspect calc warn: data missing for ${planet1Name} or ${planet2Name}.`);
                continue;
            }

            let angularDiff = Math.abs(pos1Deg - pos2Deg); // Corrected to camelCase

            if (angularDiff > 180) {
                angularDiff = 360 - angularDiff;
            }

            for (const aspectDef of aspectDefs) { // Corrected to camelCase
                const idealDegree = aspectDef.degree; // Corrected to camelCase
                const aspectName = aspectDef.name; // Corrected to camelCase

                if (angularDiff >= (idealDegree - orb) && angularDiff <= (idealDegree + orb)) {
                    const description = `${aspectName.charAt(0).toUpperCase() + aspectName.slice(1)} - ` +
                                        `${planet1Name.charAt(0).toUpperCase() + planet1Name.slice(1)} - ` +
                                        `house ${planet1Info.house} x ` +
                                        `${planet2Name.charAt(0).toUpperCase() + planet2Name.slice(1)}, ` +
                                        `house ${planet2Info.house}`;

                    groupedAspects[aspectName].push({ // Corrected to camelCase
                        planet1: { name: planet1Name, house: planet1Info.house }, // Corrected to camelCase
                        planet2: { name: planet2Name, house: planet2Info.house }, // Corrected to camelCase
                        type: aspectName,
                        exactDegree: parseFloat(angularDiff.toFixed(4)), // Corrected to camelCase
                        appliedOrb: parseFloat(Math.abs(angularDiff - idealDegree).toFixed(4)), // Corrected to camelCase
                        description: description
                    });
                }
            }
        }
    }
    return groupedAspects; // Corrected to camelCase
}


async function getPlanets(jd, cusps) { // Corrected to camelCase
  const planetMap = { // Corrected to camelCase
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

  const geoPositions = {}; // Corrected to camelCase
  const planetData = {}; // Corrected to camelCase
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  for (const [name, id] of Object.entries(planetMap)) { // Corrected to camelCase
    try {
      const current = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd, id, flags, resolve)
      );
      const future = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd + 0.01, id, flags, resolve)
      );

      const currentLong = current.longitude ?? current.position?.[0]; // Corrected to camelCase
      const futureLong = future.longitude ?? future.position?.[0]; // Corrected to camelCase

      if (currentLong == null || futureLong == null) {
        console.warn(`Planet pos warn: ${name}.`);
        continue;
      }

      const astrologicalHouse = determinarCasaAstrologica(currentLong, cusps); // Corrected to camelCase

      geoPositions[name] = currentLong; // Corrected to camelCase
      planetData[name] = { // Corrected to camelCase
        sign: degreeToSign(currentLong), // Corrected to camelCase
        retrograde: futureLong < currentLong, // Corrected to camelCase
        house: astrologicalHouse // Corrected to camelCase
      };
    } catch (err) {
      console.error(`Planet calc error: ${name}.`);
    }
  }

  return { geo: geoPositions, data: planetData }; // Corrected to camelCase
}

// --- ELEMENTAL AND MODAL QUALITIES ANALYSIS ---

// Map zodiac signs to elements.
const signElementMap = { // Corrected to camelCase
    "Áries": "fogo", "Leão": "fogo", "Sagitário": "fogo",
    "Touro": "terra", "Virgem": "terra", "Capricórnio": "terra",
    "Gêmeos": "ar", "Libra": "ar", "Aquário": "ar",
    "Câncer": "agua", "Escorpião": "agua", "Peixes": "agua"
};

// Map zodiac signs to qualities (modalities).
const signQualityMap = { // Corrected to camelCase
    "Áries": "cardinal", "Câncer": "cardinal", "Libra": "cardinal", "Capricórnio": "cardinal",
    "Touro": "fixa", "Leão": "fixa", "Escorpião": "fixa", "Aquário": "fixa",
    "Gêmeos": "mutavel", "Virgem": "mutavel", "Sagitário": "mutavel", "Peixes": "mutavel"
};

// --- WEIGHTED SCORING RULES ---
const pointWeights = { // Corrected to camelCase
    // Core Individuality (3 pts each)
    sol: 3,
    lua: 3,
    ascendente: 3, // Ascendant is House 1 cusp
    mc: 3,         // Midheaven is House 10 cusp

    // Individual Expression (2 pts each)
    mercurio: 2,
    venus: 2,
    marte: 2,
    jupiter: 2,

    // Generational Tendencies (1 pt each)
    saturno: 1,
    urano: 1,
    netuno: 1,
    plutao: 1
    // True Node, Lilith, Chiron are not included.
};

/**
 * Defines thresholds for deficiency, balance, or excess of elements/qualities.
 * Based on a total sum of 24 points.
 */
const elementQualityLimits = { // Corrected to camelCase
    deficiencyMax: 3,  // Corrected to camelCase
    balanceMax: 8      // Corrected to camelCase
};

/**
 * Determines status (deficiency, balance, excess) by count.
 * @param {number} count The point count.
 * @returns {string} The status ('deficiency', 'balance', 'excess').
 */
const getStatus = (count) => { // Corrected to camelCase
    if (count <= elementQualityLimits.deficiencyMax) {
        return "deficiency";
    } else if (count <= elementQualityLimits.balanceMax) {
        return "balance";
    } else {
        return "excess";
    }
};

/**
 * Analyzes elemental and modal qualities from astrological point data.
 * @param {Object} planetData Planet data including their signs.
 * @param {Array<Object>} cusps Array of house cusps (for Asc/MC).
 * @returns {Object} Object containing element and quality analysis.
 */
async function analyzeElementsAndQualities(planetData, cusps) { // Corrected to camelCase
    const elementCounts = { fogo: 0, terra: 0, ar: 0, agua: 0 }; // Corrected to camelCase
    const qualityCounts = { cardinal: 0, fixa: 0, mutavel: 0 }; // Corrected to camelCase

    // Map cusp data for Ascendant and Midheaven as "points".
    const additionalPoints = { // Corrected to camelCase
        ascendente: { sign: degreeToSign(cusps[0]?.degree) }, // Corrected to camelCase
        mc: { sign: degreeToSign(cusps[9]?.degree) } // Corrected to camelCase
    };

    // Combine all points for iteration, considering only those with defined weights.
    const allPoints = { ...planetData, ...additionalPoints }; // Corrected to camelCase

    for (const pointName in allPoints) { // Corrected to camelCase
        // Check if point has defined weight.
        if (pointWeights[pointName] !== undefined) { // Corrected to camelCase
            const weight = pointWeights[pointName]; // Corrected to camelCase
            const pointSign = allPoints[pointName].sign; // Corrected to camelCase

            if (signElementMap[pointSign]) { // Corrected to camelCase
                elementCounts[signElementMap[pointSign]] += weight; // Corrected to camelCase
            }
            if (signQualityMap[pointSign]) { // Corrected to camelCase
                qualityCounts[signQualityMap[pointSign]] += weight; // Corrected to camelCase
            }
        }
    }

    // Determine status (deficiency, balance, excess) for each element.
    const elementResults = {}; // Corrected to camelCase
    for (const element in elementCounts) {
        elementResults[element] = {
            count: elementCounts[element],
            status: getStatus(elementCounts[element]) // Corrected to camelCase
        };
    }

    // Determine status (deficiency, balance, excess) for each quality.
    const qualityResults = {}; // Corrected to camelCase
    for (const quality in qualityCounts) {
        qualityResults[quality] = {
            count: qualityCounts[quality],
            status: getStatus(qualityCounts[quality]) // Corrected to camelCase
        };
    }

    return { elements: elementResults, qualities: qualityResults }; // Corrected to camelCase
}
