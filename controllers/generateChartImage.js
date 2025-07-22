'use strict';

const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

const logger = console;

// --- Font Configuration ---
const interFontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
if (fs.existsSync(interFontPath)) {
  try {
    registerFont(interFontPath, { family: 'Inter', weight: 'bold' });
    registerFont(interFontPath.replace('-Bold', '-Regular'), { family: 'Inter', weight: 'normal' });
  } catch (e) {
    logger.warn('Error registering Inter font:', e.message);
  }
} else {
  logger.error(`Inter font not found: ${interFontPath}`);
}

const symbolaFontPath = path.join(__dirname, '../fonts/symbola.ttf');
let useSymbolaFont = false;
if (fs.existsSync(symbolaFontPath)) {
  try {
    registerFont(symbolaFontPath, { family: 'Symbola' });
    useSymbolaFont = true;
  } catch (e) {
    logger.warn('Error registering Symbola font:', e.message);
  }
} else {
  logger.error(`Symbola font not found: ${symbolaFontPath}`);
}

// --- Layout Configuration ---
const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;

const outerRadius = 600;
const zodiacRingOuterRadius = outerRadius;
const zodiacRingInnerRadius = outerRadius * 0.85;
const innerRadius = outerRadius * 0.25;
const aspectsLineMaxRadius = innerRadius + 50;

const minPlanetRadius = innerRadius + 80;
const maxPlanetRadius = zodiacRingInnerRadius - 90;

// --- Color Palette ---
const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const symbolColor = '#1A1E3B';
const cuspNumberColor = '#555555';
const signColor = '#5A4A42';
const signDivisionColor = 'rgba(89, 74, 66, 0.4)';
const arrowColor = '#5A2A00';
const centerTextColor = '#807B74';

// --- Symbols & Metadata ---
const planetSymbols = {
  sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
  mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
  neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7'
};

const aspectStyles = {
  conjunction: { color: null, lineWidth: 0 },
  opposition: { color: '#FF0000', lineWidth: 3 },
  square: { color: '#FF4500', lineWidth: 2.5 },
  sextile: { color: '#0000FF', lineWidth: 2 },
  trine: { color: '#008000', lineWidth: 2 }
};

const signs = ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"];
const signSymbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// --- Utility Functions ---
const degToRad = (deg) => deg * Math.PI / 180;
const toChartCoords = (deg) => degToRad(270 - deg);

// Draws directional arrows for house cusps
function drawArrow(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size / 2);
  ctx.lineTo(-size, size / 2);
  ctx.closePath();
  ctx.fillStyle = arrowColor;
  ctx.fill();
  ctx.restore();
}

// --- Main Chart Rendering ---
async function generateNatalChartImage(ephemerisData) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const planetPositions = ephemerisData?.geo || {};
  const planetSignData = ephemerisData?.planets || {};
  const aspectsData = ephemerisData?.aspects || {};

  const houseCusps = [];
  if (ephemerisData?.houses) {
    for (let i = 1; i <= 12; i++) {
      const houseKey = `house${i}`;
      const house = ephemerisData.houses[houseKey];
      if (house) {
        houseCusps.push({
          house: i,
          degree: house.cuspDegree,
          sign: house.sign
        });
      }
    }
    houseCusps.sort((a, b) => a.degree - b.degree);
  }

  // --- Background Circles ---
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius - 5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = lineColor; ctx.lineWidth = 2;
  [outerRadius, zodiacRingInnerRadius, innerRadius].forEach(radius => {
    ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.stroke();
  });

  // --- House Cusps & Numbers ---
  houseCusps.forEach((cusp, index) => {
    const angleRad = toChartCoords(cusp.degree);
    const x1 = centerX + innerRadius * Math.cos(angleRad);
    const y1 = centerY + innerRadius * Math.sin(angleRad);
    const x2 = centerX + zodiacRingInnerRadius * Math.cos(angleRad);
    const y2 = centerY + zodiacRingInnerRadius * Math.sin(angleRad);

    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    drawArrow(ctx, x2, y2, angleRad, 12);

    const next = houseCusps[(index + 1) % houseCusps.length];
    let mid = (cusp.degree + next.degree) / 2;
    if (next.degree < cusp.degree) {
      mid = (cusp.degree + next.degree + 360) / 2;
      if (mid >= 360) mid -= 360;
    }

    const labelRadius = zodiacRingInnerRadius - 40;
    const labelX = centerX + labelRadius * Math.cos(toChartCoords(mid));
    const labelY = centerY + labelRadius * Math.sin(toChartCoords(mid));

    ctx.fillStyle = cuspNumberColor;
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cusp.house.toString(), labelX, labelY);
  });

  // --- Degrees on Cusps ---
  ctx.font = 'bold 16px Inter';
  ctx.fillStyle = arrowColor;
  houseCusps.forEach((cusp) => {
    const angleRad = toChartCoords(cusp.degree);
    const r = zodiacRingInnerRadius - 20;
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);
    const signIndex = Math.floor(cusp.degree / 30);
    const degreeInSign = (cusp.degree % 30).toFixed(1);
    const label = `${degreeInSign}° ${signSymbols[signIndex]}`;

    ctx.save();
    ctx.translate(x, y);
    let rotationAngle = angleRad + Math.PI / 2;
    if (angleRad > Math.PI / 2 && angleRad < 3 * Math.PI / 2) {
        rotationAngle += Math.PI;
    }
    ctx.rotate(rotationAngle);
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -5);
    ctx.restore();
  });

  // --- Sign Divisions & Labels ---
  ctx.strokeStyle = signDivisionColor;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 6]);
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = toChartCoords(deg);
    const x1 = centerX + zodiacRingInnerRadius * Math.cos(rad);
    const y1 = centerY + zodiacRingInnerRadius * Math.sin(rad);
    const x2 = centerX + zodiacRingOuterRadius * Math.cos(rad);
    const y2 = centerY + zodiacRingOuterRadius * Math.sin(rad);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.setLineDash([]);

  signs.forEach((sign, i) => {
    const angle = toChartCoords(i * 30 + 15);
    const r = (zodiacRingOuterRadius + zodiacRingInnerRadius) / 2;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    ctx.save();
    ctx.translate(x, y);
    let rotationAngle = angle + Math.PI / 2;
    if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
        rotationAngle += Math.PI;
    }
    ctx.rotate(rotationAngle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#8B4513';
    ctx.font = useSymbolaFont ? '38px Symbola' : 'bold 24px Inter';
    ctx.fillText(signSymbols[i], 0, -15);
    ctx.fillStyle = signColor;
    ctx.font = 'bold 18px Inter';
    ctx.fillText(sign.toUpperCase(), 0, 20);
    ctx.restore();
  });

  // --- Planet Positioning ---
  const planets = Object.entries(planetPositions).map(([name, deg]) => ({
    name,
    deg,
    symbol: planetSymbols[name] || name.toUpperCase().slice(0, 3),
    info: planetSignData[name]
  })).sort((a, b) => a.deg - b.deg);

  const placed = [];
  const symbolFontSize = useSymbolaFont ? 52 : 32;
  const labelSize = 18;
  const padding = 10;
  const minPlanetClearance = symbolFontSize / 2 + padding;

  const numTracks = 3;
  const trackSpacing = (maxPlanetRadius - minPlanetRadius) / (numTracks - 1);

  for (const p of planets) {
    let foundPosition = false;
    let bestRadius = minPlanetRadius;
    let bestAngle = toChartCoords(p.deg);

    for (let i = 0; i < numTracks; i++) {
        const currentRadius = minPlanetRadius + i * trackSpacing;

        for (let angleOffset = 0; angleOffset <= degToRad(15); angleOffset += degToRad(1)) {
            const anglesToTry = [bestAngle + angleOffset, bestAngle - angleOffset];
            for (const tryAngle of anglesToTry) {
                const x = centerX + currentRadius * Math.cos(tryAngle);
                const y = centerY + currentRadius * Math.sin(tryAngle);

                let overlap = false;
                for (const existingP of placed) {
                    const d = Math.hypot(x - existingP.x, y - existingP.y);
                    if (d < existingP.clearanceRadius + minPlanetClearance) {
                        overlap = true;
                        break;
                    }
                }

                if (!overlap) {
                    p.x = x;
                    p.y = y;
                    p.angle = tryAngle;
                    p.radius = currentRadius;
                    p.clearanceRadius = minPlanetClearance;
                    placed.push(p);
                    foundPosition = true;
                    break;
                }
            }
            if (foundPosition) break;
        }
        if (foundPosition) break;
    }

    if (!foundPosition) {
        logger.warn(`Could not find space for ${p.name}, placing at max radius.`);
        p.angle = toChartCoords(p.deg);
        p.radius = maxPlanetRadius;
        p.x = centerX + p.radius * Math.cos(p.angle);
        p.y = centerY + p.radius * Math.sin(p.angle);
        p.clearanceRadius = minPlanetClearance;
        placed.push(p);
    }
  });

  // --- Draw Planets ---
  placed.forEach(p => {
    ctx.fillStyle = 'rgba(255, 249, 237, 0.7)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, symbolFontSize / 2 + padding / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = symbolColor;
    ctx.font = useSymbolaFont ? `${symbolFontSize}px Symbola` : `bold ${symbolFontSize}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.symbol, p.x, p.y);

    ctx.font = `bold ${labelSize}px Inter`;
    ctx.fillStyle = textColor;

    // // Logic to display the degree and sign symbol near the planet
    // const degInSign = (p.deg % 30).toFixed(1);
    // const signIndex = Math.floor(p.deg / 30);
    // const fullLabel = `${degInSign}°${signSymbols[signIndex]}`;

    // ctx.textAlign = 'left';
    // ctx.textBaseline = 'top';
    // ctx.fillText(fullLabel, p.x + symbolFontSize / 2 + 5, p.y + symbolFontSize / 2 - 5);

    // // Logic to display the retrograde 'R' symbol
    // if (p.info?.retrograde === 'yes') {
    //   ctx.textAlign = 'right';
    //   ctx.textBaseline = 'top';
    //   ctx.fillText('R', p.x - symbolFontSize / 2 - 5, p.y + symbolFontSize / 2 - 5);
    // }
  });

  // --- Aspect Lines ---
  for (const aspectType in aspectsData) {
    const style = aspectStyles[aspectType];
    if (!style?.color) continue;
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;

    aspectsData[aspectType].forEach(({ planet1, planet2 }) => {
      const p1 = placed.find(p => p.name === planet1.name);
      const p2 = placed.find(p => p.name === planet2.name);
      if (p1 && p2) {
        const x1 = centerX + aspectsLineMaxRadius * Math.cos(toChartCoords(p1.deg));
        const y1 = centerY + aspectsLineMaxRadius * Math.sin(toChartCoords(p1.deg));
        const x2 = centerX + aspectsLineMaxRadius * Math.cos(toChartCoords(p2.deg));
        const y2 = centerY + aspectsLineMaxRadius * Math.sin(toChartCoords(p2.deg));
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    });
  }

  // --- Center Text ---
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillStyle = centerTextColor;
 ctx.font = 'bold 32px Inter';
 ctx.fillText('MAPA NATAL', centerX, centerY - 25);
 ctx.font = 'italic 26px Inter';
 ctx.fillText('ZODIKA', centerX, centerY + 15);
 ctx.font = '18px Inter';
 ctx.fillText('www.zodika.com.br', centerX, centerY + 55);

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
