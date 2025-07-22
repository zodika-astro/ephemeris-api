'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Configuration Constants
const CHART_WIDTH = 1536;
const CHART_HEIGHT = 1536;
const CENTER_X = CHART_WIDTH / 2;
const CENTER_Y = CHART_HEIGHT / 2;
const OUTER_RADIUS = 600;
const ZODIAC_RING_INNER_RADIUS = OUTER_RADIUS * 0.85;
const INNER_RADIUS = OUTER_RADIUS * 0.25;
const ASPECTS_LINE_MAX_RADIUS = INNER_RADIUS + 50;
const MIN_PLANET_RADIUS = ASPECTS_LINE_MAX_RADIUS + 60;
const MAX_PLANET_RADIUS = ZODIAC_RING_INNER_RADIUS - 5;
const PLANET_SYMBOL_SIZE = 52;
const PLANET_CIRCLE_RADIUS = PLANET_SYMBOL_SIZE / 1.6;
const HOUSE_NUMBER_RADIUS = INNER_RADIUS + 20;
const HOUSE_NUMBER_FONT_SIZE = 28;

// Color Constants
const COLORS = {
  BACKGROUND: '#FFFBF4',
  LINE: '#29281E',
  TEXT: '#29281E',
  SYMBOL: '#1A1E3B',
  CUSP_NUMBER: '#555555',
  SIGN: '#5A4A42',
  SIGN_DIVISION: 'rgba(89, 74, 66, 0.4)',
  ARROW: '#5A2A00',
  CENTER_TEXT: '#807B74'
};

// Font registration
const interFontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
const symbolaFontPath = path.join(__dirname, '../fonts/symbola.ttf');
let useSymbolaFont = false;

if (fs.existsSync(interFontPath)) {
  registerFont(interFontPath, { family: 'Inter', weight: 'bold' });
  registerFont(interFontPath.replace('-Bold', '-Regular'), { 
    family: 'Inter', 
    weight: 'normal' 
  });
}

if (fs.existsSync(symbolaFontPath)) {
  try {
    registerFont(symbolaFontPath, { family: 'Symbola' });
    useSymbolaFont = true;
  } catch (e) {
    console.warn('Error registering Symbola font:', e.message);
  }
}

// Planet symbols
const PLANET_SYMBOLS = {
  sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
  mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
  neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7'
};

// Aspect styles
const ASPECT_STYLES = {
  conjunction: { color: null, lineWidth: 0 },
  opposition: { color: '#FF0000', lineWidth: 3 },
  square: { color: '#FF4500', lineWidth: 2.5 },
  sextile: { color: '#0000FF', lineWidth: 2 },
  trine: { color: '#008000', lineWidth: 2 }
};

// Zodiac signs and symbols
const ZODIAC_SIGNS = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", 
  "Virgem", "Libra", "Escorpião", "Sagitário", 
  "Capricórnio", "Aquário", "Peixes"
];
const SIGN_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// Utility functions
const degToRad = (degrees) => degrees * Math.PI / 180;

function toChartCoords(degree) {
  // Convert to standard chart orientation: 0° at right, increasing clockwise
  return degToRad(360 - degree);
}

function drawArrow(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size / 2);
  ctx.lineTo(-size, size / 2);
  ctx.closePath();
  ctx.fillStyle = COLORS.ARROW;
  ctx.fill();
  ctx.restore();
}

function rotateHouseToStandardPosition(houseCusps) {
  // Find house 10 (Midheaven) to position at top
  const house10 = houseCusps.find(c => c.house === 10);
  if (!house10) return houseCusps;
  
  const rotation = house10.degree;
  return houseCusps.map(c => ({
    ...c,
    degree: (c.degree - rotation + 360) % 360
  }));
}

