const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register fonts (fallback to system fonts if custom fonts fail)
try {
  registerFont(path.join(__dirname, '../fonts/Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });
  registerFont(path.join(__dirname, '../fonts/Inter-Regular.ttf'), { family: 'Inter', weight: 'regular' });
  registerFont(path.join(__dirname, '../fonts/NotoSansSymbols-Regular.ttf'), { family: 'Noto Sans Symbols' });
} catch (e) {
  console.log('Using system fonts as fallback');
}

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

// Zodiac signs in CORRECT ORDER (counter-clockwise)
const signs = [
  { name: 'ÁRIES', symbol: 'A', startDeg: 0 },    // Fallback to 'A' if symbol doesn't work
  { name: 'TOURO', symbol: 'T', startDeg: 330 },  // Fallback to 'T'
  { name: 'GÊMEOS', symbol: 'G', startDeg: 300 }, // Fallback to 'G'
  { name: 'CÂNCER', symbol: 'C', startDeg: 270 },
  { name: 'LEÃO', symbol: 'L', startDeg: 240 },
  { name: 'VIRGEM', symbol: 'V', startDeg: 210 },
  { name: 'LIBRA', symbol: 'L', startDeg: 180 },
  { name: 'ESCORPIÃO', symbol: 'E', startDeg: 150 },
  { name: 'SAGITÁRIO', symbol: 'S', startDeg: 120 },
  { name: 'CAPRICÓRNIO', symbol: 'C', startDeg: 90 },
  { name: 'AQUÁRIO', symbol: 'A', startDeg: 60 },
  { name: 'PEIXES', symbol: 'P', startDeg: 30 }
];

ctx.fillStyle = textColor;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Function to draw curved text
function drawCurvedText(text, radius, angle) {
  const letters = text.split('');
  const centerAngle = (angle - 90) * Math.PI / 180;
  const letterSpacing = 10;
  
  letters.forEach((letter, i) => {
    const charAngle = centerAngle + (i - (letters.length - 1) / 2) * (letterSpacing / radius);
    const x = centerX + radius * Math.cos(charAngle);
    const y = centerY + radius * Math.sin(charAngle);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.font = 'bold 24px Inter';
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  });
}

// Draw zodiac signs in the outer ring
signs.forEach((sign, i) => {
  const middleAngleDeg = sign.startDeg + 15;
  
  // Try symbol first, fallback to letter if symbol fails
  try {
    ctx.font = 'bold 48px "Noto Sans Symbols"';
    const symbolRadius = radius - 50;
    const xSymbol = centerX + symbolRadius * Math.cos(middleAngleDeg * Math.PI / 180);
    const ySymbol = centerY + symbolRadius * Math.sin(middleAngleDeg * Math.PI / 180);
    ctx.fillText(sign.symbol, xSymbol, ySymbol);
  } catch (e) {
    ctx.font = 'bold 48px Inter';
    const symbolRadius = radius - 50;
    const xSymbol = centerX + symbolRadius * Math.cos(middleAngleDeg * Math.PI / 180);
    const ySymbol = centerY + symbolRadius * Math.sin(middleAngleDeg * Math.PI / 180);
    ctx.fillText(sign.symbol, xSymbol, ySymbol);
  }
  
  // Draw curved sign name
  const nameRadius = radius - 100;
  drawCurvedText(sign.name, nameRadius, middleAngleDeg);
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

// Center text (ZODIKA and website)
ctx.fillStyle = textColor;
ctx.font = 'bold 36px Inter';
ctx.fillText('ZODIKA', centerX, centerY - 30);
ctx.font = '24px Inter';
ctx.fillText('www.zodika.com.br', centerX, centerY + 30);

// Save image
const outputPath = path.join(__dirname, '../chart-preview.png');
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Imagem gerada com sucesso:', outputPath));
