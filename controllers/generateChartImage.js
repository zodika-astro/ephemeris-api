'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Chart Configuration Constants
const CHART_WIDTH = 1536;
const CHART_HEIGHT = 1536;
const CENTER_X = CHART_WIDTH / 2;
const CENTER_Y = CHART_HEIGHT / 2;
const OUTER_RADIUS = 600;
const ZODIAC_RING_INNER_RADIUS = OUTER_RADIUS * 0.85;
const INNER_RADIUS = OUTER_RADIUS * 0.125;

const PLANET_SYMBOL_SIZE = 52;
const PLANET_CIRCLE_RADIUS = PLANET_SYMBOL_SIZE / 1.6;
const HOUSE_NUMBER_RADIUS = INNER_RADIUS + 35;
const HOUSE_NUMBER_FONT_SIZE = 28;
const DEGREE_TICK_RADIUS = ZODIAC_RING_INNER_RADIUS - 15;

// Calculate planet radius
const PLANET_RADIUS = (DEGREE_TICK_RADIUS + 5) * 0.9 + INNER_RADIUS * 0.125;

// Radius for aspect lines
const ASPECT_LINE_RADIUS = INNER_RADIUS + (PLANET_RADIUS - INNER_RADIUS) * 0.75;

// Constants for distributing close planets to avoid overlap
const PLANET_PROXIMITY_THRESHOLD = 5; // Degrees within which planets are considered "close"
const PLANET_ANGULAR_SPREAD_STEP = 6.5; // Angular offset in degrees for each planet in a cluster

// Line width for highlighted ruler ticks
const BOLD_TICK_LINE_WIDTH = 2.5;

// Line width for main house cusps (AC, IC, DC, MC)
const BOLD_CUSP_LINE_WIDTH = 4.5;

// Font size for planet degree labels
const PLANET_DEGREE_FONT_SIZE = 15;
// Radial offset for planet degree labels from the planet's center.
const PLANET_DEGREE_LABEL_INNER_PADDING = PLANET_CIRCLE_RADIUS + 6.5;

// Offsets for fine-tuning horizontal text placement relative to the planet's position
const PLANET_DEGREE_TEXT_PERPENDICULAR_OFFSET = 10;
const PLANET_DEGREE_VERTICAL_OFFSET_FROM_RADIAL = 10;


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
  CENTER_TEXT: '#807B74',
  DEGREE_TICK: 'rgba(89, 74, 66, 0.6)',
  ASPECT_CIRCLE: 'rgba(41, 40, 30, 0.2)'
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

// Aspect styles (only color and line width, orbs are calculated dynamically)
const ASPECT_STYLES = {
  conjunction: { color: null, lineWidth: 0 }, // Conjunction lines are typically not drawn
  opposition: { color: '#FF0000', lineWidth: 3.5 },
  square: { color: '#FF4500', lineWidth: 2 },
  sextile: { color: '#0000FF', lineWidth: 2 },
  trine: { color: '#008000', lineWidth: 2 }
};

// Aspect definitions with categories for orb lookup
const ASPECT_DEFINITIONS = [
  { name: "conjunction", degree: 0, category: 0 },
  { name: "sextile", degree: 60, category: 2 },
  { name: "square", degree: 90, category: 1 },
  { name: "trine", degree: 120, category: 1 },
  { name: "opposition", degree: 180, category: 0 }
];

// Define individual orb rules for each celestial body/point,
// mapped to aspect categories: [Conj/Opp, Sq/Tr, Sextile]
// This MUST match the ORB_RULES in controllers/ephemeris.js for consistency.
const ORB_RULES = {
  'sun': [10, 8, 6],
  'moon': [10, 8, 6],
  'mercury': [8, 8, 5],
  'venus': [8, 8, 5],
  'mars': [8, 8, 5],
  'jupiter': [7, 6, 4],
  'saturn': [7, 6, 4],
  'uranus': [6, 5, 4],
  'neptune': [6, 5, 4],
  'pluto': [6, 5, 4],
  'chiron': [6, 5, 3],
  'ascendant': [10, 10, 6],
  'mc': [10, 10, 6],
  'trueNode': [5, 4, 2],
  'lilith': [3, 3, 1.5]
};

