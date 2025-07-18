'use strict';
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
// Assumindo que você tem um logger configurado de forma semelhante
const logger = console;

// Fontes
const interFontPath = path.join(__dirname, '../fonts/Inter-Bold.ttf');
if (fs.existsSync(interFontPath)) {
    try {
        registerFont(interFontPath, { family: 'Inter', weight: 'bold' });
        // Assumindo que a fonte regular está no mesmo diretório
        registerFont(interFontPath.replace('-Bold', '-Regular'), { family: 'Inter', weight: 'normal' });
    } catch (e) {
        logger.warn('Error registering Inter font:', e.message);
    }
} else {
    logger.error(`Inter font not found: ${interFontPath}`);
}

const symbolaFontPath = path.join(__dirname, '../fonts/symbola.ttf');
let useSymbolaFont = false;
if (fs.existsSync(symbolaFontPath)) {
    try {
        registerFont(symbolaFontPath, { family: 'Symbola' });
        useSymbolaFont = true;
    } catch (e) {
        logger.warn('Error registering Symbola font:', e.message);
    }
} else {
    logger.error(`Symbola font not found: ${symbolaFontPath}`);
}


// Configuração de dimensões e cores
const width = 1536;
const height = 1536;
const centerX = width / 2;
const centerY = height / 2;
const outerRadius = 600;
const zodiacRingOuterRadius = outerRadius;
const zodiacRingInnerRadius = outerRadius * 0.85;
const innerRadius = outerRadius * 0.25;
const planetZoneInner = innerRadius + 50;
const planetZoneOuter = zodiacRingInnerRadius - 50;

const backgroundColor = '#FFFBF4';
const lineColor = '#29281E';
const textColor = '#29281E';
const symbolColor = '#1A1E3B';
const cuspNumberColor = '#555555';
const signColor = '#5A4A42';
const signDivisionColor = 'rgba(89, 74, 66, 0.4)';
const arrowColor = '#5A2A00';
const centerTextColor = '#807B74';

const planetSymbols = {
    sun: '\u2609', moon: '\u263D', mercury: '\u263F', venus: '\u2640',
    mars: '\u2642', jupiter: '\u2643', saturn: '\u2644', uranus: '\u2645',
    neptune: '\u2646', pluto: '\u2647', trueNode: '\u260A', lilith: '\u262D', chiron: '\u26B7'
};

const planetNames = {
    sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus',
    mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano',
    neptune: 'Netuno', pluto: 'Plutão', trueNode: 'Nodo Norte', lilith: 'Lilith', chiron: 'Quíron'
};

const aspectStyles = {
    conjunction: { color: null, lineWidth: 0 },
    opposition: { color: '#FF0000', lineWidth: 3 },
    square: { color: '#FF4500', lineWidth: 2.5 },
    sextile: { color: '#0000FF', lineWidth: 2 },
    trine: { color: '#008000', lineWidth: 2 }
};

const degToRad = (degrees) => degrees * Math.PI / 180;
const signs = ["Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"];
const signSymbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

function toChartCoords(degree) {
    return degToRad(360 - degree);
}

function drawArrow(ctx, x, y, angle, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size, size / 2);
    ctx.closePath();
    ctx.fillStyle = arrowColor;
    ctx.fill();
    ctx.restore();
}

