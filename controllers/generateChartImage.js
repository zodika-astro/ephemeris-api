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
const innerRadius = outerRadius * 0.25;

// Definição de camadas planetárias
const planetZoneInner = innerRadius + 50;
const planetZoneOuter = zodiacRingInnerRadius - 50;

// Cores atualizadas
const backgroundColor = '#FFFBF4'; // Fundo principal
const lineColor = '#29281E'; // Cor das linhas
const textColor = '#29281E'; // Cor dos textos
const symbolColor = '#1A1E3B'; // Cor dos símbolos
const cuspNumberColor = '#555555';
const signColor = '#5A4A42';
const signDivisionColor = 'rgba(89, 74, 66, 0.4)';
const arrowColor = '#5A2A00';
const centerBgColor = '#B7A8D3'; // Fundo do centro
const centerTextColor = '#807B74'; // Texto do centro

const planetSymbols = {
  sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
  mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
  neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7'
};

const planetNames = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus',
  mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano',
  neptune: 'Netuno', pluto: 'Plutão', trueNode: 'Nodo Norte', lilith: 'Lilith', chiron: 'Quíron'
};

// Estilos de aspecto atualizados
const aspectStyles = {
  conjunction: { color: null, lineWidth: 0 }, // Sem linha para conjunções
  opposition: { color: '#FF0000', lineWidth: 3 }, // Vermelho
  square: { color: '#FF4500', lineWidth: 2.5 }, // Laranja
  sextile: { color: '#0000FF', lineWidth: 2 }, // Azul
  trine: { color: '#008000', lineWidth: 2 } // Verde
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

  // Fundo principal
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // --- Estrutura Principal ---
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingInnerRadius, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI); ctx.stroke();
  
  // Preenchimento central
  ctx.beginPath(); 
  ctx.fillStyle = centerBgColor; 
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
    const r = zodiacRingInnerRadius - 40;
    const x = centerX + r * Math.cos(toChartCoords(midDegree));
    const y = centerY + r * Math.sin(toChartCoords(midDegree));
    
    ctx.fillStyle = cuspNumberColor;
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillText((index + 1).toString(), x, y);
  });

  // Marcadores de cúspide Placidus (reposicionados)
  ctx.font = 'bold 16px Inter';
  ctx.fillStyle = '#5A2A00';
  houseCusps.forEach((cusp) => {
    const angleRad = toChartCoords(cusp.degree);
    // Mover para direita (aumentar o raio)
    const r = zodiacRingInnerRadius - 10; 
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

  // --- Planetas ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const placed = [];
  const planets = Object.entries(planetPositions).sort(([, a], [, b]) => a - b);
  
  // Definir os limites para posicionamento dos planetas
  const minRadius = planetZoneInner;
  const maxRadius = planetZoneOuter;
  
  planets.forEach(([name, deg]) => {
    const angleRad = toChartCoords(deg);
    
    // Posicionamento radial (distribuição proporcional)
    const r = minRadius + (maxRadius - minRadius) * 0.5; // Centralizado na zona planetária
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);
    
    const symbol = planetSymbols[name];
    const fontSize = useSymbolaFont ? 46 : 28; // Aumentado o tamanho
    ctx.font = useSymbolaFont ? `${fontSize}px Symbola` : `bold ${fontSize}px Inter`;
    
    // Fundo para contraste
    ctx.fillStyle = 'rgba(255, 249, 237, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, fontSize/1.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Símbolo do planeta (nova cor)
    ctx.fillStyle = symbolColor;
    ctx.fillText((symbol && useSymbolaFont) ? symbol : name.substring(0, 3).toUpperCase(), x, y);
    
    // Nome do planeta
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Inter';
    ctx.fillText(planetNames[name] || name, x, y + 35);
    
    placed.push({ x, y, degree: deg, name });
  });

  // --- Aspectos ---
  for (const aspectType in aspectsData) {
    const style = aspectStyles[aspectType];
    if (!style || style.color === null) continue; // Ignorar conjunções
    
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

  // --- Informações Centrais (simplificadas) ---
  ctx.lineWidth = 2;
  ctx.fillStyle = centerTextColor;
  
  // "MAPA NATAL"
  ctx.font = 'bold 32px Inter';
  ctx.fillText('MAPA NATAL', centerX, centerY - 25);
  
  // "ZODIKA"
  ctx.font = 'italic 26px Inter';
  ctx.fillText('ZODIKA', centerX, centerY + 15);
  
  // Site
  ctx.font = '18px Inter';
  ctx.fillText('www.zodika.com.br', centerX, centerY + 55);

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
