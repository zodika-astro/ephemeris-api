'use strict';
const swisseph = require('swisseph');
const path = require('path');
const logger = require('../logger');

// Correctly set the path to the 'ephe' folder, located at the project root.
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
logger.info(`Swiss Ephemeris path set to: ${ephePath}`);


// Astrological signs in order
const signs = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

/**
 * Converts a degree value to its corresponding astrological sign.
 * @param {number} degree - The degree (0-359.99...).
 * @returns {string} The astrological sign name.
 */
const degreeToSign = (degree) => {
  const normalized = ((degree % 360) + 360) % 360;
  return signs[Math.floor(normalized / 30)];
};

/**
 * Computes house cusps using Swiss Ephemeris.
 * @param {number} jd - Julian Day number.
 * @param {number} lat - Latitude.
 * @param {number} lng - Longitude.
 * @param {string} [houseSystem='P'] - House system code (e.g., 'P' for Placidus).
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of house cusps.
 */
const computeHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`House calculation error: ${res.error}`));
      // Cusps are returned in order (house 1, house 2, ...).
      resolve(res.house.slice(0, 12).map((degree, i) => ({ house: i + 1, degree })));
    });
  });
};

/**
 * Determines the astrological house a planet falls into.
 * @param {number} planetDegree - The degree of the planet.
 * @param {Array<Object>} cusps - Array of house cusps (e.g., [{house: 1, degree: X}]).
 * @returns {number|null} The house number (1-12) or null if not found.
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
        } else { // Handles case where cusp crosses Aries point (e.g., House 1 at 300 deg, House 2 at 30 deg)
            if (normalizedPlanetDegree >= currentHouseCusp || normalizedPlanetDegree < nextHouseCusp) {
                return i + 1;
            }
        }
    }
    return null;
};

// --- ASTROLOGICAL ASPECTS CALCULATION ---

const ASPECT_DEFINITIONS = [
    { name: "conjunction", degree: 0 },
    { name: "sextile", degree: 60 },
    { name: "square", degree: 90 },
    { name: "trine", degree: 120 },
    { name: "opposition", degree: 180 }
];

const DEFAULT_ORB = 6; // Degrees of tolerance

// Translated planet names
const PLANETS_FOR_ASPECTS = [
    "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
    "uranus", "neptune", "pluto", "trueNode", "lilith", "chiron"
];

/**
 * Computes astrological aspects between planets.
 * @param {Object} planetGeoPositions - Object with planet names as keys and their longitudes as values.
 * @param {Object} planetSignData - Object with planet names as keys and their sign data (including house).
 * @param {number} [orb=DEFAULT_ORB] - The orb (tolerance) for aspects.
 * @returns {Object} An object grouping aspects by type.
 */
