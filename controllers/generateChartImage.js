const { createCanvas } = require('canvas');
const fs = require('fs');

const width = 1200;
const height = 1200;
const centerX = width / 2;
const centerY = height / 2;
const radius = 550;
const signos = [
  { nome: 'Áries', simbolo: '♈' },
  { nome: 'Touro', simbolo: '♉' },
  { nome: 'Gêmeos', simbolo: '♊' },
  { nome: 'Câncer', simbolo: '♋' },
  { nome: 'Leão', simbolo: '♌' },
  { nome: 'Virgem', simbolo: '♍' },
  { nome: 'Libra', simbolo: '♎' },
  { nome: 'Escorpião', simbolo: '♏' },
  { nome: 'Sagitário', simbolo: '♐' },
  { nome: 'Capricórnio', simbolo: '♑' },
  { nome: 'Aquário', simbolo: '♒' },
  { nome: 'Peixes', simbolo: '♓' }
];

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Fundo
ctx.fillStyle = '#FFFBF4';
ctx.fillRect(0, 0, width, height);

// Círculo externo
ctx.strokeStyle = '#29281E';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.stroke();

// Linhas divisórias e signos
ctx.font = '28px Inter';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#29281E';

for (let i = 0; i < 12; i++) {
  const angle = (i * 30) * (Math.PI / 180);
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Posição do texto
  const textAngle = ((i + 0.5) * 30) * (Math.PI / 180);
  const textRadius = radius - 60;
  const textX = centerX + textRadius * Math.cos(textAngle);
  const textY = centerY + textRadius * Math.sin(textAngle);

  ctx.fillText(signos[i].simbolo, textX, textY - 15);
  ctx.fillText(signos[i].nome, textX, textY + 15);
}

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('chart-preview.png', buffer);
console.log('Mapa gerado com signos e salvo como chart-preview.png');
