const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Fonte única
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

// Fundo
ctx.fillStyle = backgroundColor;
ctx.fillRect(0, 0, width, height);

// Círculos principais
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

// Signos zodiacais
const signos = [
  { nome: 'ÁRIES', simbolo: '♈', startDeg: 0 },
  { nome: 'TOURO', simbolo: '♉', startDeg: 330 },
  { nome: 'GÊMEOS', simbolo: '♊', startDeg: 300 },
  { nome: 'CÂNCER', simbolo: '♋', startDeg: 270 },
  { nome: 'LEÃO', simbolo: '♌', startDeg: 240 },
  { nome: 'VIRGEM', simbolo: '♍', startDeg: 210 },
  { nome: 'LIBRA', simbolo: '♎', startDeg: 180 },
  { nome: 'ESCORPIÃO', simbolo: '♏', startDeg: 150 },
  { nome: 'SAGITÁRIO', simbolo: '♐', startDeg: 120 },
  { nome: 'CAPRICÓRNIO', simbolo: '♑', startDeg: 90 },
  { nome: 'AQUÁRIO', simbolo: '♒', startDeg: 60 },
  { nome: 'PEIXES', simbolo: '♓', startDeg: 30 }
];

ctx.fillStyle = textColor;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Marcadores de grau
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

// Desenha os signos (nome e símbolo)
signos.forEach(signo => {
  const angleDeg = signo.startDeg + 15;
  const angle = angleDeg * Math.PI / 180;

  // Símbolo
  const symbolRadius = radius - 70;
  ctx.font = 'bold 48px Inter';
  ctx.fillText(signo.simbolo, centerX + symbolRadius * Math.cos(angle), centerY + symbolRadius * Math.sin(angle));

  // Nome com curvatura
  const nameRadius = radius - 120;
  const nameAngle = angleDeg - 90;
  const letters = signo.nome.split('');
  const letterSpacing = 16;

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

// Números das casas
for (let i = 0; i < 12; i++) {
  const angleDeg = i * 30 + 15;
  const angle = angleDeg * Math.PI / 180;
  const houseRadius = radius * 0.6;
  ctx.font = 'bold 28px Inter';
  ctx.fillText((i + 1).toString(), centerX + houseRadius * Math.cos(angle), centerY + houseRadius * Math.sin(angle));
}

// Centro do mapa
ctx.fillStyle = textColor;
ctx.font = 'bold 36px Inter';
ctx.fillText('ZODIKA', centerX, centerY - 30);
ctx.font = '24px Inter';
ctx.fillText('www.zodika.com.br', centerX, centerY + 30);

// Planetas de exemplo
const planetas = [
  { simbolo: '☉', nome: 'Sol', posicao: 45, casa: 2 },
  { simbolo: '☽', nome: 'Lua', posicao: 120, casa: 4 },
  { simbolo: '♀', nome: 'Vênus', posicao: 75, casa: 3 }
];

planetas.forEach(planeta => {
  const angle = planeta.posicao * Math.PI / 180;
  const planetRadius = radius * 0.35;
  ctx.font = 'bold 36px Inter';
  ctx.fillStyle = accentColor;
  ctx.fillText(planeta.simbolo, centerX + planetRadius * Math.cos(angle), centerY + planetRadius * Math.sin(angle));

  ctx.font = '14px Inter';
  ctx.fillStyle = textColor;
  ctx.fillText(`${planeta.nome} ${planeta.posicao}°`, centerX + planetRadius * Math.cos(angle), centerY + planetRadius * Math.sin(angle) + 30);
});

// Exporta o gráfico
const outputPath = path.join(__dirname, '../chart-preview.png');
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Gráfico gerado com sucesso:', outputPath));
