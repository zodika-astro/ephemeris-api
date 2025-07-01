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
    // Converte graus astrológicos (0 Áries = 0) para radianos do canvas (0 = direita)
    // e inverte a direção para anti-horário.
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
    const planetPositions = ephemerisData?.geo || {};
    const houseCusps = Array.isArray(ephemerisData?.houses?.cusps) ? ephemerisData.houses.cusps : [];
    const aspectsData = ephemerisData?.aspects || {};

    // Fundo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.beginPath();
    ctx.fillStyle = backgroundColor;
    ctx.arc(centerX, centerY, innerRadius - 5, 0, 2 * Math.PI);
    ctx.fill();

    // Círculos principais
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(centerX, centerY, zodiacRingInnerRadius, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI); ctx.stroke();

    // Linhas das casas e números
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

        const nextIndex = (index + 1) % houseCusps.length;
        const nextCusp = houseCusps[nextIndex];
        let midDegree = (cusp.degree + nextCusp.degree) / 2;
        if (Math.abs(cusp.degree - nextCusp.degree) > 180) {
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
        ctx.fillText((index + 1).toString(), x, y);
    });

    // Graus nas cúspides
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

    // Divisões dos signos
    ctx.strokeStyle = signDivisionColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 6]);
    for (let deg = 0; deg < 360; deg += 30) {
        const rad = toChartCoords(deg);
        const xStart = centerX + zodiacRingInnerRadius * Math.cos(rad);
        const yStart = centerY + zodiacRingInnerRadius * Math.sin(rad);
        const xEnd = centerX + zodiacRingOuterRadius * Math.cos(rad);
        const yEnd = centerY + zodiacRingOuterRadius * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Nomes dos signos
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
    // INÍCIO DA NOVA LÓGICA DE POSICIONAMENTO DE PLANETAS
    // ==================================================================
    
    // Função auxiliar para desenhar um planeta e seu nome
    const drawPlanetAndLabel = (name, deg, radius, clusterInfo = null) => {
        const angleRad = toChartCoords(deg);
        const x = centerX + radius * Math.cos(angleRad);
        const y = centerY + radius * Math.sin(angleRad);

        // Desenha o símbolo do planeta
        const symbol = planetSymbols[name];
        const fontSize = useSymbolaFont ? 52 : 32;
        ctx.font = useSymbolaFont ? `${fontSize}px Symbola` : `bold ${fontSize}px Inter`;
        ctx.fillStyle = 'rgba(255, 249, 237, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, fontSize / 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = symbolColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((symbol && useSymbolaFont) ? symbol : name.substring(0, 3).toUpperCase(), x, y);

        // Desenha o nome do planeta
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Inter';

        // Posição base do texto (radialmente para fora)
        const dirX = x - centerX;
        const dirY = y - centerY;
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        const normX = dirX / len;
        const normY = dirY / len;
        const textOffset = 40;
        let textX = x + normX * textOffset;
        let textY = y + normY * textOffset;

        // Se o planeta estiver em um cluster, aplica um desvio tangencial
        if (clusterInfo) {
            const { avgAngleRad, planetIndex, clusterSize } = clusterInfo;
            const perpX = -Math.sin(avgAngleRad); // Vetor perpendicular ao ângulo médio
            const perpY = Math.cos(avgAngleRad);
            const spread = 22; // Espaçamento entre os textos
            const initialOffset = -(clusterSize - 1) / 2 * spread;
            const tangentialOffset = initialOffset + planetIndex * spread;

            textX += perpX * tangentialOffset;
            textY += perpY * tangentialOffset;
        }

        // Ajusta o alinhamento do texto para melhor legibilidade
        const finalDirX = textX - centerX;
        if (Math.abs(finalDirX) < width * 0.1) {
            ctx.textAlign = 'center';
        } else if (finalDirX > 0) {
            ctx.textAlign = 'left';
            textX += 5;
        } else {
            ctx.textAlign = 'right';
            textX -= 5;
        }
        ctx.textBaseline = 'middle';
        ctx.fillText(planetNames[name] || name, textX, textY);
        
        return { x, y, degree: deg, name, angleRad };
    };

    // 1. Prepara os dados e identifica os clusters de planetas
    const planets = Object.entries(planetPositions).sort((a, b) => a[1] - b[1]);
    const collisionThreshold = 10; // Limite em graus para considerar um cluster
    const clusters = [];

    if (planets.length > 0) {
        let currentCluster = [planets[0]];
        for (let i = 1; i < planets.length; i++) {
            const prevPlanetDeg = currentCluster[currentCluster.length - 1][1];
            const currentPlanetDeg = planets[i][1];
            let diff = Math.abs(currentPlanetDeg - prevPlanetDeg);
            if (diff > 180) diff = 360 - diff;

            if (diff < collisionThreshold) {
                currentCluster.push(planets[i]);
            } else {
                clusters.push(currentCluster);
                currentCluster = [planets[i]];
            }
        }
        clusters.push(currentCluster);

        // Verifica se o último e o primeiro planeta formam um cluster (ex: 358° e 2°)
        if (clusters.length > 1) {
            const firstPlanetDeg = clusters[0][0][1];
            const lastPlanet = clusters[clusters.length - 1];
            const lastPlanetDeg = lastPlanet[lastPlanet.length - 1][1];
            let diff = Math.abs((firstPlanetDeg + 360) - lastPlanetDeg);
            if (diff < collisionThreshold) {
                const lastCluster = clusters.pop();
                clusters[0] = [...lastCluster, ...clusters[0]];
            }
        }
    }

    // 2. Desenha os planetas, tratando cada cluster
    const placed = [];
    const baseRadius = planetZoneInner + (planetZoneOuter - planetZoneInner) / 2;
    const radialStep = 28; // Espaçamento radial para símbolos em um cluster

    clusters.forEach(cluster => {
        const isClustered = cluster.length > 1;
        
        const clusterInfo = isClustered ? {
            avgAngleRad: toChartCoords(cluster.reduce((sum, p) => sum + p[1], 0) / cluster.length),
            clusterSize: cluster.length,
            planetIndex: 0
        } : null;

        const totalRadialSpread = isClustered ? (cluster.length - 1) * radialStep : 0;
        let currentRadius = baseRadius - totalRadialSpread / 2;

        cluster.forEach(([name, deg], index) => {
            const radius = currentRadius + index * radialStep;
            if (clusterInfo) {
                clusterInfo.planetIndex = index;
            }
            const placedPlanet = drawPlanetAndLabel(name, deg, radius, clusterInfo);
            placed.push(placedPlanet);
        });
    });
    // ==================================================================
    // FIM DA NOVA LÓGICA DE POSICIONAMENTO DE PLANETAS
    // ==================================================================

    // Linhas de aspectos (deve funcionar como antes, usando as posições de 'placed')
    for (const aspectType in aspectsData) {
        const style = aspectStyles[aspectType];
        if (!style || style.color === null) continue;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.lineWidth;
        aspectsData[aspectType].forEach(a => {
            const p1 = placed.find(p => p.name === a.planet1.name);
            const p2 = placed.find(p => p.name === a.planet2.name);
            if (p1 && p2) {
                const factor = 0.85;
                const x1 = centerX + (p1.x - centerX) * factor;
                const y1 = centerY + (p1.y - centerY) * factor;
                const x2 = centerX + (p2.x - centerX) * factor;
                const y2 = centerY + (p2.y - centerY) * factor;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        });
    }

    // Texto central
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
