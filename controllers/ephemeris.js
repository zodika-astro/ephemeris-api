'use strict';

const swisseph = require('swisseph');
const path = require('path');
const logger = require('../logger');

// Set Swiss Ephemeris path for planet and house calculations
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
logger.info(`Swiss Ephemeris path set to: ${ephePath}`);

// Define zodiac signs
const signs = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Define major astrological aspects with their core degrees
const ASPECT_DEFINITIONS = [
  { name: "conjunction", degree: 0 },
  { name: "sextile", degree: 60 },
  { name: "square", degree: 90 },
  { name: "trine", degree: 120 },
  { name: "opposition", degree: 180 }
];

// Define all astrological points considered for aspect calculations
const ALL_POINTS_FOR_ASPECTS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "trueNode", "lilith", "chiron",
  "ascendant", "mc"
];

// Map zodiac signs to their corresponding elements
const SIGN_ELEMENT_MAP = {
  "Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
  "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
  "Gemini": "air", "Libra": "air", "Aquarius": "air",
  "Cancer": "water", "Scorpio": "water", "Pisces": "water"
};

// Map zodiac signs to their corresponding qualities (modalities)
const SIGN_QUALITY_MAP = {
  "Aries": "cardinal", "Cancer": "cardinal", "Libra": "cardinal", "Capricorn": "cardinal",
  "Taurus": "fixed", "Leo": "fixed", "Scorpio": "fixed", "Aquarius": "fixed",
  "Gemini": "mutable", "Virgo": "mutable", "Sagittarius": "mutable", "Pisces": "mutable"
};

// Define weight for each point for elemental/modality analysis
const WEIGHT_PER_POINT = {
  sun: 3, moon: 3, ascendant: 3, mc: 3,
  mercury: 2, venus: 2, mars: 2, jupiter: 2,
  saturn: 1, uranus: 1, neptune: 1, pluto: 1
};

// Converts a celestial degree (0-360) to its corresponding zodiac sign
const degreeToSign = (degree) => {
  const normalized = ((degree % 360) + 360) % 360;
  return signs[Math.floor(normalized / 30)];
};

// Determines status (lack, balance, excess) based on point count in categories
const getStatusByCount = (count) => {
  const LACK_MAX = 3;
  const BALANCE_MAX = 8;
  if (count <= LACK_MAX) return "lack";
  if (count <= BALANCE_MAX) return "balance";
  return "excess";
};

// Computes house cusps using Swiss Ephemeris based on Julian Day, latitude, longitude, and house system
const computeHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`House calculation error: ${res.error}`));
      resolve(res.house.slice(0, 12).map((degree, i) => ({ house: i + 1, degree })));
    });
  });
};

// Determines the astrological house a planet is in given its degree and house cusps
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