async function generateNatalChartImage(ephemerisData) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Acessar planetas da nova chave 'planets'
    const planetPositions = ephemerisData?.geo || {};
    const planetSignData = ephemerisData?.planets || {}; // Nova chave para dados de planetas

    // Reconstruir o array de cúspides a partir da nova estrutura 'houses'
    const houseCusps = [];
    if (ephemerisData?.houses) {
        for (let i = 1; i <= 12; i++) {
            const houseKey = `house${i}`;
            if (ephemerisData.houses[houseKey]) {
                houseCusps.push({
                    house: i,
                    degree: ephemerisData.houses[houseKey].cuspDegree,
                    sign: ephemerisData.houses[houseKey].sign
                });
            }
        }
        // Ordenar as cúspides para garantir que estejam em ordem crescente de grau
        houseCusps.sort((a, b) => a.degree - b.degree);
    }
    
    const aspectsData = ephemerisData?.aspects || {};

    // Desenha a base do mapa (círculos, signos, casas, etc.)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.beginPath();
    ctx.fillStyle = backgroundColor;
    ctx.arc(centerX, centerY, innerRadius - 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingInnerRadius, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI); ctx.stroke();
    
    houseCusps.forEach((cusp, index) => {
        const angleRad = toChartCoords(cusp.degree);
        const xInner = centerX + innerRadius * Math.cos(angleRad);
        const yInner = centerY + innerRadius * Math.sin(angleRad);
        const xZodiacInner = centerX + zodiacRingInnerRadius * Math.cos(angleRad);
        const yZodiacInner = centerY + zodiacRingInnerRadius * Math.sin(angleRad);
        ctx.beginPath();
        ctx.moveTo(xInner, yInner);
        ctx.lineTo(xZodiacInner, yZodiacInner);
        ctx.stroke();
        drawArrow(ctx, xZodiacInner, yZodiacInner, angleRad, 12);
        
        // Para o número da casa, usamos o `cusp.house` que já vem da API.
        const originalHouseNumber = cusp.house; 
        
        const nextIndex = (index + 1) % houseCusps.length;
        const nextCusp = houseCusps[nextIndex];
        
        let midDegree = (cusp.degree + nextCusp.degree) / 2;
        // Lógica para lidar com a passagem por 0/360 graus
        if (nextCusp.degree < cusp.degree) {
            midDegree = (cusp.degree + nextCusp.degree + 360) / 2;
            if (midDegree >= 360) midDegree -= 360;
        }

        const r = zodiacRingInnerRadius - 40;
        const x = centerX + r * Math.cos(toChartCoords(midDegree));
        const y = centerY + r * Math.sin(toChartCoords(midDegree));
        ctx.fillStyle = cuspNumberColor;
        ctx.font = 'bold 28px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(originalHouseNumber.toString(), x, y); // Usar originalHouseNumber
    });

    ctx.font = 'bold 16px Inter';
    ctx.fillStyle = '#5A2A00';
    houseCusps.forEach((cusp) => {
        const angleRad = toChartCoords(cusp.degree);
        const r = zodiacRingInnerRadius - 20;
        const x = centerX + r * Math.cos(angleRad);
        const y = centerY + r * Math.sin(angleRad);
        const signIndex = Math.floor(cusp.degree / 30);
        const degreeInSign = (cusp.degree % 30).toFixed(1);
        const label = `${degreeInSign}° ${signSymbols[signIndex]}`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleRad + Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillText(label, 5, 0);
        ctx.restore();
    });

    ctx.strokeStyle = signDivisionColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 6]);
    for (let deg = 0; deg < 360; deg += 30) {
        const rad = toChartCoords(deg);
        const xStart = centerX + zodiacRingInnerRadius * Math.cos(rad);
        const yStart = centerY + zodiacRingInnerRadius * Math.sin(rad);
        const xEnd = centerX + zodiacRingOuterRadius * Math.cos(rad);
        // CORREÇÃO: Usar Math.sin para yEnd
        const yEnd = centerY + zodiacRingOuterRadius * Math.sin(rad); 
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = signColor;
    signs.forEach((sign, i) => {
        const angleDeg = i * 30 + 15;
        const angleRad = toChartCoords(angleDeg);
        const r = (zodiacRingOuterRadius + zodiacRingInnerRadius) / 2;
        const x = centerX + r * Math.cos(angleRad);
        const y = centerY + r * Math.sin(angleRad);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleRad + Math.PI / 2);
        ctx.fillStyle = '#8B4513';
        ctx.font = useSymbolaFont ? '38px Symbola' : 'bold 24px Inter';
        ctx.fillText(signSymbols[i], 0, -15);
        ctx.fillStyle = signColor;
        ctx.font = 'bold 18px Inter';
        ctx.fillText(sign.toUpperCase(), 0, 20);
        ctx.restore();
    });

    // ==================================================================
    // INÍCIO DA LÓGICA DE POSICIONAMENTO DE PLANETAS (VERSÃO AJUSTADA)
    // ==================================================================

    // Usar Object.entries(planetPositions) para garantir que temos os graus
    const planets = Object.entries(planetPositions).sort((a, b) => a[1] - b[1]);
    const placed = []; // Armazena as posições finais dos símbolos para desenhar aspectos

    // Define a faixa radial onde os planetas podem ser colocados
    const minPlanetRadius = planetZoneInner; // Começa da borda interna da zona de planetas
    const maxPlanetRadius = planetZoneOuter; // Termina na borda externa da zona de planetas

    // Determina o tamanho efetivo de um símbolo de planeta + seu texto associado (grau, R)
    const symbolBaseFontSize = useSymbolaFont ? 52 : 32;
    const symbolCircleRadius = symbolBaseFontSize / 1.6; // Raio do círculo de fundo do símbolo
    const textFontSize = 18; // Tamanho da fonte para 'R' e grau
    
    // Distância radial mínima necessária entre os centros de dois planetas para evitar sobreposição
    // Isso considera o círculo ao redor do símbolo e o texto ao redor dele.
    // Usamos um valor fixo um pouco maior para garantir espaço.
    const fixedRadialStep = 85; // Aumentado para garantir maior separação

    for (const [name, deg] of planets) {
        const angleRad = toChartCoords(deg);
        let currentSymbolRadius = minPlanetRadius;
        let foundPosition = false;

        // Tenta encontrar uma posição sem sobreposição movendo-se radialmente para fora
        while (currentSymbolRadius <= maxPlanetRadius && !foundPosition) {
            const xSymbol = centerX + currentSymbolRadius * Math.cos(angleRad);
            const ySymbol = centerY + currentSymbolRadius * Math.sin(angleRad);

            let isOverlapping = false;
            // Verifica sobreposição com planetas já posicionados
            for (const p of placed) {
                const distBetweenCenters = Math.sqrt(
                    Math.pow(xSymbol - p.xSymbol, 2) + Math.pow(ySymbol - p.ySymbol, 2)
                );
                // A distância mínima necessária entre os centros para evitar sobreposição
                // Considera a soma dos raios dos círculos dos símbolos e um espaço para o texto
                const minDistanceRequired = p.symbolCircleRadius + symbolCircleRadius + textFontSize * 2; 
                
                if (distBetweenCenters < minDistanceRequired) {
                    isOverlapping = true;
                    break;
                }
            }

            if (!isOverlapping) {
                // Se não houver sobreposição, adiciona o planeta à lista de posicionados
                placed.push({ 
                    name, 
                    deg, 
                    angleRad, 
                    xSymbol, 
                    ySymbol, 
                    symbolRadius: currentSymbolRadius, 
                    symbolFontSize: symbolBaseFontSize,
                    symbolCircleRadius: symbolCircleRadius // Armazena para futuras verificações de colisão
                });
                foundPosition = true;
            } else {
                // Se houver sobreposição, move para a próxima camada radial
                currentSymbolRadius += fixedRadialStep; 
            }
        }

        if (!foundPosition) {
            // Fallback: Se nenhuma posição sem sobreposição for encontrada dentro da zona permitida,
            // posiciona no raio máximo. Isso pode ainda causar sobreposição, mas garante o posicionamento.
            logger.warn(`Não foi possível encontrar uma posição sem sobreposição para o planeta ${name}. Posicionando no raio máximo.`);
            const xSymbol = centerX + maxPlanetRadius * Math.cos(angleRad);
            const ySymbol = centerY + maxPlanetRadius * Math.sin(angleRad);
            placed.push({ 
                name, 
                deg, 
                angleRad, 
                xSymbol, 
                ySymbol, 
                symbolRadius: maxPlanetRadius, 
                symbolFontSize: symbolBaseFontSize,
                symbolCircleRadius: symbolCircleRadius
            });
        }
    }

    // Agora, desenha todos os planetas posicionados
    placed.forEach(p => {
        // Desenhar Símbolo do Planeta
        const symbol = planetSymbols[p.name];
        ctx.font = useSymbolaFont ? `${p.symbolFontSize}px Symbola` : `bold ${p.symbolFontSize}px Inter`;
        ctx.fillStyle = 'rgba(255, 249, 237, 0.7)'; // Fundo translúcido para o símbolo
        ctx.beginPath();
        ctx.arc(p.xSymbol, p.ySymbol, p.symbolCircleRadius, 0, Math.PI * 2); // Círculo de fundo
        ctx.fill();
        ctx.fillStyle = symbolColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((symbol && useSymbolaFont) ? symbol : p.name.substring(0, 3).toUpperCase(), p.xSymbol, p.ySymbol);

        // Desenhar Indicador de Retrógrado 'R' e Grau do Planeta
        const planetInfo = planetSignData[p.name];
        const textFontSize = 18; // Tamanho da fonte para 'R' e grau
        ctx.font = `bold ${textFontSize}px Inter`;
        ctx.fillStyle = textColor;

        // Posição para o 'R' (se retrógrado)
        if (planetInfo && planetInfo.retrograde === "yes") {
            // Ajuste o ângulo e o raio para posicionar o 'R' de forma que não colida
            const rOffsetAngle = p.angleRad + degToRad(45); // Ângulo para o 'R'
            const rRadiusOffset = p.symbolCircleRadius + 10; // Distância radial do centro do símbolo
            const rX = p.xSymbol + rRadiusOffset * Math.cos(rOffsetAngle);
            const rY = p.ySymbol + rRadiusOffset * Math.sin(rOffsetAngle);
            ctx.fillText('R', rX, rY);
        }

        // Posição para o Grau do Planeta
        const degreeInSign = (p.deg % 30).toFixed(1);
        // Ajuste o ângulo e o raio para posicionar o grau de forma que não colida
        const degOffsetAngle = p.angleRad - degToRad(45); // Ângulo para o grau (oposto ao 'R')
        const degRadiusOffset = p.symbolCircleRadius + 10; // Distância radial do centro do símbolo
        const degX = p.xSymbol + degRadiusOffset * Math.cos(degOffsetAngle);
        const degY = p.ySymbol + degRadiusOffset * Math.sin(degOffsetAngle);
        ctx.fillText(`${degreeInSign}°`, degX, degY);
    });

    // ==================================================================
    // FIM DA LÓGICA DE POSICIONAMENTO DE PLANETAS
    // ==================================================================

    // Linhas de aspectos (desenhadas ANTES do texto central)
    for (const aspectType in aspectsData) {
        const style = aspectStyles[aspectType];
        if (!style || style.color === null) continue;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.lineWidth;
        aspectsData[aspectType].forEach(a => {
            const p1 = placed.find(p => p.name === a.planet1.name);
            const p2 = placed.find(p => p.name === a.planet2.name);
            if (p1 && p2) {
                const factor = 0.85; // Ajuste para que as linhas de aspecto não cheguem até o símbolo
                const x1 = centerX + (p1.xSymbol - centerX) * factor; // Usar xSymbol do objeto colocado
                const y1 = centerY + (p1.ySymbol - centerY) * factor; // Usar ySymbol do objeto colocado
                const x2 = centerX + (p2.xSymbol - centerX) * factor; // Usar xSymbol do objeto colocado
                const y2 = centerY + (p2.ySymbol - centerY) * factor; // Usar ySymbol do objeto colocado
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        });
    }

    // Texto central desenhado por último para ficar sobre tudo.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = centerTextColor;
    ctx.font = 'bold 32px Inter';
    ctx.fillText('MAPA NATAL', centerX, centerY - 25);
    ctx.font = 'italic 26px Inter';
    ctx.fillText('ZODIKA', centerX, centerY + 15);
    ctx.font = '18px Inter';
    ctx.fillText('www.zodika.com.br', centerX, centerY + 55);

    return canvas.toBuffer('image/png');
}

module.exports = { generateNatalChartImage };
