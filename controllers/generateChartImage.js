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
} catch (e) {
  logger.warn('Error registering Inter font:', e.message);
}

// Path to Symbola font for astrological symbols
const symbolaFontPath = path.join(__dirname, '../fonts/symbola.ttf'); // Using Symbola.ttf
if (!fs.existsSync(symbolaFontPath)) {
  logger.error(`Symbola font not found: ${symbolaFontPath}. Please ensure the font file exists.`);
  // Fallback to text names if font is missing
} else {
  try {
    registerFont(symbolaFontPath, { family: 'Symbola' });
  } catch (e) {
    logger.warn('Error registering Symbola font:', e.message);
  }
}

// --- Chart Drawing Constants ---
const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;
const outerRadius = 700; // Outer circle of the chart
const zodiacRadius = outerRadius * 0.9; // Radius for sign names/degrees
const planetOrbitRadius = outerRadius * 0.5; // Radius for planet positions
const innerRadius = outerRadius * 0.2; // Innermost circle radius

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const cuspNumberColor = '#555555'; // Color for house numbers

// Astrological symbols mapping (Unicode characters for Symbola font)
// These are common Unicode values for astrological symbols.
// If Symbola doesn't render them, you might need to find alternative Unicode points
// or a different font.
const planetSymbols = {
  sun: '\u2609',        // ☉
  moon: '\u263D',       // ☽ (or \u263E for waning crescent)
  mercury: '\u263F',    // ☿
  venus: '\u2640',      // ♀
  mars: '\u2642',       // ♂
  jupiter: '\u2643',    // ♃
  saturn: '\u2644',     // ♄
  uranus: '\u2645',     // ♅
  neptune: '\u2646',    // ♆
  pluto: '\u2647',      // ♇
  trueNode: '\u260A',   // ☊ (North Node)
  lilith: '\u262D',     // ☍ (Black Moon Lilith - common symbol, might vary)
  chiron: '\u26B7'      // ⚷
};

const signSymbols = {
  Aries: '\u2648',      // ♈
  Taurus: '\u2649',     // ♉
  Gemini: '\u264A',     // ♊
  Cancer: '\u264B',     // ♋
  Leo: '\u264C',        // ♌
  Virgo: '\u264D',      // ♍
  Libra: '\u264E',      // ♎
  Scorpio: '\u264F',    // ♏
  Sagittarius: '\u2650',// ♐
  Capricorn: '\u2651',  // ♑
  Aquarius: '\u2652',   // ♒
  Pisces: '\u2653'      // ♓
};

// Aspect colors (for drawing lines) based on user's request
const aspectColors = {
  conjunction: null,      // No line for conjunction
  opposition: '#FF0000',  // Red bold
  square: '#FF4500',      // Orange-red (slightly less bold than pure red)
  sextile: '#0000FF',     // Blue
  trine: '#008000'        // Green
};

// --- Utility Functions ---

/**
 * Converts degrees to radians.
 * @param {number} degrees - Degrees value.
 * @returns {number} Radians value.
 */
const degToRad = (degrees) => degrees * Math.PI / 180;

// Astrological signs in order (used for sign index lookup)
const signs = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Astrological signs for drawing labels (adjust order if needed for visual layout)
// This array dictates the order and starting point for drawing the sign names around the wheel.
const signsForDrawing = [
  { nome: 'ÁRIES', startDeg: 0 },
  { nome: 'TOURO', startDeg: 30 },
  { nome: 'GÊMEOS', startDeg: 60 },
  { nome: 'CÂNCER', startDeg: 90 },
  { nome: 'LEÃO', startDeg: 120 },
  { nome: 'VIRGEM', startDeg: 150 },
  { nome: 'LIBRA', startDeg: 180 },
  { nome: 'ESCORPIÃO', startDeg: 210 },
  { nome: 'SAGITÁRIO', startDeg: 240 },
  { nome: 'CAPRICÓRNIO', startDeg: 270 },
  { nome: 'AQUÁRIO', startDeg: 300 },
  { nome: 'PEIXES', startDeg: 330 }
];

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
  const planetSignData = ephemerisData?.signs || {}; // Contains sign and house for each planet
  const houseCusps = ephemerisData?.houses?.cusps || [];
  const aspectsData = ephemerisData?.aspects || {};

  // --- Background ---
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // --- Main Circles ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI); ctx.stroke(); // Outer zodiac circle
  ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRadius, 0, 2 * Math.PI); ctx.stroke(); // Inner zodiac circle (for degrees/signs)
  ctx.beginPath(); ctx.arc(centerX, centerY, planetOrbitRadius, 0, 2 * Math.PI); ctx.stroke(); // Planet orbit circle
  ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI); ctx.stroke(); // Innermost circle

  // --- House Cusps Lines (Accurate) ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;

  houseCusps.forEach((cusp, index) => {
    const angleRad = degToRad(cusp.degree);
    const xOuter = centerX + outerRadius * Math.cos(angleRad);
    const yOuter = centerY + outerRadius * Math.sin(angleRad);
    const xInner = centerX + innerRadius * Math.cos(angleRad);
    const yInner = centerY + innerRadius * Math.sin(angleRad);

    ctx.beginPath();
    ctx.moveTo(xInner, yInner); // Start from the inner circle
    ctx.lineTo(xOuter, yOuter); // Extend to the outer circle
    ctx.stroke();

    // Draw house numbers (positioned in the middle of the house sector)
    const nextCuspDegree = houseCusps[(index + 1) % 12].degree;
    let midAngleDeg;
    if (nextCuspDegree > cusp.degree) {
      midAngleDeg = (cusp.degree + nextCuspDegree) / 2;
    } else { // Handle wrap-around (e.g., from 350 to 10 degrees)
      midAngleDeg = (cusp.degree + nextCuspDegree + 360) / 2;
      if (midAngleDeg >= 360) midAngleDeg -= 360;
    }

    const houseNumberRadius = (planetOrbitRadius + innerRadius) / 2; // Position between inner planet circle and inner circle
    const numX = centerX + houseNumberRadius * Math.cos(degToRad(midAngleDeg));
    const numY = centerY + houseNumberRadius * Math.sin(degToRad(midAngleDeg));

    ctx.fillStyle = cuspNumberColor;
    ctx.font = 'bold 24px Inter';
    ctx.fillText((index + 1).toString(), numX, numY);
  });


  // --- Zodiac Signs (Symbols and Names) ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw Sign Symbols
  const signSymbolRadius = outerRadius + 30; // Slightly outside the outer circle
  // Check if Symbola font is registered before trying to use it
  if (fs.existsSync(symbolaFontPath)) {
    ctx.font = '48px Symbola'; // Use Symbola font for symbols
  } else {
    // Fallback to Inter font if Symbola is not available
    ctx.font = 'bold 36px Inter';
  }

  signsForDrawing.forEach(signo => {
    const signName = signo.nome.charAt(0).toUpperCase() + signo.nome.slice(1).toLowerCase(); // Normalize name (e.g., 'ÁRIES' -> 'Áries')
    const symbolChar = signSymbols[signName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")]; // Remove accents for lookup

    const angleDeg = signo.startDeg + 15; // Middle of the 30-degree sign
    const angleRad = degToRad(angleDeg);

    const x = centerX + signSymbolRadius * Math.cos(angleRad);
    const y = centerY + signSymbolRadius * Math.sin(angleRad);

    ctx.fillStyle = textColor;
    if (symbolChar && fs.existsSync(symbolaFontPath)) {
      ctx.fillText(symbolChar, x, y);
    } else {
      // Fallback to text if symbola font is missing or symbol not found
      ctx.font = 'bold 20px Inter'; // Smaller font for fallback sign name
      ctx.fillText(signo.nome, x, y);
    }
  });

  // Draw Sign Names (Circular Layout) - Adjusted positioning
  const signNameTextRadius = zodiacRadius + 50; // Between outer zodiac circle and outer radius
  ctx.font = 'bold 20px Inter'; // Use Inter font for text names
  signsForDrawing.forEach(signo => {
    const angleDeg = signo.startDeg + 15; // Middle of the 30-degree sign
    const angleRad = degToRad(angleDeg);

    const letters = signo.nome.split('');
    const letterSpacing = 20; // Adjust for visual spacing

    letters.forEach((letter, i) => {
      const letterAngle = angleRad + (i - (letters.length - 1) / 2) * (letterSpacing / signNameTextRadius);
      const x = centerX + signNameTextRadius * Math.cos(letterAngle);
      const y = centerY + signNameTextRadius * Math.sin(letterAngle);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(letterAngle + Math.PI / 2); // Rotate text to follow the arc
      ctx.fillText(letter, 0, 0);
      ctx.restore();
    });
  });

  // --- Degree Markers ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.font = '14px Inter'; // Smaller font for degrees

  for (let deg = 0; deg < 360; deg += 1) { // Draw every degree for finer marks
    const angleRad = degToRad(deg);
    const outerMarkRadius = zodiacRadius - 5; // Start just inside zodiac circle
    let innerMarkRadius = zodiacRadius - 10; // Default mark length

    if (deg % 5 === 0) { // Longer mark for every 5 degrees
      innerMarkRadius = zodiacRadius - 15;
    }
    if (deg % 10 === 0) { // Even longer mark for every 10 degrees, and add text
      innerMarkRadius = zodiacRadius - 25;
      const textRadius = zodiacRadius - 35; // Position text further in
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
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Check if Symbola font is registered before trying to use it
  if (fs.existsSync(symbolaFontPath)) {
    ctx.font = '36px Symbola'; // Use Symbola font for planet symbols
  } else {
    // Fallback to Inter font if Symbola is not available
    ctx.font = 'bold 20px Inter';
  }

  const placedPlanets = []; // To track placed planets and avoid overlaps

  // Sort planets by degree to help with overlap avoidance
  const sortedPlanets = Object.entries(planetPositions).sort(([, degA], [, degB]) => degA - degB);

  sortedPlanets.forEach(([planetName, degree]) => {
    const angleRad = degToRad(degree);
    let currentPlanetRadius = planetOrbitRadius;
    let x, y;
    let overlap = true;
    let attempt = 0;
    const maxAttempts = 10; // Max attempts to find a non-overlapping spot
    const radiusStep = 20; // Pixels to move out/in for overlap avoidance (increased slightly)
    const symbolSize = 30; // Approximate size of the symbol for collision detection (increased for symbols)

    // Simple overlap avoidance: try to move slightly if collision
    while (overlap && attempt < maxAttempts) {
      x = centerX + currentPlanetRadius * Math.cos(angleRad);
      y = centerY + currentPlanetRadius * Math.sin(angleRad);
      overlap = false;

      for (const placed of placedPlanets) {
        const dist = Math.sqrt(Math.pow(x - placed.x, 2) + Math.pow(y - placed.y, 2));
        if (dist < (symbolSize + placed.symbolSize) * 0.7) { // If too close (0.7 factor for tighter packing)
          overlap = true;
          currentPlanetRadius += radiusStep; // Move further out
          break;
        }
      }
      attempt++;
    }

    // Fallback if too many overlaps or no symbol
    const symbol = planetSymbols[planetName];
    if (symbol && fs.existsSync(symbolaFontPath)) {
      ctx.fillText(symbol, x, y);
    } else {
      // Fallback to text if font not loaded or symbol not found
      ctx.font = 'bold 16px Inter';
      ctx.fillText(planetName.toUpperCase(), x, y);
    }

    placedPlanets.push({ x, y, symbolSize: symbolSize, degree: degree, name: planetName }); // Store placed planet with its final position
  });

  // --- Aspect Lines ---
  ctx.lineWidth = 2; // Default line width for aspects

  for (const aspectType in aspectsData) {
    const color = aspectColors[aspectType];
    if (!color) continue; // Skip if no color defined or if null (like conjunction)

    ctx.strokeStyle = color;

    // Adjust line width for "bold" aspects like Opposition
    if (aspectType === 'opposition') {
      ctx.lineWidth = 3; // Thicker line for opposition
    } else if (aspectType === 'square') {
      ctx.lineWidth = 2; // Normal thickness for square
    } else {
      ctx.lineWidth = 1.5; // Slightly thinner for sextile/trine
    }

    aspectsData[aspectType].forEach(aspect => {
      const planet1Name = aspect.planet1.name;
      const planet2Name = aspect.planet2.name;

      // Find the final drawn positions of the planets
      const p1 = placedPlanets.find(p => p.name === planet1Name);
      const p2 = placedPlanets.find(p => p.name === planet2Name);

      if (p1 && p2) {
        // Draw line between the *actual drawn positions* of the planets
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
