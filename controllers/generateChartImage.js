'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

// --- Font Configuration ---
const interFontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
if (!fs.existsSync(interFontPath)) {
  logger.error(`Inter font not found: ${interFontPath}. Please ensure the font file exists.`);
}
try {
  registerFont(interFontPath, { family: 'Inter', weight: 'bold' });
  registerFont(interFontPath.replace('-Bold', '-Regular'), { family: 'Inter', weight: 'normal' });
} catch (e) {
  logger.warn('Error registering Inter font:', e.message);
}

const symbolaFontPath = path.join(__dirname, '../fonts/symbola.ttf');
let useSymbolaFont = false;
if (!fs.existsSync(symbolaFontPath)) {
  logger.error(`Symbola font not found: ${symbolaFontPath}. Planet symbols will use text names.`);
} else {
  try {
    registerFont(symbolaFontPath, { family: 'Symbola' });
    useSymbolaFont = true;
  } catch (e) {
    logger.warn('Error registering Symbola font:', e.message);
  }
}

const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;
const outerRadius = 600;
const zodiacRingOuterRadius = outerRadius;
const zodiacRingInnerRadius = outerRadius * 0.85;
const planetOrbitRadius = outerRadius * 0.45;
const innerRadius = outerRadius * 0.15;

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const cuspNumberColor = '#555555';

const planetSymbols = {
  sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
  mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
  neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7'
};

const aspectStyles = {
  conjunction: { color: null, lineWidth: 0 },
  opposition: { color: '#FF0000', lineWidth: 3 },
  square: { color: '#FF4500', lineWidth: 2 },
  sextile: { color: '#0000FF', lineWidth: 1.5 },
  trine: { color: '#008000', lineWidth: 1.5 }
};

const degToRad = (degrees) => degrees * Math.PI / 180;

const signs = ["Peixes", "Aquário", "Capricórnio", "Sagitário", "Escorpião", "Libra", "Virgem", "Leão", "Câncer", "Gêmeos", "Touro", "Áries"].reverse();
const signSymbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

async function generateNatalChartImage(ephemerisData) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dados seguros com fallback
  const planetPositions = ephemerisData?.geo || {};
  const houseCusps = ephemerisData?.houses?.cusps || [];
  const aspectsData = ephemerisData?.aspects || {};
  const meta = ephemerisData?.meta || {};

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingOuterRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingInnerRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, planetOrbitRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.fillStyle = backgroundColor; ctx.arc(centerX, centerY, innerRadius - 5, 0, 2 * Math.PI); ctx.fill();

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  houseCusps.forEach((cusp, index) => {
    const angleRad = degToRad(cusp.degree);
    const xOuter = centerX + outerRadius * Math.cos(angleRad);
    const yOuter = centerY + outerRadius * Math.sin(angleRad);
    const xInner = centerX + innerRadius * Math.cos(angleRad);
    const yInner = centerY + innerRadius * Math.sin(angleRad);
    ctx.beginPath(); ctx.moveTo(xInner, yInner); ctx.lineTo(xOuter, yOuter); ctx.stroke();

    // Correção do ponto médio para casas
    const nextIndex = (index + 1) % 12;
    const nextCusp = houseCusps[nextIndex];
    let midDegree = (cusp.degree + nextCusp.degree) / 2;
    
    // Ajuste para cruzamento de 0°
    if (Math.abs(cusp.degree - nextCusp.degree) > 180) {
      midDegree = (cusp.degree + nextCusp.degree + 360) / 2;
      if (midDegree >= 360) midDegree -= 360;
    }
    
    const r = innerRadius + (planetOrbitRadius - innerRadius) * 0.5;
    const x = centerX + r * Math.cos(degToRad(midDegree));
    const y = centerY + r * Math.sin(degToRad(midDegree));
    
    ctx.fillStyle = cuspNumberColor;
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillText((index + 1).toString(), x, y);
  });

  ctx.textAlign = 'center'; 
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px Inter';
  
  // Correção da orientação zodiacal
  signs.forEach((sign, i) => {
    const angleDeg = 360 - (i * 30 + 15);
    const angleRad = degToRad(angleDeg);
    const r = (zodiacRingOuterRadius + zodiacRingInnerRadius) / 2;
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad + Math.PI / 2);
    ctx.fillStyle = textColor;
    ctx.fillText(signSymbols[i], 0, -10);
    ctx.fillText(sign.toUpperCase(), 0, 12);
    ctx.restore();
  });

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.font = '14px Inter';
  for (let deg = 0; deg < 360; deg++) {
    const rad = degToRad(deg);
    const out = zodiacRingOuterRadius;
    let inn = out - 5;
    if (deg % 5 === 0) inn = out - 10;
    if (deg % 10 === 0) {
      inn = out - 20;
      const tx = centerX + (out - 35) * Math.cos(rad);
      const ty = centerY + (out - 35) * Math.sin(rad);
      ctx.fillText(deg.toString(), tx, ty);
    }
    ctx.beginPath();
    ctx.moveTo(centerX + out * Math.cos(rad), centerY + out * Math.sin(rad));
    ctx.lineTo(centerX + inn * Math.cos(rad), centerY + inn * Math.sin(rad));
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.font = useSymbolaFont ? '36px Symbola' : 'bold 20px Inter';
  const placed = [];
  const planets = Object.entries(planetPositions).sort(([, a], [, b]) => a - b);
  planets.forEach(([name, deg]) => {
    const rad = degToRad(deg);
    let r = planetOrbitRadius, x, y, overlap = true, tries = 0;
    const max = 15, step = 25, size = 30;
    while (overlap && tries < max) {
      x = centerX + r * Math.cos(rad);
      y = centerY + r * Math.sin(rad);
      overlap = placed.some(p => Math.hypot(x - p.x, y - p.y) < (size + p.symbolSize) * 0.8);
      if (overlap) r += step;
      tries++;
    }
    const symbol = planetSymbols[name];
    ctx.fillText((symbol && useSymbolaFont) ? symbol : name.toUpperCase(), x, y);
    placed.push({ x, y, symbolSize: size, degree: deg, name });
  });

  for (const aspectType in aspectsData) {
    const style = aspectStyles[aspectType];
    if (!style || style.color === null) continue;
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;
    aspectsData[aspectType].forEach(a => {
      const p1 = placed.find(p => p.name === a.planet1.name);
      const p2 = placed.find(p => p.name === a.planet2.name);
      if (p1 && p2) {
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
    });
  }
  
  ctx.lineWidth = 2;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 24px Inter';
  ctx.fillText('ZODIKA', centerX, centerY - 20);
  
  ctx.font = '18px Inter';
  ctx.fillText('www.zodika.com.br', centerX, centerY + 20);
  
  // Adicionando dados do nativo com segurança
  if (meta.name || meta.datetime) {
    ctx.fillStyle = '#5A4A42';
    ctx.font = 'bold 18px Inter';
    ctx.fillText(meta.name || '', centerX, centerY - 60);
    
    ctx.font = '16px Inter';
    ctx.fillText(meta.datetime || '', centerX, centerY + 60);
  }

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
