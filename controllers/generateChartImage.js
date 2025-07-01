'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

// --- Font Configuration ---
// Path to the Inter font (for general text)
const interFontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
if (!fs.existsSync(interFontPath)) {
  logger.error(`Inter font not found: ${interFontPath}. Please ensure the font file exists.`);
}
try {
  registerFont(interFontPath, { family: 'Inter', weight: 'bold' });
  registerFont(interFontPath.replace('-Bold', '-Regular'), { family: 'Inter', weight: 'normal' }); // Register regular for degrees
} catch (e) {
  logger.warn('Error registering Inter font:', e.message);
}

// Path to Symbola font for astrological symbols (planets only)
const symbolaFontPath = path.join(__dirname, '../fonts/symbola.ttf');
let useSymbolaFont = false; // Flag to check if Symbola is available
if (!fs.existsSync(symbolaFontPath)) {
  logger.error(`Symbola font not found: ${symbolaFontPath}. Planet symbols will use text names.`);
} else {
  try {
    registerFont(symbolaFontPath, { family: 'Symbola' });
    useSymbolaFont = true;
  } catch (e) {
    logger.warn('Error registering Symbola font:', e.message);
  }
}

// --- Chart Drawing Constants ---
const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;
const outerRadius = 600; // Adjusted outer radius to match reference more closely
const zodiacRingOuterRadius = outerRadius; // Outer edge of the zodiac degree ring
const zodiacRingInnerRadius = outerRadius * 0.85; // Inner edge of the zodiac degree ring (thinner ring)
const planetOrbitRadius = outerRadius * 0.45; // Radius for planet positions (adjusted to be more central)
const innerRadius = outerRadius * 0.15; // Innermost circle radius (smaller central circle)

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const cuspNumberColor = '#555555'; // Color for house numbers

// Astrological symbols mapping (Unicode characters for Symbola font)
const planetSymbols = {
  sun: '\u2609',        // ☉
  moon: '\u263D',       // ☽
  mercury: '\u263F',    // ☿
  venus: '\u2640',      // ♀
  mars: '\u2642',       // ♂
  jupiter: '\u2643',    // ♃
  saturn: '\u2644',     // ♄
  uranus: '\u2645',     // ♅
  neptune: '\u2646',    // ♆
  pluto: '\u2647',      // ♇
  trueNode: '\u260A',   // ☊ (North Node)
  lilith: '\u262D',     // ☍ (Black Moon Lilith)
  chiron: '\u26B7'      // ⚷
};

// Aspect colors and line widths
const aspectStyles = {
  conjunction: { color: null, lineWidth: 0 }, // No line for conjunction
  opposition: { color: '#FF0000', lineWidth: 3 }, // Red bold
  square: { color: '#FF4500', lineWidth: 2 },     // Orange-red normal
  sextile: { color: '#0000FF', lineWidth: 1.5 },  // Blue
  trine: { color: '#008000', lineWidth: 1.5 }     // Green
};

// --- Utility Functions ---

/**
 * Converts degrees to radians.
 * @param {number} degrees - Degrees value.
 * @returns {number} Radians value.
 */
const degToRad = (degrees) => degrees * Math.PI / 180;

// Astrological signs in order (used for sign index lookup and drawing labels)
const signs = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// --- Chart Drawing Function ---

/**
 * Generates a natal chart image as a PNG buffer.
 * @param {Object} ephemerisData - The complete ephemeris data from your API.
 * @returns {Promise<Buffer>} A promise that resolves with the PNG image buffer.
 */
