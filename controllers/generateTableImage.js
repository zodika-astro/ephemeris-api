'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

// Register project fonts
const interFontPathBold = path.join(__dirname, '../fonts/Inter-Bold.ttf');
const interFontPathRegular = path.join(__dirname, '../fonts/Inter-Regular.ttf');

if (fs.existsSync(interFontPathBold)) {
    registerFont(interFontPathBold, { family: 'Inter', weight: 'bold' });
} else {
    logger.warn(`Font Inter-Bold.ttf not found at: ${interFontPathBold}. Using default font.`);
}

if (fs.existsSync(interFontPathRegular)) {
    registerFont(interFontPathRegular, { family: 'Inter', weight: 'normal' });
} else {
    logger.warn(`Font Inter-Regular.ttf not found at: ${interFontPathRegular}. Using default font.`);
}

// Color and layout constants
const WIDTH = 1400;
const COLORS = {
    BACKGROUND: '#FFFBF4',
    TEXT: '#29281E',
    HEADER: '#1A1E3B',
    TABLE_BORDER: '#CCCCCC',
    ASPECT_CONJUNCTION: '#000000',
    ASPECT_OPPOSITION: '#FF0000',
    ASPECT_TRINE: '#008000',
    ASPECT_SQUARE: '#FF4500',
    ASPECT_SEXTILE: '#0000FF'
};

// Font definitions for different visual elements
const FONT_TABLE_HEADER = 'bold 16px Inter';
const FONT_TABLE_TEXT = '14px Inter';
const FONT_SYMBOLS = '20px Inter';
const FONT_ASC_MC_SYMBOLS = '16px Inter';
const FONT_ASPECT_SYMBOLS = '18px Inter';

const PADDING = 30;
const ROW_HEIGHT = 30;
const TABLE_START_Y = PADDING;
const ASPECT_MATRIX_CELL_SIZE = 38;

// Column widths for the planet positions table
const TABLE_COL_WIDTHS = {
    symbol: 40,
    planet: 114,
    positionDetails: 212.5,
};

// Mapping of planet labels to Portuguese
const PLANET_LABELS_PT = {
    sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
    jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno',
    pluto: 'Plutão', trueNode: 'Nodo Norte', lilith: 'Lilith', chiron: 'Quíron',
    ascendant: 'Ascendente', mc: 'Meio do Céu'
};

// Astrological symbols for planets
const PLANET_SYMBOLS = {
    sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
    jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆',
    pluto: '♇', trueNode: '☊', lilith: '☭', chiron: '⚷',
    ascendant: 'Asc',
    mc: 'MC'
};

// Mapping of zodiac sign labels to Portuguese
const SIGN_LABELS_PT = {
    Aries: 'Áries', Taurus: 'Touro', Gemini: 'Gêmeos', Cancer: 'Câncer', Leo: 'Leão',
    Virgo: 'Virgem', Libra: 'Libra', Scorpio: 'Escorpião', Sagittarius: 'Sagitário',
    Capricorn: 'Capricórnio', Aquarius: 'Aquário', Pisces: 'Peixes'
};

