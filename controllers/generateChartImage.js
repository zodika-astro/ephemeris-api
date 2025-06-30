const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register fonts
registerFont(path.join(__dirname, '../fonts/Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });
registerFont(path.join(__dirname, '../fonts/Inter-Regular.ttf'), { family: 'Inter', weight: 'regular' });
registerFont(path.join(__dirname, '../fonts/NotoSansSymbols-Regular.ttf'), { family: 'Noto Sans Symbols' });

const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;
const radius = 700;

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const accentColor = '#8B0000';

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = backgroundColor;
ctx.fillRect(0, 0, width, height);

// Line style
ctx.strokeStyle = lineColor;
ctx.lineWidth = 2;

// Outer circle
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.stroke();

// Inner circles
ctx.beginPath();
ctx.arc(centerX, centerY, radius * 0.9, 0, 2 * Math.PI);
ctx.stroke();

ctx.beginPath();
ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI);
ctx.stroke();

// House division lines
for (let i = 0; i < 12; i++) {
  const angle = (i * 30) * Math.PI / 180;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  
  // Main division lines
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  // Short lines in the middle ring
  const shortLineLength = radius * 0.1;
  const x1 = centerX + (radius * 0.8) * Math.cos(angle);
  const y1 = centerY + (radius * 0.8) * Math.sin(angle);
  const x2 = centerX + (radius * 0.8 + shortLineLength) * Math.cos(angle);
  const y2 = centerY + (radius * 0.8 + shortLineLength) * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Zodiac signs with symbols
const signs = [
  { name: 'ÁRIES', symbol: '♈', startDeg: 0 },    { name: 'TOURO', symbol: '♉', startDeg: 30 },
  { name: 'GÊMEOS', symbol: '♊', startDeg: 60 },  { name: 'CÂNCER', symbol: '♋', startDeg: 90 },
  { name: 'LEÃO', symbol: '♌', startDeg: 120 },   { name: 'VIRGEM', symbol: '♍', startDeg: 150 },
  { name: 'LIBRA', symbol: '♎', startDeg: 180 },  { name: 'ESCORPIÃO', symbol: '♏', startDeg: 210 },
  { name: 'SAGITÁRIO', symbol: '♐', startDeg: 240 }, { name: 'CAPRICÓRNIO', symbol: '♑', startDeg: 270 },
  { name: 'AQUÁRIO', symbol: '♒', startDeg: 300 }, { name: 'PEIXES', symbol: '♓', startDeg: 330 }
];

ctx.fillStyle = textColor;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Draw zodiac signs in the outer ring
signs.forEach((sign, i) => {
  const middleAngleDeg = sign.startDeg + 15;
  const angle = middleAngleDeg * Math.PI / 180;
  
  // Symbol position
  const symbolRadius = radius - 50;
  const xSymbol = centerX + symbolRadius * Math.cos(angle);
  const ySymbol = centerY + symbolRadius * Math.sin(angle);
  
  // Sign name position
  const nameRadius = radius - 100;
  const xName = centerX + nameRadius * Math.cos(angle);
  const yName = centerY + nameRadius * Math.sin(angle);
  
  // Degree markings (every 5 degrees)
  for (let deg = sign.startDeg; deg < sign.startDeg + 30; deg += 5) {
    const degAngle = deg * Math.PI / 180;
    const outerX = centerX + (radius - 20) * Math.cos(degAngle);
    const outerY = centerY + (radius - 20) * Math.sin(degAngle);
    const innerX = centerX + (radius - 30) * Math.cos(degAngle);
    const innerY = centerY + (radius - 30) * Math.sin(degAngle);
    
    ctx.beginPath();
    ctx.moveTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
    ctx.stroke();
    
    // Label every 10 degrees
    if (deg % 10 === 0) {
      const labelX = centerX + (radius - 60) * Math.cos(degAngle);
      const labelY = centerY + (radius - 60) * Math.sin(degAngle);
      
      ctx.font = '14px Inter';
      ctx.fillText(deg.toString(), labelX, labelY);
    }
  }
  
  // Draw sign symbol
  ctx.font = 'bold 48px "Noto Sans Symbols"';
  ctx.fillText(sign.symbol, xSymbol, ySymbol);
  
  // Draw sign name
  ctx.font = 'bold 24px Inter';
  ctx.fillText(sign.name, xName, yName);
});

// House numbers (1-12)
for (let i = 0; i < 12; i++) {
  const angleDeg = i * 30 + 15;
  const angle = angleDeg * Math.PI / 180;
  const houseRadius = radius * 0.65;
  
  const x = centerX + houseRadius * Math.cos(angle);
  const y = centerY + houseRadius * Math.sin(angle);
  
  ctx.font = 'bold 28px Inter';
  ctx.fillText((i + 1).toString(), x, y);
}

// Planetary positions (example data - replace with actual positions)
const planets = [
  { symbol: '☉', name: 'Sun', position: 45, house: 2 },
  { symbol: '☽', name: 'Moon', position: 120, house: 4 },
  { symbol: '☿', name: 'Mercury', position: 30, house: 1 },
  { symbol: '♀', name: 'Venus', position: 75, house: 3 },
  { symbol: '♂', name: 'Mars', position: 210, house: 7 },
  { symbol: '♃', name: 'Jupiter', position: 300, house: 10 },
  { symbol: '♄', name: 'Saturn', position: 180, house: 6 },
  { symbol: '♅', name: 'Uranus', position: 240, house: 8 },
  { symbol: '♆', name: 'Neptune', position: 330, house: 11 },
  { symbol: '♇', name: 'Pluto', position: 270, house: 9 }
];

// Draw planets in the inner circle
planets.forEach(planet => {
  const angle = planet.position * Math.PI / 180;
  const planetRadius = radius * 0.4;
  
  const x = centerX + planetRadius * Math.cos(angle);
  const y = centerY + planetRadius * Math.sin(angle);
  
  // Draw planet symbol
  ctx.font = 'bold 36px "Noto Sans Symbols"';
  ctx.fillStyle = accentColor;
  ctx.fillText(planet.symbol, x, y);
  
  // Draw planet name and degree
  ctx.font = '14px Inter';
  ctx.fillStyle = textColor;
  ctx.fillText(`${planet.name} ${planet.position}°`, x, y + 30);
});

// Chart information in the center
ctx.fillStyle = textColor;
ctx.font = 'bold 24px Inter';
ctx.fillText('ASTRO DIENST', centerX, centerY - 40);
ctx.font = '18px Inter';
ctx.fillText('www.astro.com', centerX, centerY);

// House cusps (example data - replace with actual cusps)
ctx.font = '14px Inter';
for (let i = 0; i < 12; i++) {
  const angleDeg = i * 30;
  const angle = angleDeg * Math.PI / 180;
  const cuspRadius = radius * 0.75;
  
  const x = centerX + cuspRadius * Math.cos(angle);
  const y = centerY + cuspRadius * Math.sin(angle);
  
  // Example cusp degrees - replace with actual values
  const cuspDegree = (i * 30 + 15) % 360;
  ctx.fillText(`${cuspDegree}°`, x, y);
}

// Save image
const outputPath = path.join(__dirname, '../chart-preview.png');
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Imagem gerada com sucesso:', outputPath));
