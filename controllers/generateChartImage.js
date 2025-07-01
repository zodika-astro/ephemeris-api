'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const logger = require('../logger'); // Corrected path to logger

// --- Font Configuration ---
const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
if (!fs.existsSync(fontPath)) {
  logger.error(`Font Inter not found: ${fontPath}. Please ensure the font file exists.`);
  // Consider throwing an error or using a fallback font if critical
}
try {
  registerFont(fontPath, { family: 'Inter', weight: 'bold' });
} catch (e) {
  logger.warn('Error registering Inter font:', e.message);
}

// --- Chart Drawing Constants ---
const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;
const radius = 700;

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const planetColor = '#8B0000'; // Example color for planets

// Astrological signs for drawing labels (adjust order if needed for visual layout)
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

  // Ensure planetPositions is correctly accessed
  const planetPositions = ephemerisData?.geo || {};

  // --- Background ---
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // --- Circles ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI); ctx.stroke();

  // --- House Lines ---
  // Note: Your house lines are currently drawn every 30 degrees, which is for equal houses.
  // If you want to draw based on actual cusp degrees, you'd use ephemerisData.houses.cusps.
  // For simplicity, keeping the 30-degree divisions as per original code.
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.stroke();

    // Small markers on the outer circle
    const markerLength = radius * 0.05;
    const x1 = centerX + (radius * 0.8) * Math.cos(angle);
    const y1 = centerY + (radius * 0.8) * Math.sin(angle);
    const x2 = centerX + (radius * 0.8 + markerLength) * Math.cos(angle);
    const y2 = centerY + (radius * 0.8 + markerLength) * Math.sin(angle);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  // --- Degree Markers ---
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let deg = 0; deg < 360; deg += 5) {
    const angle = deg * Math.PI / 180;
    const outer = deg % 10 === 0 ? 20 : 15; // Longer lines for 10-degree marks
    const inner = deg % 10 === 0 ? 35 : 30;

    ctx.beginPath();
    ctx.moveTo(centerX + (radius - outer) * Math.cos(angle), centerY + (radius - outer) * Math.sin(angle));
    ctx.lineTo(centerX + (radius - inner) * Math.cos(angle), centerY + (radius - inner) * Math.sin(angle));
    ctx.stroke();

    if (deg % 10 === 0) {
      ctx.font = 'bold 16px Inter';
      ctx.fillText(deg.toString(), centerX + (radius - 50) * Math.cos(angle), centerY + (radius - 50) * Math.sin(angle));
    }
  }

  // --- Sign Names (Circular Layout) ---
  // Note: The original `signos` array had an inverse order for `startDeg`.
  // Adjusted `signsForDrawing` to match typical astrological wheel layout (Aries at 0 deg).
  // The `startDeg` in `signsForDrawing` should be the actual degree where the sign starts.
  // For circular text, the angle calculation needs to be precise.
  ctx.font = 'bold 32px Inter'; // Set font once for all signs
  signsForDrawing.forEach(signo => {
    // Calculate the center of the sign's arc for text placement
    const angleDeg = signo.startDeg + 15; // Middle of the 30-degree sign
    const angleRad = angleDeg * Math.PI / 180;

    const nameRadius = radius - 100;
    const letters = signo.nome.split('');
    const letterSpacing = 22; // Adjust for visual spacing

    letters.forEach((letter, i) => {
      // Calculate individual letter angle for circular text
      const letterAngle = angleRad + (i - (letters.length - 1) / 2) * (letterSpacing / nameRadius);
      const x = centerX + nameRadius * Math.cos(letterAngle);
      const y = centerY + nameRadius * Math.sin(letterAngle);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(letterAngle + Math.PI / 2); // Rotate text to follow the arc
      ctx.fillText(letter, 0, 0);
      ctx.restore();
    });
  });

  // --- House Numbers ---
  ctx.font = 'bold 28px Inter';
  for (let i = 0; i < 12; i++) {
    // Position house numbers in the middle of each house sector
    // This uses the 30-degree equal house assumption from your drawing logic.
    // To use actual cusps, ensure ephemerisData.houses.cusps is correctly populated and use its degrees.
    const cusp1Degree = ephemerisData.houses?.cusps[i]?.degree;
    const cusp2Degree = ephemerisData.houses?.cusps[(i + 1) % 12]?.degree;

    if (cusp1Degree !== undefined && cusp2Degree !== undefined) {
      // Calculate the midpoint angle between two cusps, handling wrap-around for 360/0
      let midAngleDeg;
      if (cusp2Degree > cusp1Degree) {
          midAngleDeg = (cusp1Degree + cusp2Degree) / 2;
      } else {
          midAngleDeg = (cusp1Degree + cusp2Degree + 360) / 2;
          if (midAngleDeg >= 360) midAngleDeg -= 360;
      }

      const angleRad = midAngleDeg * Math.PI / 180;
      const houseRadius = radius * 0.6;
      ctx.fillText((i + 1).toString(), centerX + houseRadius * Math.cos(angleRad), centerY + houseRadius * Math.sin(angleRad));
    } else {
      logger.warn(`House cusp data missing for house ${i + 1}. Using default 30-degree spacing.`);
      const angleDeg = i * 30 + 15;
      const angleRad = angleDeg * Math.PI / 180;
      const houseRadius = radius * 0.6;
      ctx.fillText((i + 1).toString(), centerX + houseRadius * Math.cos(angleRad), centerY + houseRadius * Math.sin(angleRad));
    }
  }

  // --- Planet Positions ---
  ctx.fillStyle = planetColor;
  ctx.font = 'bold 16px Inter';
  Object.entries(planetPositions).forEach(([planet, degree]) => {
    const angle = degree * Math.PI / 180;
    const planetRadius = radius * 0.4; // Inner circle for planets
    const x = centerX + planetRadius * Math.cos(angle);
    const y = centerY + planetRadius * Math.sin(angle);

    // Draw a circle for the planet symbol (placeholder for actual symbols)
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fill();

    // Draw planet name (as a placeholder for actual symbols)
    ctx.fillStyle = textColor;
    ctx.fillText(planet.toUpperCase(), x, y - 20); // Position text above the circle
  });

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
