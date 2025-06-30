const { createCanvas } = require('canvas');
const fs = require('fs');

const width = 800;
const height = 800;
const centerX = width / 2;
const centerY = height / 2;
const radius = 350;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Draw outer circle
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.strokeStyle = '#333';
ctx.lineWidth = 2;
ctx.stroke();

// Divide into 12 sections
for (let i = 0; i < 12; i++) {
  const angle = (i * 30) * Math.PI / 180;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = '#aaa';
  ctx.stroke();
}

// Save PNG to root folder
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(__dirname + '/../chart-preview.png', buffer);

console.log('🟢 Mapa base gerado: chart-preview.png');
