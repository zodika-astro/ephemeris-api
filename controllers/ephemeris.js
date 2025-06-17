'use strict';
const swisseph = require('swisseph');
const path = require('path');

// Set Swiss Ephemeris path to 'ephe' directory at project root.
const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe-path(ephePath); // Changed to swe_set-ephe-path
console.log('Swiss Ephemeris path set:', ephePath);


const zodiac-signs = [ // Renamed
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

// Get zodiac sign from degree.
const degree-to-sign = (degree) => { // Renamed
  const normalized = ((degree % 360) + 360) % 360;
  return zodiac-signs[Math.floor(normalized / 30)]; // Using new const name
};

// Calculate house cusps.
const get-houses = (jd, lat, lng, houseSystem = 'P') => { // Renamed
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

const aspect-defs = [ // Renamed
    { name: "conjuncao", degree: 0 },
    { name: "sextil", degree: 60 },
    { name: "quadratura", degree: 90 },
    { name: "trigono", degree: 120 },
    { name: "oposicao", degree: 180 }
];

const default-orb = 6; // Renamed

const planets-for-aspects = [ // Renamed
    "sol", "lua", "mercurio", "venus", "marte", "jupiter", "saturno",
    "urano", "netuno", "plutao", "nodo_verdadeiro", "lilith", "quiron"
];

async function get-aspects(planet-geo-pos, planet-data, orb = default-orb) { // Renamed
    const grouped-aspects = { // Renamed
        conjuncao: [],
        sextil: [],
        quadratura: [],
        trigono: [],
        oposicao: []
    };

    const planet-keys = Object.keys(planet-geo-pos).filter(key => planets-for-aspects.includes(key)); // Renamed

    for (let i = 0; i < planet-keys.length; i++) {
        for (let j = i + 1; j < planet-keys.length; j++) {
            const planet1-name = planet-keys[i]; // Renamed
            const planet2-name = planet-keys[j]; // Renamed

            const pos1-deg = planet-geo-pos[planet1-name]; // Renamed
            const pos2-deg = planet-geo-pos[planet2-name]; // Renamed

            const planet1-info = planet-data[planet1-name]; // Renamed
            const planet2-info = planet-data[planet2-name]; // Renamed

            if (pos1-deg === undefined || pos2-deg === undefined || !planet1-info || !planet2-info) {
                console.warn(`Aspect calc warn: data missing for ${planet1-name} or ${planet2-name}.`);
                continue;
            }

            let angular-diff = Math.abs(pos1-deg - pos2-deg); // Renamed

            if (angular-diff > 180) {
                angular-diff = 360 - angular-diff;
            }

            for (const aspect-def of aspect-defs) { // Renamed
                const ideal-degree = aspect-def.degree; // Renamed
                const aspect-name = aspect-def.name; // Renamed

                if (angular-diff >= (ideal-degree - orb) && angular-diff <= (ideal-degree + orb)) {
                    const description = `${aspect-name.charAt(0).toUpperCase() + aspect-name.slice(1)} - ` +
                                        `${planet1-name.charAt(0).toUpperCase() + planet1-name.slice(1)} - ` +
                                        `house ${planet1-info.house} x ` +
                                        `${planet2-name.charAt(0).toUpperCase() + planet2-name.slice(1)}, ` +
                                        `house ${planet2-info.house}`;

                    grouped-aspects[aspect-name].push({ // Renamed
                        planet1: { name: planet1-name, house: planet1-info.house }, // Renamed
                        planet2: { name: planet2-name, house: planet2-info.house }, // Renamed
                        type: aspect-name, // Renamed
                        exactDegree: parseFloat(angular-diff.toFixed(4)), // Renamed
                        appliedOrb: parseFloat(Math.abs(angular-diff - ideal-degree).toFixed(4)), // Renamed
                        description: description
                    });
                }
            }
        }
    }
    return grouped-aspects; // Renamed
}


async function get-planets(jd, cusps) { // Renamed
  const planet-map = { // Renamed
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

  const geo-pos = {}; // Renamed
  const planet-data = {}; // Renamed
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  for (const [name, id] of Object.entries(planet-map)) { // Renamed
    try {
      const current = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd, id, flags, resolve)
      );
      const future = await new Promise((resolve) =>
        swisseph.swe_calc_ut(jd + 0.01, id, flags, resolve)
      );

      const current-long = current.longitude ?? current.position?.[0]; // Renamed
      const future-long = future.longitude ?? future.position?.[0]; // Renamed

      if (current-long == null || future-long == null) {
        console.warn(`Planet pos warn: ${name}.`); // Shortened message
        continue;
      }

      const astrological-house = determinarCasaAstrologica(current-long, cusps); // Renamed

      geo-pos[name] = current-long; // Renamed
      planet-data[name] = { // Renamed
        sign: degree-to-sign(current-long), // Renamed
        retrograde: future-long < current-long, // Renamed
        house: astrological-house // Renamed
      };
    } catch (err) {
      console.error(`Planet calc error: ${name}.`); // Shortened message
    }
  }

  return { geo: geo-pos, data: planet-data }; // Renamed
}

// --- ELEMENTAL AND MODAL QUALITIES ANALYSIS ---

// Map zodiac signs to elements.
const sign-elem-map = { // Renamed
    "Áries": "fogo", "Leão": "fogo", "Sagitário": "fogo",
    "Touro": "terra", "Virgem": "terra", "Capricórnio": "terra",
    "Gêmeos": "ar", "Libra": "ar", "Aquário": "ar",
    "Câncer": "agua", "Escorpião": "agua", "Peixes": "agua"
};

// Map zodiac signs to qualities (modalities).
const sign-qual-map = { // Renamed
    "Áries": "cardinal", "Câncer": "cardinal", "Libra": "cardinal", "Capricórnio": "cardinal",
    "Touro": "fixa", "Leão": "fixa", "Escorpião": "fixa", "Aquário": "fixa",
    "Gêmeos": "mutavel", "Virgem": "mutavel", "Sagitário": "mutavel", "Peixes": "mutavel"
};

// --- WEIGHTED SCORING RULES ---
const point-weights = { // Renamed
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
const elem-qual-limits = { // Renamed
    deficiency-max: 3,  // Renamed
    balance-max: 8      // Renamed
};

/**
 * Determines status (deficiency, balance, excess) by count.
 * @param {number} count The point count.
 * @returns {string} The status ('deficiency', 'balance', 'excess').
 */
const get-status = (count) => { // Renamed
    if (count <= elem-qual-limits.deficiency-max) {
        return "deficiency";
    } else if (count <= elem-qual-limits.balance-max) {
        return "balance";
    } else {
        return "excess";
    }
};

/**
 * Analyzes elemental and modal qualities from astrological point data.
 * @param {Object} planet-data Planet data including their signs.
 * @param {Array<Object>} cusps Array of house cusps (for Asc/MC).
 * @returns {Object} Object containing element and quality analysis.
 */
async function analyze-elements-qual(planet-data, cusps) { // Renamed
    const element-counts = { fogo: 0, terra: 0, ar: 0, agua: 0 }; // Renamed
    const quality-counts = { cardinal: 0, fixa: 0, mutavel: 0 }; // Renamed

    // Map cusp data for Ascendant and Midheaven as "points".
    const add-points = { // Renamed
        ascendente: { sign: degree-to-sign(cusps[0]?.degree) }, // Renamed
        mc: { sign: degree-to-sign(cusps[9]?.degree) } // Renamed
    };

    // Combine all points for iteration, considering only those with defined weights.
    const all-points = { ...planet-data, ...add-points }; // Renamed

    for (const point-name in all-points) { // Renamed
        // Check if point has defined weight.
        if (point-weights[point-name] !== undefined) { // Renamed
            const weight = point-weights[point-name]; // Renamed
            const point-sign = all-points[point-name].sign; // Renamed

            if (sign-elem-map[point-sign]) { // Renamed
                element-counts[sign-elem-map[point-sign]] += weight; // Renamed
            }
            if (sign-qual-map[point-sign]) { // Renamed
                quality-counts[sign-qual-map[point-sign]] += weight; // Renamed
            }
        }
    }

    // Determine status (deficiency, balance, excess) for each element.
    const element-results = {}; // Renamed
    for (const element in element-counts) {
        element-results[element] = {
            count: element-counts[element],
            status: get-status(element-counts[element]) // Renamed
        };
    }

    // Determine status (deficiency, balance, excess) for each quality.
    const quality-results = {}; // Renamed
    for (const quality in quality-counts) {
        quality-results[quality] = {
            count: quality-counts[quality],
            status: get-status(quality-counts[quality]) // Renamed
        };
    }

    return { elements: element-results, qualities: quality-results }; // Renamed
}

// Restante do código (analyzeHouses e compute) será na próxima parte.