// Computes planetary positions, signs, retrogradation status, and houses
async function computePlanets(jd, cusps) {
  // Map internal planet names to Swiss Ephemeris IDs
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

  // Iterate over each planet to calculate its position and associated data
  for (const [name, id] of Object.entries(planetsMap)) {
    try {
      // Calculate current and future positions to determine retrogradation
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

// Computes aspects between all relevant planetary pairs based on dynamic orb rules
async function computeAspects(planetGeoPositions, planetSignData) {
  const groupedAspects = {
    conjunction: [], sextile: [], square: [], trine: [], opposition: []
  };

  // Helper to get specific orb rules based on point category
  const getOrbRulesForPoint = (pointName) => {
    if (pointName === "sun" || pointName === "moon") {
      return { conjOpp: 10, triSqr: 8, sextile: 6 }; // Luminaries
    } else if (["mercury", "venus", "mars"].includes(pointName)) {
      return { conjOpp: 8, triSqr: 6, sextile: 4 }; // Fast Planets
    } else if (["jupiter", "saturn", "uranus", "neptune", "pluto"].includes(pointName)) {
      return { conjOpp: 6, triSqr: 5, sextile: 3 }; // Slow Planets
    } else if (["trueNode", "lilith", "chiron"].includes(pointName)) {
      return { conjOpp: 3, triSqr: 2, sextile: 2 }; // Nodes/Chiron/Lilith
    } else if (pointName === "ascendant" || pointName === "mc") {
      return { conjOpp: 10, triSqr: 8, sextile: 6 }; // AC/MC
    }
    return null;
  };

  // Determines the actual orb for an aspect based on the categories of the two points involved
  const determineActualOrb = (p1Name, p2Name, aspectType) => {
    const rules1 = getOrbRulesForPoint(p1Name);
    const rules2 = getOrbRulesForPoint(p2Name);

    if (!rules1 || !rules2) return 0; // Should not happen with valid point names

    let orb1, orb2;
    switch (aspectType) {
      case "conjunction":
      case "opposition":
        orb1 = rules1.conjOpp;
        orb2 = rules2.conjOpp;
        break;
      case "trine":
      case "square":
        orb1 = rules1.triSqr;
        orb2 = rules2.triSqr;
        break;
      case "sextile":
        orb1 = rules1.sextile;
        orb2 = rules2.sextile;
        break;
      default:
        return 0; // Unrecognized aspect type
    }
    // Apply the rule: use the LARGER orb when two categories conflict
    return Math.max(orb1, orb2);
  };

  const allPointsKeys = Object.keys(planetGeoPositions).filter(key => ALL_POINTS_FOR_ASPECTS.includes(key));

  // Iterate over all unique pairs of astrological points
  for (let i = 0; i < allPointsKeys.length; i++) {
    for (let j = i + 1; j < allPointsKeys.length; j++) {
      const [p1, p2] = [allPointsKeys[i], allPointsKeys[j]];

      // Skip aspects between AC and MC as per rule
      if ((p1 === "ascendant" && p2 === "mc") || (p1 === "mc" && p2 === "ascendant")) {
        continue;
      }

      const [pos1, pos2] = [planetGeoPositions[p1], planetGeoPositions[p2]];
      const [info1, info2] = [planetSignData[p1], planetSignData[p2]];

      if (pos1 === undefined || pos2 === undefined || !info1 || !info2) {
        logger.warn(`Invalid position or info for ${p1} or ${p2} when computing aspects.`);
        continue;
      }

      // Calculate the angular difference between the two points using full decimal precision
      let diff = Math.abs(pos1 - pos2);
      // Normalize difference to be within 0-180 degrees (shortest arc)
      if (diff > 180) diff = 360 - diff;

      // Check against each defined aspect type
      for (const aspectDef of ASPECT_DEFINITIONS) {
        // Determine the applicable orb based on the points' categories and aspect type
        const orb = determineActualOrb(p1, p2, aspectDef.name);

        // Check if the difference falls within the aspect's orb
        if (orb > 0 && diff >= (aspectDef.degree - orb) && diff <= (aspectDef.degree + orb)) {
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

// Analyzes the distribution of points across elemental and modal qualities
async function analyzeElementalAndModalQualities(planetSignData, cusps) {
  const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  const qualityCounts = { cardinal: 0, fixed: 0, mutable: 0 };

  // Include Ascendant and MC in the analysis
  const extraPoints = {
    ascendant: { sign: degreeToSign(cusps[0]?.degree) },
    mc: { sign: degreeToSign(cusps[9]?.degree) }
  };

  const allPoints = { ...planetSignData, ...extraPoints };

  // Aggregate counts based on point weights and sign classifications
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

  // Determine status (lack, balance, excess) for each element and quality
  for (const el in elementCounts) {
    elementsResult[el] = { count: elementCounts[el], status: getStatusByCount(elementCounts[el]) };
  }

  for (const ql in qualityCounts) {
    // FIX: Corrected variable name from 'qualities' to 'qualityCounts'
    qualitiesResult[ql] = { count: qualityCounts[ql], status: getStatusByCount(qualityCounts[ql]) };
  }

  return { elements: elementsResult, qualities: qualitiesResult };
}

// Detects intercepted signs and signs ruling multiple houses
const analyzeHouses = (cusps) => {
  const signsOnCusps = new Set(cusps.map(c => degreeToSign(c.degree)));
  const housesWithInterceptedSigns = [];
  const interceptedSigns = new Set();

  // Iterate through houses to find intercepted signs
  for (let i = 0; i < cusps.length; i++) {
    const current = cusps[i];
    const next = cusps[(i + 1) % cusps.length];
    let start = current.degree;
    let end = next.degree > start ? next.degree : next.degree + 360;

    const signsPresent = new Set();
    // Check each degree within the house segment for signs
    for (let deg = Math.floor(start); deg < Math.ceil(end); deg++) {
      signsPresent.add(degreeToSign(deg % 360));
    }

    signsPresent.forEach(sign => {
      // If a sign is within a house but not on its cusp, it's intercepted
      if (!signsOnCusps.has(sign)) {
        housesWithInterceptedSigns.push({ house: current.house, interceptedSign: sign });
        interceptedSigns.add(sign);
      }
    });
  }

  // Count how many cusps each sign appears on
  const cuspSignCount = {};
  cusps.forEach(c => {
    const sign = degreeToSign(c.degree);
    cuspSignCount[sign] = (cuspSignCount[sign] || 0) + 1;
  });

  // Identify signs that rule more than one house
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

// Main function to compute complete ephemeris data for a given birth chart
const compute = async (reqBody) => {
  try {
    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone,
      config = {}
    } = reqBody;

    // Calculate Julian Day for the given date and time
    const decimalHours = hours + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL);

    // Compute house cusps
    const houseSystem = config.house_system || 'P';
    const cusps = await computeHouses(jd, latitude, longitude, houseSystem);
    // Compute planetary positions and initial sign/house data
    let { geo, signs: planetSignData } = await computePlanets(jd, cusps);

    // Add AC (Ascendant) and MC (Midheaven) to the geocentric positions and sign data
    // This makes them available for aspect calculations and elemental/modal analysis
    const ascendantDegree = cusps.find(c => c.house === 1)?.degree;
    const mcDegree = cusps.find(c => c.house === 10)?.degree;

    if (ascendantDegree !== undefined) {
      geo.ascendant = ascendantDegree;
      planetSignData.ascendant = { sign: degreeToSign(ascendantDegree), retrograde: "no", house: 1 };
    }
    if (mcDegree !== undefined) {
      geo.mc = mcDegree;
      planetSignData.mc = { sign: degreeToSign(mcDegree), retrograde: "no", house: 10 };
    }

    // Compute aspects between all relevant points
    const aspects = await computeAspects(geo, planetSignData);
    // Analyze elemental and modal qualities of the chart
    const { elements, qualities } = await analyzeElementalAndModalQualities(planetSignData, cusps);
    // Perform house-specific analysis (intercepted signs, double rulership)
    const analysis = analyzeHouses(cusps);

    // Format house data for the final output
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

    // Return the comprehensive ephemeris data
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
