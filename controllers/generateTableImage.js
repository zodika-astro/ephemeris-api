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
// FONT_TITLE e FONT_SUBTITLE foram removidos ou não serão usados para títulos.
const FONT_TABLE_HEADER = 'bold 16px Inter'; // Cabeçalho da tabela
const FONT_TABLE_TEXT = '14px Inter'; // Texto da tabela
const FONT_SYMBOLS = '20px Inter'; // Para símbolos de planetas e signos
const FONT_ASPECT_SYMBOLS = '18px Inter'; // Para símbolos de aspectos

const PADDING = 30; // Preenchimento geral das margens
const ROW_HEIGHT = 30; // Altura de cada linha na tabela
// Ajusta a posição Y inicial da tabela para compensar a remoção do título principal
const TABLE_START_Y = PADDING * 2;
const ASPECT_MATRIX_CELL_SIZE = 40; // Tamanho da célula na matriz de aspectos

// Larguras das colunas para a tabela de posições dos planetas
const TABLE_COL_WIDTHS = {
  symbol: 40,    // Símbolo do planeta (primeira coluna da tabela combinada)
  planet: 120,   // Nome do planeta
  positionDetails: 380, // Coluna unificada para Grau, Signo, Minutos, Segundos e Retrógrado
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
  pluto: '♇', trueNode: '☊', lilith: '☭', chiron: '⚷'
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

// Símbolos astrológicos para aspectos
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
 * Formata as informações de posição de um planeta em uma única string.
 * Formato: Grau(°), Signo, Minutos (') Segundos (") e Retrógrado (R)
 * @param {string} planet - O nome do planeta.
 * @param {object} data - Objeto contendo dados dos signos dos planetas.
 * @param {object} degrees - Objeto contendo os graus absolutos dos planetas.
 * @returns {string} - A string formatada (e.g., "15° Touro, 27' 24" (R)").
 */
const formatPositionDetails = (planet, data, degrees) => {
  const degreeValue = degrees[planet];
  // Grau dentro do signo (0-29)
  const d = Math.floor(degreeValue % 30);
  const m = Math.floor((degreeValue * 60) % 60); // Minutos
  const s = Math.round((degreeValue * 3600) % 60); // Segundos

  const sign = data[planet]?.sign || '-';
  const signPt = SIGN_LABELS_PT[sign] || sign;
  const retro = data[planet]?.retrograde === 'yes' ? ' (R)' : '';

  return `${d}° ${signPt}, ${m}' ${s}"${retro}`.trim();
};

/**
 * Calcula o aspecto entre dois graus.
 * Esta é uma função simplificada para demonstração, considerando orbes básicas.
 * @param {number} degree1 - Grau do primeiro planeta.
 * @param {number} degree2 - Grau do segundo planeta.
 * @returns {string} - Símbolo do aspecto ou vazio se não houver aspecto principal.
 */
const calculateAspect = (degree1, degree2) => {
  const diff = Math.abs(degree1 - degree2);
  const normalizedDiff = diff % 180; // Normaliza a diferença para 0-180

  // Orbes de exemplo (você pode ajustar estes valores)
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
  return ''; // Nenhum aspecto principal detectado
};

/**
 * Retorna a cor para um símbolo de aspecto específico.
 * @param {string} aspectSymbol - O símbolo do aspecto.
 * @returns {string} - A cor definida nas constantes COLORS.
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
      return COLORS.TEXT; // Cor padrão para aspectos não definidos ou vazios
  }
};

/**
 * Gera uma imagem de tabela de mapa natal combinando posições de planetas e matriz de aspectos.
 * @param {object} chartData - Dados do mapa natal, incluindo planetas e seus graus e signos.
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

  // --- Tabela Combinada de Posições e Aspectos ---
  // Removido o título principal e o subtítulo "Posições e Aspectos dos Planetas"
  // Ajusta a posição Y inicial da tabela para compensar a remoção do título principal
  let currentY = TABLE_START_Y;
  let currentX = PADDING;

  // --- Desenha o Cabeçalho da Tabela Combinada ---
  ctx.font = FONT_TABLE_HEADER;
  ctx.fillStyle = COLORS.HEADER;
  ctx.strokeStyle = COLORS.TABLE_BORDER;
  ctx.lineWidth = 1;

  let headerX = currentX;

  // Célula vazia no canto superior esquerdo
  ctx.strokeRect(headerX, currentY, TABLE_COL_WIDTHS.symbol, ROW_HEIGHT);
  headerX += TABLE_COL_WIDTHS.symbol;

  // Cabeçalho da coluna "Planeta"
  ctx.strokeRect(headerX, currentY, TABLE_COL_WIDTHS.planet, ROW_HEIGHT);
  ctx.fillText('Planeta', headerX + 5, currentY + ROW_HEIGHT - 8);
  headerX += TABLE_COL_WIDTHS.planet;

  // Cabeçalho da coluna "Posição" (grau, signo, retro)
  ctx.strokeRect(headerX, currentY, TABLE_COL_WIDTHS.positionDetails, ROW_HEIGHT);
  ctx.fillText('Posição', headerX + 5, currentY + ROW_HEIGHT - 8);
  headerX += TABLE_COL_WIDTHS.positionDetails;

  // Cabeçalhos horizontais da matriz de aspectos (símbolos dos planetas)
  ctx.font = FONT_SYMBOLS; // Usa fonte para símbolos
  ctx.textAlign = 'center'; // Centraliza o texto para os símbolos
  planetsList.forEach((planet, i) => {
    ctx.strokeRect(headerX, currentY, ASPECT_MATRIX_CELL_SIZE, ROW_HEIGHT);
    ctx.fillText(PLANET_SYMBOLS[planet] || '', headerX + ASPECT_MATRIX_CELL_SIZE / 2, currentY + ROW_HEIGHT - 8);
    headerX += ASPECT_MATRIX_CELL_SIZE;
  });
  ctx.textAlign = 'left'; // Reseta o alinhamento para o padrão

  currentY += ROW_HEIGHT; // Move para a próxima linha (primeira linha de dados)

  // --- Desenha as Linhas de Dados da Tabela Combinada ---
  planetsList.forEach((planetRow, rowIndex) => {
    // Fundo alternado para as linhas para melhor legibilidade
    if (rowIndex % 2 === 1) {
      ctx.fillStyle = COLORS.ROW_ALTERNATE_BG;
      // Calcula a largura total da linha da tabela combinada
      const totalRowWidth = TABLE_COL_WIDTHS.symbol + TABLE_COL_WIDTHS.planet + TABLE_COL_WIDTHS.positionDetails + (planetsList.length * ASPECT_MATRIX_CELL_SIZE);
      ctx.fillRect(currentX, currentY, totalRowWidth, ROW_HEIGHT);
      ctx.fillStyle = COLORS.TEXT; // Volta para a cor do texto
    } else {
      ctx.fillStyle = COLORS.TEXT;
    }

    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.lineWidth = 1;

    let colX = currentX;

    // Primeira coluna: Símbolo do Planeta (como cabeçalho da linha)
    ctx.font = FONT_SYMBOLS;
    ctx.fillText(PLANET_SYMBOLS[planetRow] || '', colX + 10, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.symbol, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.symbol;

    // Segunda coluna: Nome do Planeta
    ctx.font = FONT_TABLE_TEXT;
    ctx.fillText(PLANET_LABELS_PT[planetRow] || planetRow, colX + 5, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.planet, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.planet;

    // Terceira coluna: Detalhes da Posição (Grau, Signo, Minutos, Segundos, Retrógrado)
    ctx.fillText(formatPositionDetails(planetRow, signs, degrees), colX + 5, currentY + ROW_HEIGHT - 8);
    ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.positionDetails, ROW_HEIGHT);
    colX += TABLE_COL_WIDTHS.positionDetails;

    // Células da Matriz de Aspectos para esta linha
    ctx.font = FONT_ASPECT_SYMBOLS; // Fonte para os símbolos de aspecto
    ctx.textAlign = 'center'; // Centraliza os símbolos de aspecto
    planetsList.forEach((planetCol, colIndex) => {
      ctx.strokeRect(colX, currentY, ASPECT_MATRIX_CELL_SIZE, ROW_HEIGHT);
      if (rowIndex === colIndex) {
        // Célula diagonal: planeta com ele mesmo
        ctx.fillStyle = COLORS.TEXT;
        ctx.fillText('-', colX + ASPECT_MATRIX_CELL_SIZE / 2, currentY + ROW_HEIGHT - 8);
      } else {
        // Calcula e desenha o símbolo do aspecto
        const aspectSymbol = calculateAspect(degrees[planetRow], degrees[planetCol]);
        ctx.fillStyle = getAspectColor(aspectSymbol); // Define a cor com base no aspecto
        ctx.fillText(aspectSymbol, colX + ASPECT_MATRIX_CELL_SIZE / 2, currentY + ROW_HEIGHT - 8);
      }
      colX += ASPECT_MATRIX_CELL_SIZE;
    });
    ctx.textAlign = 'left'; // Reseta o alinhamento para o padrão

    currentY += ROW_HEIGHT; // Move para a próxima linha
  });

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalTableImage };
