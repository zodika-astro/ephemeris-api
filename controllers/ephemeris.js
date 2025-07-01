'use strict';
const swisseph = require('swisseph');
const path = require('path');
const logger = require('../logger');

// Swiss Ephemeris Configuration
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
logger.info(`Swiss Ephemeris path set to: ${ephePath}`);

// Astrological Constants
const signs = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const ASPECT_DEFINITIONS = [
  { name: "conjunction", degree: 0 },
  { name: "sextile", degree: 60 },
  { name: "square", degree: 90 },
  { name: "trine", degree: 120 },
  { name: "opposition", degree: 180 }
];

const DEFAULT_ORB = 6;

const PLANETS_FOR_ASPECTS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "trueNode", "lilith", "chiron"
];

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

const WEIGHT_PER_POINT = {
  sun: 3, moon: 3, ascendant: 3, mc: 3,
  mercury: 2, venus: 2, mars: 2, jupiter: 2,
  saturn: 1, uranus: 1, neptune: 1, pluto: 1
};

// --- Utility Functions ---

/**
 * Converts a degree to its astrological sign.
 * @param {number} degree - The degree (0-359.99...).
 * @returns {string} Astrological sign name.
 */
const degreeToSign = (degree) => {
  const normalized = ((degree % 360) + 360) % 360;
  return signs[Math.floor(normalized / 30)];
};

/**
 * Determines status based on weighted point count.
 * @param {number} count - Weighted point count.
 * @returns {string} Status ('lack', 'balance', 'excess').
 */
const getStatusByCount = (count) => {
  const LACK_MAX = 3;
  const BALANCE_MAX = 8;
  if (count <= LACK_MAX) return "lack";
  if (count <= BALANCE_MAX) return "balance";
  return "excess";
};

// --- Astrological Calculation Functions ---

/**
 * Computes house cusps using Swiss Ephemeris.
 * @param {number} jd - Julian Day number.
 * @param {number} lat - Latitude.
 * @param {number} lng - Longitude.
 * @param {string} [houseSystem='P'] - House system code.
 * @returns {Promise<Array<Object>>} Array of house cusps.
 */
const computeHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`House calculation error: ${res.error}`));
      resolve(res.house.slice(0, 12).map((degree, i) => ({ house: i + 1, degree })));
    });
  });
};

/**
 * Determines the astrological house a planet falls into.
 * @param {number} planetDegree - Planet's degree.
 * @param {Array<Object>} cusps - Array of house cusps.
 * @returns {number|null} House number (1-12) or null.
 */
const determineAstrologicalHouse = (planetDegree, cusps) => {
  const normalizedPlanetDegree = ((planetDegree % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const currentHouseCusp = cusps[i].degree;
    const nextHouseCusp = cusps[(i + 1) % 12].degree;

    if (currentHouseCusp < nextHouseCusp) {
      if (normalizedPlanetDegree >= currentHouseCusp && normalizedPlanetDegree < nextHouseCusp) {
        return i + 1;
      }
    } else { // Handles cusp crossing Aries point (0 degrees)
      if (normalizedPlanetDegree >= currentHouseCusp || normalizedPlanetDegree < nextHouseCusp) {
        return i + 1;
      }
    }
  }
  return null;
};

/**
 * Computes planet positions and related data using Swiss Ephemeris.
 * @param {number} jd - Julian Day number.
 * @param {Array<Object>} cusps - Array of house cusps.
 * @returns {Promise<Object>} Geo positions and sign data for planets.
 */
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
  retrograde: isRetrograde,
  house: astrologicalHouse

      };
    } catch (err) {
      logger.error('Error calculating ' + name + ': ' + err.message);
    }
  }
  return { geo: geoPositions, signs: signData };
}

/**
 * Computes astrological aspects between planets.
 * @param {Object} planetGeoPositions - Planet longitudes.
 * @param {Object} planetSignData - Planet sign and house data.
 * @param {number} [orb=DEFAULT_ORB] - Orb (tolerance) for aspects.
 * @returns {Object} Aspects grouped by type.
 */
async function computeAspects(planetGeoPositions, planetSignData, orb = DEFAULT_ORB) {
  const groupedAspects = {
    conjunction: [], sextile: [], square: [], trine: [], opposition: []
  };

  const planetKeys = Object.keys(planetGeoPositions).filter(key => PLANETS_FOR_ASPECTS.includes(key));

  for (let i = 0; i < planetKeys.length; i++) {
    for (let j = i + 1; j < planetKeys.length; j++) {
      const planet1Name = planetKeys[i];
      const planet2Name = planetKeys[j];

      const pos1 = planetGeoPositions[planet1Name];
      const pos2 = planetGeoPositions[planet2Name];
      const infoPlanet1 = planetSignData[planet1Name];
      const infoPlanet2 = planetSignData[planet2Name];

      if (pos1 === undefined || pos2 === undefined || !infoPlanet1 || !infoPlanet2) {
        logger.warn(`Invalid position or info for ${planet1Name} or ${planet2Name} when computing aspects.`);
        continue;
      }

      let angularDifference = Math.abs(pos1 - pos2);
      if (angularDifference > 180) { // Normalize angular difference to 0-180 degrees
        angularDifference = 360 - angularDifference;
      }

      for (const aspectDef of ASPECT_DEFINITIONS) {
        const idealDegree = aspectDef.degree;
        const aspectName = aspectDef.name;

        if (angularDifference >= (idealDegree - orb) && angularDifference <= (idealDegree + orb)) {
          const description = `${aspectName.charAt(0).toUpperCase() + aspectName.slice(1)} - ` +
            `${planet1Name.charAt(0).toUpperCase() + planet1Name.slice(1)} (${infoPlanet1.sign}) - ` +
            `house ${infoPlanet1.house} x ` +
            `${planet2Name.charAt(0).toUpperCase() + planet2Name.slice(1)} (${infoPlanet2.sign}), ` +
            `house ${infoPlanet2.house}`;

          groupedAspects[aspectName].push({
            planet1: { name: planet1Name, sign: infoPlanet1.sign, house: infoPlanet1.house },
            planet2: { name: planet2Name, sign: infoPlanet2.sign, house: infoPlanet2.house },
            description: description
          });
        }
      }
    }
  }
  return groupedAspects;
}

/**
 * Analyzes elemental and quality distributions of points.
 * @param {Object} planetSignData - Planet data including signs.
 * @param {Array<Object>} cusps - House cusps (for Asc/MC).
 * @returns {Object} Elemental and quality analysis results.
 */
async function analyzeElementalAndModalQualities(planetSignData, cusps) {
  const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  const qualityCounts = { cardinal: 0, fixed: 0, mutable: 0 };
  const additionalPoints = {
    ascendant: { sign: degreeToSign(cusps[0]?.degree) },
    mc: { sign: degreeToSign(cusps[9]?.degree) }
  };

  const allPoints = { ...planetSignData, ...additionalPoints };

  for (const pointName in allPoints) {
    if (WEIGHT_PER_POINT[pointName] !== undefined) {
      const weight = WEIGHT_PER_POINT[pointName];
      const signOfPoint = allPoints[pointName].sign;

      if (SIGN_ELEMENT_MAP[signOfPoint]) {
        elementCounts[SIGN_ELEMENT_MAP[signOfPoint]] += weight;
      }
      if (SIGN_QUALITY_MAP[signOfPoint]) {
        qualityCounts[SIGN_QUALITY_MAP[signOfPoint]] += weight;
      }
    }
  }

  const elementsResult = {};
  for (const element in elementCounts) {
    elementsResult[element] = {
      count: elementCounts[element],
      status: getStatusByCount(elementCounts[element])
    };
  }

  const qualitiesResult = {};
  for (const quality in qualityCounts) {
    qualitiesResult[quality] = {
      count: qualityCounts[quality],
      status: getStatusByCount(qualityCounts[quality])
    };
  }
  return { elements: elementsResult, qualities: qualitiesResult };
}

/**
 * Analyzes houses for intercepted signs and double rulership.
 * @param {Array<Object>} cusps - Array of house cusps.
 * @returns {Object} Analysis results for houses.
 */
const analyzeHouses = (cusps) => {
  const signsOnCusps = new Set(cusps.map(c => degreeToSign(c.degree)));
  const housesWithInterceptedSigns = [];
  const interceptedSigns = new Set();

  for (let i = 0; i < cusps.length; i++) {
    const currentCusp = cusps[i];
    const nextCusp = cusps[(i + 1) % cusps.length];
    let startDegree = currentCusp.degree;
    let endDegree = nextCusp.degree > startDegree ? nextCusp.degree : nextCusp.degree + 360;

    const signsPresentInHouse = new Set();
    for (let deg = Math.floor(startDegree); deg <= Math.ceil(endDegree); deg++) {
      if (deg >= startDegree && deg < endDegree) {
        signsPresentInHouse.add(degreeToSign(deg % 360));
      }
    }

    signsPresentInHouse.forEach(sign => {
      if (!signsOnCusps.has(sign)) {
        housesWithInterceptedSigns.push({ house: currentCusp.house, interceptedSign: sign });
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

// --- Main Computation Function ---

/**
 * Main function to compute the complete astrological chart data.
 * @param {Object} reqBody - Request body containing chart parameters.
 * @returns {Object} Formatted astrological chart data.
 */
const compute = async (reqBody) => {
  try {
    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone,
      config = {}
    } = reqBody;

    // Calculate Julian Day (JD) for UTC time
    const decimalHours = hours + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL);

    const houseSystem = config.house_system || 'P';
    const cusps = await computeHouses(jd, latitude, longitude, houseSystem);
    const { geo, signs: planetSignData } = await computePlanets(jd, cusps); // Renamed `signs` to `planetSignData` to avoid conflict with the global `signs` array.
    const aspects = await computeAspects(geo, planetSignData);
    const { elements, qualities } = await analyzeElementalAndModalQualities(planetSignData, cusps);
    const analysis = analyzeHouses(cusps);

    return {
      statusCode: 200,
      message: "Ephemeris computed successfully",
      ephemerisQuery: reqBody,
      geo,
      signs: planetSignData, // Use the renamed `planetSignData` here
      houses: {
        cusps: analysis.cusps,
        housesWithInterceptedSigns: analysis.housesWithInterceptedSigns,
        signsWithDoubleRulership: analysis.signsWithDoubleRulership
      },
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
