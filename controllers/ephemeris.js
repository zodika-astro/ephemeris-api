'use strict';

const swisseph = require('swisseph');
const path = require('path');
const logger = require('../logger');

// Set Swiss Ephemeris path
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
logger.info(`Swiss Ephemeris path set to: ${ephePath}`);

// Zodiac signs
const signs = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Aspect definitions and default orb
const ASPECT_DEFINITIONS = [
  { name: "conjunction", degree: 0, defaultOrb: 8, luminaryOrb: 10 },
  { name: "sextile", degree: 60, defaultOrb: 6, luminaryOrb: 6 }, // Alterado para 6
  { name: "square", degree: 90, defaultOrb: 8, luminaryOrb: 8 },   // Alterado para 8
  { name: "trine", degree: 120, defaultOrb: 8, luminaryOrb: 8 },   // Alterado para 8
  { name: "opposition", degree: 180, defaultOrb: 8, luminaryOrb: 10 }
];
const DEFAULT_ORB = 6; // Este não é mais tão relevante, mas mantido.

const PLANETS_FOR_ASPECTS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "trueNode", "lilith", "chiron"
];

// Element and modality classification
const SIGN_ELEMENT_MAP = {
  "Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
  "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
  "Gemini": "air", "Libra": "air", "Aquarius": "air",
  "Cancer": "water", "Scorpio": "water", "Pisces": "water"
};

const SIGN_QUALITY_MAP = {
  "Aries": "cardinal", "Cancer": "cardinal", "Libra": "cardinal", "Capricorn": "cardinal",
  "Taurus": "fixed", "Leo": "fixed", "Scorpio": "fixed", "Aquarius": "fixed",
  "Gemini": "mutable", "Virgo": "mutable", "Sagittarius": "mutable", "Pisces": "mutable"
};

// Weight used for elemental/modality analysis
const WEIGHT_PER_POINT = {
  sun: 3, moon: 3, ascendant: 3, mc: 3,
  mercury: 2, venus: 2, mars: 2, jupiter: 2,
  saturn: 1, uranus: 1, neptune: 1, pluto: 1
};

// Converts a degree to its corresponding zodiac sign
const degreeToSign = (degree) => {
  const normalized = ((degree % 360) + 360) % 360;
  return signs[Math.floor(normalized / 30)];
};

// Returns status based on point count
const getStatusByCount = (count) => {
  const LACK_MAX = 3;
  const BALANCE_MAX = 8;
  if (count <= LACK_MAX) return "lack";
  if (count <= BALANCE_MAX) return "balance";
  return "excess";
};

// Calculates house cusps using Swiss Ephemeris
const computeHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`House calculation error: ${res.error}`));
      resolve(res.house.slice(0, 12).map((degree, i) => ({ house: i + 1, degree })));
    });
  });
};

