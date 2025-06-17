'use strict';
const swisseph = require('swisseph');
const path = require('path');

/**
 * Enhanced logger with timestamp and log levels
 */
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()}: ${message}`),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()}: ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()}: ${message}`)
};

// Configure ephemeris data path
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
logger.info(`Ephemeris data path configured: ${ephePath}`);

/**
 * Astrological constants and configurations
 */
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const DEGREES_PER_SIGN = 30;
const CIRCLE_DEGREES = 360;
const HALF_CIRCLE = 180;

// Cache for sign calculations
const signCache = new Map();

/**
 * Calculate zodiac sign from degree with caching
 * @param {number} degree - Celestial longitude (0-359.999...)
 * @returns {string} Zodiac sign name
 */
const degreeToSign = (degree) => {
  const normalized = ((degree % CIRCLE_DEGREES) + CIRCLE_DEGREES) % CIRCLE_DEGREES;
  const cacheKey = Math.floor(normalized * 1000); // Precision to 3 decimal places
  
  if (signCache.has(cacheKey)) {
    return signCache.get(cacheKey);
  }
  
  const sign = ZODIAC_SIGNS[Math.floor(normalized / DEGREES_PER_SIGN)];
  signCache.set(cacheKey, sign);
  return sign;
};

/**
 * Calculate house cusps using Swiss Ephemeris
 * @param {number} jd - Julian Day number
 * @param {number} lat - Geographic latitude
 * @param {number} lng - Geographic longitude
 * @param {string} [houseSystem='P'] - House system code (default: Placidus)
 * @returns {Promise<Array<{house: number, degree: number}>>} House cusps
 */
const computeHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(
      jd,
      swisseph.SEFLG_SWIEPH,
      lat,
      lng,
      houseSystem,
      (result) => {
        if (result.error) {
          return reject(new Error(`House calculation failed: ${result.error}`));
        }
        resolve(result.house.slice(0, 12).map((degree, i) => ({
          house: i + 1,
          degree
        })));
      }
    );
  });
};

/**
 * Determine house placement for a planet
 * @param {number} planetDegree - Planet's celestial longitude
 * @param {Array<{house: number, degree: number}>} cusps - House cusps
 * @returns {number|null} House number (1-12) or null if undetermined
 */
const determineHousePlacement = (planetDegree, cusps) => {
  const normalizedDegree = ((planetDegree % CIRCLE_DEGREES) + CIRCLE_DEGREES) % CIRCLE_DEGREES;

  for (let i = 0; i < 12; i++) {
    const currentCusp = cusps[i].degree;
    const nextCusp = cusps[(i + 1) % 12].degree;
    const isCuspCrossingAries = currentCusp > nextCusp;

    if (isCuspCrossingAries) {
      if (normalizedDegree >= currentCusp || normalizedDegree < nextCusp) {
        return i + 1;
      }
    } else if (normalizedDegree >= currentCusp && normalizedDegree < nextCusp) {
      return i + 1;
    }
  }
  return null;
};

/**
 * Aspect definitions with orb tolerances
 */
const ASPECT_CONFIGS = [
  { name: "conjunction", degree: 0, orb: 10 },
  { name: "sextile", degree: 60, orb: 6 },
  { name: "square", degree: 90, orb: 7 },
  { name: "trine", degree: 120, orb: 8 },
  { name: "opposition", degree: 180, orb: 10 }
];

const PLANET_IDS = {
  sun: swisseph.SE_SUN,
  moon: swisseph.SE_MOON,
  mercury: swisseph.SE_MERCURY,
  venus: swisseph.SE_VENUS,
  mars: swisseph.SE_MARS,
  jupiter: swisseph.SE_JUPITER,
  saturn: swisseph.SE_SATURN,
  uranus: swisseph.SE_URANUS,
  neptune: swisseph.SE_NEPTUNE,
  pluto: swisseph.SE_PLUTO,
  trueNode: swisseph.SE_TRUE_NODE,
  lilith: swisseph.SE_MEAN_APOG,
  chiron: swisseph.SE_CHIRON
};

const CORE_PLANETS = Object.keys(PLANET_IDS);

/**
 * Calculate planetary positions and metadata
 * @param {number} jd - Julian Day number
 * @param {Array<{house: number, degree: number}>} cusps - House cusps
 * @returns {Promise<{geo: Object, signs: Object}>} Planetary data
 */
async function computePlanetaryData(jd, cusps) {
  const positions = {};
  const metadata = {};
  const calculationFlags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  // Process planets in parallel
  await Promise.all(Object.entries(PLANET_IDS).map(async ([name, id]) => {
    try {
      const [current, future] = await Promise.all([
        new Promise(resolve => swisseph.swe_calc_ut(jd, id, calculationFlags, resolve)),
        new Promise(resolve => swisseph.swe_calc_ut(jd + 0.01, id, calculationFlags, resolve))
      ]);

      const currentLon = current.longitude ?? current.position?.[0];
      const futureLon = future.longitude ?? future.position?.[0];

      if (currentLon == null || futureLon == null) {
        logger.warn(`Skipping ${name}: Invalid position data`);
        return;
      }

      positions[name] = currentLon;
      metadata[name] = {
        sign: degreeToSign(currentLon),
        retrograde: futureLon < currentLon,
        house: determineHousePlacement(currentLon, cusps)
      };
    } catch (err) {
      logger.error(`Planet calculation error (${name}): ${err.message}`);
    }
  }));

  return { geo: positions, signs: metadata };
}

/**
 * Detect astrological aspects between planets
 * @param {Object} positions - Planetary longitudes
 * @param {Object} metadata - Planetary metadata
 * @returns {Object} Grouped aspects by type
 */
function calculateAspects(positions, metadata) {
  const aspects = {
    conjunction: [], sextile: [], square: [], trine: [], opposition: []
  };

  const validPlanets = Object.keys(positions)
    .filter(planet => CORE_PLANETS.includes(planet));

  // Compare all planet pairs
  for (let i = 0; i < validPlanets.length; i++) {
    for (let j = i + 1; j < validPlanets.length; j++) {
      const [p1, p2] = [validPlanets[i], validPlanets[j]];
      const [lon1, lon2] = [positions[p1], positions[p2]];
      const [data1, data2] = [metadata[p1], metadata[p2]];

      if (!lon1 || !lon2 || !data1 || !data2) continue;

      let separation = Math.abs(lon1 - lon2);
      separation = separation > HALF_CIRCLE ? CIRCLE_DEGREES - separation : separation;

      for (const aspect of ASPECT_CONFIGS) {
        if (separation <= aspect.orb) {
          const description = `${aspect.name} between ${p1} (${data1.sign}) and ${p2} (${data2.sign})`;
          
          aspects[aspect.name].push({
            planets: [
              { name: p1, sign: data1.sign, house: data1.house },
              { name: p2, sign: data2.sign, house: data2.house }
            ],
            exactAngle: separation,
            description
          });
        }
      }
    }
  }

  return aspects;
}

module.exports = { compute };
