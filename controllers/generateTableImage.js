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
  TABLE_BORDER: '#CCCCCC'
};

const FONT_HEADER = 'bold 32px Inter';
const FONT_TEXT = '10px Inter';
const ROW_HEIGHT = 22;

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

  const planets = Object.keys(chartData.planets);
  const degrees = chartData.geo;
  const signs = chartData.planets;
  const elements = chartData.elements;
  const qualities = chartData.qualities;

  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const startX = 40;
  const symbolColX = startX + 5;
  const labelColX = startX + 25;
  const valueColX = startX + 100;
  const startY = 80;

  ctx.font = FONT_TEXT;
  ctx.fillStyle = COLORS.TEXT;
  ctx.lineWidth = 0.6;

  planets.forEach((planet, index) => {
    const labelText = PLANET_LABELS_PT[planet] || planet;
    const symbol = PLANET_SYMBOLS[planet] || '';
    const value = formatPlanetRow(planet, signs, degrees);
    const y = startY + (index + 1) * ROW_HEIGHT;
    ctx.fillText(symbol, symbolColX, y);
    ctx.fillText(labelText, labelColX, y);
    ctx.fillText(value, valueColX, y);

    // Horizontal line
    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.beginPath();
    ctx.moveTo(startX, y + 6);
    ctx.lineTo(valueColX + 400, y + 6);
    ctx.stroke();
  });

  // Vertical divider
  ctx.beginPath();
  ctx.moveTo(valueColX - 5, startY);
  ctx.lineTo(valueColX - 5, startY + (planets.length + 1) * ROW_HEIGHT);
  ctx.strokeStyle = COLORS.TABLE_BORDER;
  ctx.stroke();

  // Aspect matrix (symbols on diagonals)
  const aspectStartX = valueColX + 40;
  const aspectStartY = startY;
  const aspectSize = 30;

  planets.forEach((planet, i) => {
    const y = aspectStartY + (i + 1) * ROW_HEIGHT - 12;
    ctx.fillText(PLANET_SYMBOLS[planet] || '', aspectStartX + i * aspectSize + 10, y);
  });

  planets.forEach((planet, row) => {
    const y = aspectStartY + (row + 1) * ROW_HEIGHT - 6;
    planets.forEach((_, col) => {
      const x = aspectStartX + col * aspectSize;
      ctx.strokeStyle = COLORS.TABLE_BORDER;
      ctx.strokeRect(x, y - 10, aspectSize, ROW_HEIGHT);
    });
  });

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalTableImage };
