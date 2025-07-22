'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const logger = console; // Assuming console is used for logging, replace with a proper logger if available

// Font paths - ensure these paths are correct in your environment
const INTER_BOLD_FONT_PATH = path.join(__dirname, '../fonts/Inter-Bold.ttf');
const INTER_REGULAR_FONT_PATH = path.join(__dirname, '../fonts/Inter-Regular.ttf'); // Assuming a regular font exists
const SYMBOLA_FONT_PATH = path.join(__dirname, '../fonts/symbola.ttf');

let useSymbolaFont = false;

// Register fonts
try {
    if (fs.existsSync(INTER_BOLD_FONT_PATH)) {
        registerFont(INTER_BOLD_FONT_PATH, { family: 'Inter', weight: 'bold' });
        if (fs.existsSync(INTER_REGULAR_FONT_PATH)) {
            registerFont(INTER_REGULAR_FONT_PATH, { family: 'Inter', weight: 'normal' });
        } else {
            logger.warn(`Inter-Regular font not found: ${INTER_REGULAR_FONT_PATH}. Using Inter-Bold as fallback.`);
            registerFont(INTER_BOLD_FONT_PATH, { family: 'Inter', weight: 'normal' }); // Fallback
        }
    } else {
        logger.error(`Inter-Bold font not found: ${INTER_BOLD_FONT_PATH}. Chart text may not display correctly.`);
    }

    if (fs.existsSync(SYMBOLA_FONT_PATH)) {
        registerFont(SYMBOLA_FONT_PATH, { family: 'Symbola' });
        useSymbolaFont = true;
    } else {
        logger.warn(`Symbola font not found: ${SYMBOLA_FONT_PATH}. Planet symbols may not display correctly.`);
    }
} catch (e) {
    logger.error('Error registering fonts:', e.message);
}

// Chart Configuration and Dimensions
const chartConfig = {
    width: 1536,
    height: 1536,
    get centerX() { return this.width / 2; },
    get centerY() { return this.height / 2; },
    outerRadius: 600,
    get zodiacRingOuterRadius() { return this.outerRadius; },
    get zodiacRingInnerRadius() { return this.outerRadius * 0.85; }, // 510
    get innerRadius() { return this.outerRadius * 0.25; }, // 150

    // Max radius for aspect lines, positioned closer to the center
    get aspectsLineMaxRadius() { return this.innerRadius + 50; }, // 200

    // Radial zone for planet symbols
    get minPlanetRadius() { return this.aspectsLineMaxRadius + 60; }, // 260 (buffer from aspect lines)
    get maxPlanetRadius() { return this.zodiacRingInnerRadius - 5; }, // 505 (buffer from zodiac ring)

    // Planet symbol and text sizing
    get symbolBaseFontSize() { return useSymbolaFont ? 52 : 32; },
    get symbolCircleRadius() { return this.symbolBaseFontSize / 1.6; },
    textFontSize: 18, // Font size for 'R' and degree
    
    // Radial step for staggering planets to prevent overlap
    fixedRadialStep: 105, 

    // Colors
    backgroundColor: '#FFFBF4',
    lineColor: '#29281E',
    textColor: '#29281E',
    symbolColor: '#1A1E3B',
    cuspNumberColor: '#555555',
    signColor: '#5A4A42',
    signDivisionColor: 'rgba(89, 74, 66, 0.4)',
    arrowColor: '#5A2A00',
    centerTextColor: '#807B74',
};

// Astrological Symbols and Names
const planetSymbols = {
    sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
    mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
    neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7'
};

const planetNames = {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
    mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus',
    neptune: 'Neptune', pluto: 'Pluto', trueNode: 'North Node', lilith: 'Lilith', chiron: 'Chiron'
};

const aspectStyles = {
    conjunction: { color: null, lineWidth: 0 },
    opposition: { color: '#FF0000', lineWidth: 3 },
    square: { color: '#FF4500', lineWidth: 2.5 },
    sextile: { color: '#0000FF', lineWidth: 2 },
    trine: { color: '#008000', lineWidth: 2 }
};

const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const signSymbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// --- Utility Functions ---

/**
 * Converts degrees to radians.
 * @param {number} degrees - Angle in degrees.
 * @returns {number} Angle in radians.
 */
const degToRad = (degrees) => degrees * Math.PI / 180;

/**
 * Converts astrological degree (0-360, Aries at 0) to chart canvas radians (0-2PI, 0 degrees at right, increasing counter-clockwise).
 * @param {number} degree - Astrological degree.
 * @returns {number} Radians for canvas drawing.
 */
function toChartCoords(degree) {
    return degToRad(360 - degree);
}

/**
 * Draws an arrow on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {number} x - X coordinate of the arrow base.
 * @param {number} y - Y coordinate of the arrow base.
 * @param {number} angle - Rotation angle of the arrow in radians.
 * @param {number} size - Size of the arrow.
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
    ctx.fillStyle = chartConfig.arrowColor;
    ctx.fill();
    ctx.restore();
}

/**
 * Generates a natal chart image.
 * @param {Object} ephemerisData - Astrological data for the chart.
 * @returns {Buffer} PNG image buffer.
 */
async function generateNatalChartImage(ephemerisData) {
    const canvas = createCanvas(chartConfig.width, chartConfig.height);
    const ctx = canvas.getContext('2d');

    // Extract data from ephemerisData
    const planetPositions = ephemerisData?.geo || {};
    const planetSignData = ephemerisData?.planets || {};
    const aspectsData = ephemerisData?.aspects || {};

    // Reconstruct house cusps array from the new 'houses' structure
    const houseCusps = [];
    if (ephemerisData?.houses) {
        for (let i = 1; i <= 12; i++) {
            const houseKey = `house${i}`;
            if (ephemerisData.houses[houseKey]) {
                houseCusps.push({
                    house: i,
                    degree: ephemerisData.houses[houseKey].cuspDegree,
                    sign: ephemerisData.houses[houseKey].sign
                });
            }
        }
        // Sort cusps to ensure correct drawing order
        houseCusps.sort((a, b) => a.degree - b.degree);
    }
    
    // Draw chart background and main circles
    ctx.fillStyle = chartConfig.backgroundColor;
    ctx.fillRect(0, 0, chartConfig.width, chartConfig.height);
    ctx.beginPath();
    ctx.fillStyle = chartConfig.backgroundColor;
    ctx.arc(chartConfig.centerX, chartConfig.centerY, chartConfig.innerRadius - 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = chartConfig.lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(chartConfig.centerX, chartConfig.centerY, chartConfig.outerRadius, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(chartConfig.centerX, chartConfig.centerY, chartConfig.zodiacRingInnerRadius, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(chartConfig.centerX, chartConfig.centerY, chartConfig.innerRadius, 0, 2 * Math.PI); ctx.stroke();
    
    // Draw house cusps and numbers
    houseCusps.forEach((cusp, index) => {
        const angleRad = toChartCoords(cusp.degree);
        const xInner = chartConfig.centerX + chartConfig.innerRadius * Math.cos(angleRad);
        const yInner = chartConfig.centerY + chartConfig.innerRadius * Math.sin(angleRad);
        const xZodiacInner = chartConfig.centerX + chartConfig.zodiacRingInnerRadius * Math.cos(angleRad);
        const yZodiacInner = chartConfig.centerY + chartConfig.zodiacRingInnerRadius * Math.sin(angleRad);
        ctx.beginPath();
        ctx.moveTo(xInner, yInner);
        ctx.lineTo(xZodiacInner, yZodiacInner);
        ctx.stroke();
        drawArrow(ctx, xZodiacInner, yZodiacInner, angleRad, 12);
        
        const originalHouseNumber = cusp.house; 
        
        const nextIndex = (index + 1) % houseCusps.length;
        const nextCusp = houseCusps[nextIndex];
        
        let midDegree = (cusp.degree + nextCusp.degree) / 2;
        // Handle 0/360 degree wrap-around for mid-degree calculation
        if (nextCusp.degree < cusp.degree) {
            midDegree = (cusp.degree + nextCusp.degree + 360) / 2;
            if (midDegree >= 360) midDegree -= 360;
        }

        const r = chartConfig.zodiacRingInnerRadius - 40;
        const x = chartConfig.centerX + r * Math.cos(toChartCoords(midDegree));
        const y = chartConfig.centerY + r * Math.sin(toChartCoords(midDegree));
        ctx.fillStyle = chartConfig.cuspNumberColor;
        ctx.font = 'bold 28px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(originalHouseNumber.toString(), x, y);
    });

    // Draw cusp degrees and signs on the outer ring
    ctx.font = 'bold 16px Inter';
    ctx.fillStyle = chartConfig.arrowColor;
    houseCusps.forEach((cusp) => {
        const angleRad = toChartCoords(cusp.degree);
        const r = chartConfig.zodiacRingInnerRadius - 20;
        const x = chartConfig.centerX + r * Math.cos(angleRad);
        const y = chartConfig.centerY + r * Math.sin(angleRad);
        const signIndex = Math.floor(cusp.degree / 30);
        const degreeInSign = (cusp.degree % 30).toFixed(1);
        const label = `${degreeInSign}° ${signSymbols[signIndex]}`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleRad + Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillText(label, 5, 0);
        ctx.restore();
    });

    // Draw zodiac sign divisions
    ctx.strokeStyle = chartConfig.signDivisionColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 6]);
    for (let deg = 0; deg < 360; deg += 30) {
        const rad = toChartCoords(deg);
        const xStart = chartConfig.centerX + chartConfig.zodiacRingInnerRadius * Math.cos(rad);
        const yStart = chartConfig.centerY + chartConfig.zodiacRingInnerRadius * Math.sin(rad);
        const xEnd = chartConfig.centerX + chartConfig.zodiacRingOuterRadius * Math.cos(rad);
        const yEnd = chartConfig.centerY + chartConfig.zodiacRingOuterRadius * Math.sin(rad); 
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw zodiac sign symbols and names
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = chartConfig.signColor;
    signs.forEach((sign, i) => {
        const angleDeg = i * 30 + 15; // Center of the sign
        const angleRad = toChartCoords(angleDeg);
        const r = (chartConfig.zodiacRingOuterRadius + chartConfig.zodiacRingInnerRadius) / 2;
        const x = chartConfig.centerX + r * Math.cos(angleRad);
        const y = chartConfig.centerY + r * Math.sin(angleRad);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleRad + Math.PI / 2); // Rotate to align with the circle
        ctx.fillStyle = '#8B4513'; // Symbol color
        ctx.font = useSymbolaFont ? '38px Symbola' : 'bold 24px Inter';
        ctx.fillText(signSymbols[i], 0, -15);
        ctx.fillStyle = chartConfig.signColor; // Text color
        ctx.font = 'bold 18px Inter';
        ctx.fillText(sign.toUpperCase(), 0, 20);
        ctx.restore();
    });

    // --- Planet Positioning Logic ---
    // Sort planets by degree for consistent collision detection
    const planets = Object.entries(planetPositions).sort((a, b) => a[1] - b[1]);
    const placed = []; // Stores final positions of symbols for drawing aspects

    for (const [name, deg] of planets) {
        const angleRad = toChartCoords(deg);
        let currentSymbolRadius = chartConfig.minPlanetRadius;
        let foundPosition = false;

        // Attempt to find a non-overlapping position by moving radially outwards
        while (currentSymbolRadius <= chartConfig.maxPlanetRadius && !foundPosition) {
            const xSymbol = chartConfig.centerX + currentSymbolRadius * Math.cos(angleRad);
            const ySymbol = chartConfig.centerY + currentSymbolRadius * Math.sin(angleRad);

            let isOverlapping = false;
            // Check for overlap with already placed planets
            for (const p of placed) {
                const distBetweenCenters = Math.sqrt(
                    Math.pow(xSymbol - p.xSymbol, 2) + Math.pow(ySymbol - p.ySymbol, 2)
                );
                // Minimum required distance to prevent overlap, considering symbol size and text
                const minDistanceRequired = p.symbolCircleRadius + chartConfig.symbolCircleRadius + chartConfig.textFontSize * 2; 
                
                if (distBetweenCenters < minDistanceRequired) {
                    isOverlapping = true;
                    break;
                }
            }

            if (!isOverlapping) {
                // If no overlap, add the planet to the placed list
                placed.push({ 
                    name, 
                    deg, 
                    angleRad, 
                    xSymbol, 
                    ySymbol, 
                    symbolRadius: currentSymbolRadius, 
                    symbolFontSize: chartConfig.symbolBaseFontSize,
                    symbolCircleRadius: chartConfig.symbolCircleRadius 
                });
                foundPosition = true;
            } else {
                // If overlapping, move to the next radial layer
                currentSymbolRadius += chartConfig.fixedRadialStep; 
            }
        }

        // Fallback: If no non-overlapping position is found within the allowed zone,
        // position at the maximum radius. This might still cause overlap.
        if (!foundPosition) {
            logger.warn(`Could not find non-overlapping position for planet ${name}. Placing at max radius.`);
            const xSymbol = chartConfig.centerX + chartConfig.maxPlanetRadius * Math.cos(angleRad);
            const ySymbol = chartConfig.centerY + chartConfig.maxPlanetRadius * Math.sin(angleRad);
            placed.push({ 
                name, 
                deg, 
                angleRad, 
                xSymbol, 
                ySymbol, 
                symbolRadius: chartConfig.maxPlanetRadius, 
                symbolFontSize: chartConfig.symbolBaseFontSize,
                symbolCircleRadius: chartConfig.symbolCircleRadius
            });
        }
    }

    // Draw all positioned planets
    placed.forEach(p => {
        // Draw Planet Symbol
        const symbol = planetSymbols[p.name];
        ctx.font = useSymbolaFont ? `${p.symbolFontSize}px Symbola` : `bold ${p.symbolFontSize}px Inter`;
        ctx.fillStyle = 'rgba(255, 249, 237, 0.7)'; // Translucent background for the symbol
        ctx.beginPath();
        ctx.arc(p.xSymbol, p.ySymbol, p.symbolCircleRadius, 0, Math.PI * 2); 
        ctx.fill();
        ctx.fillStyle = chartConfig.symbolColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((symbol && useSymbolaFont) ? symbol : p.name.substring(0, 3).toUpperCase(), p.xSymbol, p.ySymbol);

        // Draw Retrograde 'R' Indicator and Planet Degree
        const planetInfo = planetSignData[p.name];
        ctx.font = `bold ${chartConfig.textFontSize}px Inter`;
        ctx.fillStyle = chartConfig.textColor;

        // Position for 'R' (if retrograde)
        if (planetInfo && planetInfo.retrograde === "yes") {
            const rOffsetAngle = p.angleRad + degToRad(45); // Angle for 'R'
            const rRadiusOffset = p.symbolCircleRadius + 10; // Radial distance from symbol center
            const rX = p.xSymbol + rRadiusOffset * Math.cos(rOffsetAngle);
            const rY = p.ySymbol + rRadiusOffset * Math.sin(rOffsetAngle);
            ctx.fillText('R', rX, rY);
        }

        // Position for Planet Degree
        const degreeInSign = (p.deg % 30).toFixed(1);
        const degOffsetAngle = p.angleRad - degToRad(45); // Angle for degree (opposite to 'R')
        const degRadiusOffset = p.symbolCircleRadius + 10; // Radial distance from symbol center
        const degX = p.xSymbol + degRadiusOffset * Math.cos(degOffsetAngle);
        const degY = p.ySymbol + degRadiusOffset * Math.sin(degOffsetAngle);
        ctx.fillText(`${degreeInSign}°`, degX, degY);
    });

    // --- Aspect Lines Drawing ---
    // Drawn in the new, more internal zone
    for (const aspectType in aspectsData) {
        const style = aspectStyles[aspectType];
        if (!style || style.color === null) continue;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.lineWidth;
        aspectsData[aspectType].forEach(a => {
            const p1 = placed.find(p => p.name === a.planet1.name);
            const p2 = placed.find(p => p.name === a.planet2.name);
            if (p1 && p2) {
                // Use aspectsLineMaxRadius for aspect lines
                const x1 = chartConfig.centerX + chartConfig.aspectsLineMaxRadius * Math.cos(p1.angleRad);
                const y1 = chartConfig.centerY + chartConfig.aspectsLineMaxRadius * Math.sin(p1.angleRad);
                const x2 = chartConfig.centerX + chartConfig.aspectsLineMaxRadius * Math.cos(p2.angleRad);
                const y2 = chartConfig.centerY + chartConfig.aspectsLineMaxRadius * Math.sin(p2.angleRad);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        });
    }

    // Draw central text last to ensure it's on top
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = chartConfig.centerTextColor;
    ctx.font = 'bold 32px Inter';
    ctx.fillText('NATAL CHART', chartConfig.centerX, chartConfig.centerY - 25);
    ctx.font = 'italic 26px Inter';
    ctx.fillText('ZODIKA', chartConfig.centerX, chartConfig.centerY + 15);
    ctx.font = '18px Inter';
    ctx.fillText('www.zodika.com.br', chartConfig.centerX, chartConfig.centerY + 55);

    return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
