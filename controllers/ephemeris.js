'use strict';

const swisseph = require('swisseph');

// Configura o caminho para os dados das efemérides.
// É crucial que este caminho esteja correto no ambiente de produção.
// Assumindo que o diretório 'ephe' está na raiz do projeto.
swisseph.swe_set_ephe_path('./ephe');

const planetNames = {
  0: 'sol',
  1: 'lua',
  2: 'mercurio',
  3: 'venus',
  4: 'marte',
  5: 'jupiter',
  6: 'saturno',
  7: 'urano',
  8: 'netuno',
  9: 'plutao',
};

const signosZodiaco = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
];

/**
 * Calcula o signo zodiacal a partir de um grau de longitude.
 * Ajusta para graus negativos e garante o índice correto.
 * @param {number} grau - O grau de longitude (0-360).
 * @returns {string} O nome do signo.
 */
const calcularSigno = (grau) => {
  const grauNormalizado = grau % 360;
  // Se o grau for negativo, adiciona 360 para que fique no intervalo [0, 360)
  const index = Math.floor(grauNormalizado < 0 ? (grauNormalizado + 360) / 30 : grauNormalizado / 30);
  return signosZodiaco[index];
};

/**
 * Retorna o índice de um signo no array `signosZodiaco`.
 * @param {string} signo - O nome do signo.
 * @returns {number} O índice do signo (0-11).
 */
const getSignoIndex = (signo) => {
    return signosZodiaco.indexOf(signo);
};

/**
 * Normaliza um grau para o intervalo [0, 360).
 * @param {number} grau - O grau a ser normalizado.
 * @returns {number} O grau normalizado.
 */
const normalizarGrau = (grau) => {
    let normalized = grau % 360;
    return normalized < 0 ? normalized + 360 : normalized;
};


/**
 * Identifica as cúspides das casas e os signos interceptados.
 * @param {number[]} grausCuspides - Um array de 12 graus, um para cada cúspide de casa.
 * @returns {{cuspides: object, signosInterceptados: string[]}} Informações das casas e signos.
 */
const identificarSignos = (grausCuspides) => {
  const cuspides = {};
  const signosQueSaoCuspides = new Set(); // Armazena os signos que são o início de uma casa

  // 1. Processa as cúspides para identificar os signos que iniciam as casas
  for (let i = 0; i < 12; i++) {
    const grauCuspide = normalizarGrau(grausCuspides[i]);
    const signoCuspide = calcularSigno(grauCuspide);
    cuspides[`casa${i + 1}`] = { grau: parseFloat(grauCuspide.toFixed(2)), signo: signoCuspide };
    signosQueSaoCuspides.add(signoCuspide);
  }

  const signosInterceptados = new Set();

  // 2. Itera por cada casa para encontrar signos interceptados
  for (let i = 0; i < 12; i++) {
    const cuspideAtualGrau = normalizarGrau(grausCuspides[i]);
    let proximaCuspideGrau = normalizarGrau(grausCuspides[(i + 1) % 12]); // Cúspide final da casa atual

    // Ajusta o grau da próxima cúspide se a casa cruzar o ponto 0 de Áries (o arco da casa atravessa 360/0)
    if (proximaCuspideGrau < cuspideAtualGrau) {
      proximaCuspideGrau += 360;
    }

    // Identifica os signos que a casa 'atravessa'
    let currentSignIndex = Math.floor(cuspideAtualGrau / 30);
    let endSignIndex = Math.floor((proximaCuspideGrau - 0.0001) / 30); // Subtrai um epsilon para garantir que não pule o último signo se for exato

    // Loop pelos signos entre a cúspide inicial e a final da casa
    // A iteração deve ser 'cíclica' se a casa atravessar o 0/360
    for (let s = 0; s < 12; s++) { // Percorre todos os 12 signos do zodíaco
        const signoVerificado = signosZodiaco[(currentSignIndex + s) % 12];
        const signoVerificadoIndex = getSignoIndex(signoVerificado);

        let signoStartGrau = signoVerificadoIndex * 30;
        let signoEndGrau = (signoVerificadoIndex + 1) * 30;

        // Se o arco da casa atravessou 0/360, ajusta os graus do signo para a mesma "volta"
        if (signoStartGrau < cuspideAtualGrau && signoEndGrau < cuspideAtualGrau && proximaCuspideGrau > 360) {
            signoStartGrau += 360;
            signoEndGrau += 360;
        }

        // Verifica se o signo está inteiramente dentro da casa atual
        // E se ele NÃO é um signo de cúspide (ou seja, não foi o início de nenhuma casa)
        if (signoStartGrau >= cuspideAtualGrau &&
            signoEndGrau <= proximaCuspideGrau &&
            !signosQueSaoCuspides.has(signoVerificado)) {
            signosInterceptados.add(signoVerificado);
        }

        // Se já passamos do signo final da casa (ajustado para 360), podemos parar
        if (normalizarGrau(signoEndGrau) > normalizarGrau(proximaCuspideGrau)) {
             // Esta condição precisa de um ajuste mais inteligente, pois um signo pode estar interceptado no "final" do arco extendido
             // Melhor confiar nas condições de start/end do signo
        }
    }
  }

  // 3. Garante que se um signo é interceptado, seu oposto também seja.
  const signosFinaisInterceptados = new Set(signosInterceptados);
  signosInterceptados.forEach(s => {
    const idx = getSignoIndex(s);
    const opostoIdx = (idx + 6) % 12; // O oposto é sempre 6 signos (180 graus) de distância
    signosFinaisInterceptados.add(signosZodiaco[opostoIdx]);
  });


  // No seu formato de saída desejado, você quer apenas as cúspides e os interceptados
  // O 'signosPresentes' (signosQueSaoCuspides) é para uso interno da lógica.
  return {
    cuspides, // { casa1: { grau, signo }, ... }
    signosInterceptados: Array.from(signosFinaisInterceptados)
  };
};

