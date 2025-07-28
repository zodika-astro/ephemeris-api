'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Register project fonts
const interFontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
if (fs.existsSync(interFontPath)) {
  registerFont(interFontPath, { family: 'Inter', weight: 'bold' });
  registerFont(interFontPath.replace('-Bold', '-Regular'), {
    family: 'Inter',
    weight: 'normal'
  });
}

// Color and layout constants
const WIDTH = 1536;
const HEIGHT = 768;
const COLORS = {
  BACKGROUND: '#FFFBF4',
  TEXT: '#29281E',
  HEADER: '#1A1E3B',
  TABLE_BORDER: '#29281E'
};

const FONT_HEADER = 'bold 32px Inter';
const FONT_TEXT = '12px Inter';

// Planet and sign translation maps
const PLANET_LABELS_PT = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
  jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno',
  pluto: 'Plutão', trueNode: 'Nodo Norte', lilith: 'Lilith', chiron: 'Quíron'
};

const PLANET_SYMBOLS = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆',
  pluto: '♇', trueNode: '☊', lilith: '☭', chiron: '⚷'
};

const SIGN_LABELS_PT = {
  Aries: 'Áries', Taurus: 'Touro', Gemini: 'Gêmeos', Cancer: 'Câncer', Leo: 'Leão',
  Virgo: 'Virgem', Libra: 'Libra', Scorpio: 'Escorpião', Sagittarius: 'Sagitário',
  Capricorn: 'Capricórnio', Aquarius: 'Aquário', Pisces: 'Peixes'
};

// Helper to format planet row
const formatPlanetRow = (planet, data, degrees) => {
  const degree = degrees[planet];
  const totalSeconds = (degree % 30) * 3600;
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  const sign = data[planet]?.sign || '-';
  const signPt = SIGN_LABELS_PT[sign] || sign;
  const retro = data[planet]?.retrograde === 'yes' ? ' (retrógrado)' : '';
  return `${d}° ${signPt} ${m}' ${s}"${retro}`.trim();
};

async function generateNatalTableImage(chartData) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const planets = Object.keys(chartData.planets);
  const degrees = chartData.geo;
  const signs = chartData.planets;

  // ELEMENTS TABLE: Cardinal / Fixed / Mutable vs Fire / Earth / Air / Water
  const elements = chartData.elements;
  const qualities = chartData.qualities;

  // PLANET TABLE (left)
  const startX = 60;
  const startY = 80;
  const rowHeight = 36;

    ctx.font = FONT_TEXT;
  ctx.fillStyle = COLORS.TEXT;
  planets.forEach((planet, index) => {
    const labelText = PLANET_LABELS_PT[planet] || planet;
    const symbol = PLANET_SYMBOLS[planet] || '';
    const label = `${symbol} ${labelText}`;
    const value = formatPlanetRow(planet, signs, degrees);
    const y = startY + (index + 1) * rowHeight;
    ctx.fillText(label, startX, y);
    ctx.fillText(value, startX + 200, y);

    // Draw divider line
    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.beginPath();
    ctx.moveTo(startX, y + 10);
    ctx.lineTo(startX + 360, y + 10);
    ctx.stroke();
  });

  // MATRIX TABLE (right)
  const matrixStartX = 700;
  const matrixStartY = 80;
  const cellWidth = 110;
  const cellHeight = 50;

  const qualitiesOrder = ['cardinal', 'fixed', 'mutable'];
  const elementsOrder = ['fire', 'earth', 'air', 'water'];

  // Headers
  ctx.font = FONT_HEADER;
  const qualityLabels = ['Cardinal', 'Fixo', 'Mutável']; // No title drawn
  qualitiesOrder.forEach((q, col) => {
    ctx.fillText(qualityLabels[col], matrixStartX + (col + 1) * cellWidth, matrixStartY);
  });

  const elementLabels = ['Fogo', 'Terra', 'Ar', 'Água'];
  elementLabels.forEach((el, row) => {
    ctx.fillText(el, matrixStartX, matrixStartY + (row + 1) * cellHeight);
  });

  // Cells
  ctx.font = FONT_TEXT;
  elementsOrder.forEach((el, row) => {
    qualitiesOrder.forEach((q, col) => {
      const x = matrixStartX + (col + 1) * cellWidth;
      const y = matrixStartY + (row + 1) * cellHeight;
      ctx.strokeStyle = COLORS.TABLE_BORDER;
      ctx.strokeRect(x - 40, y - 30, 80, 40);
      if (elements[el] && qualities[q]) {
        const elCount = elements[el].count;
        const qCount = qualities[q].count;
        const label = (elCount && qCount) ? `${elCount}/${qCount}` : '-';
        ctx.fillText(label, x, y);
      }
    });
  });

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalTableImage };
