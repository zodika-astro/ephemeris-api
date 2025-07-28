'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Register project fonts
// Certifique-se de que os arquivos de fonte Inter-Bold.ttf e Inter-Regular.ttf
// estejam disponíveis no diretório '../fonts/' em relação ao local de execução.
const interFontPathBold = path.join(__dirname, '../fonts/Inter-Bold.ttf');
const interFontPathRegular = path.join(__dirname, '../fonts/Inter-Regular.ttf');

if (fs.existsSync(interFontPathBold)) {
  registerFont(interFontPathBold, { family: 'Inter', weight: 'bold' });
} else {
  console.warn(`Fonte Inter-Bold.ttf não encontrada em: ${interFontPathBold}. Usando fonte padrão.`);
}

if (fs.existsSync(interFontPathRegular)) {
  registerFont(interFontPathRegular, { family: 'Inter', weight: 'normal' });
} else {
  console.warn(`Fonte Inter-Regular.ttf não encontrada em: ${interFontPathRegular}. Usando fonte padrão.`);
}


// Color and layout constants
const WIDTH = 1536; // Largura do canvas
const HEIGHT = 768; // Altura do canvas
const COLORS = {
  BACKGROUND: '#FFFBF4', // Cor de fundo do canvas
  TEXT: '#29281E',      // Cor principal do texto
  HEADER: '#1A1E3B',    // Cor para títulos e cabeçalhos
  TABLE_BORDER: '#CCCCCC', // Cor das bordas da tabela
  ROW_ALTERNATE_BG: '#F8F8F8', // Cor de fundo para linhas alternadas da tabela
  ASPECT_CONJUNCTION: '#000000', // Preto para Conjunção
  ASPECT_OPPOSITION: '#FF0000',  // Vermelho para Oposição
  ASPECT_TRINE: '#008000',       // Verde para Trígono
  ASPECT_SQUARE: '#FFA500',      // Laranja para Quadratura
  ASPECT_SEXTILE: '#0000FF'      // Azul para Sextil
};

// Definições de fontes para diferentes elementos visuais
const FONT_TITLE = 'bold 40px Inter'; // Título principal
const FONT_SUBTITLE = 'bold 24px Inter'; // Subtítulos (Planetas, Aspectos)
const FONT_TABLE_HEADER = 'bold 16px Inter'; // Cabeçalho da tabela
const FONT_TABLE_TEXT = '14px Inter'; // Texto da tabela
const FONT_SYMBOLS = '20px Inter'; // Para símbolos de planetas e signos
const FONT_ASPECT_SYMBOLS = '18px Inter'; // Para símbolos de aspectos

const PADDING = 30; // Preenchimento geral das margens
const ROW_HEIGHT = 30; // Altura de cada linha na tabela
const TABLE_START_Y = 120; // Posição Y inicial da tabela principal
const ASPECT_MATRIX_CELL_SIZE = 40; // Tamanho da célula na matriz de aspectos

// Larguras das colunas para a tabela de posições dos planetas
const TABLE_COL_WIDTHS = {
  symbol: 40,    // Símbolo do planeta
  planet: 120,   // Nome do planeta
  degree: 160,   // Grau, minuto, segundo
  sign: 120,     // Signo e símbolo do signo
  retro: 100     // Status de retrógrado
};

// Mapeamento de rótulos de planetas para português
const PLANET_LABELS_PT = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
  jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno',
  pluto: 'Plutão', trueNode: 'Nodo Norte', lilith: 'Lilith', chiron: 'Quíron'
};

// Símbolos astrológicos para planetas
const PLANET_SYMBOLS = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆',
  pluto: '♇', trueNode: '☊', lilith: '⚸', chiron: '⚷' // Lilith ajustado para um símbolo mais comum
};

// Mapeamento de rótulos de signos para português
const SIGN_LABELS_PT = {
  Aries: 'Áries', Taurus: 'Touro', Gemini: 'Gêmeos', Cancer: 'Câncer', Leo: 'Leão',
  Virgo: 'Virgem', Libra: 'Libra', Scorpio: 'Escorpião', Sagittarius: 'Sagitário',
  Capricorn: 'Capricórnio', Aquarius: 'Aquário', Pisces: 'Peixes'
};

// Símbolos astrológicos para signos
const SIGN_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌',
  Virgo: '♍', Libra: '♎', Scorpio: '♏', Sagittarius: '♐',
  Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

// Símbolos astrológicos para aspectos (exemplo)
const ASPECT_SYMBOLS = {
  conjunction: '☌', // 0°
  opposition: '☍',  // 180°
  trine: '△',       // 120°
  square: '□',      // 90°
  sextile: '⚹',      // 60°
  quincunx: '⚻',     // 150°
  semisextile: '⚺',  // 30°
  semisquare: '∠',   // 45°
  sesquiquadrate: '⚼' // 135°
};

/**
 * Formata um valor de grau em graus, minutos e segundos.
 * @param {number} degree - O valor do grau (e.g., 15.4567).
 * @returns {string} - A string formatada (e.g., "15° 27' 24"").
 */
const formatDegree = (degree) => {
  const totalSeconds = (degree % 30) * 3600; // Pega apenas a parte fracionária do signo e converte para segundos
  const d = Math.floor(degree); // Graus inteiros
  const m = Math.floor((degree * 60) % 60); // Minutos
  const s = Math.round((degree * 3600) % 60); // Segundos
  return `${d}° ${m}' ${s}"`.trim();
};

/**
 * Calcula o aspecto entre dois graus.
 * Esta é uma função simplificada para demonstração.
 * Em uma aplicação real, você precisaria de uma lógica astrológica mais complexa
 * considerando orbes e tipos de aspectos.
 * @param {number} degree1 - Grau do primeiro planeta.
 * @param {number} degree2 - Grau do segundo planeta.
 * @returns {string} - Símbolo do aspecto ou vazio se não houver aspecto principal.
 */
const calculateAspect = (degree1, degree2) => {
  const diff = Math.abs(degree1 - degree2);
  const normalizedDiff = diff % 180; // Normaliza a diferença para 0-180

  // Orbes de exemplo (você pode ajustar)
  const orbConjunction = 8;
  const orbOpposition = 8;
  const orbTrine = 7;
  const orbSquare = 7;
  const orbSextile = 5;

  if (normalizedDiff < orbConjunction || normalizedDiff > 360 - orbConjunction) {
    return ASPECT_SYMBOLS.conjunction;
  } else if (Math.abs(normalizedDiff - 180) < orbOpposition) {
    return ASPECT_SYMBOLS.opposition;
  } else if (Math.abs(normalizedDiff - 120) < orbTrine) {
    return ASPECT_SYMBOLS.trine;
  } else if (Math.abs(normalizedDiff - 90) < orbSquare) {
    return ASPECT_SYMBOLS.square;
  } else if (Math.abs(normalizedDiff - 60) < orbSextile) {
    return ASPECT_SYMBOLS.sextile;
  }
  // Adicione mais aspectos conforme necessário
  return ''; // Nenhum aspecto principal
};

/**
 * Retorna a cor para um símbolo de aspecto.
 * @param {string} aspectSymbol - O símbolo do aspecto.
 * @returns {string} - A cor definida em COLORS.
 */
const getAspectColor = (aspectSymbol) => {
  switch (aspectSymbol) {
    case ASPECT_SYMBOLS.conjunction:
      return COLORS.ASPECT_CONJUNCTION;
    case ASPECT_SYMBOLS.opposition:
      return COLORS.ASPECT_OPPOSITION;
    case ASPECT_SYMBOLS.trine:
      return COLORS.ASPECT_TRINE;
    case ASPECT_SYMBOLS.square:
      return COLORS.ASPECT_SQUARE;
    case ASPECT_SYMBOLS.sextile:
      return COLORS.ASPECT_SEXTILE;
    default:
      return COLORS.TEXT; // Cor padrão
  }
};


/**
 * Gera uma imagem de tabela de mapa natal com posições de planetas e matriz de aspectos.
 * @param {object} chartData - Dados do mapa natal, incluindo planetas e graus.
 * @returns {Buffer} - Buffer da imagem PNG gerada.
 */
async function generateNatalTableImage(chartData) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const planetsList = Object.keys(chartData.planets);
  const degrees = chartData.geo;
  const signs = chartData.planets;

  // Preenche o fundo do canvas
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // --- Título Principal ---
  ctx.font = FONT_TITLE;
  ctx.fillStyle = COLORS.HEADER;
  ctx.textAlign = 'center';
  ctx.fillText('Mapa Natal', WIDTH / 2, PADDING * 2);

  // --- Tabela de Posições dos Planetas ---
  ctx.textAlign = 'left';
  ctx.font = FONT_SUBTITLE;
  ctx.fillStyle = COLORS.TEXT;
  ctx.fillText('Posições dos Planetas', PADDING, TABLE_START_Y - 40);

  let currentY = TABLE_START_Y;
  let currentX = PADDING;

  // Desenha o cabeçalho da tabela de posições
  const drawTableHeader = () => {
    ctx.font = FONT_TABLE_HEADER;
    ctx.fillStyle = COLORS.HEADER;
    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.lineWidth = 1;

    let headerX = currentX;
    const headers = [
      { text: '', width: TABLE_COL_WIDTHS.symbol },
      { text: 'Planeta', width: TABLE_COL_WIDTHS.planet },
      { text: 'Grau', width: TABLE_COL_WIDTHS.degree },
      { text: 'Signo', width: TABLE_COL_WIDTHS.sign },
      { text: 'Retrógrado', width: TABLE_COL_WIDTHS.retro }
    ];

    headers.forEach(header => {
      ctx.strokeRect(headerX, currentY, header.width, ROW_HEIGHT);
      ctx.fillText(header.text, headerX + 5, currentY + ROW_HEIGHT - 8); // Ajuste para alinhamento do texto
      headerX += header.width;
    });
    currentY += ROW_HEIGHT;
  };

  drawTableHeader();

  // Desenha as linhas da tabela de posições
  planetsList.forEach((planet, index) => {
    const labelText = PLANET_LABELS_PT[planet] || planet;
    const symbol = PLANET_SYMBOLS[planet] || '';
    const degreeValue = degrees[planet];
    const formattedDegree = formatDegree(degreeValue);
    const sign = signs[planet]?.sign || '-';
    const signPt = SIGN_LABELS_PT[sign] || sign;
    const retro = signs[planet]?.retrograde === 'yes' ? 'Sim' : '';

    // Fundo alternado para as linhas para melhor legibilidade
    if (index % 2 === 1) {
      ctx.fillStyle = COLORS.ROW_ALTERNATE_BG;
      // Calcula a largura total da tabela de posições
      const totalTableWidth = Object.values(TABLE_COL_WIDTHS).reduce((a, b) => a + b, 0);
      ctx.fillRect(currentX, currentY, totalTableWidth, ROW_HEIGHT);
      ctx.fillStyle = COLORS.TEXT; // Volta para a cor do texto
    } else {
      ctx.fillStyle = COLORS.TEXT;
    }

    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.lineWidth = 1;

    let colX = currentX;

    // Coluna do Símbolo do Planeta
    ctx.font = FONT_SYMBOLS; // Fonte maior para símbolos
    ctx.fillText(symbol, colX + 10, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.symbol, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.symbol;

    // Coluna do Nome do Planeta
    ctx.font = FONT_TABLE_TEXT; // Volta para a fonte normal do texto
    ctx.fillText(labelText, colX + 5, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.planet, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.planet;

    // Coluna do Grau
    ctx.fillText(formattedDegree, colX + 5, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.degree, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.degree;

    // Coluna do Signo (com símbolo)
    ctx.fillText(`${SIGN_SYMBOLS[sign] || ''} ${signPt}`, colX + 5, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.sign, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.sign;

    // Coluna de Retrógrado
    ctx.fillText(retro, colX + 5, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.retro, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.retro;

    currentY += ROW_HEIGHT;
  });

  // --- Matriz de Aspectos ---
  // Calcula a posição X inicial da matriz de aspectos (depois da tabela de planetas + padding)
  const aspectMatrixStartX = currentX + Object.values(TABLE_COL_WIDTHS).reduce((a, b) => a + b, 0) + PADDING * 2;
  const aspectMatrixStartY = TABLE_START_Y;

  ctx.font = FONT_SUBTITLE;
  ctx.fillStyle = COLORS.TEXT;
  ctx.fillText('Matriz de Aspectos', aspectMatrixStartX, aspectMatrixStartY - 40);

  // Desenha os cabeçalhos da matriz de aspectos (símbolos dos planetas)
  ctx.font = FONT_SYMBOLS;
  ctx.textAlign = 'center'; // Centraliza o texto para os símbolos

  // Cabeçalhos das colunas (horizontal)
  planetsList.forEach((planet, i) => {
    ctx.fillText(PLANET_SYMBOLS[planet] || '', aspectMatrixStartX + (i + 1) * ASPECT_MATRIX_CELL_SIZE + ASPECT_MATRIX_CELL_SIZE / 2, aspectMatrixStartY + ROW_HEIGHT - 8);
  });

  // Cabeçalhos das linhas (vertical)
  planetsList.forEach((planet, i) => {
    ctx.fillText(PLANET_SYMBOLS[planet] || '', aspectMatrixStartX + ASPECT_MATRIX_CELL_SIZE / 2, aspectMatrixStartY + (i + 1) * ROW_HEIGHT - 8);
  });
  ctx.textAlign = 'left'; // Reseta o alinhamento para o padrão

  // Desenha a grade da matriz de aspectos
  ctx.strokeStyle = COLORS.TABLE_BORDER;
  ctx.lineWidth = 1;

  // Desenha as células da grade, incluindo a linha e a coluna de cabeçalho
  for (let i = 0; i < planetsList.length + 1; i++) {
    for (let j = 0; j < planetsList.length + 1; j++) {
      ctx.strokeRect(aspectMatrixStartX + j * ASPECT_MATRIX_CELL_SIZE, aspectMatrixStartY + i * ROW_HEIGHT, ASPECT_MATRIX_CELL_SIZE, ROW_HEIGHT);
    }
  }

  // Preenche a matriz com os aspectos calculados
  ctx.font = FONT_ASPECT_SYMBOLS; // Fonte para os símbolos de aspecto
  ctx.textAlign = 'center'; // Centraliza os símbolos de aspecto

  for (let row = 0; row < planetsList.length; row++) {
    for (let col = 0; col < planetsList.length; col++) {
      // Pula a célula diagonal (planeta com ele mesmo)
      if (row === col) {
        ctx.fillStyle = COLORS.TEXT;
        ctx.fillText('-', aspectMatrixStartX + (col + 1) * ASPECT_MATRIX_CELL_SIZE + ASPECT_MATRIX_CELL_SIZE / 2, aspectMatrixStartY + (row + 1) * ROW_HEIGHT - 8);
      } else {
        const planet1 = planetsList[row];
        const planet2 = planetsList[col];
        const aspectSymbol = calculateAspect(degrees[planet1], degrees[planet2]);

        ctx.fillStyle = getAspectColor(aspectSymbol); // Define a cor com base no aspecto
        ctx.fillText(aspectSymbol, aspectMatrixStartX + (col + 1) * ASPECT_MATRIX_CELL_SIZE + ASPECT_MATRIX_CELL_SIZE / 2, aspectMatrixStartY + (row + 1) * ROW_HEIGHT - 8);
      }
    }
  }
  ctx.textAlign = 'left'; // Reseta o alinhamento para o padrão

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalTableImage };
