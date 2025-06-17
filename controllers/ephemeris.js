'use strict';
const swisseph = require('swisseph');
const path = require('path');

// Set Swiss Ephemeris path.
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
console.log('Swiss Ephemeris path set:', ephePath);

const zodiacSigns = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

const degreeToSign = (degree) => {
  const normalized = ((degree % 360) + 360) % 360;
  return zodiacSigns[Math.floor(normalized / 30)];
};

const getHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`House calc error: ${res.error}`));
      resolve(res.house.slice(0, 12).map((degree, i) => ({ house: i + 1, degree })));
    });
  });
};

// NOTE: This function's name and core logic are preserved due to sensitivity.
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

const aspectDefs = [
    { name: "conjuncao", degree: 0 },
    { name: "sextil", degree: 60 },
    { name: "quadratura", degree: 90 },
    { name: "trigono", degree: 120 },
    { name: "oposicao", degree: 180 }
];

const defaultOrb = 6;

const planetsForAspects = [
    "sol", "lua", "mercurio", "venus", "marte", "jupiter", "saturno",
    "urano", "netuno", "plutao", "nodo_verdadeiro", "lilith", "quiron"
];

async function getAspects(planetGeoPos, planetData, orb = defaultOrb) {
    const groupedAspects = {
        conjuncao: [], sextil: [], quadratura: [], trigono: [], oposicao: []
    };

    const planetKeys = Object.keys(planetGeoPos).filter(key => planetsForAspects.includes(key));

    for (let i = 0; i < planetKeys.length; i++) {
        for (let j = i + 1; j < planetKeys.length; j++) {
            const planet1Name = planetKeys[i];
            const planet2Name = planetKeys[j];

            const pos1Deg = planetGeoPos[planet1Name];
            const pos2Deg = planetGeoPos[planet2Name];

            const planet1Info = planetData[planet1Name];
            const planet2Info = planetData[planet2Name];

            if (pos1Deg === undefined || pos2Deg === undefined || !planet1Info || !planet2Info) {
                console.warn(`Aspect calc warn: data missing for ${planet1Name} or ${planet2Name}.`);
                continue;
            }

            let angularDiff = Math.abs(pos1Deg - pos2Deg);
            if (angularDiff > 180) {
                angularDiff = 360 - angularDiff;
            }

            for (const aspectDef of aspectDefs) {
                const idealDegree = aspectDef.degree;
                const aspectName = aspectDef.name;

                if (angularDiff >= (idealDegree - orb) && angularDiff <= (idealDegree + orb)) {
                    const description = `${aspectName.charAt(0).toUpperCase() + aspectName.slice(1)} - ` +
                                        `${planet1Name.charAt(0).toUpperCase() + planet1Name.slice(1)} - ` +
                                        `house ${planet1Info.house} x ` +
                                        `${planet2Name.charAt(0).toUpperCase() + planet2Name.slice(1)}, ` +
                                        `house ${planet2Info.house}`;

                    groupedAspects[aspectName].push({
                        planet1: { name: planet1Name, house: planet1Info.house },
                        planet2: { name: planet2Name, house: planet2Info.house },
                        type: aspectName,
                        exactDegree: parseFloat(angularDiff.toFixed(4)),
                        appliedOrb: parseFloat(Math.abs(angularDiff - idealDegree).toFixed(4)),
                        description: description
                    });
                }
            }
        }
    }
    return groupedAspects;
}

async function getPlanets(jd, cusps) {
  const planetMap = {
    sol: swisseph.SE_SUN, lua: swisseph.SE_MOON, mercurio: swisseph.SE_MERCURY,
    venus: swisseph.SE_VENUS, marte: swisseph.SE_MARS, jupiter: swisseph.SE_JUPITER,
    saturno: swisseph.SE_SATURN, urano: swisseph.SE_URANUS, netuno: swisseph.SE_NEPTUNE,
    plutao: swisseph.SE_PLUTO, nodo_verdadeiro: swisseph.SE_TRUE_NODE,
    lilith: swisseph.SE_MEAN_APOG, quiron: swisseph.SE_CHIRON
  };

  const geoPositions = {};
  const planetData = {};
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  for (const [name, id] of Object.entries(planetMap)) {
    try {
      const current = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd, id, flags, resolve)
      );
      const future = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd + 0.01, id, flags, resolve)
      );

      const currentLong = current.longitude ?? current.position?.[0];
      const futureLong = future.longitude ?? future.position?.[0];

      if (currentLong == null || futureLong == null) {
        console.warn(`Planet pos warn: ${name}.`);
        continue;
      }

      const astrologicalHouse = determinarCasaAstrologica(currentLong, cusps);

      geoPositions[name] = currentLong;
      planetData[name] = {
        sign: degreeToSign(currentLong),
        retrograde: futureLong < currentLong,
        house: astrologicalHouse
      };
    } catch (err) {
      console.error(`Planet calc error: ${name}.`);
    }
  }
  return { geo: geoPositions, data: planetData };
}

