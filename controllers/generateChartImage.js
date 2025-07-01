const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Verificação de fontes
const fontPaths = {
  interBold: path.join(__dirname, '../fonts/Inter-Bold.ttf'),
  notoSymbols: path.join(__dirname, '../fonts/NotoSansSymbols-Regular.ttf')
};

// Checa se arquivos existem
Object.entries(fontPaths).forEach(([name, path]) => {
  if (!fs.existsSync(path)) {
    console.error(`Fonte ${name} não encontrada em: ${path}`);
  }
});

// Registro seguro
try {
  registerFont(fontPaths.interBold, { family: 'Inter', weight: 'bold' });
  registerFont(fontPaths.notoSymbols, { family: 'Noto Sans Symbols' });
} catch (e) {
  console.warn('Registro de fontes falhou, usando fallback:', e.message);
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

// Círculos concêntricos
ctx.strokeStyle = lineColor;
ctx.lineWidth = 2;

// Círculo externo
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.stroke();

// Círculo médio
ctx.beginPath();
ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI);
ctx.stroke();

// Círculo interno
ctx.beginPath();
ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
ctx.stroke();

// Linhas das casas
for (let i = 0; i < 12; i++) {
  const angle = (i * 30) * Math.PI / 180;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  // Marcadores curtos
  const markerLength = radius * 0.05;
  const x1 = centerX + (radius * 0.8) * Math.cos(angle);
  const y1 = centerY + (radius * 0.8) * Math.sin(angle);
  const x2 = centerX + (radius * 0.8 + markerLength) * Math.cos(angle);
  const y2 = centerY + (radius * 0.8 + markerLength) * Math.sin(angle);
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Signos zodiacais em ordem correta (anti-horária)
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

// Marcadores de graus (5 em 5 graus)
for (let deg = 0; deg < 360; deg += 5) {
  const angle = deg * Math.PI / 180;
  const outer = deg % 10 === 0 ? 20 : 15;
  const inner = deg % 10 === 0 ? 35 : 30;
  
  ctx.beginPath();
  ctx.moveTo(
    centerX + (radius - outer) * Math.cos(angle),
    centerY + (radius - outer) * Math.sin(angle)
  );
  ctx.lineTo(
    centerX + (radius - inner) * Math.cos(angle),
    centerY + (radius - inner) * Math.sin(angle)
  );
  ctx.stroke();
  
  // Rótulos a cada 10 graus
  if (deg % 10 === 0) {
    ctx.font = 'bold 16px Inter';
    ctx.fillText(
      deg.toString(),
      centerX + (radius - 50) * Math.cos(angle),
      centerY + (radius - 50) * Math.sin(angle)
    );
  }
}

// Signos zodiacais
signos.forEach(signo => {
  const angleDeg = signo.startDeg + 15;
  const angle = angleDeg * Math.PI / 180;
  
  // Símbolo
  const symbolRadius = radius - 70;
  try {
    ctx.font = 'bold 48px "Noto Sans Symbols"';
    ctx.fillText(
      signo.simbolo,
      centerX + symbolRadius * Math.cos(angle),
      centerY + symbolRadius * Math.sin(angle)
    );
  } catch (e) {
    ctx.font = 'bold 48px Inter';
    ctx.fillText(
      signo.simbolo,
      centerX + symbolRadius * Math.cos(angle),
      centerY + symbolRadius * Math.sin(angle)
    );
  }
  
  // Nome do signo (curvado)
  const nameRadius = radius - 120;
  const nameAngle = angleDeg - 90;
  const letters = signo.nome.split('');
  const letterSpacing = 12;
  
  letters.forEach((letter, i) => {
    const letterAngle = nameAngle * Math.PI / 180 + (i - (letters.length - 1) / 2) * (letterSpacing / nameRadius);
    const x = centerX + nameRadius * Math.cos(letterAngle);
    const y = centerY + nameRadius * Math.sin(letterAngle);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(letterAngle + Math.PI / 2);
    ctx.font = 'bold 22px Inter';
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  });
});

// Números das casas (1-12)
for (let i = 0; i < 12; i++) {
  const angleDeg = i * 30 + 15;
  const angle = angleDeg * Math.PI / 180;
  const houseRadius = radius * 0.6;
  
  ctx.font = 'bold 28px Inter';
  ctx.fillText(
    (i + 1).toString(),
    centerX + houseRadius * Math.cos(angle),
    centerY + houseRadius * Math.sin(angle)
  );
}

// Texto central
ctx.fillStyle = textColor;
ctx.font = 'bold 36px Inter';
ctx.fillText('ZODIKA', centerX, centerY - 30);
ctx.font = '24px Inter';
ctx.fillText('www.zodika.com.br', centerX, centerY + 30);

// Exemplo de planetas (substitua com dados reais)
const planetas = [
  { simbolo: '☉', nome: 'Sol', posicao: 45, casa: 2 },
  { simbolo: '☽', nome: 'Lua', posicao: 120, casa: 4 },
  { simbolo: '♀', nome: 'Vênus', posicao: 75, casa: 3 }
];

// Desenhar planetas
planetas.forEach(planeta => {
  const angle = planeta.posicao * Math.PI / 180;
  const planetRadius = radius * 0.35;
  
  ctx.font = 'bold 36px "Noto Sans Symbols"';
  ctx.fillStyle = accentColor;
  ctx.fillText(
    planeta.simbolo,
    centerX + planetRadius * Math.cos(angle),
    centerY + planetRadius * Math.sin(angle)
  );
  
  ctx.font = '14px Inter';
  ctx.fillStyle = textColor;
  ctx.fillText(
    `${planeta.nome} ${planeta.posicao}°`,
    centerX + planetRadius * Math.cos(angle),
    centerY + planetRadius * Math.sin(angle) + 30
  );
});

// Salvar imagem
const outputPath = path.join(__dirname, '../chart-preview.png');
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Gráfico gerado com sucesso:', outputPath));
