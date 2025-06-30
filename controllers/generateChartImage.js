const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Registra as fontes
registerFont(path.join(__dirname, '../fonts/Inter-Bold.ttf'), { family: 'Inter' });
registerFont(path.join(__dirname, '../fonts/NotoSansSymbols-Regular.ttf'), { family: 'Noto Sans Symbols' });

const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;
const radius = 700;

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Fundo
ctx.fillStyle = backgroundColor;
ctx.fillRect(0, 0, width, height);

// Estilo das linhas
ctx.strokeStyle = lineColor;
ctx.lineWidth = 2;

// Círculo externo
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.stroke();

// Linhas divisórias
for (let i = 0; i < 12; i++) {
  const angle = (i * 30) * Math.PI / 180;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

// Signos com símbolos
const signos = [
  { nome: 'ÁRIES', simbolo: '♈' },     { nome: 'TOURO', simbolo: '♉' },
  { nome: 'GÊMEOS', simbolo: '♊' },    { nome: 'CÂNCER', simbolo: '♋' },
  { nome: 'LEÃO', simbolo: '♌' },      { nome: 'VIRGEM', simbolo: '♍' },
  { nome: 'LIBRA', simbolo: '♎' },     { nome: 'ESCORPIÃO', simbolo: '♏' },
  { nome: 'SAGITÁRIO', simbolo: '♐' }, { nome: 'CAPRICÓRNIO', simbolo: '♑' },
  { nome: 'AQUÁRIO', simbolo: '♒' },   { nome: 'PEIXES', simbolo: '♓' }
];

ctx.fillStyle = textColor;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

signos.forEach((signo, i) => {
  const angleDeg = i * 30 - 90;
  const angle = angleDeg * Math.PI / 180;
  const symbolRadius = radius - 140;
  const labelRadius = radius - 90;

  const xSymbol = centerX + symbolRadius * Math.cos(angle);
  const ySymbol = centerY + symbolRadius * Math.sin(angle) - 20;

  const xLabel = centerX + labelRadius * Math.cos(angle);
  const yLabel = centerY + labelRadius * Math.sin(angle) + 20;

  // Símbolo com fonte Noto Sans Symbols
  ctx.font = 'bold 48px "Noto Sans Symbols"';
  ctx.fillText(signo.simbolo, xSymbol, ySymbol);

  // Nome do signo com fonte Inter
  ctx.font = 'bold 32px Inter';
  ctx.fillText(signo.nome, xLabel, yLabel);
});

// Salvar imagem
const outputPath = path.join(__dirname, '../chart-preview.png');
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Imagem gerada com sucesso:', outputPath));
