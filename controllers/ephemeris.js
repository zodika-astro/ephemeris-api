'use strict';
const swisseph = require('swisseph');

// Initialize ephemeris path (important for accuracy)
swisseph.swe_set_ephe_path(__dirname + '/ephe');

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

// Historical DST data for Belgium (simplified)
const belgiumDST = {
  1965: {
    start: { month: 4, day: 18 }, // DST started April 18, 1965
    end: { month: 9, day: 26 }    // DST ended September 26, 1965
  }
  // Add more years as needed
};

function checkHistoricalDST(year, month, date, timezone) {
  if (timezone !== 1) return false; // Only applies to Brussels time
  const dstData = belgiumDST[year];
  if (!dstData) return false;
  
  const dstStart = new Date(year, dstData.start.month - 1, dstData.start.day);
  const dstEnd = new Date(year, dstData.end.month - 1, dstData.end.day);
  const currentDate = new Date(year, month - 1, date);
  
  return currentDate >= dstStart && currentDate <= dstEnd;
}

function grauParaSigno(grau) {
  const normalized = ((grau % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  return signos[Math.min(index, 11)]; // Ensure we don't go beyond array bounds
}

async function computeHouses(jd, lat, lng, houseSystem = 'P') {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses_ex(
      jd,
      swisseph.SEFLG_SWIEPH,
      lat,
      lng,
      houseSystem,
      (res) => {
        if (res.error) {
          reject(new Error(`House calculation error: ${res.error}`));
          return;
        }

        const cuspides = res.house.slice(0, 12).map((cusp, i) => ({
          casa: i + 1,
          grau: cusp
        }));

        resolve(cuspides);
      }
    );
  });
}

async function computePlanetaryPositions(jd) {
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
    plutao: swisseph.SE_PLUTO
  };

  const positions = {};
  const signosPlanetas = {};

  // We need SEFLG_SPEED to get the speed for retrograde detection
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  for (const [nome, id] of Object.entries(planetas)) {
    const pos = await new Promise((resolve) => {
      swisseph.swe_calc_ut(
        jd,
        id,
        flags,
        (res) => {
          console.log(`Planet: ${nome}`);
          console.log(`Longitude: ${res.longitude}`);
          console.log(`Speed: ${res.speed}`);
          console.log(`Retrograde: ${res.speed < 0}`);
          
          resolve({
            longitude: res.longitude,
            speed: res.speed,
            retrograde: res.speed < 0
          });
        }
      );
    });

    positions[nome] = pos.longitude;
    signosPlanetas[nome] = grauParaSigno(pos.longitude);
    signosPlanetas[`${nome}_retrogrado`] = pos.retrograde;
  }

  return { geo: positions, signos: signosPlanetas };
}

function analyzeHouses(cuspides) {
  const signosNasCuspides = new Set(cuspides.map(c => grauParaSigno(c.grau)));
  const casasComInterceptacoes = [];
  const signosInterceptados = new Set();

  // Check for interceptions
  for (let i = 0; i < cuspides.length; i++) {
    const current = cuspides[i];
    const next = cuspides[(i + 1) % cuspides.length];
    let startDegree = current.grau;
    let endDegree = next.grau > current.grau ? next.grau : next.grau + 360;

    const signosNoArco = new Set();
    for (let deg = startDegree; deg < endDegree; deg += 1) {
      signosNoArco.add(grauParaSigno(deg));
    }

    signosNoArco.forEach(signo => {
      if (!signosNasCuspides.has(signo)) {
        casasComInterceptacoes.push({
          casa: current.casa,
          signoInterceptado: signo
        });
        signosInterceptados.add(signo);
      }
    });
  }

  // Check for duplicate ruled signs
  const signCount = {};
  cuspides.forEach(c => {
    const signo = grauParaSigno(c.grau);
    signCount[signo] = (signCount[signo] || 0) + 1;
  });

  const signosComDuplaRegencia = Object.entries(signCount)
    .filter(([_, count]) => count > 1)
    .map(([signo]) => signo);

  return {
    signosInterceptados: Array.from(signosInterceptados),
    signosComDuplaRegencia,
    casasComInterceptacoes,
    cuspides: cuspides.map(c => ({
      ...c,
      signo: grauParaSigno(c.grau),
      interceptado: casasComInterceptacoes.some(i => 
        i.casa === c.casa && i.signoInterceptado === grauParaSigno(c.grau))
    }))
  };
}

async function compute(reqBody) {
  try {
    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone,
      config = {}
    } = reqBody;

    // Validate input
    if (!year || !month || !date) {
      throw new Error("Invalid date parameters");
    }

    // Handle timezone and DST
    const isDST = checkHistoricalDST(year, month, date, timezone);
    const effectiveTimezone = isDST ? timezone + 1 : timezone;
    const decimalHours = hours + minutes / 60 + seconds / 3600;

    // Calculate Julian Day with proper timezone adjustment
    const jd = swisseph.swe_julday(
      year, month, date, decimalHours - effectiveTimezone, swisseph.SE_GREG_CAL
    );

    // Calculate houses with configured system (default Placidus)
    const houseSystem = config.house_system || 'P';
    const cuspides = await computeHouses(jd, latitude, longitude, houseSystem);

    // Calculate planetary positions
    const { geo, signos: signosPlanetas } = await computePlanetaryPositions(jd);

    // Analyze house data
    const houseAnalysis = analyzeHouses(cuspides);

    return {
      statusCode: 200,
      message: "Ephemeris computed successfully",
      ephemerisQuery: reqBody,
      ephemerides: { geo },
      signos: signosPlanetas,
      casas: {
        cuspides: houseAnalysis.cuspides,
        signosInterceptados: houseAnalysis.signosInterceptados,
        signosComDuplaRegencia: houseAnalysis.signosComDuplaRegencia,
        casasComInterceptacoes: houseAnalysis.casasComInterceptacoes
      },
      config: {
        house_system: houseSystem,
        timezone_used: effectiveTimezone,
        is_dst: isDST
      }
    };
  } catch (error) {
    console.error("Ephemeris calculation error:", error);
    return {
      statusCode: 500,
      message: `Calculation error: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}

module.exports = { compute };
