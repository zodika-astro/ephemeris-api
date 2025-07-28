'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Chart Configuration Constants
const PADDING = 10; // Padding in pixels around the zodiac wheel
let DYNAMIC_CHART_WIDTH;
let DYNAMIC_CHART_HEIGHT;
let DYNAMIC_CENTER_X;
let DYNAMIC_CENTER_Y;
let DYNAMIC_OUTER_RADIUS; // This will be the radius of the zodiac wheel

// Proportional constants based on DYNAMIC_OUTER_RADIUS
const ZODIAC_RING_INNER_RADIUS_RATIO = 0.85;
const INNER_RADIUS_RATIO = 0.125;
const PLANET_SYMBOL_SIZE_RATIO = 0.086; // approx 52/600
const PLANET_CIRCLE_RADIUS_RATIO = PLANET_SYMBOL_SIZE_RATIO / 1.6;
const HOUSE_NUMBER_RADIUS_OFFSET_RATIO = 0.058; // approx 35/600
const HOUSE_NUMBER_FONT_SIZE_RATIO = 0.046; // approx 28/600
const DEGREE_TICK_RADIUS_OFFSET_RATIO = 0.025; // approx 15/600
const PLANET_DEGREE_FONT_SIZE_RATIO = 0.025; // approx 15/600
const PLANET_DEGREE_LABEL_INNER_PADDING_RATIO = PLANET_CIRCLE_RADIUS_RATIO + (6.5 / 600);
const ARROW_SIZE_RATIO = 0.02; // approx 12/600
const SIGN_SYMBOL_FONT_SIZE_RATIO = 0.063; // approx 38/600 (Symbola)
const SIGN_NAME_FONT_SIZE_RATIO = 0.03; // approx 18/600
const CUSP_LABEL_FONT_SIZE_RATIO = 0.026; // approx 16/600

// Fixed constants (not dependent on radius)
const PLANET_PROXIMITY_THRESHOLD = 5; // Degrees within which planets are considered "close"
const PLANET_ANGULAR_SPREAD_STEP = 6.5; // Angular offset in degrees for each planet in a cluster
const BOLD_TICK_LINE_WIDTH = 2.5;
const BOLD_CUSP_LINE_WIDTH = 4.5;
const PLANET_DEGREE_TEXT_PERPENDICULAR_OFFSET = 10;
const PLANET_DEGREE_VERTICAL_OFFSET_FROM_RADIAL = 10;

// Astrological points whose aspects should not be drawn
const EXCLUDED_ASPECT_POINTS = ["ascendant", "mc", "chiron", "trueNode", "lilith"];

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
        // Suppress warning as per request, to keep code clean and professional for deployment.
        // console.warn('Error registering Symbola font:', e.message);
    }
}

// Planet symbols
const PLANET_SYMBOLS = {
    sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
    mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
    neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7',
    ascendant: 'Ac', mc: 'Mc'
};

// Aspect styles (orb properties removed as ephemeris.js handles calculation)
const ASPECT_STYLES = {
    conjunction: { color: null, lineWidth: 0 }, // Conjunction typically has no visible line or a neutral color
    opposition: { color: '#FF0000', lineWidth: 3.5 },
    square: { color: '#FF4500', lineWidth: 2 },
    sextile: { color: '#0000FF', lineWidth: 2 },
    trine: { color: '#008000', lineWidth: 2 }
};

// Zodiac signs and symbols (in Portuguese, as requested for image output)
const ZODIAC_SIGNS = [
    "Áries", "Touro", "Gêmeos", "Câncer", "Leão",
    "Virgem", "Libra", "Escorpião", "Sagitário",
    "Capricórnio", "Aquário", "Peixes"
];
const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

// Utility functions
const degToRad = (degrees) => degrees * Math.PI / 180;

/**
 * Converts an astrological degree to chart coordinates (radians) with a specific rotation.
 * This function maps astrological degrees to canvas coordinates.
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
 * Generates a natal chart image based on ephemeris data.
 * @param {Object} ephemerisData - Data containing planet positions, house cusps, and aspects.
 * @returns {Buffer} A PNG image buffer of the natal chart.
 */
async function generateNatalChartImage(ephemerisData) {
    // Set a base outer radius for proportional calculations.
    DYNAMIC_OUTER_RADIUS = 600;

    // Calculate dynamic canvas dimensions and center based on outer radius and padding.
    DYNAMIC_CHART_WIDTH = (DYNAMIC_OUTER_RADIUS * 2) + (2 * PADDING);
    DYNAMIC_CHART_HEIGHT = (DYNAMIC_OUTER_RADIUS * 2) + (2 * PADDING);
    DYNAMIC_CENTER_X = DYNAMIC_CHART_WIDTH / 2;
    DYNAMIC_CENTER_Y = DYNAMIC_CHART_HEIGHT / 2;

    const canvas = createCanvas(DYNAMIC_CHART_WIDTH, DYNAMIC_CHART_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Extract chart data from ephemerisData
    const planetPositions = ephemerisData?.geo || {};
    const rawCusps = ephemerisData?.analysis?.cusps || []; // Accessing raw cusp data
    const aspectsData = ephemerisData?.aspects || {};

    // Prepare house cusps from rawCusps for drawing
    const houseCusps = rawCusps.map(cusp => ({
        house: cusp.house,
        degree: cusp.degree,
        sign: cusp.sign
    }));

    // Get MC degree (House 10) from rawCusps for chart rotation
    const mcDegree = houseCusps.find(c => c.house === 10)?.degree || 0;

    // Calculate rotation to place MC at top (270° canvas angle)
    const mcCanvasAngleInitial = (180 - mcDegree + 360) % 360;
    const rotationOffset = (270 - mcCanvasAngleInitial + 360) % 360;

    // Draw chart background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, DYNAMIC_CHART_WIDTH, DYNAMIC_CHART_HEIGHT);

    // Calculate proportional radii and sizes for drawing elements
    const ZODIAC_RING_INNER_RADIUS = DYNAMIC_OUTER_RADIUS * ZODIAC_RING_INNER_RADIUS_RATIO;
    const INNER_RADIUS = DYNAMIC_OUTER_RADIUS * INNER_RADIUS_RATIO;
    const PLANET_SYMBOL_SIZE = DYNAMIC_OUTER_RADIUS * PLANET_SYMBOL_SIZE_RATIO;
    const PLANET_CIRCLE_RADIUS = PLANET_SYMBOL_SIZE / 1.6;
    const HOUSE_NUMBER_RADIUS = INNER_RADIUS + (DYNAMIC_OUTER_RADIUS * HOUSE_NUMBER_RADIUS_OFFSET_RATIO);
    const HOUSE_NUMBER_FONT_SIZE = DYNAMIC_OUTER_RADIUS * HOUSE_NUMBER_FONT_SIZE_RATIO;
    const DEGREE_TICK_RADIUS = ZODIAC_RING_INNER_RADIUS - (DYNAMIC_OUTER_RADIUS * DEGREE_TICK_RADIUS_OFFSET_RATIO);
    const PLANET_DEGREE_FONT_SIZE = DYNAMIC_OUTER_RADIUS * PLANET_DEGREE_FONT_SIZE_RATIO;
    const PLANET_DEGREE_LABEL_INNER_PADDING = DYNAMIC_OUTER_RADIUS * PLANET_DEGREE_LABEL_INNER_PADDING_RATIO;
    const ARROW_SIZE = DYNAMIC_OUTER_RADIUS * ARROW_SIZE_RATIO;
    const SIGN_SYMBOL_FONT_SIZE = DYNAMIC_OUTER_RADIUS * SIGN_SYMBOL_FONT_SIZE_RATIO;
    const SIGN_NAME_FONT_SIZE = DYNAMIC_OUTER_RADIUS * SIGN_NAME_FONT_SIZE_RATIO;
    const CUSP_LABEL_FONT_SIZE = DYNAMIC_OUTER_RADIUS * CUSP_LABEL_FONT_SIZE_RATIO;

    // Calculate planet orbit radius
    const PLANET_RADIUS = (DEGREE_TICK_RADIUS + (DYNAMIC_OUTER_RADIUS * (5 / 600))) * 0.9 + INNER_RADIUS * 0.125;

    // Calculate aspect line radius
    const ASPECT_LINE_RADIUS = INNER_RADIUS + (PLANET_RADIUS - INNER_RADIUS) * 0.75;

    // Draw concentric circles for chart structure
    ctx.strokeStyle = COLORS.LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(DYNAMIC_CENTER_X, DYNAMIC_CENTER_Y, DYNAMIC_OUTER_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(DYNAMIC_CENTER_X, DYNAMIC_CENTER_Y, ZODIAC_RING_INNER_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(DYNAMIC_CENTER_X, DYNAMIC_CENTER_Y, INNER_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw the aspect circle
    ctx.strokeStyle = COLORS.ASPECT_CIRCLE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(DYNAMIC_CENTER_X, DYNAMIC_CENTER_Y, ASPECT_LINE_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();

    // Prepare planets for positioning and overlap distribution
    const planets = Object.entries(planetPositions)
        .map(([name, deg]) => ({ name, deg }));

    const adjustedPlanets = [];
    let currentCluster = [];

    // Sort planets by degree to facilitate cluster identification
    planets.sort((a, b) => a.deg - b.deg);

    for (let i = 0; i < planets.length; i++) {
        const currentPlanet = planets[i];
        const prevPlanet = planets[i - 1];

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

    // Use a Map for faster planet lookup by name during drawing
    const placedPlanetsMap = new Map();
    adjustedPlanets.forEach(planet => {
        const angleRad = toChartCoords(planet.adjustedDeg, rotationOffset);
        const x = DYNAMIC_CENTER_X + PLANET_RADIUS * Math.cos(angleRad);
        const y = DYNAMIC_CENTER_Y + PLANET_RADIUS * Math.sin(angleRad);

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
        const tickLength = isMajorTick ? 10 * (DYNAMIC_OUTER_RADIUS / 600) : 5 * (DYNAMIC_OUTER_RADIUS / 600);

        // Adjust line width if a planet is positioned at this degree
        const originalLineWidth = ctx.lineWidth;
        if (planetDegrees.has(deg)) {
            ctx.lineWidth = BOLD_TICK_LINE_WIDTH;
        }

        const tickStart = DEGREE_TICK_RADIUS;
        const tickEnd = tickStart + tickLength;

        const xStart = DYNAMIC_CENTER_X + tickStart * Math.cos(rad);
        const yStart = DYNAMIC_CENTER_Y + tickStart * Math.sin(rad);
        const xEnd = DYNAMIC_CENTER_X + tickEnd * Math.cos(rad);
        const yEnd = DYNAMIC_CENTER_Y + tickEnd * Math.sin(rad);

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
        if ([1, 4, 7, 10].includes(cusp.house)) {
            ctx.lineWidth = BOLD_CUSP_LINE_WIDTH;
        } else {
            ctx.lineWidth = 2; // Default width for other cusps
        }

        // Draw cusp line
        const xInner = DYNAMIC_CENTER_X + INNER_RADIUS * Math.cos(angleRad);
        const yInner = DYNAMIC_CENTER_Y + INNER_RADIUS * Math.sin(angleRad);
        const xZodiacInner = DYNAMIC_CENTER_X + ZODIAC_RING_INNER_RADIUS * Math.cos(angleRad);
        const yZodiacInner = DYNAMIC_CENTER_Y + ZODIAC_RING_INNER_RADIUS * Math.sin(angleRad);

        ctx.beginPath();
        ctx.moveTo(xInner, yInner);
        ctx.lineTo(xZodiacInner, yZodiacInner);
        ctx.stroke();

        ctx.lineWidth = originalCuspLineWidth; // Restore line width

        // Draw arrow
        drawArrow(ctx, xZodiacInner, yZodiacInner, angleRad, ARROW_SIZE);

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
        const x = DYNAMIC_CENTER_X + r * Math.cos(midHouseAngleRad);
        const y = DYNAMIC_CENTER_Y + r * Math.sin(midHouseAngleRad);

        ctx.fillStyle = COLORS.CUSP_NUMBER;
        ctx.font = `bold ${HOUSE_NUMBER_FONT_SIZE}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cusp.house.toString(), x, y);
    });

    // Draw sign and degree labels on house cusps
    ctx.font = `bold ${CUSP_LABEL_FONT_SIZE}px Inter`;
    ctx.fillStyle = '#5A2A00';
    houseCusps.forEach((cusp) => {
        const angleRad = toChartCoords(cusp.degree, rotationOffset);
        const r = ZODIAC_RING_INNER_RADIUS - (DYNAMIC_OUTER_RADIUS * (20 / 600));
        const x = DYNAMIC_CENTER_X + r * Math.cos(angleRad);
        const y = DYNAMIC_CENTER_Y + r * Math.sin(angleRad);
        const signIndex = Math.floor(cusp.degree / 30);
        const degreeInSign = (cusp.degree % 30).toFixed(1);
        const label = `${degreeInSign}° ${SIGN_SYMBOLS[signIndex]}`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleRad + Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillText(label, 5 * (DYNAMIC_OUTER_RADIUS / 600), 0);
        ctx.restore();
    });

    // Draw zodiac sign divisions
    ctx.strokeStyle = COLORS.SIGN_DIVISION;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 6]);

    for (let deg = 0; deg < 360; deg += 30) {
        const rad = toChartCoords(deg, rotationOffset);
        const xStart = DYNAMIC_CENTER_X + ZODIAC_RING_INNER_RADIUS * Math.cos(rad);
        const yStart = DYNAMIC_CENTER_Y + ZODIAC_RING_INNER_RADIUS * Math.sin(rad);
        const xEnd = DYNAMIC_CENTER_X + DYNAMIC_OUTER_RADIUS * Math.cos(rad);
        const yEnd = DYNAMIC_CENTER_Y + DYNAMIC_OUTER_RADIUS * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line dash

    // Draw zodiac signs and symbols
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.SIGN;

    ZODIAC_SIGNS.forEach((sign, i) => {
        const angleDeg = i * 30;
        // Position sign symbols in the middle of each 30-degree segment
        const angleRad = toChartCoords(angleDeg + 15, rotationOffset);
        const r = (DYNAMIC_OUTER_RADIUS + ZODIAC_RING_INNER_RADIUS) / 2;
        const x = DYNAMIC_CENTER_X + r * Math.cos(angleRad);
        const y = DYNAMIC_CENTER_Y + r * Math.sin(angleRad);

        ctx.save();
        ctx.translate(x, y);
        // Rotate the text to be upright relative to the chart's center
        ctx.rotate(angleRad + Math.PI / 2);

        // Draw sign symbol
        ctx.fillStyle = '#8B4513';
        ctx.font = useSymbolaFont ?
            `${SIGN_SYMBOL_FONT_SIZE}px Symbola` :
            `bold ${SIGN_SYMBOL_FONT_SIZE * (24 / 38)}px Inter`; // Adjust for Inter to appear similar to Symbola
        ctx.fillText(SIGN_SYMBOLS[i], 0, -15 * (DYNAMIC_OUTER_RADIUS / 600));
        ctx.fillStyle = COLORS.SIGN;
        ctx.font = `bold ${SIGN_NAME_FONT_SIZE}px Inter`;
        ctx.fillText(sign.toUpperCase(), 0, 20 * (DYNAMIC_OUTER_RADIUS / 600));

        ctx.restore();
    });

    // Draw planets and their degree labels
    placedPlanetsMap.forEach(planet => {
        const symbol = PLANET_SYMBOLS[planet.name];

        // Draw background circle for planet symbol
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
        let labelX = DYNAMIC_CENTER_X + textDisplayRadius * Math.cos(labelAngleRad);
        let labelY = DYNAMIC_CENTER_Y + textDisplayRadius * Math.sin(labelAngleRad);

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
        ctx.textBaseline = 'middle';
        ctx.fillText(degreeText, labelX, labelY);
        ctx.restore();
    });

    // Draw aspect lines
    for (const aspectType in aspectsData) {
        const style = ASPECT_STYLES[aspectType];
        // Conjunction (lineWidth: 0) and aspects without a defined color are not drawn.
        if (!style || !style.color || style.lineWidth === 0) continue;

        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.lineWidth;

        aspectsData[aspectType].forEach(aspect => {
            const p1 = placedPlanetsMap.get(aspect.planet1.name);
            const p2 = placedPlanetsMap.get(aspect.planet2.name);

            // Do NOT draw aspects between excluded points
            if (EXCLUDED_ASPECT_POINTS.includes(aspect.planet1.name) || EXCLUDED_ASPECT_POINTS.includes(aspect.planet2.name)) {
                return; // Skip this aspect if either planet is in the exclusion list
            }

            if (p1 && p2) {
                // Aspect validation is handled by ephemeris.js, so we just draw the line.
                const aspectX1 = DYNAMIC_CENTER_X + ASPECT_LINE_RADIUS * Math.cos(p1.angleRad);
                const aspectY1 = DYNAMIC_CENTER_Y + ASPECT_LINE_RADIUS * Math.sin(p1.angleRad);
                const aspectX2 = DYNAMIC_CENTER_X + ASPECT_LINE_RADIUS * Math.cos(p2.angleRad);
                const aspectY2 = DYNAMIC_CENTER_Y + ASPECT_LINE_RADIUS * Math.sin(p2.angleRad);

                ctx.beginPath();
                ctx.moveTo(aspectX1, aspectY1);
                ctx.lineTo(aspectX2, aspectY2);
                ctx.stroke();
            }
        });
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