async function computeAspects(planetGeoPositions, planetSignData, orb = DEFAULT_ORB) {
    const groupedAspects = {
        conjunction: [],
        sextile: [],
        square: [],
        trine: [],
        opposition: []
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

            // Normalize angular difference to be within 0-180 degrees
            if (angularDifference > 180) {
                angularDifference = 360 - angularDifference;
            }

            for (const aspectDef of ASPECT_DEFINITIONS) {
                const idealDegree = aspectDef.degree;
                const aspectName = aspectDef.name;

                if (angularDifference >= (idealDegree - orb) && angularDifference <= (idealDegree + orb)) {
                    // Include sign in the description and in the planet objects
                    const description = `${aspectName.charAt(0).toUpperCase() + aspectName.slice(1)} - ` +
                                        `${planet1Name.charAt(0).toUpperCase() + planet1Name.slice(1)} (${infoPlanet1.sign}) - ` +
                                        `house ${infoPlanet1.house} x ` +
                                        `${planet2Name.charAt(0).toUpperCase() + planet2Name.slice(1)} (${infoPlanet2.sign}), ` +
                                        `house ${infoPlanet2.house}`;

                    groupedAspects[aspectName].push({
                        // Removed 'type', 'exactDegree', 'appliedOrb' from the output
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
 * Computes planet positions and related data using Swiss Ephemeris.
 * @param {number} jd - Julian Day number.
 * @param {Array<Object>} cusps - Array of house cusps.
 * @returns {Promise<Object>} An object containing geographical positions and sign data for planets.
*/
async function computePlanets(jd, cusps) {
  // Translated planet names mapping to Swiss Ephemeris IDs
  const planetsMap = {
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

  const geoPositions = {};
  const signData = {};
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED; // Use SWIEPH for faster calculations and get speed

  for (const [name, id] of Object.entries(planetsMap)) {
    try {
      // Calculate current position
      const current = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd, id, flags, resolve)
      );
      // Calculate future position for retrograde check (a small step forward in time)
      const future = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd + 0.01, id, flags, resolve)
      );

      // Extract longitude. Use position[0] as fallback for older swisseph versions or specific IDs.
      const currentLongitude = current.longitude ?? current.position?.[0];
      const futureLongitude = future.longitude ?? future.position?.[0];

      if (currentLongitude == null || futureLongitude == null) {
        console.warn('Could not get position for ' + name + '.');
        continue;
      }

      const astrologicalHouse = determineAstrologicalHouse(currentLongitude, cusps);

      geoPositions[name] = currentLongitude;
      signData[name] = {
        sign: degreeToSign(currentLongitude),
        retrograde: futureLongitude < currentLongitude,
        house: astrologicalHouse
      };
    } catch (err) {
      console.error('Error calculating ' + name + ': ' + err.message);

    }
  }

  return { geo: geoPositions, signs: signData };
}

// --- NEW FUNCTIONALITY: ELEMENTAL AND QUALITIES/MODALITIES ANALYSIS (with weighted scoring) ---

// Mappings of signs to elements and qualities
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

// --- NEW WEIGHTED SCORING RULES ---
const WEIGHT_PER_POINT = {
    // Group: Individuality Base (3 points each)
    sun: 3,
    moon: 3,
    ascendant: 3,
    mc: 3,

    // Group: Individuality Expression Channels (2 points each)
    mercury: 2,
    venus: 2,
    mars: 2,
    jupiter: 2,

    // Group: Generational Tendencies (1 point each)
    saturn: 1,
    uranus: 1,
    neptune: 1,
    pluto: 1

    // True Node, Lilith, Chiron are NOT included in elemental/quality counts
    // as per specified scoring rules.
};

/**
 * Determines the status (lack, balance, excess) based on the point count and defined limits.
 * @param {number} count - The weighted point count.
 * @returns {string} The status ('lack', 'balance', 'excess').
 */
const getStatusByCount = (count) => {
    // New limits based on a total sum of 24 points.
    const LACK_MAX = 3;     // 3 or fewer points = lack
    const BALANCE_MAX = 8;  // Between 4 and 8 points = balance
                            // 9 or more points = excess (by implicit 'else')

    if (count <= LACK_MAX) {
        return "lack";
    } else if (count <= BALANCE_MAX) {
        return "balance";
    } else {
        return "excess";
    }
};

/**
 * Analyzes elemental and quality (modality) distributions based on weighted astrological point positions.
 * @param {Object} planetSignData - Planet data including their signs.
 * @param {Array<Object>} cusps - Array of house cusps (for Asc/MC).
 * @returns {Object} Object containing elemental and quality analyses.
 */
async function analyzeElementalAndModalQualities(planetSignData, cusps) {
    const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
    const qualityCounts = { cardinal: 0, fixed: 0, mutable: 0 };

    // Map cusp data to facilitate access for Ascendant and MC as "points"
    const additionalPoints = {
        ascendant: { sign: degreeToSign(cusps[0]?.degree) },
        mc: { sign: degreeToSign(cusps[9]?.degree) }
    };

    // Combine planets and additional points, considering only those with defined weights
    const allPoints = { ...planetSignData, ...additionalPoints };

    for (const pointName in allPoints) {
        // Check if the point has a defined weight in the rules
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

    // Determine status (lack, balance, excess) for each element and quality
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
    // Iterate through degrees to find all signs within the house span
    // (This simplified check assumes continuous house spans and might need refinement for edge cases)
    for (let deg = Math.floor(startDegree); deg <= Math.ceil(endDegree); deg++) {
        if (deg >= startDegree && deg < endDegree) { // Ensure degree is within the span
             signsPresentInHouse.add(degreeToSign(deg % 360));
        }
    }

    signsPresentInHouse.forEach(sign => {
      // If a sign is present within the house but doesn't rule any cusp of this house, it's intercepted.
      // This logic is a common approximation. True interception requires checking if it's "enclosed".
      // For more robust interception detection, a more complex algorithm comparing house spans and sign spans is needed.
      if (!signsOnCusps.has(sign)) {
        housesWithInterceptedSigns.push({ house: currentCusp.house, interceptedSign: sign });
        interceptedSigns.add(sign);
      }
    });
  }

  // Count how many cusps each sign rules (for double rulership)
  const cuspSignCount = {};
  cusps.forEach(c => {
    const sign = degreeToSign(c.degree);
    cuspSignCount[sign] = (cuspSignCount[sign] || 0) + 1;
  });

  const signsWithDoubleRulership = Object.entries(cuspSignCount)
    .filter(([_, count]) => count > 1)
    .map(([sign]) => sign);

  return {
    interceptedSigns: Array.from(interceptedSigns),
    housesWithInterceptedSigns,
    signsWithDoubleRulership,
    // Modified cusps output: removed 'degree' and 'isInterceptedSign'
    cusps: cusps.map(c => ({
      house: c.house,
      sign: degreeToSign(c.degree)
    }))
  };
};

/**
 * Main function to compute the complete astrological chart data.
 * @param {Object} reqBody - Request body containing chart parameters.
 * @param {number} reqBody.year
 * @param {number} reqBody.month
 * @param {number} reqBody.date
 * @param {number} reqBody.hours
 * @param {number} reqBody.minutes
 * @param {number} reqBody.seconds
 * @param {number} reqBody.latitude
 * @param {number} reqBody.longitude
 * @param {number} reqBody.timezone - Timezone offset from UTC in hours (e.g., -3 for GMT-3).
 * @param {Object} [reqBody.config] - Optional configuration for house system.
 * @param {string} [reqBody.config.house_system='P'] - House system (e.g., 'P' for Placidus).
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

    // Calculate Julian Day (JD) from local time, adjusting for timezone.
    // timezone is subtracted because swe_julday expects local time and
    // the timezone parameter essentially converts it to UT (Universal Time)
    const decimalHours = hours + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL);

    const houseSystem = config.house_system || 'P';
    const cusps = await computeHouses(jd, latitude, longitude, houseSystem);

    // geo (geographical positions) is needed for aspect calculations but will not be in the final output
    const { geo, signs } = await computePlanets(jd, cusps);

    // aspects are computed using geo positions and sign data
    const aspects = await computeAspects(geo, signs);

    // Analyze elemental and modal qualities using weighted scoring
    const { elements, qualities } = await analyzeElementalAndModalQualities(signs, cusps);

    const analysis = analyzeHouses(cusps);

    return {
      statusCode: 200,
      message: "Ephemeris computed successfully",
      ephemerisQuery: reqBody,
      // ephemerides: { geo }, // Removed as requested
      signs,                  // Sign and house data for planets
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

