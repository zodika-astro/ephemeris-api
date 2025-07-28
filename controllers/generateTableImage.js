'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Registrar fontes do projeto
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


// Constantes de cor e layout
const WIDTH = 1536; // Largura do canvas mantida no valor original
// HEIGHT será calculado dinamicamente
const COLORS = {
  BACKGROUND: '#FFFBF4', // Cor de fundo do canvas
  TEXT: '#29281E',      // Cor principal do texto
  HEADER: '#1A1E3B',    // Cor para títulos e cabeçalhos
  TABLE_BORDER: '#CCCCCC', // Cor das bordas da tabela
  ASPECT_CONJUNCTION: '#000000', // Preto para Conjunção
  ASPECT_OPPOSITION: '#FF0000',  // Vermelho para Oposição
  ASPECT_TRINE: '#0000FF',       // Azul para Trígono (alterado de verde)
  ASPECT_SQUARE: '#FF0000',      // Vermelho para Quadratura (alterado de laranja)
  ASPECT_SEXTILE: '#0000FF'      // Azul para Sextil
};

// Definições de fontes para diferentes elementos visuais
const FONT_TABLE_HEADER = 'bold 16px Inter'; // Cabeçalho da tabela
const FONT_TABLE_TEXT = '14px Inter'; // Texto da tabela
const FONT_SYMBOLS = '20px Inter'; // Para símbolos de planetas e signos
const FONT_ASPECT_SYMBOLS = '18px Inter'; // Para símbolos de aspectos

const PADDING = 30; // Preenchimento geral das margens
const ROW_HEIGHT = 30; // Altura de cada linha na tabela
const TABLE_START_Y = PADDING; // Posição Y inicial da tabela (ajustada pela remoção dos títulos)
const ASPECT_MATRIX_CELL_SIZE = 40; // Tamanho da célula na matriz de aspectos

// Larguras das colunas para a tabela de posições dos planetas
const TABLE_COL_WIDTHS = {
  symbol: 40,    // Símbolo do planeta (primeira coluna da tabela combinada)
  planet: 120 * 0.70,   // Nome do planeta (diminuído em 30%)
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
  sextile: '⚹'      // 60°
};

// --- Definições de Aspectos e Orbe Padrão (copiado de controllers/ephemeris.js) ---
const ASPECT_DEFINITIONS = [
  { name: "conjunction", degree: 0 },
  { name: "sextile", degree: 60 },
  { name: "square", degree: 90 },
  { name: "trine", degree: 120 },
  { name: "opposition", degree: 180 }
];
const DEFAULT_ORB = 6; // Orbe padrão, ajuste conforme necessário para sua precisão

// --- Mapeamento de Elementos e Qualidades para português (NOVO) ---
const ELEMENT_LABELS_PT = {
  fire: 'Fogo',
  earth: 'Terra',
  air: 'Ar',
  water: 'Água'
};

const QUALITY_LABELS_PT = {
  cardinal: 'Cardinais',
  fixed: 'Fixos',
  mutable: 'Mutáveis'
};

// Element and modality classification (copiado de ephemeris.js para auto-contenção)
const SIGN_ELEMENT_MAP = {
  "Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
  "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
  "Gemini": "air", "Libra": "air", "Aquarius": "air",
  "Cancer": "water", "Scorpio": "water", "Pisces": "water"
};

const SIGN_QUALITY_MAP = {
  "Aries": "cardinal", "Cancer": "cardinal", "Libra": "cardinal", "Capricorn": "cardinal",
  "Taurus": "fixed", "Leo": "fixed", "Scorpio": "fixed", "Aquarius": "fixed",
  "Gemini": "mutable", "Virgo": "mutable", "Sagittarius": "mutable", "Pisces": "mutable"
};


/**
 * Formata as informações de posição de um planeta em uma única string.
 * Formato: Grau(°), Signo, Minutos (') Segundos (") e Retrógrado (R)
 * O grau exibido é o grau dentro do signo (0-29).
 * @param {string} planet - O nome do planeta.
 * @param {object} data - Objeto contendo dados dos signos dos planetas.
 * @param {object} degrees - Objeto contendo os graus absolutos dos planetas.
 * @returns {string} - A string formatada (e.g., "15° Touro, 27' 24" (R)").
 */
