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
// Removemos a órbita planetária fixa
const innerRadius = outerRadius * 0.25;

// Definição de camadas planetárias
const planetZoneInner = zodiacRingInnerRadius * 0.95; // Margem interna para planetas
const planetZoneOuter = zodiacRingInnerRadius * 0.75; // Margem externa para planetas

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const cuspNumberColor = '#555555';
const signColor = '#5A4A42';
const signDivisionColor = 'rgba(89, 74, 66, 0.4)';
const arrowColor = '#5A2A00';

const planetSymbols = {
  sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
  mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
  neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7'
};

const aspectStyles = {
  conjunction: { color: '#FF9800', lineWidth: 3 },
  opposition: { color: '#D32F2F', lineWidth: 3 },
  square: { color: '#F57C00', lineWidth: 2.5 },
  sextile: { color: '#1976D2', lineWidth: 2 },
  trine: { color: '#388E3C', lineWidth: 2 }
};

const degToRad = (degrees) => degrees * Math.PI / 180;

// Ordem zodiacal natural (sentido anti-horário)
const signs = ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", 
               "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"];
const signSymbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// Sistema de coordenadas unificado (anti-horário)
function toChartCoords(degree) {
  return degToRad(360 - degree);
}

// Função para desenhar setinhas
function drawArrow(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size/2);
  ctx.lineTo(-size, size/2);
  ctx.closePath();
  ctx.fillStyle = arrowColor;
  ctx.fill();
  
  ctx.restore();
}

async function generateNatalChartImage(ephemerisData) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Verificação robusta dos dados
  const planetPositions = ephemerisData?.geo || {};
  const houseCusps = Array.isArray(ephemerisData?.houses?.cusps) ? ephemerisData.houses.cusps : [];
  const aspectsData = ephemerisData?.aspects || {};
  const meta = ephemerisData?.meta || {};

  // Fundo com gradiente sutil
  const gradient = ctx.createRadialGradient(
    centerX, centerY, innerRadius * 0.5,
    centerX, centerY, outerRadius * 1.2
  );
  gradient.addColorStop(0, '#FFF9ED');
  gradient.addColorStop(1, '#FFEED6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // --- Estrutura Principal ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingInnerRadius, 0, 2 * Math.PI); ctx.stroke();
  // REMOVIDO: a órbita planetária (terceira linha)
  ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI); ctx.stroke();
  
  // Preenchimento central
  ctx.beginPath(); 
  ctx.fillStyle = '#FFF9E6'; 
  ctx.arc(centerX, centerY, innerRadius - 5, 0, 2 * Math.PI); 
  ctx.fill();
  ctx.stroke();

  // --- Casas Astrológicas (Placidus) ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  
  // Função para determinar casa de um planeta
  const getHouseForPlanet = (planetDegree, cusps) => {
    for (let i = 0; i < cusps.length; i++) {
      const nextIndex = (i + 1) % cusps.length;
      const start = cusps[i].degree;
      let end = cusps[nextIndex].degree;
      
      if (end < start) end += 360;
      let planetDeg = planetDegree;
      if (planetDeg < start) planetDeg += 360;
      
      if (planetDeg >= start && planetDeg < end) {
        return i + 1;
      }
    }
    return 1;
  };

  houseCusps.forEach((cusp, index) => {
    const angleRad = toChartCoords(cusp.degree);
    
    // Ponto inicial (círculo interno)
    const xInner = centerX + innerRadius * Math.cos(angleRad);
    const yInner = centerY + innerRadius * Math.sin(angleRad);
    
    // Ponto final (anel interno do zodíaco)
    const xZodiacInner = centerX + zodiacRingInnerRadius * Math.cos(angleRad);
    const yZodiacInner = centerY + zodiacRingInnerRadius * Math.sin(angleRad);
    
    // Linha da cúspide
    ctx.beginPath(); 
    ctx.moveTo(xInner, yInner); 
    ctx.lineTo(xZodiacInner, yZodiacInner); 
    ctx.stroke();
    
    // Adicionar setinha no final da linha
    drawArrow(ctx, xZodiacInner, yZodiacInner, angleRad, 12);

    // Cálculo preciso do ponto médio
    const nextIndex = (index + 1) % houseCusps.length;
    const nextCusp = houseCusps[nextIndex];
    let midDegree = (cusp.degree + nextCusp.degree) / 2;
    
    // Correção para cruzamento de 0°
    if (Math.abs(cusp.degree - nextCusp.degree) > 180) {
      midDegree = (cusp.degree + nextCusp.degree + 360) / 2;
      if (midDegree >= 360) midDegree -= 360;
    }
    
    // Posicionar o número da casa mais próximo da linha da cúspide
    const r = zodiacRingInnerRadius - 40; // Mais próximo do anel interno
    const x = centerX + r * Math.cos(toChartCoords(midDegree));
    const y = centerY + r * Math.sin(toChartCoords(midDegree));
    
    ctx.fillStyle = cuspNumberColor;
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillText((index + 1).toString(), x, y);
  });

  // Marcadores de cúspide Placidus
  ctx.font = 'bold 16px Inter';
  ctx.fillStyle = '#5A2A00';
  houseCusps.forEach((cusp) => {
    const angleRad = toChartCoords(cusp.degree);
    const r = zodiacRingInnerRadius - 20;
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);
    
    // Calcular signo e grau
    const signIndex = Math.floor(cusp.degree / 30);
    const degreeInSign = (cusp.degree % 30).toFixed(1);
    const label = `${degreeInSign}° ${signSymbols[signIndex]}`;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad + Math.PI/2);
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // --- Divisórias entre Signos (30 graus) ---
  ctx.strokeStyle = signDivisionColor;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 6]);
  
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = toChartCoords(deg);
    const xStart = centerX + zodiacRingInnerRadius * Math.cos(rad);
    const yStart = centerY + zodiacRingInnerRadius * Math.sin(rad);
    const xEnd = centerX + zodiacRingOuterRadius * Math.cos(rad);
    const yEnd = centerY + zodiacRingOuterRadius * Math.sin(rad);
    
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
  }
  
  ctx.setLineDash([]);

  // --- Signos do Zodíaco (sentido anti-horário) ---
  ctx.textAlign = 'center'; 
  ctx.textBaseline = 'middle';
  ctx.fillStyle = signColor;
  ctx.font = 'bold 22px Inter';
  
  signs.forEach((sign, i) => {
    const angleDeg = i * 30 + 15;
    const angleRad = toChartCoords(angleDeg);
    const r = (zodiacRingOuterRadius + zodiacRingInnerRadius) / 2;
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad + Math.PI / 2);
    
    // Símbolo do signo
    ctx.fillStyle = '#8B4513';
    ctx.font = useSymbolaFont ? '38px Symbola' : 'bold 24px Inter';
    ctx.fillText(signSymbols[i], 0, -15);
    
    // Nome do signo
    ctx.fillStyle = signColor;
    ctx.font = 'bold 18px Inter';
    ctx.fillText(sign.toUpperCase(), 0, 20);
    
    ctx.restore();
  });

  // --- Planetas (distribuídos no espaço entre o anel interno do zodíaco e o círculo central) ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const placed = [];
  const planets = Object.entries(planetPositions).sort(([, a], [, b]) => a - b);
  
  // Definir os limites para posicionamento dos planetas
  const minRadius = innerRadius + 50; // 50 pixels a partir do círculo central
  const maxRadius = zodiacRingInnerRadius - 50; // 50 pixels a partir do anel interno do zodíaco
  
  planets.forEach(([name, deg]) => {
    // Determinar casa do planeta
    const house = getHouseForPlanet(deg, houseCusps);
    
    // Calcular posição radial baseada na casa
    // Casa 1: mais externa, Casa 12: mais interna
    const houseFactor = (13 - house) / 12; // Invertido para casa 1 ser mais externa
    const radius = minRadius + (maxRadius - minRadius) * houseFactor;
    
    const angleRad = toChartCoords(deg);
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);
    
    const symbol = planetSymbols[name];
    const fontSize = useSymbolaFont ? 42 : 24;
    ctx.font = useSymbolaFont ? `${fontSize}px Symbola` : `bold ${fontSize}px Inter`;
    
    // Fundo para contraste
    ctx.fillStyle = 'rgba(255, 249, 237, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, fontSize/1.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Símbolo do planeta
    ctx.fillStyle = '#2A2A2A';
    ctx.fillText((symbol && useSymbolaFont) ? symbol : name.substring(0, 3).toUpperCase(), x, y);
    
    placed.push({ x, y, degree: deg, name, house });
  });

  // --- Aspectos ---
  for (const aspectType in aspectsData) {
    const style = aspectStyles[aspectType];
    if (!style) continue;
    
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;
    
    aspectsData[aspectType].forEach(a => {
      const p1 = placed.find(p => p.name === a.planet1.name);
      const p2 = placed.find(p => p.name === a.planet2.name);
      
      if (p1 && p2) {
        ctx.beginPath();
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const offset = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) * 0.2;
        
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(
          midX + offset * Math.cos(degToRad(45)),
          midY + offset * Math.sin(degToRad(45)),
          p2.x, p2.y
        );
        ctx.stroke();
      }
    });
  }

  // --- Informações Centrais ---
  ctx.lineWidth = 2;
  ctx.fillStyle = '#5D4037';
  ctx.font = 'bold 32px Inter';
  ctx.fillText('MAPA NATAL', centerX, centerY - 25);
  
  ctx.font = 'italic 20px Inter';
  ctx.fillStyle = '#7D5D47';
  ctx.fillText(meta.name || 'N/A', centerX, centerY + 15);
  
  ctx.font = '18px Inter';
  ctx.fillStyle = '#999999';
  ctx.fillText(meta.datetime || 'Data não disponível', centerX, centerY + 45);
  ctx.fillText('www.zodika.com.br', centerX, centerY + 75);

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