async function generateNatalChartImage(ephemerisData) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Ensure data is correctly accessed
  const planetPositions = ephemerisData?.geo || {};
  const planetSignData = ephemerisData?.signs || {};
  const houseCusps = ephemerisData?.houses?.cusps || [];
  const aspectsData = ephemerisData?.aspects || {};

  // --- Background ---
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // --- Main Circles ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI); ctx.stroke(); // Outer boundary
  ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingOuterRadius, 0, 2 * Math.PI); ctx.stroke(); // Zodiac outer ring
  ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingInnerRadius, 0, 2 * Math.PI); ctx.stroke(); // Zodiac inner ring
  ctx.beginPath(); ctx.arc(centerX, centerY, planetOrbitRadius, 0, 2 * Math.PI); ctx.stroke(); // Planet orbit circle
  ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI); ctx.stroke(); // Innermost circle

  // --- House Cusps Lines (Accurate) ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;

  houseCusps.forEach((cusp, index) => {
    const angleRad = degToRad(cusp.degree);
    const xOuter = centerX + outerRadius * Math.cos(angleRad); // Extend to outer boundary
    const yOuter = centerY + outerRadius * Math.sin(angleRad);
    const xInner = centerX + innerRadius * Math.cos(angleRad); // Start from inner circle
    const yInner = centerY + innerRadius * Math.sin(angleRad);

    ctx.beginPath();
    ctx.moveTo(xInner, yInner);
    ctx.lineTo(xOuter, yOuter);
    ctx.stroke();

    // Draw house numbers (positioned in the central area)
    const nextCuspDegree = houseCusps[(index + 1) % 12].degree;
    let midAngleDeg;
    if (nextCuspDegree > cusp.degree) {
      midAngleDeg = (cusp.degree + nextCuspDegree) / 2;
    } else {
      midAngleDeg = (cusp.degree + nextCuspDegree + 360) / 2;
      if (midAngleDeg >= 360) midAngleDeg -= 360;
    }

    const houseNumberRadius = innerRadius + (planetOrbitRadius - innerRadius) * 0.5; // Position between inner circle and planet orbit
    const numX = centerX + houseNumberRadius * Math.cos(degToRad(midAngleDeg));
    const numY = centerY + houseNumberRadius * Math.sin(degToRad(midAngleDeg));

    ctx.fillStyle = cuspNumberColor;
    ctx.font = 'bold 24px Inter';
    ctx.fillText((index + 1).toString(), numX, numY);
  });


  // --- Zodiac Sign Names (Inside Zodiac Ring) ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 24px Inter'; // Use Inter font for text names

  // Calculate position for each sign name
  signs.forEach((signName, index) => {
    const startDegree = index * 30; // Each sign is 30 degrees
    const angleDeg = startDegree + 15; // Middle of the 30-degree sign
    const angleRad = degToRad(angleDeg);

    const signNameTextRadius = (zodiacRingOuterRadius + zodiacRingInnerRadius) / 2; // Position in the middle of the zodiac ring

    // Simplified text drawing for sign names (no individual letter rotation)
    const textX = centerX + signNameTextRadius * Math.cos(angleRad);
    const textY = centerY + signNameTextRadius * Math.sin(angleRad);

    ctx.save();
    ctx.translate(textX, textY);
    // Rotate text to align with the circle (adjusting for canvas Y-axis inversion)
    ctx.rotate(angleRad + Math.PI / 2); // Rotate text to follow the arc
    ctx.fillStyle = textColor;
    ctx.fillText(signName.toUpperCase(), 0, 0); // Draw full name
    ctx.restore();
  });

  // --- Degree Markers ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.font = '14px Inter'; // Smaller font for degrees

  for (let deg = 0; deg < 360; deg += 1) { // Draw every degree for finer marks
    const angleRad = degToRad(deg);
    const outerMarkRadius = zodiacRingOuterRadius; // Start from outer zodiac ring
    let innerMarkRadius = zodiacRingOuterRadius - 5; // Default mark length

    if (deg % 5 === 0) { // Longer mark for every 5 degrees
      innerMarkRadius = zodiacRingOuterRadius - 10;
    }
    if (deg % 10 === 0) { // Even longer mark for every 10 degrees, and add text
      innerMarkRadius = zodiacRingOuterRadius - 20;
      const textRadius = zodiacRingOuterRadius - 35; // Position text further in
      const textX = centerX + textRadius * Math.cos(angleRad);
      const textY = centerY + textRadius * Math.sin(angleRad);
      ctx.fillText(deg.toString(), textX, textY);
    }

    ctx.beginPath();
    ctx.moveTo(centerX + outerMarkRadius * Math.cos(angleRad), centerY + outerMarkRadius * Math.sin(angleRad));
    ctx.lineTo(centerX + innerMarkRadius * Math.cos(angleRad), centerY + innerMarkRadius * Math.sin(angleRad));
    ctx.stroke();
  }


  // --- Planet Positions (Symbols) ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;

  // Set font based on Symbola availability
  if (useSymbolaFont) {
    ctx.font = '36px Symbola'; // Use Symbola font for planet symbols
  } else {
    ctx.font = 'bold 20px Inter'; // Fallback to Inter font for text names
  }

  const placedPlanets = []; // To track placed planets and their final positions

  // Sort planets by degree to help with overlap avoidance (ascending order)
  const sortedPlanets = Object.entries(planetPositions).sort(([, degA], [, degB]) => degA - degB);

  sortedPlanets.forEach(([planetName, degree]) => {
    const angleRad = degToRad(degree);
    let currentPlanetRadius = planetOrbitRadius;
    let x, y;
    let overlap = true;
    let attempt = 0;
    const maxAttempts = 15; // Increased max attempts for better spacing
    const radiusStep = 25; // Pixels to move out/in for overlap avoidance (increased)
    const symbolSize = 30; // Approximate size of the symbol for collision detection

    // Simple overlap avoidance: try to move slightly if collision
    while (overlap && attempt < maxAttempts) {
      x = centerX + currentPlanetRadius * Math.cos(angleRad);
      y = centerY + currentPlanetRadius * Math.sin(angleRad);
      overlap = false;

      for (const placed of placedPlanets) {
        // Calculate distance between current planet's potential position and already placed planets
        const dist = Math.sqrt(Math.pow(x - placed.x, 2) + Math.pow(y - placed.y, 2));
        // Check for overlap based on symbol size. Factor 0.8 allows slight overlap for denser charts.
        if (dist < (symbolSize + placed.symbolSize) * 0.8) {
          overlap = true;
          currentPlanetRadius += radiusStep; // Move further out
          break;
        }
      }
      attempt++;
    }

    // Draw the planet symbol or its name as fallback
    const symbol = planetSymbols[planetName];
    if (symbol && useSymbolaFont) {
      ctx.fillText(symbol, x, y);
    } else {
      ctx.fillText(planetName.toUpperCase(), x, y); // Fallback to text
    }

    // Store the final calculated position of the planet
    placedPlanets.push({ x, y, symbolSize: symbolSize, degree: degree, name: planetName });
  });

  // --- Aspect Lines ---
  // Draw lines between the actual drawn positions of the planets
  for (const aspectType in aspectsData) {
    const style = aspectStyles[aspectType];
    if (!style || style.color === null) continue; // Skip if no style or color is null (e.g., conjunction)

    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;

    aspectsData[aspectType].forEach(aspect => {
      const planet1Name = aspect.planet1.name;
      const planet2Name = aspect.planet2.name;

      // Find the final drawn positions of the planets
      const p1 = placedPlanets.find(p => p.name === planet1Name);
      const p2 = placedPlanets.find(p => p.name === planet2Name);

      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
  }

  // Reset line width for general drawing after aspects
  ctx.lineWidth = 2;

  // --- Center Text ---
  ctx.fillStyle = textColor;
  ctx.font = 'bold 36px Inter';
  ctx.fillText('ZODIKA', centerX, centerY - 30);
  ctx.font = '24px Inter';
  ctx.fillText('www.zodika.com.br', centerX, centerY + 30);

  // Return the image as a Buffer
  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
