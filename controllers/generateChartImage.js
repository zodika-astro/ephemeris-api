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
const PLANET_SYMBOL_SIZE = 32;
const PLANET_CIRCLE_RADIUS = PLANET_SYMBOL_SIZE / 1.6;
const MIN_ANGULAR_SEPARATION = 5;
const RADIAL_INCREMENT = 5;
const MAX_ITERATIONS = 50;
const MIN_DISTANCE_BETWEEN_SYMBOLS = PLANET_CIRCLE_RADIUS * 2 + 10;
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
if (fs.existsSync(interFontPath)) {
  registerFont(interFontPath, { family: 'Inter', weight: 'bold' });
  registerFont(interFontPath.replace('-Bold', '-Regular'), { 
    family: 'Inter', 
    weight: 'normal' 
  });
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

// Zodiac signs
const ZODIAC_SIGNS = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", 
  "Virgem", "Libra", "Escorpião", "Sagitário", 
  "Capricórnio", "Aquário", "Peixes"
];

// Utility functions
const degToRad = (degrees) => degrees * Math.PI / 180;

function toChartCoords(degree, mcDegree) {
  const adjusted = (degree - mcDegree + 450) % 360;
  return degToRad(adjusted);
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

async function generateNatalChartImage(ephemerisData) {
  const canvas = createCanvas(CHART_WIDTH, CHART_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Extract chart data
  const planetPositions = ephemerisData?.geo || {};
  const houses = ephemerisData?.houses || {};
  const aspectsData = ephemerisData?.aspects || {};

  // Prepare house cusps with correct orientation
  const houseCusps = [];
  let mcDegree = 0;
  
  for (let i = 1; i <= 12; i++) {
    const houseKey = `house${i}`;
    if (houses[houseKey]) {
      houseCusps.push({
        house: i,
        degree: houses[houseKey].cuspDegree,
        sign: houses[houseKey].sign
      });
      
      // Find MC (Midheaven - House 10)
      if (i === 10) mcDegree = houses[houseKey].cuspDegree;
    }
  }

  // Sort houses by degree with MC at top
  houseCusps.sort((a, b) => (a.degree - mcDegree + 360) % 360 - (b.degree - mcDegree + 360) % 360);

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
  houseCusps.forEach((cusp, index) => {
    const angleRad = toChartCoords(cusp.degree, mcDegree);
    
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
    
    // Draw house number
    const nextIndex = (index + 1) % houseCusps.length;
    const nextCusp = houseCusps[nextIndex];
    
    let midDegree = (cusp.degree + nextCusp.degree) / 2;
    if (nextCusp.degree < cusp.degree) {
      midDegree = (cusp.degree + nextCusp.degree + 360) / 2;
      if (midDegree >= 360) midDegree -= 360;
    }
    
    const midAngleRad = toChartCoords(midDegree, mcDegree);
    const x = CENTER_X + HOUSE_NUMBER_RADIUS * Math.cos(midAngleRad);
    const y = CENTER_Y + HOUSE_NUMBER_RADIUS * Math.sin(midAngleRad);
    
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
    const rad = toChartCoords(deg, mcDegree);
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

  // Draw zodiac signs
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.SIGN;
  
  ZODIAC_SIGNS.forEach((sign, i) => {
    const angleDeg = i * 30 + 15;
    const angleRad = toChartCoords(angleDeg, mcDegree);
    const r = (OUTER_RADIUS + ZODIAC_RING_INNER_RADIUS) / 2;
    const x = CENTER_X + r * Math.cos(angleRad);
    const y = CENTER_Y + r * Math.sin(angleRad);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad + Math.PI / 2);
    ctx.font = 'bold 18px Inter';
    ctx.fillText(sign.toUpperCase(), 0, 0);
    ctx.restore();
  });

  // ==================================================================
  // PLANET POSITIONING LOGIC (COLLISION AVOIDANCE)
  // ==================================================================
  const planets = Object.entries(planetPositions)
    .map(([name, deg]) => ({ name, deg }))
    .sort((a, b) => a.deg - b.deg);

  // Initialize positions
  const radii = new Array(planets.length).fill(MIN_PLANET_RADIUS);
  const angles = planets.map(planet => toChartCoords(planet.deg, mcDegree));

  // Collision detection function
  const hasCollision = (i, j) => {
    const dx = radii[i] * Math.cos(angles[i]) - radii[j] * Math.cos(angles[j]);
    const dy = radii[i] * Math.sin(angles[i]) - radii[j] * Math.sin(angles[j]);
    return Math.sqrt(dx*dx + dy*dy) < MIN_DISTANCE_BETWEEN_SYMBOLS;
  };

  // Resolve collisions iteratively
  let collision;
  let iterations = 0;
  
  do {
    collision = false;
    
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        if (hasCollision(i, j)) {
          collision = true;
          
          if (radii[i] <= radii[j]) {
            radii[i] = Math.min(radii[i] + RADIAL_INCREMENT, MAX_PLANET_RADIUS);
          } else {
            radii[j] = Math.min(radii[j] + RADIAL_INCREMENT, MAX_PLANET_RADIUS);
          }
        }
      }
    }
    
    iterations++;
  } while (collision && iterations < MAX_ITERATIONS);

  // Create final planet positions
  const placedPlanets = planets.map((planet, i) => ({
    ...planet,
    angleRad: angles[i],
    x: CENTER_X + radii[i] * Math.cos(angles[i]),
    y: CENTER_Y + radii[i] * Math.sin(angles[i])
  }));

  // Draw planets
  placedPlanets.forEach(planet => {
    const symbol = PLANET_SYMBOLS[planet.name];
    
    // Draw background circle
    ctx.fillStyle = 'rgba(255, 249, 237, 0.7)';
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, PLANET_CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw planet symbol
    ctx.fillStyle = COLORS.SYMBOL;
    ctx.font = `bold ${PLANET_SYMBOL_SIZE}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, planet.x, planet.y);
  });

  // ==================================================================
  // ASPECT LINES
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
        const x1 = CENTER_X + ASPECTS_LINE_MAX_RADIUS * Math.cos(p1.angleRad);
        const y1 = CENTER_Y + ASPECTS_LINE_MAX_RADIUS * Math.sin(p1.angleRad);
        const x2 = CENTER_X + ASPECTS_LINE_MAX_RADIUS * Math.cos(p2.angleRad);
        const y2 = CENTER_Y + ASPECTS_LINE_MAX_RADIUS * Math.sin(p2.angleRad);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
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