// Define all astrological points considered for aspect calculations (needed for orb determination)
const ALL_POINTS_FOR_ASPECTS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "trueNode", "lilith", "chiron",
  "ascendant", "mc"
];

// List of points for which aspect lines should NOT be drawn
const POINTS_TO_EXCLUDE_ASPECT_LINES = [
  "trueNode", "lilith", "chiron", "ascendant", "mc"
];


// Zodiac signs and symbols
const ZODIAC_SIGNS = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão",
  "Virgem", "Libra", "Escorpião", "Sagitário",
  "Capricórnio", "Aquário", "Peixes"
];
const SIGN_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// Utility functions
const degToRad = (degrees) => degrees * Math.PI / 180;

/**
 * Converts an astrological degree to chart coordinates (radians) with a specific rotation.
 * This function maps astrological degrees to canvas coordinates.
 *
 * @param {number} degree - The astrological degree (0-360).
 * @param {number} rotationOffset - The additional rotation in degrees to apply to the chart.
 * @returns {number} The angle in radians for drawing on the canvas.
 */
function toChartCoords(degree, rotationOffset = 0) {
  // Step 1: Map astrological degree to standard canvas coordinates (clockwise from right, 0=right).
  let canvasDegree = (180 - degree + 360) % 360;

  // Step 2: Apply the calculated rotation offset.
  const finalCanvasDegree = (canvasDegree + rotationOffset + 360) % 360;

  return degToRad(finalCanvasDegree);
}

/**
 * Draws an arrow on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {number} x - The x-coordinate of the arrow's base.
 * @param {number} y - The y-coordinate of the arrow's base.
 * @param {number} angle - The rotation angle of the arrow in radians.
 * @param {number} size - The size of the arrow.
 */
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

/**
 * Distributes planets within a close angular cluster to prevent symbol overlap.
 * @param {Array<Object>} cluster - An array of planet objects ({ name, deg }).
 * @param {Array<Object>} targetArray - The array where adjusted planets will be added.
 */
function distributeCluster(cluster, targetArray) {
  const numPlanets = cluster.length;
  if (numPlanets <= 1) {
    targetArray.push({ ...cluster[0], adjustedDeg: cluster[0].deg });
    return;
  }

  // Sort planets by original degree for consistent distribution
  cluster.sort((a, b) => a.deg - b.deg);

  // Calculate a central point for the cluster, adjusting for 0/360 degree wrap-around
  let tempDegrees = cluster.map(p => p.deg);
  // If the cluster crosses the 0/360 line (e.g., 350, 5, 10), adjust smaller degrees to be > 360
  if (tempDegrees[0] > 180 && tempDegrees[tempDegrees.length - 1] < 180) {
      for (let i = 0; i < tempDegrees.length; i++) {
          if (tempDegrees[i] < 180) {
              tempDegrees[i] += 360;
          }
      }
  }
  const clusterCenterDegree = (tempDegrees.reduce((sum, deg) => sum + deg, 0) / numPlanets + 360) % 360;

  // Calculate the starting offset to center the spread
  const totalAngularSpread = (numPlanets - 1) * PLANET_ANGULAR_SPREAD_STEP;
  const startOffset = -totalAngularSpread / 2;

  cluster.forEach((planet, index) => {
    const individualOffset = startOffset + index * PLANET_ANGULAR_SPREAD_STEP;
    const adjustedDeg = (clusterCenterDegree + individualOffset + 360) % 360;
    targetArray.push({
      ...planet,
      adjustedDeg: adjustedDeg
    });
  });
}

/**
 * Helper to get specific orb rules based on point category
 * (Copied from ephemeris.js for consistency)
 */
const getOrbRulesForPoint = (pointName) => {
  if (ORB_RULES[pointName]) {
    // Return direct lookup from ORB_RULES (ensures consistency)
    return {
      conjOpp: ORB_RULES[pointName][0],
      triSqr: ORB_RULES[pointName][1],
      sextile: ORB_RULES[pointName][2]
    };
  }
  return null; // Should not happen if ALL_POINTS_FOR_ASPECTS and ORB_RULES are consistent
};