/**
 * Valida os parâmetros de entrada para o cálculo do mapa astral.
 * @param {object} input - Objeto contendo os parâmetros de entrada.
 * @returns {string[]} Um array de erros de validação, vazio se válido.
 */
const validateInput = (input) => {
  const errors = [];
  const { year, month, date, hours, minutes, seconds, latitude, longitude, timezone } = input;

  // Verifica se todos os campos necessários estão presentes e não são nulos/undefined
  const requiredFields = ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'latitude', 'longitude', 'timezone'];
  for (const field of requiredFields) {
    if (typeof input[field] === 'undefined' || input[field] === null) {
      errors.push(`Campo '${field}' é obrigatório.`);
    }
  }

  // Se campos obrigatórios estão faltando, não adianta validar tipos/ranges
  if (errors.length > 0) return errors;

  // Validação de tipos e ranges para números
  if (isNaN(year) || year < 1000 || year > 3000) errors.push('Ano inválido (1000-3000).');
  if (isNaN(month) || month < 1 || month > 12) errors.push('Mês inválido (1-12).');
  if (isNaN(date) || date < 1 || date > 31) errors.push('Dia inválido (1-31).');
  if (isNaN(hours) || hours < 0 || hours > 23) errors.push('Hora inválida (0-23).');
  if (isNaN(minutes) || minutes < 0 || minutes > 59) errors.push('Minutos inválidos (0-59).');
  if (isNaN(seconds) || seconds < 0 || seconds > 59) errors.push('Segundos inválidos (0-59).');
  if (isNaN(latitude) || latitude < -90 || latitude > 90) errors.push('Latitude inválida (-90 a 90).');
  if (isNaN(longitude) || longitude < -180 || longitude > 180) errors.push('Longitude inválida (-180 a 180).');
  // Fuso horário pode ser um float (ex: -3.5), então a validação é mais flexível
  if (isNaN(timezone) || timezone < -14 || timezone > 14) errors.push('Fuso horário inválido (-14 a +14).'); // Faixa de fuso horário comum

  // Validação de data completa (se a data é válida, e.g., 31 de Fevereiro)
  const d = new Date(Date.UTC(year, month - 1, date, hours, minutes, seconds));
  if (d.getUTCFullYear() !== year || (d.getUTCMonth() + 1) !== month || d.getUTCDate() !== date) {
      errors.push('Data ou hora inválida (ex: 31 de Fevereiro).');
  }

  return errors;
};


/**
 * Função principal para calcular as efemérides e o mapa astral.
 * @param {object} input - Os parâmetros de entrada para o cálculo do mapa.
 * @returns {Promise<object>} Um objeto contendo os resultados do cálculo.
 */