const formatPositionDetails = (planet, data, degrees) => {
  const degreeValue = degrees[planet]; // Ex: 35.4567 (grau absoluto 0-360)
  // Calcula o grau dentro do signo (0-29)
  const d = Math.floor(degreeValue % 30);
  const m = Math.floor((degreeValue * 60) % 60); // Minutos
  const s = Math.round((degreeValue * 3600) % 60); // Segundos

  const sign = data[planet]?.sign || '-';
  const signPt = SIGN_LABELS_PT[sign] || sign;
  const retro = data[planet]?.retrograde === 'yes' ? ' (R)' : '';

  return `${d}° ${signPt}, ${m}' ${s}"${retro}`.trim();
};

/**
 * Calcula o aspecto entre dois graus usando as definições de aspecto e orbes.
 * A lógica é baseada na função `computeAspects` do seu `ephemeris.js`.
 * @param {number} degree1 - Grau do primeiro planeta.
 * @param {number} degree2 - Grau do segundo planeta.
 * @returns {string} - Símbolo do aspecto ou vazio se não houver aspecto principal.
 */
const calculateAspect = (degree1, degree2) => {
  let diff = Math.abs(degree1 - degree2);
  // Normaliza a diferença para estar entre 0 e 180 graus, como no ephemeris.js
  if (diff > 180) {
    diff = 360 - diff;
  }

  for (const { name, degree } of ASPECT_DEFINITIONS) {
    // Verifica se a diferença está dentro da orbe para o aspecto
    if (diff >= (degree - DEFAULT_ORB) && diff <= (degree + DEFAULT_ORB)) {
      // Retorna o símbolo correspondente ao aspecto encontrado
      return ASPECT_SYMBOLS[name];
    }
  }
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
 * Retorna o status traduzido para português.
 * @param {string} status - O status em inglês (lack, balance, excess).
 * @returns {string} - O status traduzido para português.
 */
const getTranslatedStatus = (status) => {
  switch (status) {
    case 'lack':
      return 'Falta';
    case 'balance':
      return 'Equilíbrio';
    case 'excess':
      return 'Excesso';
    default:
      return status;
  }
};

/**
 * Gera uma imagem de tabela de mapa natal combinando posições de planetas e matriz de aspectos.
 * @param {object} chartData - Dados do mapa natal, incluindo planetas e seus graus e signos.
 * @returns {Buffer} - Buffer da imagem PNG gerada.
 */
async function generateNatalTableImage(chartData) {
  const planetsList = Object.keys(chartData.planets);
  const degrees = chartData.geo;
  const signs = chartData.planets;

  // Pre-processar planetas e pontos para tabelas de Elementos e Qualidades
  const elementsPlanets = { fire: [], earth: [], air: [], water: [] };
  const qualitiesPlanets = { cardinal: [], fixed: [], mutable: [] };

  // Helper para adicionar planeta/ponto à lista correta de elemento/qualidade
  const addPointToCategories = (pointName, sign) => {
    if (!sign) return; // Garante que o signo exista

    const element = SIGN_ELEMENT_MAP[sign];
    const quality = SIGN_QUALITY_MAP[sign];

    let displaySymbol;
    if (pointName === 'Asc') {
      displaySymbol = 'Asc';
    } else if (pointName === 'MC') {
      displaySymbol = 'MC';
    } else {
      displaySymbol = PLANET_SYMBOLS[pointName] || pointName;
    }

    if (element) {
      elementsPlanets[element].push(displaySymbol);
    }
    if (quality) {
      qualitiesPlanets[quality].push(displaySymbol);
    }
  };

  // Adicionar planetas
  for (const planetName in chartData.planets) {
    const sign = chartData.planets[planetName].sign;
    addPointToCategories(planetName, sign);
  }

  // Adicionar Ascendente (house1)
  const ascendantSign = chartData.houses.house1?.sign;
  addPointToCategories('Asc', ascendantSign);

  // Adicionar MC (house10)
  const mcSign = chartData.houses.house10?.sign;
  addPointToCategories('MC', mcSign);


  // Calcular a largura total da tabela principal (posições + aspectos)
  const mainTableContentWidth = TABLE_COL_WIDTHS.symbol + TABLE_COL_WIDTHS.planet + TABLE_COL_WIDTHS.positionDetails + (planetsList.length * ASPECT_MATRIX_CELL_SIZE);

  // Define novas constantes para a tabela de elementos/qualidades
  const PADDING_BETWEEN_TABLES = 60; // Espaçamento entre as duas tabelas
  const EQ_COL_WIDTHS = {
    name: 120, // e.g., "Fogo", "Cardinais"
    count: 80, // e.g., "10"
    planets: 120, // NOVO: Coluna para listar planetas
    status: 100 // e.g., "Equilíbrio"
  };
  const EQ_TABLE_TOTAL_WIDTH = EQ_COL_WIDTHS.name + EQ_COL_WIDTHS.count + EQ_COL_WIDTHS.planets + EQ_COL_WIDTHS.status;
  const EQ_TABLE_START_X = PADDING + mainTableContentWidth + PADDING_BETWEEN_TABLES;


  // Calcular a largura total do canvas (mantendo WIDTH original)
  const calculatedWidth = WIDTH;

  // Calcular a altura total da tabela principal
  const mainTableHeight = TABLE_START_Y + (planetsList.length * ROW_HEIGHT) + PADDING;

  // Calcular a altura da tabela de elementos e qualidades
  const elementsCount = Object.keys(chartData.elements).length;
  const qualitiesCount = Object.keys(chartData.qualities).length;
  // Ajuste na altura: inclui os cabeçalhos das sub-tabelas
  const eqTableContentHeight = (elementsCount + qualitiesCount + 2) * ROW_HEIGHT + (PADDING * 2); // +2 para os cabeçalhos das seções, + PADDING para espaço entre elas

  const eqTableCalculatedHeight = TABLE_START_Y + eqTableContentHeight;


  // A altura final do canvas será o máximo entre a altura da tabela principal e a altura da tabela de elementos/qualidades
  const calculatedHeight = Math.max(mainTableHeight, eqTableCalculatedHeight);

  const canvas = createCanvas(calculatedWidth, calculatedHeight);
  const ctx = canvas.getContext('2d');

  // Preenche o fundo do canvas
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, calculatedWidth, calculatedHeight);

  // --- Tabela Combinada de Posições e Aspectos ---
  let currentY = TABLE_START_Y;
  let currentX = PADDING;

  // --- Desenha as Linhas de Dados da Tabela Combinada ---
  planetsList.forEach((planetRow, rowIndex) => {
    ctx.fillStyle = COLORS.TEXT; // Mantém a cor do texto padrão
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
      // Desenha a borda da célula APENAS se estiver na diagonal ou abaixo dela
      if (colIndex <= rowIndex) {
        ctx.strokeRect(colX, currentY, ASPECT_MATRIX_CELL_SIZE, ROW_HEIGHT);
      }

      if (rowIndex === colIndex) {
        // Célula diagonal: mostra o símbolo do planeta
        ctx.fillStyle = COLORS.TEXT;
        ctx.fillText(PLANET_SYMBOLS[planetRow] || '', colX + ASPECT_MATRIX_CELL_SIZE / 2, currentY + ROW_HEIGHT - 8);
      } else if (colIndex > rowIndex) {
        // Parte superior da diagonal: não desenha nada (deixa em branco)
        // Nenhuma borda ou conteúdo é desenhado aqui.
      } else {
        // Parte inferior da diagonal: calcula e desenha o símbolo do aspecto
        const aspectSymbol = calculateAspect(degrees[planetRow], degrees[planetCol]);
        ctx.fillStyle = getAspectColor(aspectSymbol); // Define a cor com base no aspecto
        ctx.fillText(aspectSymbol, colX + ASPECT_MATRIX_CELL_SIZE / 2, currentY + ROW_HEIGHT - 8);
      }
      colX += ASPECT_MATRIX_CELL_SIZE;
    });
    ctx.textAlign = 'left'; // Reseta o alinhamento para o padrão

    currentY += ROW_HEIGHT; // Move para a próxima linha
  });

  // --- Tabela de Elementos e Qualidades ---
  let eqCurrentY = TABLE_START_Y;
  let eqCurrentX = EQ_TABLE_START_X;

  // --- Seção de Elementos ---
  // Cabeçalho da tabela de Elementos
  let eqHeaderX = eqCurrentX;
  ctx.strokeStyle = COLORS.TABLE_BORDER;
  ctx.lineWidth = 1;
  ctx.font = FONT_TABLE_TEXT; // Usa a fonte de texto para o cabeçalho da tabela
  ctx.fillStyle = COLORS.HEADER; // Cor para o texto do cabeçalho da tabela

  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.name, ROW_HEIGHT);
  ctx.fillText('Elemento', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.name;

  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.count, ROW_HEIGHT);
  ctx.fillText('Contagem', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.count;

  // NOVO: Cabeçalho da coluna de Planetas
  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.planets, ROW_HEIGHT);
  ctx.fillText('Planetas', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.planets;

  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.status, ROW_HEIGHT);
  ctx.fillText('Status', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.status;
  eqCurrentY += ROW_HEIGHT; // Move para a próxima linha para os dados dos elementos

  // Dados dos Elementos
  ctx.font = FONT_TABLE_TEXT;
  ctx.fillStyle = COLORS.TEXT;
  for (const element in chartData.elements) {
    const data = chartData.elements[element];
    let eqColX = eqCurrentX; // Reseta X para cada linha de dados

    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.lineWidth = 1;

    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.name, ROW_HEIGHT);
    ctx.fillText(ELEMENT_LABELS_PT[element] || element.charAt(0).toUpperCase() + element.slice(1), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.name;

    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.count, ROW_HEIGHT);
    ctx.fillText(data.count.toString(), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.count;

    // NOVO: Dados da coluna de Planetas
    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.planets, ROW_HEIGHT);
    ctx.fillText(elementsPlanets[element].join(', '), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.planets;

    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.status, ROW_HEIGHT);
    ctx.fillText(getTranslatedStatus(data.status), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.status;
    eqCurrentY += ROW_HEIGHT;
  }

  // Adiciona um espaçamento entre a tabela de Elementos e Qualidades
  eqCurrentY += PADDING;

  // --- Seção de Qualidades ---
  // Cabeçalho da tabela de Qualidades
  eqHeaderX = eqCurrentX; // Reseta X para o cabeçalho da tabela de qualidades
  ctx.font = FONT_TABLE_TEXT; // Usa a fonte de texto para o cabeçalho da tabela
  ctx.fillStyle = COLORS.HEADER; // Cor para o texto do cabeçalho da tabela

  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.name, ROW_HEIGHT);
  ctx.fillText('Qualidade', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.name;

  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.count, ROW_HEIGHT);
  ctx.fillText('Contagem', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.count;

  // NOVO: Cabeçalho da coluna de Planetas
  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.planets, ROW_HEIGHT);
  ctx.fillText('Planetas', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.planets;

  ctx.strokeRect(eqHeaderX, eqCurrentY, EQ_COL_WIDTHS.status, ROW_HEIGHT);
  ctx.fillText('Status', eqHeaderX + 5, eqCurrentY + ROW_HEIGHT - 8);
  eqHeaderX += EQ_COL_WIDTHS.status;
  eqCurrentY += ROW_HEIGHT; // Move para a próxima linha para os dados das qualidades

  // Dados das Qualidades
  ctx.font = FONT_TABLE_TEXT;
  ctx.fillStyle = COLORS.TEXT;
  for (const quality in chartData.qualities) {
    const data = chartData.qualities[quality];
    let eqColX = eqCurrentX; // Reseta X para cada linha de dados

    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.lineWidth = 1;

    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.name, ROW_HEIGHT);
    ctx.fillText(QUALITY_LABELS_PT[quality] || quality.charAt(0).toUpperCase() + quality.slice(1), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.name;

    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.count, ROW_HEIGHT);
    ctx.fillText(data.count.toString(), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.count;

    // NOVO: Dados da coluna de Planetas
    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.planets, ROW_HEIGHT);
    ctx.fillText(qualitiesPlanets[quality].join(', '), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.planets;

    ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.status, ROW_HEIGHT);
    ctx.fillText(getTranslatedStatus(data.status), eqColX + 5, eqCurrentY + ROW_HEIGHT - 8);
    eqColX += EQ_COL_WIDTHS.status;
    eqCurrentY += ROW_HEIGHT;
  }

  return canvas.toBuffer('image/png');
}

module.exports = { generateNatalTableImage };
