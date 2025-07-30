'use strict';

// Zodiac signs
const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Element and modality classification
const SIGN_ELEMENT_MAP = {
  "Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
  "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
  "Gemini": "air", "Libra": "air", "Aquarius": "air",
  "Cancer": "water", "Scorpio": "water", "Pisces": "water"
};

// Modality classification
const SIGN_QUALITY_MAP = {
  "Aries": "cardinal", "Cancer": "cardinal", "Libra": "cardinal", "Capricorn": "cardinal",
  "Taurus": "fixed", "Leo": "fixed", "Scorpio": "fixed", "Aquarius": "fixed",
  "Gemini": "mutable", "Virgo": "mutable", "Sagittarius": "mutable", "Pisces": "mutable"
};

// Weights used for elemental/modality analysis
const WEIGHT_PER_POINT = {
  sun: 3, moon: 3, ascendant: 3, mc: 3,
  mercury: 2, venus: 2, mars: 2, jupiter: 2,
  saturn: 1, uranus: 1, neptune: 1, pluto: 1
};

// Converts a degree (0–360) to a zodiac sign
const degreeToSign = (degree) => {
  const normalized = ((degree % 360) + 360) % 360;
  return SIGNS[Math.floor(normalized / 30)];
};

// Categorizes a count into "lack", "balance", or "excess"
const getStatusByCount = (count) => {
  const LACK_MAX = 3;
  const BALANCE_MAX = 8;
  if (count <= LACK_MAX) return "lack";
  if (count <= BALANCE_MAX) return "balance";
  return "excess";
};

// Analyzes intercepted signs and repeated signs on cusps
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

module.exports = {
  degreeToSign,
  getStatusByCount,
  analyzeHouses,
  SIGN_ELEMENT_MAP,
  SIGN_QUALITY_MAP,
  WEIGHT_PER_POINT
};