const compute = async (input) => {
  try {
    // 1. Validação dos inputs antes de qualquer cálculo
    const validationErrors = validateInput(input);
    if (validationErrors.length > 0) {
      const error = new Error('Erro de validação dos parâmetros de entrada.');
      error.details = validationErrors; // Adiciona os detalhes dos erros para depuração
      throw error; // Lança o erro para ser capturado no `vers1.js`
    }

    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone
    } = input;

    // 2. Cálculo do Julian Date (JD)
    // Converte a hora local e o fuso horário para Hora Universal Coordenada (UTC).
    // swisseph.swe_julday espera a hora UTC.
    const decimalHoursUTC = (hours - timezone) + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHoursUTC, swisseph.SE_GREG_CAL);

    // 3. Configura a localização topocêntrica (latitude, longitude) para cálculos.
    swisseph.swe_set_topo(longitude, latitude, 0); // O último parâmetro é a altitude (0 para o nível do mar)

    const planetCodes = [
      swisseph.SE_SUN, swisseph.SE_MOON, swisseph.SE_MERCURY,
      swisseph.SE_VENUS, swisseph.SE_MARS, swisseph.SE_JUPITER,
      swisseph.SE_SATURN, swisseph.SE_URANUS, swisseph.SE_NEPTUNE,
      swisseph.SE_PLUTO
    ];

    // Mantendo a estrutura de 'ephemerides' para compatibilidade se for usada.
    const ephemerides = { geo: {} };
    // Este objeto armazena os signos dos planetas no formato desejado (sol: 'Gêmeos', lua: 'Câncer').
    const signosPlanetas = {};

    // 4. Cálculo das posições dos planetas
    for (const code of planetCodes) {
      const eph = await new Promise((resolve, reject) => {
        // swisseph.swe_calc_ut: Calcula posição de um corpo celeste para um tempo UT.
        // O flag swisseph.SEFLG_SWIEPH é crucial para usar os arquivos de efemérides.
        swisseph.swe_calc_ut(jd, code, swisseph.SEFLG_SWIEPH, (res) => {
          if (res.error) reject(new Error(`Erro ao calcular ${planetNames[code]}: ${res.error}`));
          else resolve(res);
        });
      });

      // Popula o objeto 'ephemerides' com dados brutos do swisseph (se necessário para outros usos).
      ephemerides.geo[code] = [{
        longitude: eph.longitude,
        latitude: eph.latitude,
        distance: eph.distance,
        planet: code,
        model: 'geo'
      }];

      // Preenche 'signosPlanetas' com o signo de cada planeta.
      const nome = planetNames[code];
      signosPlanetas[nome] = calcularSigno(eph.longitude);
    }

    // 5. Cálculo das cúspides das casas e identificação de signos interceptados
    const casasResult = await new Promise((resolve, reject) => {
      // swisseph.swe_houses: Calcula as cúspides das casas astrológicas.
      // 'P' indica o sistema de casas Plácidus.
      swisseph.swe_houses(jd, latitude, longitude, 'P', (houses) => {
        if (houses.error || !houses.house) {
          reject(new Error('Erro ao calcular casas astrológicas.'));
        } else {
          // Usa a função `identificarSignos` revisada, que retorna { cuspides, signosInterceptados }
          resolve(identificarSignos(houses.house));
        }
      });
    });

    // 6. Retorna o resultado completo no formato desejado
    return {
      statusCode: 200, // Mantido aqui conforme seu código base
      message: 'Ephemeris computed successfully', // Mantido aqui conforme seu código base
      ephemerisQuery: input, // Parâmetros de entrada para referência
      ephemerides, // Dados brutos dos planetas (se ainda for útil)
      signos: signosPlanetas, // Signo de cada planeta (sol: 'Gêmeos', etc.)
      casas: { // A estrutura de casas é mantida, com a adição de signosInterceptados
        // As cúspides das casas no formato: { casa1: { grau, signo }, ... }
        ...casasResult.cuspides,
        // E aqui está a nova informação de interceptação:
        signosInterceptados: casasResult.signosInterceptados
      }
    };
  } catch (error) {
    console.error('🔥 Erro Interno no Cálculo de Efemérides:', error);
    // Re-lança o erro para ser capturado pelo `try/catch` em `vers1.js`
    throw error;
  }
};

module.exports = {
  compute
};