const signElementMap = {
    "Áries": "fogo", "Leão": "fogo", "Sagitário": "fogo",
    "Touro": "terra", "Virgem": "terra", "Capricórnio": "terra",
    "Gêmeos": "ar", "Libra": "ar", "Aquário": "ar",
    "Câncer": "agua", "Escorpião": "agua", "Peixes": "agua"
};

const signQualityMap = {
    "Áries": "cardinal", "Câncer": "cardinal", "Libra": "cardinal", "Capricórnio": "cardinal",
    "Touro": "fixa", "Leão": "fixa", "Escorpião": "fixa", "Aquário": "fixa",
    "Gêmeos": "mutavel", "Virgem": "mutavel", "Sagitário": "mutavel", "Peixes": "mutavel"
};

const pointWeights = {
    sol: 3, lua: 3, ascendente: 3, mc: 3,
    mercurio: 2, venus: 2, marte: 2, jupiter: 2,
    saturno: 1, urano: 1, netuno: 1, plutao: 1
};

const elementQualityLimits = {
    deficiencyMax: 3,
    balanceMax: 8
};

const getStatus = (count) => {
    if (count <= elementQualityLimits.deficiencyMax) {
        return "deficiency";
    } else if (count <= elementQualityLimits.balanceMax) {
        return "balance";
    } else {
        return "excess";
    }
};

async function analyzeElementsAndQualities(planetData, cusps) {
    const elementCounts = { fogo: 0, terra: 0, ar: 0, agua: 0 };
    const qualityCounts = { cardinal: 0, fixa: 0, mutavel: 0 };

    const additionalPoints = {
        ascendente: { sign: degreeToSign(cusps[0]?.degree) },
        mc: { sign: degreeToSign(cusps[9]?.degree) }
    };

    const allPoints = { ...planetData, ...additionalPoints };

    for (const pointName in allPoints) {
        if (pointWeights[pointName] !== undefined) {
            const weight = pointWeights[pointName];
            const pointSign = allPoints[pointName].sign;

            if (signElementMap[pointSign]) {
                elementCounts[signElementMap[pointSign]] += weight;
            }
            if (signQualityMap[pointSign]) {
                qualityCounts[signQualityMap[pointSign]] += weight;
            }
        }
    }

    const elementResults = {};
    for (const element in elementCounts) {
        elementResults[element] = {
            count: elementCounts[element],
            status: getStatus(elementCounts[element])
        };
    }

    const qualityResults = {};
    for (const quality in qualityCounts) {
        qualityResults[quality] = {
            count: qualityCounts[quality],
            status: getStatus(qualityCounts[quality])
        };
    }
    return { elements: elementResults, qualities: qualityResults };
}

// NOTE: Complex interception logic is omitted for stability.
async function analyzeHouses(cusps) {
    const cuspSigns = cusps.map(cusp => degreeToSign(cusp.degree));
    const doubleRulershipSigns = new Set();

    for (let i = 0; i < 12; i++) {
        const currentHouseCuspSign = cuspSigns[i];
        for (let k = 0; k < 12; k++) {
            if (i !== k && currentHouseCuspSign === cuspSigns[k]) {
                doubleRulershipSigns.add(currentHouseCuspSign);
            }
        }
    }
    return {
        interceptedHouses: [],
        interceptedSigns: [],
        doubleRulershipSigns: Array.from(doubleRulershipSigns)
    };
}

async function computeChart({
  year, month, day, hour, minute, second,
  latitude, longitude, houseSystem = 'P',
  timezoneOffset
}) {
  const date = new Date(year, month - 1, day, hour, minute, second);
  const utcDate = new Date(date.getTime() - (timezoneOffset * 60 * 1000));
  const jd = swisseph.swe_julday(
    utcDate.getFullYear(), utcDate.getMonth() + 1, utcDate.getDate(),
    utcDate.getHours() + utcDate.getMinutes() / 60 + utcDate.getSeconds() / 3600,
    swisseph.SE_GREG_CAL
  );

  try {
    const houses = await getHouses(jd, latitude, longitude, houseSystem);
    const { geo: planetGeoPositions, data: planetData } = await getPlanets(jd, houses);
    const aspects = await getAspects(planetGeoPositions, planetData);
    const { elements, qualities } = await analyzeElementsAndQualities(planetData, houses);
    const houseAnalysis = await analyzeHouses(houses);

    return {
      statusCode: 200,
      ephemerides: planetData,
      signos: planetData,
      casas: houses,
      aspectos: aspects,
      elementos: elements,
      qualidades: qualities,
      house_analysis: houseAnalysis,
    };
  } catch (error) {
    console.error(`Compute chart error: ${error.message}`);
    return {
      statusCode: 500,
      message: `Failed to compute chart: ${error.message}`
    };
  }
}

// Export main functions.
module.exports = {
  getHouses,
  determinarCasaAstrologica,
  getAspects,
  getPlanets,
  analyzeElementsAndQualities,
  analyzeHouses,
  computeChart
};