// Determines which house a planet is in
const determineAstrologicalHouse = (planetDegree, cusps) => {
  const normalizedPlanetDegree = ((planetDegree % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const current = cusps[i].degree;
    const next = cusps[(i + 1) % 12].degree;
    if (current < next) {
      if (normalizedPlanetDegree >= current && normalizedPlanetDegree < next) return i + 1;
    } else {
      if (normalizedPlanetDegree >= current || normalizedPlanetDegree < next) return i + 1;
    }
  }
  return null;
};

// Computes planetary positions, signs, retrogradation, and houses
async function computePlanets(jd, cusps) {
  const planetsMap = {
    sun: swisseph.SE_SUN, moon: swisseph.SE_MOON, mercury: swisseph.SE_MERCURY,
    venus: swisseph.SE_VENUS, mars: swisseph.SE_MARS, jupiter: swisseph.SE_JUPITER,
    saturn: swisseph.SE_SATURN, uranus: swisseph.SE_URANUS, neptune: swisseph.SE_NEPTUNE,
    pluto: swisseph.SE_PLUTO, trueNode: swisseph.SE_TRUE_NODE, lilith: swisseph.SE_MEAN_APOG,
    chiron: swisseph.SE_CHIRON
  };

  const geoPositions = {};
  const signData = {};
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  for (const [name, id] of Object.entries(planetsMap)) {
    try {
      const current = await new Promise((resolve) => swisseph.swe_calc_ut(jd, id, flags, resolve));
      const future = await new Promise((resolve) => swisseph.swe_calc_ut(jd + 0.01, id, flags, resolve));
      const currentLongitude = current.longitude ?? current.position?.[0];
      const futureLongitude = future.longitude ?? future.position?.[0];

      if (currentLongitude == null || futureLongitude == null) {
        logger.warn('Could not get position for ' + name + '.');
        continue;
      }

      const astrologicalHouse = determineAstrologicalHouse(currentLongitude, cusps);
      const delta = ((futureLongitude - currentLongitude + 540) % 360) - 180;
      const isRetrograde = delta < 0;

      geoPositions[name] = currentLongitude;
      signData[name] = {
        sign: degreeToSign(currentLongitude),
        retrograde: isRetrograde ? "yes" : "no",
        house: astrologicalHouse
      };
    } catch (err) {
      logger.error('Error calculating ' + name + ': ' + err.message);
    }
  }
  return { geo: geoPositions, signs: signData };
}

// Computes aspects between all planetary pairs
async function computeAspects(planetGeoPositions, planetSignData) {
  const groupedAspects = {
    conjunction: [], sextile: [], square: [], trine: [], opposition: []
  };

  const planetKeys = Object.keys(planetGeoPositions).filter(key => PLANETS_FOR_ASPECTS.includes(key));

  for (let i = 0; i < planetKeys.length; i++) {
    for (let j = i + 1; j < planetKeys.length; j++) {
      const [p1, p2] = [planetKeys[i], planetKeys[j]];
      const [pos1, pos2] = [planetGeoPositions[p1], planetGeoPositions[p2]];
      const [info1, info2] = [planetSignData[p1], planetSignData[p2]];

      if (pos1 === undefined || pos2 === undefined || !info1 || !info2) {
        logger.warn(`Invalid position or info for ${p1} or ${p2} when computing aspects.`);
        continue;
      }

      // **Alteração aqui: Usa as posições decimais completas para a avaliação do aspecto**
      let diff = Math.abs(pos1 - pos2);
      if (diff > 180) diff = 360 - diff;

      for (const aspectDef of ASPECT_DEFINITIONS) {
        let orb = aspectDef.defaultOrb;
        // Verifica se um dos planetas é o Sol ou a Lua para aplicar o orbe de luminária
        if ((p1 === "sun" || p1 === "moon" || p2 === "sun" || p2 === "moon")) {
          orb = aspectDef.luminaryOrb;
        }

        if (diff >= (aspectDef.degree - orb) && diff <= (aspectDef.degree + orb)) {
          groupedAspects[aspectDef.name].push({
            planet1: { name: p1, sign: info1.sign, house: info1.house },
            planet2: { name: p2, sign: info2.sign, house: info2.house },
            description: `${aspectDef.name.charAt(0).toUpperCase() + aspectDef.name.slice(1)} - ` +
              `${p1.charAt(0).toUpperCase() + p1.slice(1)} (${info1.sign}) - house ${info1.house} x ` +
              `${p2.charAt(0).toUpperCase() + p2.slice(1)} (${info2.sign}), house ${info2.house}`
          });
        }
      }
    }
  }
  return groupedAspects;
}

// Analyzes elemental and modal distributions
async function analyzeElementalAndModalQualities(planetSignData, cusps) {
  const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  const qualityCounts = { cardinal: 0, fixed: 0, mutable: 0 };

  const extraPoints = {
    ascendant: { sign: degreeToSign(cusps[0]?.degree) },
    mc: { sign: degreeToSign(cusps[9]?.degree) }
  };

  const allPoints = { ...planetSignData, ...extraPoints };

  for (const point in allPoints) {
    const sign = allPoints[point].sign;
    const weight = WEIGHT_PER_POINT[point];
    if (weight !== undefined) {
      if (SIGN_ELEMENT_MAP[sign]) elementCounts[SIGN_ELEMENT_MAP[sign]] += weight;
      if (SIGN_QUALITY_MAP[sign]) qualityCounts[SIGN_QUALITY_MAP[sign]] += weight;
    }
  }

  const elementsResult = {};
  const qualitiesResult = {};

  for (const el in elementCounts) {
    elementsResult[el] = { count: elementCounts[el], status: getStatusByCount(elementCounts[el]) };
  }

  for (const ql in qualityCounts) {
    qualitiesResult[ql] = { count: qualityCounts[ql], status: getStatusByCount(qualityCounts[ql]) };
  }

  return { elements: elementsResult, qualities: qualitiesResult };
}

// Detects intercepted signs and signs ruling multiple houses
const analyzeHouses = (cusps) => {
  const signsOnCusps = new Set(cusps.map(c => degreeToSign(c.degree)));
  const housesWithInterceptedSigns = [];
  const interceptedSigns = new Set();

  for (let i = 0; i < cusps.length; i++) {
    const current = cusps[i];
    const next = cusps[(i + 1) % cusps.length];
    let start = current.degree;
    let end = next.degree > start ? next.degree : next.degree + 360;

    const signsPresent = new Set();
    for (let deg = Math.floor(start); deg < Math.ceil(end); deg++) {
      signsPresent.add(degreeToSign(deg % 360));
    }

    signsPresent.forEach(sign => {
      if (!signsOnCusps.has(sign)) {
        housesWithInterceptedSigns.push({ house: current.house, interceptedSign: sign });
        interceptedSigns.add(sign);
      }
    });
  }

  const cuspSignCount = {};
  cusps.forEach(c => {
    const sign = degreeToSign(c.degree);
    cuspSignCount[sign] = (cuspSignCount[sign] || 0) + 1;
  });

  const signsWithDoubleRulership = Object.entries(cuspSignCount)
    .filter(([, count]) => count > 1)
    .map(([sign]) => sign);

  return {
    interceptedSigns: Array.from(interceptedSigns),
    housesWithInterceptedSigns,
    signsWithDoubleRulership,
    cusps: cusps.map(c => ({
      house: c.house,
      sign: degreeToSign(c.degree),
      degree: c.degree
    }))
  };
};

// Main computation wrapper
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
    const cusps = await computeHouses(jd, latitude, longitude, houseSystem);
    const { geo, signs: planetSignData } = await computePlanets(jd, cusps);
    const aspects = await computeAspects(geo, planetSignData);
    const { elements, qualities } = await analyzeElementalAndModalQualities(planetSignData, cusps);
    const analysis = analyzeHouses(cusps);

    const formattedHouses = {};
    for (let i = 1; i <= 12; i++) {
      const cuspInfo = analysis.cusps.find(c => c.house === i);
      const hasInterceptedSign = analysis.housesWithInterceptedSigns.some(item => item.house === i);
      const planetsInThisHouse = {};

      for (const planet in planetSignData) {
        const data = planetSignData[planet];
        if (data.house === i) {
          planetsInThisHouse[planet] = {
            sign: data.sign,
            retrograde: data.retrograde,
            house: data.house
          };
        }
      }

      formattedHouses[`house${i}`] = {
        sign: cuspInfo?.sign || null,
        cuspDegree: cuspInfo?.degree || null,
        intercepted: hasInterceptedSign ? "yes" : "no",
        planets: planetsInThisHouse
      };
    }

    return {
      statusCode: 200,
      message: "Ephemeris computed successfully",
      ephemerisQuery: reqBody,
      geo,
      planets: planetSignData,
      houses: formattedHouses,
      aspects,
      elements,
      qualities
    };
  } catch (err) {
    logger.error(`Calculation error: ${err.message}`);
    return {
      statusCode: 500,
      message: `Calculation failed: ${err.message}`
    };
  }
};

module.exports = { compute };