async function generateNatalChartImage(ephemerisData) {
  const canvas = createCanvas(CHART_WIDTH, CHART_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Extract chart data
  const planetPositions = ephemerisData?.geo || {};
  const houses = ephemerisData?.houses || {};
  const aspectsData = ephemerisData?.aspects || {};

  // Prepare house cusps
  const houseCusps = [];
  for (let i = 1; i <= 12; i++) {
    const houseKey = `house${i}`;
    if (houses[houseKey]) {
      houseCusps.push({
        house: i,
        degree: houses[houseKey].cuspDegree,
        sign: houses[houseKey].sign
      });
    }
  }
  
  // Rotate houses to standard position (House 10 at top)
  const rotatedHouseCusps = rotateHouseToStandardPosition(houseCusps);
  rotatedHouseCusps.sort((a, b) => a.degree - b.degree);

  // Draw chart base
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);
  
  // Draw concentric circles
  ctx.strokeStyle = COLORS.LINE;
  ctx.lineWidth = 2;
  ctx.beginPath(); 
  ctx.arc(CENTER_X, CENTER_Y, OUTER_RADIUS, 0, 2 * Math.PI); 
  ctx.stroke();
  ctx.beginPath(); 
  ctx.arc(CENTER_X, CENTER_Y, ZODIAC_RING_INNER_RADIUS, 0, 2 * Math.PI); 
  ctx.stroke();
  ctx.beginPath(); 
  ctx.arc(CENTER_X, CENTER_Y, INNER_RADIUS, 0, 2 * Math.PI); 
  ctx.stroke();

  // Draw house cusps and numbers
  rotatedHouseCusps.forEach((cusp, index) => {
    const angleRad = toChartCoords(cusp.degree);
    
    // Draw cusp line
    const xInner = CENTER_X + INNER_RADIUS * Math.cos(angleRad);
    const yInner = CENTER_Y + INNER_RADIUS * Math.sin(angleRad);
    const xZodiacInner = CENTER_X + ZODIAC_RING_INNER_RADIUS * Math.cos(angleRad);
    const yZodiacInner = CENTER_Y + ZODIAC_RING_INNER_RADIUS * Math.sin(angleRad);
    ctx.beginPath();
    ctx.moveTo(xInner, yInner);
    ctx.lineTo(xZodiacInner, yZodiacInner);
    ctx.stroke();
    
    // Draw arrow
    drawArrow(ctx, xZodiacInner, yZodiacInner, angleRad, 12);
    
    // Draw house number near cusp line (inside circle)
    const r = INNER_RADIUS + 35;
    const x = CENTER_X + r * Math.cos(angleRad);
    const y = CENTER_Y + r * Math.sin(angleRad);
    
    ctx.fillStyle = COLORS.CUSP_NUMBER;
    ctx.font = `bold ${HOUSE_NUMBER_FONT_SIZE}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cusp.house.toString(), x, y);
  });

  // Draw sign divisions
  ctx.strokeStyle = COLORS.SIGN_DIVISION;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 6]);
  
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = toChartCoords(deg);
    const xStart = CENTER_X + ZODIAC_RING_INNER_RADIUS * Math.cos(rad);
    const yStart = CENTER_Y + ZODIAC_RING_INNER_RADIUS * Math.sin(rad);
    const xEnd = CENTER_X + OUTER_RADIUS * Math.cos(rad);
    const yEnd = CENTER_Y + OUTER_RADIUS * Math.sin(rad);
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
  }
  
  ctx.setLineDash([]);

  // Draw zodiac signs and symbols
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.SIGN;
  
  ZODIAC_SIGNS.forEach((sign, i) => {
    const angleDeg = i * 30 + 15;
    const angleRad = toChartCoords(angleDeg);
    const r = (OUTER_RADIUS + ZODIAC_RING_INNER_RADIUS) / 2;
    const x = CENTER_X + r * Math.cos(angleRad);
    const y = CENTER_Y + r * Math.sin(angleRad);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad + Math.PI / 2);
    
    // Draw sign symbol
    ctx.fillStyle = '#8B4513';
    ctx.font = useSymbolaFont ? '38px Symbola' : 'bold 24px Inter';
    ctx.fillText(SIGN_SYMBOLS[i], 0, -15);
    
    // Draw sign name
    ctx.fillStyle = COLORS.SIGN;
    ctx.font = 'bold 18px Inter';
    ctx.fillText(sign.toUpperCase(), 0, 20);
    
    ctx.restore();
  });

  // ==================================================================
  // PLANET POSITIONING LOGIC (IMPROVED VERSION)
  // ==================================================================
  const planets = Object.entries(planetPositions)
    .map(([name, deg]) => ({ name, deg }))
    .sort((a, b) => a.deg - b.deg);

  const placedPlanets = [];
  const MIN_DISTANCE = PLANET_CIRCLE_RADIUS * 2 + 20;

  planets.forEach(planet => {
    const angleRad = toChartCoords(planet.deg);
    
    // Find optimal radius that avoids collisions
    let radius = MIN_PLANET_RADIUS;
    let collision;
    let attempts = 0;
    
    do {
      collision = false;
      const x = CENTER_X + radius * Math.cos(angleRad);
      const y = CENTER_Y + radius * Math.sin(angleRad);
      
      // Check collisions with existing planets
      for (const placed of placedPlanets) {
        const dx = x - placed.x;
        const dy = y - placed.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < MIN_DISTANCE) {
          collision = true;
          radius += 15; // Move outward
          break;
        }
      }
      
      // Ensure we don't go too far out
      if (radius > MAX_PLANET_RADIUS) {
        radius = MAX_PLANET_RADIUS;
        break;
      }
      
      attempts++;
    } while (collision && attempts < 20);
    
    // Final position
    placedPlanets.push({
      ...planet,
      angleRad,
      x: CENTER_X + radius * Math.cos(angleRad),
      y: CENTER_Y + radius * Math.sin(angleRad),
      radius
    });
  });

  // Draw planets with larger symbols
  placedPlanets.forEach(planet => {
    const symbol = PLANET_SYMBOLS[planet.name];
    
    // Draw background circle
    ctx.fillStyle = 'rgba(255, 249, 237, 0.7)';
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, PLANET_CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw planet symbol
    ctx.fillStyle = COLORS.SYMBOL;
    ctx.font = useSymbolaFont ? 
      `bold ${PLANET_SYMBOL_SIZE}px Symbola` : 
      `bold ${PLANET_SYMBOL_SIZE}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, planet.x, planet.y);
  });

  // ==================================================================
  // ASPECT LINES (PROPERLY POSITIONED)
  // ==================================================================
  for (const aspectType in aspectsData) {
    const style = ASPECT_STYLES[aspectType];
    if (!style || !style.color) continue;
    
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;
    
    aspectsData[aspectType].forEach(aspect => {
      const p1 = placedPlanets.find(p => p.name === aspect.planet1.name);
      const p2 = placedPlanets.find(p => p.name === aspect.planet2.name);
      
      if (p1 && p2) {
        // Start from planet's actual position
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
  }

  // Draw center text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.CENTER_TEXT;
  ctx.font = 'bold 32px Inter';
  ctx.fillText('MAPA NATAL', CENTER_X, CENTER_Y - 25);
  ctx.font = 'italic 26px Inter';
  ctx.fillText('ZODIKA', CENTER_X, CENTER_Y + 15);
  ctx.font = '18px Inter';
  ctx.fillText('www.zodika.com.br', CENTER_X, CENTER_Y + 55);

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
