const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Fontes
const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');

if (!fs.existsSync(fontPath)) {
  console.error(`Fonte Inter não encontrada em: ${fontPath}`);
}

// Registra a fonte Inter apenas
try {
  registerFont(fontPath, { family: 'Inter', weight: 'bold' });
} catch (e) {
  console.warn('Erro ao registrar fonte Inter:', e.message);
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

// Fundo
ctx.fillStyle = backgroundColor;
ctx.fillRect(0, 0, width, height);

// Círculos
ctx.strokeStyle = lineColor;
ctx.lineWidth = 2;

ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.stroke();
ctx.beginPath(); ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI); ctx.stroke();
ctx.beginPath(); ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI); ctx.stroke();

// Linhas das casas
for (let i = 0; i < 12; i++) {
  const angle = (i * 30) * Math.PI / 180;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.stroke();

  // Marcadores curtos
  const markerLength = radius * 0.05;
  const x1 = centerX + (radius * 0.8) * Math.cos(angle);
  const y1 = centerY + (radius * 0.8) * Math.sin(angle);
  const x2 = centerX + (radius * 0.8 + markerLength) * Math.cos(angle);
  const y2 = centerY + (radius * 0.8 + markerLength) * Math.sin(angle);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

// Signos zodiacais (anti-horário)
const signos = [
  { nome: 'ÁRIES', simbolo: '♈', startDeg: 0 },
  { nome: 'TOURO', simbolo: '♉', startDeg: 330 },
  { nome: 'GÊMEOS', simbolo: '♊', startDeg: 300 },
  {