/**
 * Determines the actual orb for an aspect based on the categories of the two points involved
 * (Copied from ephemeris.js for consistency)
 */
const determineActualOrb = (p1Name, p2Name, aspectType) => {
  const rules1 = getOrbRulesForPoint(p1Name);
  const rules2 = getOrbRulesForPoint(p2Name);

  if (!rules1 || !rules2) return 0;

  let orb1, orb2;
  switch (aspectType) {
    case "conjunction":
    case "opposition":
      orb1 = rules1.conjOpp;
      orb2 = rules2.conjOpp;
      break;
    case "trine":
    case "square":
      orb1 = rules1.triSqr;
      orb2 = rules2.triSqr;
      break;
    case "sextile":
      orb1 = rules1.sextile;
      orb2 = rules2.sextile;
      break;
    default:
      return 0; // Unrecognized aspect type
  }
  // Apply the rule: use the AVERAGE orb when two categories conflict
  return (orb1 + orb2) / 2.0;
};


/**
 * Generates a natal chart image based on ephemeris data.
 * @param {Object} } ephemerisData - Data containing planet positions, house cusps, and aspects.
 * @returns {Buffer} A PNG image buffer of the natal chart.
 */
async function generateNatalChartImage(ephemerisData) {
  const canvas = createCanvas(CHART_WIDTH, CHART_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Extract chart data
  const planetPositions = ephemerisData?.geo || {};
  // Now correctly get cusps data from ephemerisData.analysis.cusps
  const analysisCusps = ephemerisData?.analysis?.cusps || []; 
  const aspectsData = ephemerisData?.aspects || {};

  // Prepare house cusps for drawing (using analysisCusps for degree info)
  const houseCusps = [];
  let mcDegree = 0;

  for (let i = 1; i <= 12; i++) {
    const cuspInfo = analysisCusps.find(c => c.house === i);
    if (cuspInfo) {
      houseCusps.push({
        house: i,
        degree: cuspInfo.degree, // Use degree from analysis.cusps
        sign: cuspInfo.sign
      });

      // Get MC degree (House 10)
      if (i === 10) mcDegree = cuspInfo.degree; // Use degree from analysis.cusps for MC
    }
  }

  // Calculate rotation to place MC at top (270° canvas angle)
  const mcCanvasAngleInitial = (180 - mcDegree + 360) % 360;
  const rotationOffset = (270 - mcCanvasAngleInitial + 360) % 360;

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

  // Draw the aspect circle
  ctx.strokeStyle = COLORS.ASPECT_CIRCLE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, ASPECT_LINE_RADIUS, 0, 2 * Math.PI);
  ctx.stroke();

  // Filter out AC and MC from the list of 'planets' to be drawn in the planet ring
  // as they are handled as cusps and should not have planet symbols/labels.
  const planetsToDraw = Object.entries(planetPositions)
    .filter(([name, deg]) => name !== 'ascendant' && name !== 'mc')
    .map(([name, deg]) => ({ name, deg }));

  const adjustedPlanets = [];
  let currentCluster = [];

  // Sort filtered planets by degree for consistent distribution
  planetsToDraw.sort((a, b) => a.deg - b.deg);

  for (let i = 0; i < planetsToDraw.length; i++) {
    const currentPlanet = planetsToDraw[i];
    const prevPlanet = planetsToDraw[i - 1];

    // Check if the current planet is close to the previous one, considering 0/360 wrap-around
    const degreeDifference = Math.abs(currentPlanet.deg - (prevPlanet ? prevPlanet.deg : currentPlanet.deg));
    const wrappedDifference = 360 - degreeDifference;

    if (prevPlanet && Math.min(degreeDifference, wrappedDifference) < PLANET_PROXIMITY_THRESHOLD) {
      currentCluster.push(currentPlanet);
    } else {
      if (currentCluster.length > 0) {
        distributeCluster(currentCluster, adjustedPlanets);
      }
      currentCluster = [currentPlanet]; // Start a new cluster
    }
  }
  // Process the last cluster after the loop
  if (currentCluster.length > 0) {
    distributeCluster(currentCluster, adjustedPlanets);
  }

  // Optimize: Use a Map for faster planet lookup by name in aspect drawing
  const placedPlanetsMap = new Map();
  adjustedPlanets.forEach(planet => {
    const angleRad = toChartCoords(planet.adjustedDeg, rotationOffset);
    const x = CENTER_X + PLANET_RADIUS * Math.cos(angleRad);
    const y = CENTER_Y + PLANET_RADIUS * Math.sin(angleRad);

    const placedPlanet = {
      ...planet,
      angleRad,
      x,
      y
    };
    placedPlanetsMap.set(planet.name, placedPlanet);
  });

  // Draw degree ticks in the zodiac ring
  ctx.strokeStyle = COLORS.DEGREE_TICK;
  ctx.lineWidth = 1;

  // Create a set of rounded adjusted planet degrees for efficient lookup
  const planetDegrees = new Set(Array.from(placedPlanetsMap.values()).map(p => Math.round(p.adjustedDeg)));

  for (let deg = 0; deg < 360; deg++) {
    const rad = toChartCoords(deg, rotationOffset);

    // Determine tick size based on degree
    const isMajorTick = deg % 10 === 0;
    const tickLength = isMajorTick ? 10 * 1.2 : 5 * 1.2;

    // Adjust line width if a planet is positioned at this degree
    const originalLineWidth = ctx.lineWidth;
    if (planetDegrees.has(deg)) {
        ctx.lineWidth = BOLD_TICK_LINE_WIDTH;
    }

    const tickStart = DEGREE_TICK_RADIUS;
    const tickEnd = tickStart + tickLength;

    const xStart = CENTER_X + tickStart * Math.cos(rad);
    const yStart = CENTER_Y + tickStart * Math.sin(rad);
    const xEnd = CENTER_X + tickEnd * Math.cos(rad);
    const yEnd = CENTER_Y + tickEnd * Math.cos(rad);

    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();

    ctx.lineWidth = originalLineWidth;
  }

  // Draw house cusps and numbers
  houseCusps.forEach((cusp, index) => {
    const angleRad = toChartCoords(cusp.degree, rotationOffset);

    // Set line width for main cusps (AC, IC, DC, MC)
    const originalCuspLineWidth = ctx.lineWidth;
    if ([1, 4, 7, 10].includes(cusp.house)) { // Check if it's AC, IC, DC, or MC
        ctx.lineWidth = BOLD_CUSP_LINE_WIDTH;
    } else {
        ctx.lineWidth = 2; // Default width for other cusps
    }

    // Draw cusp line
    const xInner = CENTER_X + INNER_RADIUS * Math.cos(angleRad);
    const yInner = CENTER_Y + INNER_RADIUS * Math.sin(angleRad);
    const xZodiacInner = CENTER_X + ZODIAC_RING_INNER_RADIUS * Math.cos(angleRad);
    const yZodiacInner = CENTER_Y + ZODIAC_RING_INNER_RADIUS * Math.sin(angleRad);

    ctx.beginPath();
    ctx.moveTo(xInner, yInner);
    ctx.lineTo(xZodiacInner, yZodiacInner);
    ctx.stroke();

    // Restore line width after drawing the cusp
    ctx.lineWidth = originalCuspLineWidth;

    // Draw arrow
    drawArrow(ctx, xZodiacInner, yZodiacInner, angleRad, 12);

    // Calculate the center point of the house to position the number
    let nextCuspDegree;
    if (index < houseCusps.length - 1) {
      nextCuspDegree = houseCusps[index + 1].degree;
    } else {
      // For the last house (12), its end is the beginning of house 1
      nextCuspDegree = houseCusps[0].degree;
    }

    let startDeg = cusp.degree;
    let endDeg = nextCuspDegree;

    // Handle 0/360 degree wrap-around
    if (endDeg < startDeg) {
        endDeg += 360;
    }

    const midHouseDegree = (startDeg + endDeg) / 2;
    const midHouseAngleRad = toChartCoords(midHouseDegree, rotationOffset);

    // Draw house number in the center of the house
    const r = HOUSE_NUMBER_RADIUS;
    const x = CENTER_X + r * Math.cos(midHouseAngleRad);
    const y = CENTER_Y + r * Math.sin(midHouseAngleRad);

    ctx.fillStyle = COLORS.CUSP_NUMBER;
    ctx.font = `bold ${HOUSE_NUMBER_FONT_SIZE}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cusp.house.toString(), x, y);
  });

  // Draw sign and degree labels on house cusps
  ctx.font = 'bold 16px Inter';
  ctx.fillStyle = '#5A2A00';
  houseCusps.forEach((cusp) => {
    const angleRad = toChartCoords(cusp.degree, rotationOffset);
    const r = ZODIAC_RING_INNER_RADIUS - 20;
    const x = CENTER_X + r * Math.cos(angleRad);
    const y = CENTER_Y + r * Math.sin(angleRad);
    const signIndex = Math.floor(cusp.degree / 30);
    const degreeInSign = (cusp.degree % 30).toFixed(1);
    const label = `${degreeInSign}° ${SIGN_SYMBOLS[signIndex]}`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad + Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.fillText(label, 5, 0);
    ctx.restore();
  });

  // Draw sign divisions
  ctx.strokeStyle = COLORS.SIGN_DIVISION;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 6]);

  for (let deg = 0; deg < 360; deg += 30) {
    const rad = toChartCoords(deg, rotationOffset);
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
    const angleDeg = i * 30;
    // Position sign symbols in the middle of each 30-degree segment
    const angleRad = toChartCoords(angleDeg + 15, rotationOffset);
    const r = (OUTER_RADIUS + ZODIAC_RING_INNER_RADIUS) / 2;
    const x = CENTER_X + r * Math.cos(angleRad);
    const y = CENTER_Y + r * Math.sin(angleRad);

    ctx.save();
    ctx.translate(x, y);
    // Rotate the text so it's upright relative to the chart's center
    ctx.rotate(angleRad + Math.PI / 2);

    // Draw sign symbol
    ctx.fillStyle = '#8B4513';
    ctx.font = useSymbolaFont ?
      `38px Symbola` :
      `bold 24px Inter`;
    ctx.fillText(SIGN_SYMBOLS[i], 0, -15);
    ctx.fillStyle = COLORS.SIGN;
    ctx.font = 'bold 18px Inter';
    ctx.fillText(sign.toUpperCase(), 0, 20);

    ctx.restore();
  });

  // Draw planets and their degree labels
  placedPlanetsMap.forEach(planet => {
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

    // Draw planet degree label
    const degreeInSign = Math.floor(planet.deg % 30);
    const signIndex = Math.floor(planet.deg / 30);
    const signSymbol = SIGN_SYMBOLS[signIndex];
    const degreeText = `${degreeInSign}° ${signSymbol}`; // Format: "Degree° SignSymbol"

    const labelAngleRad = toChartCoords(planet.adjustedDeg, rotationOffset);

    // Calculate the radial position for the text.
    const textDisplayRadius = PLANET_RADIUS - PLANET_DEGREE_LABEL_INNER_PADDING;

    // Calculate initial x, y based on the radial position and adjusted angle
    let labelX = CENTER_X + textDisplayRadius * Math.cos(labelAngleRad);
    let labelY = CENTER_Y + textDisplayRadius * Math.sin(labelAngleRad);

    let textAlignForLabel = 'center';
    let offsetX = 0;
    let offsetY = 0;

    // Determine quadrant based on canvas angle (0=top, clockwise)
    // This logic adjusts the text position to be perpendicular to the radial line
    // and ensures it's "inside" the planet symbol's orbit.
    if (labelAngleRad >= -Math.PI / 4 && labelAngleRad < Math.PI / 4) { // Right side (approx 315 to 45 deg canvas)
        offsetX = -PLANET_DEGREE_TEXT_PERPENDICULAR_OFFSET; // Shift left
        textAlignForLabel = 'right';
    } else if (labelAngleRad >= Math.PI / 4 && labelAngleRad < 3 * Math.PI / 4) { // Bottom side (approx 45 to 135 deg canvas)
        offsetY = -PLANET_DEGREE_VERTICAL_OFFSET_FROM_RADIAL; // Shift up
        textAlignForLabel = 'center';
    } else if (labelAngleRad >= 3 * Math.PI / 4 && labelAngleRad < 5 * Math.PI / 4) { // Left side (approx 135 to 225 deg canvas)
        offsetX = PLANET_DEGREE_TEXT_PERPENDICULAR_OFFSET; // Shift right
        textAlignForLabel = 'left';
    } else { // Top side (approx 225 to 315 deg canvas)
        offsetY = PLANET_DEGREE_VERTICAL_OFFSET_FROM_RADIAL; // Shift down
        textAlignForLabel = 'center';
    }

    // Apply the offsets to the label's position
    labelX += offsetX;
    labelY += offsetY;

    ctx.save();
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = `bold ${PLANET_DEGREE_FONT_SIZE}px Inter`;
    ctx.textAlign = textAlignForLabel;
    ctx.textBaseline = 'middle'; // Keep middle for vertical centering

    ctx.fillText(degreeText, labelX, labelY);
    ctx.restore();
  });

  // Draw aspect lines
  for (const aspectType in aspectsData) {
    const style = ASPECT_STYLES[aspectType];
    // Conjunction lines are typically not drawn, so skip if color is null
    if (!style || !style.color) continue; 

    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;

    aspectsData[aspectType].forEach(aspect => {
      // Filter: Do NOT draw aspect lines if either planet is in the exclusion list
      if (POINTS_TO_EXCLUDE_ASPECT_LINES.includes(aspect.planet1.name) || 
          POINTS_TO_EXCLUDE_ASPECT_LINES.includes(aspect.planet2.name)) {
        return; // Skip drawing this aspect line
      }

      const p1 = placedPlanetsMap.get(aspect.planet1.name);
      const p2 = placedPlanetsMap.get(aspect.planet2.name);

      if (p1 && p2) {
        // Calculate difference using full decimal precision
        let diff = Math.abs(p1.deg - p2.deg);
        if (diff > 180) diff = 360 - diff;

        // Determine aspect degree from ASPECT_DEFINITIONS
        const aspectDef = ASPECT_DEFINITIONS.find(def => def.name === aspectType);
        if (!aspectDef) return; // Should not happen if aspectsData is valid

        // Determine the applicable orb using the same logic as ephemeris.js
        const p1Orb = ORB_RULES[p1.name]?.[aspectDef.category];
        const p2Orb = ORB_RULES[p2.name]?.[aspectDef.category];

        if (p1Orb === undefined || p2Orb === undefined) {
            // Log a warning if orb rule is missing, but don't stop drawing other aspects
            console.warn(`Orb rule not found for ${p1.name} or ${p2.name} for aspect ${aspectDef.name}. Skipping drawing this aspect line.`);
            return; 
        }

        const orb = (p1Orb + p2Orb) / 2.0;

        // Draw the line only if the aspect is within the calculated orb
        if (orb > 0 && diff >= (aspectDef.degree - orb) && diff <= (aspectDef.degree + orb)) {
          const aspectX1 = CENTER_X + ASPECT_LINE_RADIUS * Math.cos(p1.angleRad);
          const aspectY1 = CENTER_Y + ASPECT_LINE_RADIUS * Math.sin(p1.angleRad);
          const aspectX2 = CENTER_X + ASPECT_LINE_RADIUS * Math.cos(p2.angleRad);
          const aspectY2 = CENTER_Y + ASPECT_LINE_RADIUS * Math.sin(p2.angleRad);

          ctx.beginPath();
          ctx.moveTo(aspectX1, aspectY1);
          ctx.lineTo(aspectX2, aspectY2);
          ctx.stroke();
        }
      }
    });
  }

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