// Astrological symbols for zodiac signs
const SIGN_SYMBOLS = {
    Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌',
    Virgo: '♍', Libra: '♎', Scorpio: '♏', Sagittarius: '♐',
    Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

// Astrological symbols for aspects
const ASPECT_SYMBOLS = {
    conjunction: '☌',
    opposition: '☍',
    trine: '△',
    square: '□',
    sextile: '⚹'
};

// Aspect Definitions and Orb Rules
const ASPECT_DEFINITIONS = [
    { name: "conjunction", degree: 0, category: 0 },
    { name: "sextile", degree: 60, category: 2 },
    { name: "square", degree: 90, category: 1 },
    { name: "trine", degree: 120, category: 1 },
    { name: "opposition", degree: 180, category: 0 }
];

// Define individual orb rules for each celestial body/point,
// mapped to aspect categories: [Conj/Opp, Sq/Tr, Sextile]
const ORB_RULES = {
    'sun': [10, 9, 7],
    'moon': [10, 9, 7],
    'mercury': [10, 9, 7],
    'venus': [10, 9, 7],
    'mars': [10, 9, 7],
    'jupiter': [9, 9, 6],
    'saturn': [9, 9, 6],
    'uranus': [9, 8, 5],
    'neptune': [9, 8, 5],
    'pluto': [8, 7, 5],
    'trueNode': [5, 4, 2],
    'chiron': [6, 5, 3],
    'lilith': [3, 3, 1.5],
    'ascendant': [10, 10, 6],
    'mc': [10, 10, 6]
};

// Define all astrological points considered for aspect calculations
const ALL_POINTS_FOR_ASPECTS = [
    "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
    "uranus", "neptune", "pluto", "trueNode", "chiron", "lilith",
    "ascendant", "mc"
];

// Mapping of Elements and Qualities to Portuguese
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

// Element and modality classification
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
 * Formats a planet's position information into a single string.
 * @param {string} planetName - The planet's name.
 * @param {object} planetSignData - Object containing planet sign data.
 * @param {object} geoDegrees - Object containing the absolute degrees of the planets.
 * @returns {string} - The formatted string (e.g., "15° Touro, 27' 24" (R)").
 */
const formatPositionDetails = (planetName, planetSignData, geoDegrees) => {
    const degreeValue = geoDegrees[planetName];
    if (degreeValue === undefined || degreeValue === null) {
        logger.warn(`Degree value for ${planetName} is missing or invalid.`);
        return 'N/A';
    }

    const d = Math.floor(degreeValue % 30);
    const m = Math.floor((degreeValue * 60) % 60);
    const s = Math.round((degreeValue * 3600) % 60);

    const sign = planetSignData[planetName]?.sign || '-';
    const signPt = SIGN_LABELS_PT[sign] || sign;
    const retro = planetSignData[planetName]?.retrograde === 'yes' ? ' (R)' : '';

    return `${d}° ${signPt}, ${m}' ${s}"${retro}`.trim();
};

/**
 * Helper to get specific orb rules based on point category.
 * @param {string} pointName - Name of the celestial point.
 * @returns {object|null} Orb rules for the point, or null if not found.
 */
const getOrbRulesForPoint = (pointName) => {
    if (ORB_RULES[pointName]) {
        return {
            conjOpp: ORB_RULES[pointName][0],
            triSqr: ORB_RULES[pointName][1],
            sextile: ORB_RULES[pointName][2]
        };
    }
    return null;
};

/**
 * Calculates the aspect between two degrees using aspect definitions and dynamic orb rules.
 * @param {string} planet1Name - Name of the first planet.
 * @param {number} degree1 - Degree of the first planet.
 * @param {string} planet2Name - Name of the second planet.
 * @param {number} degree2 - Degree of the second planet.
 * @returns {string} - Aspect symbol or empty if no major aspect.
 */
const calculateAspect = (planet1Name, degree1, planet2Name, degree2) => {
    // Validate that degrees are numbers before proceeding with calculations.
    if (typeof degree1 !== 'number' || isNaN(degree1) || typeof degree2 !== 'number' || isNaN(degree2)) {
        logger.warn(`Invalid degree values passed to calculateAspect: ${planet1Name}=${degree1}, ${planet2Name}=${degree2}. Returning empty aspect.`);
        return '';
    }

    if (!ALL_POINTS_FOR_ASPECTS.includes(planet1Name) || !ALL_POINTS_FOR_ASPECTS.includes(planet2Name)) {
        return '';
    }

    if ((planet1Name === "ascendant" && planet2Name === "mc") || (planet1Name === "mc" && planet2Name === "ascendant")) {
        return '';
    }

    const deg1 = Math.floor(degree1) + (Math.floor((degree1 % 1) * 60)) / 60;
    const deg2 = Math.floor(degree2) + (Math.floor((degree2 % 1) * 60)) / 60;

    let diff = Math.abs(deg1 - deg2);
    if (diff > 180) {
        diff = 360 - diff;
    }

    for (const aspectDef of ASPECT_DEFINITIONS) {
        const p1OrbRules = getOrbRulesForPoint(planet1Name);
        const p2OrbRules = getOrbRulesForPoint(planet2Name);

        if (!p1OrbRules || !p2OrbRules) {
            logger.warn(`Orb rule not found for ${planet1Name} or ${planet2Name}. Skipping aspect check.`);
            continue;
        }

        let orb1, orb2;
        switch (aspectDef.category) {
            case 0:
                orb1 = p1OrbRules.conjOpp;
                orb2 = p2OrbRules.conjOpp;
                break;
            case 1:
                orb1 = p1OrbRules.triSqr;
                orb2 = p2OrbRules.triSqr;
                break;
            case 2:
                orb1 = p1OrbRules.sextile;
                orb2 = p2OrbRules.sextile;
                break;
            default:
                continue;
        }
        const orb = (orb1 + orb2) / 2.0;

        if (orb > 0 && diff >= (aspectDef.degree - orb) && diff <= (aspectDef.degree + orb)) {
            return ASPECT_SYMBOLS[aspectDef.name];
        }
    }
    return '';
};

/**
 * Returns the color for a specific aspect symbol.
 * @param {string} aspectSymbol - The aspect symbol.
 * @returns {string} - The color defined in COLORS constants.
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
            return COLORS.TEXT;
    }
};

/**
 * Returns the translated status in Portuguese.
 * @param {string} status - The status in English (lack, balance, excess).
 * @returns {string} - The translated status in Portuguese.
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
 * Generates a natal chart table image combining planet positions and aspect matrix.
 * @param {object} chartData - Natal chart data, including planets and their degrees and signs.
 * @returns {Buffer} - Generated PNG image buffer.
 */
async function generateNatalTableImage(chartData) {
    // Use ALL_POINTS_FOR_ASPECTS to define the order and inclusion of points in the table.
    const planetsList = ALL_POINTS_FOR_ASPECTS.filter(p => chartData.geo[p] !== undefined);

    const degrees = chartData.geo;
    const signs = chartData.planets;

    const elementsPlanets = { fire: [], earth: [], air: [], water: [] };
    const qualitiesPlanets = { cardinal: [], fixed: [], mutable: [] };

    /**
     * Helper to add planet/point to the correct element/quality list.
     * @param {string} pointName - The name of the celestial point.
     * @param {string} sign - The sign the point is in.
     */
    const addPointToCategories = (pointName, sign) => {
        if (!sign) return;

        // Exclude points that do not contribute to element/quality calculations.
        const pointsWithoutWeight = ['trueNode', 'chiron', 'lilith'];
        if (pointsWithoutWeight.includes(pointName)) {
            return;
        }

        const element = SIGN_ELEMENT_MAP[sign];
        const quality = SIGN_QUALITY_MAP[sign];

        let displaySymbol = PLANET_SYMBOLS[pointName] || pointName;

        if (element) {
            elementsPlanets[element].push(displaySymbol);
        }
        if (quality) {
            qualitiesPlanets[quality].push(displaySymbol);
        }
    };

    // Add planets to categories based on their signs.
    for (const planetName in chartData.planets) {
        const sign = chartData.planets[planetName].sign;
        addPointToCategories(planetName, sign);
    }

    // Add Ascendant (house1) and MC (house10) to categories if available.
    if (chartData.houses.house1?.sign) {
        addPointToCategories('ascendant', chartData.houses.house1.sign);
    }
    if (chartData.houses.house10?.sign) {
        addPointToCategories('mc', chartData.houses.house10.sign);
    }

    // Calculate the total width of the main table (positions + aspects).
    const mainTableContentWidth = TABLE_COL_WIDTHS.symbol + TABLE_COL_WIDTHS.planet + TABLE_COL_WIDTHS.positionDetails + (planetsList.length * ASPECT_MATRIX_CELL_SIZE);

    const PADDING_BETWEEN_TABLES = 60;

    const EQ_COL_WIDTHS = {
        name: 102,
        count: 36,
        planets: 197,
        status: 100
    };

    // Initial X position of the elements/qualities table, calculated after the main table.
    const EQ_TABLE_START_X = PADDING + mainTableContentWidth + PADDING_BETWEEN_TABLES;

    const calculatedWidth = WIDTH;

    // Calculate main table height.
    const mainTableHeight = TABLE_START_Y + (planetsList.length * ROW_HEIGHT) + PADDING;

    const elementsCount = Object.keys(chartData.elements).length;
    const qualitiesCount = Object.keys(chartData.qualities).length;

    // Calculate EQ tables height.
    const eqTableContentHeight = (elementsCount * ROW_HEIGHT) + PADDING + (qualitiesCount * ROW_HEIGHT);

    // Determine the total height needed for the Elements and Qualities block.
    const totalEQBlockHeight = (elementsCount > 0 || qualitiesCount > 0) ? eqTableContentHeight : 0;

    // The final canvas height will be the maximum between the main table height and the elements/qualities table height.
    const calculatedHeight = Math.max(mainTableHeight, TABLE_START_Y + totalEQBlockHeight + PADDING);

    const canvas = createCanvas(calculatedWidth, calculatedHeight);
    const ctx = canvas.getContext('2d');

    // Fill the canvas background.
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, calculatedWidth, calculatedHeight);

    // --- Combined Positions and Aspects Table ---
    let currentY = TABLE_START_Y;
    let currentX = PADDING;

    // Set textBaseline to align text vertically to the middle of the line.
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.lineWidth = 1;

    // --- Draw Data Rows of the Combined Table ---
    planetsList.forEach((planetRow, rowIndex) => {
        ctx.fillStyle = COLORS.TEXT;

        let colX = currentX;

        // Apply specific font for 'Asc' and 'MC' or default planet symbols.
        const symbolFont = (planetRow === 'ascendant' || planetRow === 'mc') ? FONT_ASC_MC_SYMBOLS : FONT_SYMBOLS;

        // Column: Symbol.
        ctx.font = symbolFont;
        ctx.textAlign = 'center';
        ctx.fillText(PLANET_SYMBOLS[planetRow] || '', colX + TABLE_COL_WIDTHS.symbol / 2, currentY + ROW_HEIGHT / 2);
        ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.symbol, ROW_HEIGHT);
        colX += TABLE_COL_WIDTHS.symbol;

        // Column: Planet Name.
        ctx.font = FONT_TABLE_TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(PLANET_LABELS_PT[planetRow] || planetRow, colX + 5, currentY + ROW_HEIGHT / 2);
        ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.planet, ROW_HEIGHT);
        colX += TABLE_COL_WIDTHS.planet;

        // Column: Position Details.
        ctx.fillText(formatPositionDetails(planetRow, signs, degrees), colX + 5, currentY + ROW_HEIGHT / 2);
        ctx.strokeRect(colX, currentY, TABLE_COL_WIDTHS.positionDetails, ROW_HEIGHT);
        colX += TABLE_COL_WIDTHS.positionDetails;

        // Aspect matrix cells.
        ctx.font = FONT_ASPECT_SYMBOLS;
        ctx.textAlign = 'center';
        planetsList.forEach((planetCol, colIndex) => {
            // Draw cell border only if it's on or below the diagonal.
            if (colIndex <= rowIndex) {
                ctx.strokeRect(colX, currentY, ASPECT_MATRIX_CELL_SIZE, ROW_HEIGHT);
            }

            if (rowIndex === colIndex) {
                // Diagonal cell: show planet symbol.
                ctx.fillStyle = COLORS.TEXT;
                // Apply specific font for 'Asc' and 'MC' or default planet symbols on diagonal.
                const diagonalSymbolFont = (planetRow === 'ascendant' || planetRow === 'mc') ? FONT_ASC_MC_SYMBOLS : FONT_SYMBOLS;
                ctx.font = diagonalSymbolFont;
                ctx.fillText(PLANET_SYMBOLS[planetRow] || '', colX + ASPECT_MATRIX_CELL_SIZE / 2, currentY + ROW_HEIGHT / 2);
                ctx.font = FONT_ASPECT_SYMBOLS; // Reset for subsequent aspect symbols.
            } else if (colIndex > rowIndex) {
                // Upper part of the diagonal remains blank.
            } else {
                // Lower part of the diagonal: calculate and draw aspect symbol.
                const degree1 = degrees[planetRow];
                const degree2 = degrees[planetCol];

                // Check for missing degrees before calculating aspect to prevent 'deg2' error.
                if (degree1 === undefined || degree2 === undefined) {
                    logger.warn(`Missing degree for ${planetRow} or ${planetCol} when calculating aspect for table. Cell left blank.`);
                } else {
                    const aspectSymbol = calculateAspect(planetRow, degree1, planetCol, degree2);
                    ctx.fillStyle = getAspectColor(aspectSymbol);
                    ctx.fillText(aspectSymbol, colX + ASPECT_MATRIX_CELL_SIZE / 2, currentY + ROW_HEIGHT / 2);
                }
            }
            colX += ASPECT_MATRIX_CELL_SIZE;
        });
        // Reset text alignment for the next row.
        ctx.textAlign = 'left';
        currentY += ROW_HEIGHT;
    });

    // --- Elements and Qualities Table ---
    let eqCurrentY = TABLE_START_Y + (calculatedHeight - (TABLE_START_Y + totalEQBlockHeight + PADDING)) / 2;
    let eqCurrentX = EQ_TABLE_START_X;

    ctx.font = FONT_TABLE_TEXT;
    ctx.fillStyle = COLORS.TEXT;
    ctx.strokeStyle = COLORS.TABLE_BORDER;
    ctx.lineWidth = 1;

    // --- Elements Section ---
    for (const element in chartData.elements) {
        const data = chartData.elements[element];
        let eqColX = eqCurrentX;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.name, ROW_HEIGHT);
        ctx.fillText(ELEMENT_LABELS_PT[element] || element.charAt(0).toUpperCase() + element.slice(1), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.name;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.count, ROW_HEIGHT);
        ctx.fillText(data.count.toString(), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.count;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.planets, ROW_HEIGHT);
        ctx.fillText(elementsPlanets[element].join(', '), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.planets;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.status, ROW_HEIGHT);
        ctx.fillText(getTranslatedStatus(data.status), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.status;
        eqCurrentY += ROW_HEIGHT;
    }

    // Add spacing between Elements and Qualities tables
    eqCurrentY += PADDING;

    // --- Qualities Section ---
    for (const quality in chartData.qualities) {
        const data = chartData.qualities[quality];
        let eqColX = eqCurrentX;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.name, ROW_HEIGHT);
        ctx.fillText(QUALITY_LABELS_PT[quality] || quality.charAt(0).toUpperCase() + quality.slice(1), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.name;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.count, ROW_HEIGHT);
        ctx.fillText(data.count.toString(), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.count;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.planets, ROW_HEIGHT);
        ctx.fillText(qualitiesPlanets[quality].join(', '), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.planets;

        ctx.strokeRect(eqColX, eqCurrentY, EQ_COL_WIDTHS.status, ROW_HEIGHT);
        ctx.fillText(getTranslatedStatus(data.status), eqColX + 5, eqCurrentY + ROW_HEIGHT / 2);
        eqColX += EQ_COL_WIDTHS.status;
        eqCurrentY += ROW_HEIGHT;
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateNatalTableImage };
