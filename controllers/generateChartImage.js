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
// MODIFICAÇÃO: Diminuir o círculo interno para metade do tamanho
const INNER_RADIUS = OUTER_RADIUS * 0.125; // Era 0.25, agora 0.25 / 2 = 0.125
const ASPECTS_LINE_MAX_RADIUS = INNER_RADIUS + 50; // Esta constante não será mais usada para o posicionamento das linhas de aspecto

const PLANET_SYMBOL_SIZE = 52;
const PLANET_CIRCLE_RADIUS = PLANET_SYMBOL_SIZE / 1.6;
const HOUSE_NUMBER_RADIUS = INNER_RADIUS + 35;
const HOUSE_NUMBER_FONT_SIZE = 28;
const DEGREE_TICK_RADIUS = ZODIAC_RING_INNER_RADIUS - 15;
const PLANET_RADIUS = DEGREE_TICK_RADIUS + 5; // Raio onde os símbolos dos planetas são desenhados

// MODIFICAÇÃO: Novo raio para as linhas de aspecto, a meio caminho entre INNER_RADIUS e PLANET_RADIUS
const ASPECT_LINE_RADIUS = (INNER_RADIUS + PLANET_RADIUS) / 2;


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
  // MODIFICAÇÃO: Nova cor para o círculo dos aspectos
  ASPECT_CIRCLE: 'rgba(41, 40, 30, 0.2)' // Uma versão mais clara da cor da linha principal
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

/**
 * Converts an astrological degree to chart coordinates (radians) with a specific rotation.
 * This function is designed to initially map astrological degrees to canvas coordinates as follows:
 * - Astrological 0° (Áries) maps to the left (180° canvas).
 * - Astrological 90° (Câncer) maps to the bottom (90° canvas).
 * - Astrological 180° (Libra) maps to the right (0° canvas).
 * - Astrological 270° (Capricórnio) maps to the top (270° canvas).
 *
 * A 'rotationOffset' é então aplicado para girar todo o gráfico.
 *
 * @param {number} degree - O grau astrológico (0-360).
 * @param {number} rotationOffset - A rotação adicional em graus a ser aplicada ao gráfico.
 * Este valor é calculado para trazer um ponto astrológico específico
 * (por exemplo, MC) para uma posição desejada no canvas (por exemplo, topo).
 * @returns {number} O ângulo em radianos para desenho no canvas.
 */
function toChartCoords(degree, rotationOffset = 0) {
  // Passo 1: Mapeia o grau astrológico para coordenadas padrão do canvas (sentido horário a partir da direita, 0=direita).
  // Astrológico 0 (Áries) está geralmente à esquerda.
  // Canvas 0 está à direita.
  // Para mapear Áries (0) para a esquerda (180 canvas), Câncer (90) para baixo (90 canvas), etc.:
  let canvasDegree = (180 - degree + 360) % 360;

  // Passo 2: Aplica o offset de rotação calculado.
  const finalCanvasDegree = (canvasDegree + rotationOffset + 360) % 360;

  return degToRad(finalCanvasDegree);
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

  // Prepare house cusps
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
      
      // Get MC degree (House 10)
      if (i === 10) mcDegree = houses[houseKey].cuspDegree;
    }
  }
  
  // ==================================================================
  // MODIFICAÇÃO INÍCIO: Calcula a rotação para posicionar o MC no topo (ângulo de 270° no canvas)
  // ==================================================================
  // Primeiro, encontra o ângulo do canvas do MC sem nenhuma rotação adicional.
  // Isso usa o mapeamento inicial (Áries à esquerda, Câncer embaixo, Libra à direita, Capricórnio no topo).
  const mcCanvasAngleInitial = (180 - mcDegree + 360) % 360;

  // Queremos que o MC esteja no topo do gráfico, o que corresponde a 270 graus nas coordenadas do canvas.
  // Calcula o offset de rotação necessário para mover a posição inicial do MC para o topo.
  const rotationOffset = (270 - mcCanvasAngleInitial + 360) % 360;
  // ==================================================================
  // MODIFICAÇÃO FIM
  // ==================================================================

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

  // MODIFICAÇÃO: Desenhar o novo círculo para os aspectos
  ctx.strokeStyle = COLORS.ASPECT_CIRCLE; // Usar a nova cor
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, ASPECT_LINE_RADIUS, 0, 2 * Math.PI);
  ctx.stroke();


  // Draw degree ticks in the zodiac ring
  ctx.strokeStyle = COLORS.DEGREE_TICK;
  ctx.lineWidth = 1;
  
  for (let deg = 0; deg < 360; deg++) {
    const rad = toChartCoords(deg, rotationOffset); 
    
    // Determine tick size based on degree
    const isMajorTick = deg % 10 === 0;
    const tickLength = isMajorTick ? 10 : 5;
    const tickStart = DEGREE_TICK_RADIUS;
    const tickEnd = tickStart + tickLength;
    
    const xStart = CENTER_X + tickStart * Math.cos(rad);
    const yStart = CENTER_Y + tickStart * Math.sin(rad);
    const xEnd = CENTER_X + tickEnd * Math.cos(rad);
    const yEnd = CENTER_Y + tickEnd * Math.sin(rad);
    
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
  }

  // Draw house cusps and numbers
  houseCusps.forEach((cusp, index) => { 
    const angleRad = toChartCoords(cusp.degree, rotationOffset); 
    
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
    
    // Calcular o ponto central da casa para posicionar o número
    let nextCuspDegree;
    if (index < houseCusps.length - 1) {
      nextCuspDegree = houseCusps[index + 1].degree;
    } else {
      // Para a última casa (12), sua extremidade é o início da casa 1
      nextCuspDegree = houseCusps[0].degree;
    }

    let startDeg = cusp.degree;
    let endDeg = nextCuspDegree;

    // Lida com a passagem da marca de 0/360 graus
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
    
    // Draw sign name
    ctx.fillStyle = COLORS.SIGN;
    ctx.font = 'bold 18px Inter';
    ctx.fillText(sign.toUpperCase(), 0, 20);
    
    ctx.restore();
  });

  // ==================================================================
  // PLANET POSITIONING (FIXED RADIUS ON DEGREE TICKS)
  // ==================================================================
  const planets = Object.entries(planetPositions)
    .map(([name, deg]) => ({ name, deg }));

  const placedPlanets = [];

  planets.forEach(planet => {
    const angleRad = toChartCoords(planet.deg, rotationOffset); 
    const x = CENTER_X + PLANET_RADIUS * Math.cos(angleRad);
    const y = CENTER_Y + PLANET_RADIUS * Math.sin(angleRad);
    
    placedPlanets.push({
      ...planet,
      angleRad,
      x,
      y
    });
  });

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
    ctx.font = useSymbolaFont ? 
      `bold ${PLANET_SYMBOL_SIZE}px Symbola` : 
      `bold ${PLANET_SYMBOL_SIZE}px Inter`;
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
        // MODIFICAÇÃO: Desenhar as linhas de aspecto no novo raio ASPECT_LINE_RADIUS
        const aspectX1 = CENTER_X + ASPECT_LINE_RADIUS * Math.cos(p1.angleRad);
        const aspectY1 = CENTER_Y + ASPECT_LINE_RADIUS * Math.sin(p1.angleRad);
        const aspectX2 = CENTER_X + ASPECT_LINE_RADIUS * Math.cos(p2.angleRad);
        const aspectY2 = CENTER_Y + ASPECT_LINE_RADIUS * Math.sin(p2.angleRad);

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
