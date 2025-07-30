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

module.exports = {
  degreeToSign,
  getStatusByCount,
  SIGN_ELEMENT_MAP,
  SIGN_QUALITY_MAP,
  SIGNS
};
