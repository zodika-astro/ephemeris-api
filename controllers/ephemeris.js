'use strict';

const swisseph = require('swisseph');
const path = require('path');
const logger = require('../logger');

const ephePath = path.join(__dirname, '..', 'ephe');
swisseph.swe_set_ephe_path(ephePath);
logger.info(`Swiss Ephemeris path set to: ${ephePath}`);

const {
  degreeToSign,
  getStatusByCount,
  SIGN_ELEMENT_MAP,
  SIGN_QUALITY_MAP
} = require('../utils/astrology');

const ASPECT_DEFINITIONS = [
  { name: "conjunction", degree: 0, category: 0 },
  { name: "sextile", degree: 60, category: 2 },
  { name: "square", degree: 90, category: 1 },
  { name: "trine", degree: 120, category: 1 },
  { name: "opposition", degree: 180, category: 0 }
];

const ORB_RULES = {
  'sun': [10, 9, 7],
  'moon': [10, 9, 7],
  'mercury': [10, 9, 7],
  'venus': [10, 9, 7],
  'mars': [10, 9, 7],
  'jupiter': [9, 9, 6],
  'saturn': [9, 9, 6],
  'uranus': [9, 8, 5],
  'neptune': [9, 8, 5],
  'pluto': [8, 7, 5],
  'trueNode': [5, 4, 2],
  'chiron': [6, 5, 3],
  'lilith': [3, 3, 1.5],
  'ascendant': [10, 10, 6],
  'mc': [10, 10, 6]
};

const ALL_POINTS_FOR_ASPECTS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "trueNode", "chiron", "lilith",
  "ascendant", "mc"
];

const WEIGHT_PER_POINT = {
  sun: 3, moon: 3, ascendant: 3, mc: 3,
  mercury: 2, venus: 2, mars: 2, jupiter: 2,
  saturn: 1, uranus: 1, neptune: 1, pluto: 1
};

const SIGN_LABELS = {
  en: ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"],
  pt: ["Áries","Touro","Gêmeos","Câncer","Leão","Virgem","Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"],
  es: ["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"]
};

const PLANET_LABELS = {
  en: {
    sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
    jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto",
    trueNode: "North Node", lilith: "Lilith", chiron: "Chiron", ascendant: "Ascendant", mc: "MC"
  },
  pt: {
    sun: "Sol", moon: "Lua", mercury: "Mercúrio", venus: "Vênus", mars: "Marte",
    jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Netuno", pluto: "Plutão",
    trueNode: "Nodo Norte", lilith: "Lilith", chiron: "Quíron", ascendant: "Ascendente", mc: "Meio do Céu"
  },
  es: {
    sun: "Sol", moon: "Luna", mercury: "Mercurio", venus: "Venus", mars: "Marte",
    jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Neptuno", pluto: "Plutón",
    trueNode: "Nodo Norte", lilith: "Lilith", chiron: "Quirón", ascendant: "Ascendente", mc: "Medio Cielo"
  }
};

const ELEMENT_LABELS = {
  en: { fire: "Fire", earth: "Earth", air: "Air", water: "Water" },
  pt: { fire: "Fogo", earth: "Terra", air: "Ar", water: "Água" },
  es: { fire: "Fuego", earth: "Tierra", air: "Aire", water: "Agua" }
};

const QUALITY_LABELS = {
  en: { cardinal: "Cardinal", fixed: "Fixed", mutable: "Mutable" },
  pt: { cardinal: "Cardinal", fixed: "Fixo", mutable: "Mutável" },
  es: { cardinal: "Cardinal", fixed: "Fijo", mutable: "Mutable" }
};

const STATUS_LABELS = {
  en: { lack: "lack", balance: "balance", excess: "excess" },
  pt: { lack: "escassez", balance: "equilíbrio", excess: "excesso" },
  es: { lack: "falta", balance: "equilibrio", excess: "exceso" }
};

const ASPECT_LABELS = {
  en: { conjunction: "Conjunction", sextile: "Sextile", square: "Square", trine: "Trine", opposition: "Opposition" },
  pt: { conjunction: "Conjunção", sextile: "Sextil", square: "Quadratura", trine: "Trígono", opposition: "Oposição" },
  es: { conjunction: "Conjunción", sextile: "Sextil", square: "Cuadratura", trine: "Trígono", opposition: "Oposición" }
};

const HOUSE_WORD = { en: "house", pt: "casa", es: "casa" };

const YESNO = {
  en: { yes: "yes", no: "no" },
  pt: { yes: "sim", no: "não" },
  es: { yes: "sí", no: "no" }
};

function normalizeLang(raw) {
  const v = String(raw || 'en').toLowerCase();
  if (v.startsWith('pt')) return 'pt';
  if (v.startsWith('es')) return 'es';
  return 'en';
}

function signIndexFromDegree(deg) {
  const n = ((deg % 360) + 360) % 360;
  return Math.floor(n / 30);
}

function degreeToSignLocalized(deg, lang) {
  const labels = SIGN_LABELS[lang] || SIGN_LABELS.en;
  return labels[signIndexFromDegree(deg)];
}

const computeHouses = (jd, lat, lng, houseSystem = 'P') => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(jd, swisseph.SEFLG_SWIEPH, lat, lng, houseSystem, (res) => {
      if (res.error) return reject(new Error(`House calculation error: ${res.error}`));
      resolve(res.house.slice(0, 12).map((degree, i) => ({ house: i + 1, degree })));
    });
  });
};

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

async function computeAspects(planetGeoPositions, planetSignData, lang) {
  const groupedAspects = {
    conjunction: [], sextile: [], square: [], trine: [], opposition: []
  };

  const allPointsKeys = Object.keys(planetGeoPositions).filter(key => ALL_POINTS_FOR_ASPECTS.includes(key));

  for (let i = 0; i < allPointsKeys.length; i++) {
    for (let j = i + 1; j < allPointsKeys.length; j++) {
      const [p1, p2] = [allPointsKeys[i], allPointsKeys[j]];

      if ((p1 === "ascendant" && p2 === "mc") || (p1 === "mc" && p2 === "ascendant")) {
        continue;
      }

      const [pos1, pos2] = [planetGeoPositions[p1], planetGeoPositions[p2]];
      const [info1, info2] = [planetSignData[p1], planetSignData[p2]];

      if (pos1 === undefined || pos2 === undefined || !info1 || !info2) {
        logger.warn(`Invalid position or info for ${p1} or ${p2} when computing aspects.`);
        continue;
      }

      const deg1 = Math.floor(pos1) + (Math.floor((pos1 % 1) * 60)) / 60;
      const deg2 = Math.floor(pos2) + (Math.floor((pos2 % 1) * 60)) / 60;
      let cleanDiff = Math.abs(deg1 - deg2);
      if (cleanDiff > 180) cleanDiff = 360 - cleanDiff;

      for (const aspectDef of ASPECT_DEFINITIONS) {
        const p1Orb = ORB_RULES[p1]?.[aspectDef.category];
        const p2Orb = ORB_RULES[p2]?.[aspectDef.category];

        if (p1Orb === undefined || p2Orb === undefined) {
            logger.warn(`Orb rule not found for ${p1} or ${p2} for aspect ${aspectDef.name}. Skipping.`);
            continue;
        }

        const orb = (p1Orb + p2Orb) / 2.0;

        if (orb > 0 && cleanDiff >= (aspectDef.degree - orb) && cleanDiff <= (aspectDef.degree + orb)) {
          const aspectLabel = (ASPECT_LABELS[lang] || ASPECT_LABELS.en)[aspectDef.name];
          const s1 = degreeToSignLocalized(pos1, lang);
          const s2 = degreeToSignLocalized(pos2, lang);
          const wordHouse = HOUSE_WORD[lang] || HOUSE_WORD.en;
          const planetLabels = PLANET_LABELS[lang] || PLANET_LABELS.en;

          groupedAspects[aspectDef.name].push({
            planet1: { name: p1, label: planetLabels[p1] || p1, sign: s1, house: info1.house },
            planet2: { name: p2, label: planetLabels[p2] || p2, sign: s2, house: info2.house },
            description:
              `${aspectLabel} — ${planetLabels[p1] || p1} (${s1}) · ${wordHouse} ${info1.house} × ` +
              `${planetLabels[p2] || p2} (${s2}) · ${wordHouse} ${info2.house}`
          });
        }
      }
    }
  }
  return groupedAspects;
}

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

const calculateEphemeris = async (reqBody) => {
  try {
    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone,
      config = {}
    } = reqBody;

    const lang = normalizeLang(config.language);
    const decimalHours = hours + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL);

    const houseSystem = config.house_system || 'P';
    const cusps = await computeHouses(jd, latitude, longitude, houseSystem);
    let { geo, signs: planetSignData } = await computePlanets(jd, cusps);

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

    const aspects = await computeAspects(geo, planetSignData, lang);
    const { elements, qualities } = await analyzeElementalAndModalQualities(planetSignData, cusps);
    const analysis = analyzeHouses(cusps);

    const formattedHouses = {};
    const yn = YESNO[lang] || YESNO.en;
    const planetLabels = PLANET_LABELS[lang] || PLANET_LABELS.en;

    for (let i = 1; i <= 12; i++) {
      const cuspInfo = analysis.cusps.find(c => c.house === i);
      const hasInterceptedSign = analysis.housesWithInterceptedSigns.some(item => item.house === i);
      const planetsInThisHouse = [];

      for (const planetName in planetSignData) {
        const data = planetSignData[planetName];
        if (data.house === i) {
          planetsInThisHouse.push(planetName);
        }
      }

      formattedHouses[`house${i}`] = {
        sign: cuspInfo ? degreeToSignLocalized(cuspInfo.degree, lang) : null,
        cuspDegree: cuspInfo?.degree || null,
        intercepted: hasInterceptedSign ? yn.yes : yn.no,
        planets: planetsInThisHouse,
        planetsLabels: planetsInThisHouse.map(p => planetLabels[p] || p)
      };
    }

    const planetsOut = {};
    for (const [name, data] of Object.entries(planetSignData)) {
      const deg = geo[name];
      const localizedSign = typeof deg === 'number' ? degreeToSignLocalized(deg, lang) : data.sign;
      planetsOut[name] = {
        ...data,
        sign: localizedSign,
        retrograde: data.retrograde === "yes" ? yn.yes : yn.no
      };
    }

    const elementsOut = {};
    const elLabels = ELEMENT_LABELS[lang] || ELEMENT_LABELS.en;
    const stLabels = STATUS_LABELS[lang] || STATUS_LABELS.en;
    for (const [elKey, obj] of Object.entries(elements)) {
      elementsOut[elKey] = {
        ...obj,
        label: elLabels[elKey] || elKey,
        statusLabel: stLabels[obj.status] || obj.status
      };
    }

    const qualitiesOut = {};
    const qLabels = QUALITY_LABELS[lang] || QUALITY_LABELS.en;
    for (const [qKey, obj] of Object.entries(qualities)) {
      qualitiesOut[qKey] = {
        ...obj,
        label: qLabels[qKey] || qKey,
        statusLabel: stLabels[obj.status] || obj.status
      };
    }

    return {
      statusCode: 200,
      message: "Ephemeris computed successfully",
      ephemerisQuery: reqBody,
      geo,
      planets: planetsOut,
      houses: formattedHouses,
      aspects,
      elements: elementsOut,
      qualities: qualitiesOut
    };
  } catch (err) {
    logger.error(`Calculation error: ${err.message}`);
    return {
      statusCode: 500,
      message: `Calculation failed: ${err.message}`
    };
  }
};

module.exports = { calculateEphemeris };
