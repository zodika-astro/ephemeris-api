const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const fontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');

if (!fs.existsSync(fontPath)) {
  console.error(`Fonte Inter não encontrada em: ${fontPath}`);
}

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

// background
ctx.fillStyle = backgroundColor;
ctx.fillRect(0, 0, width, height);

// circles
ctx.strokeStyle = lineColor;
ctx.lineWidth = 2;
ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.stroke();
ctx.beginPath(); ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI); ctx.stroke();
ctx.beginPath(); ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI); ctx.stroke();

// houses
for (let i = 0; i < 12; i++) {
  const angle = (i * 30) * Math.PI / 180;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.stroke();

  // marker
  const markerLength = radius * 0.05;
  const x1 = centerX + (radius * 0.8) * Math.cos(angle);
  const y1 = centerY + (radius * 0.8) * Math.sin(angle);
  const x2 = centerX + (radius * 0.8 + markerLength) * Math.cos(angle);
  const y2 = centerY + (radius * 0.8 + markerLength) * Math.sin(angle);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

// signs
const signos = [
  { nome: 'ÁRIES', startDeg: 0 },
  { nome: 'TOURO', startDeg: 330 },
  { nome: 'GÊMEOS', startDeg: 300 },
  { nome: 'CÂNCER', startDeg: 270 },
  { nome: 'LEÃO', startDeg: 240 },
  { nome: 'VIRGEM', startDeg: 210 },
  { nome: 'LIBRA', startDeg: 180 },
  { nome: 'ESCORPIÃO', startDeg: 150 },
  { nome: 'SAGITÁRIO', startDeg: 120 },
  { nome: 'CAPRICÓRNIO', startDeg: 90 },
  { nome: 'AQUÁRIO', startDeg: 60 },
  { nome: 'PEIXES', startDeg: 30 }
];

ctx.fillStyle = textColor;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// marker
for (let deg = 0; deg < 360; deg += 5) {
  const angle = deg * Math.PI / 180;
  const outer = deg % 10 === 0 ? 20 : 15;
  const inner = deg % 10 === 0 ? 35 : 30;

  ctx.beginPath();
  ctx.moveTo(centerX + (radius - outer) * Math.cos(angle), centerY + (radius - outer) * Math.sin(angle));
  ctx.lineTo(centerX + (radius - inner) * Math.cos(angle), centerY + (radius - inner) * Math.sin(angle));
  ctx.stroke();

  if (deg % 10 === 0) {
    ctx.font = 'bold 16px Inter';
    ctx.fillText(deg.toString(), centerX + (radius - 50) * Math.cos(angle), centerY + (radius - 50) * Math.sin(angle));
  }
}

// names
signos.forEach(signo => {
  const angleDeg = signo.startDeg + 15;
  const angle = angleDeg * Math.PI / 180;

  const nameRadius = radius - 100;
  const nameAngle = angleDeg - 90;
  const letters = signo.nome.split('');
  const letterSpacing = 22;

  letters.forEach((letter, i) => {
    const letterAngle = nameAngle * Math.PI / 180 + (i - (letters.length - 1) / 2) * (letterSpacing / nameRadius);
    const x = centerX + nameRadius * Math.cos(letterAngle);
    const y = centerY + nameRadius * Math.sin(letterAngle);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(letterAngle + Math.PI / 2);
    ctx.font = 'bold 32px Inter';
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  });
});

// house numbers
for (let i = 0; i < 12; i++) {
  const angleDeg = i * 30 + 15;
  const angle = angleDeg * Math.PI / 180;
  const houseRadius = radius * 0.6;
  ctx.font = 'bold 28px Inter';
  ctx.fillText((i + 1).toString(), centerX + houseRadius * Math.cos(angle), centerY + houseRadius * Math.sin(angle));
}

// center
ctx.fillStyle = textColor;
ctx.font = 'bold 36px Inter';
ctx.fillText('ZODIKA', centerX, centerY - 30);
ctx.font = '24px Inter';
ctx.fillText('www.zodika.com.br', centerX, centerY + 30);


// export
const outputPath = path.join(__dirname, '../chart-preview.png');
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Gráfico gerado com sucesso:', outputPath));
