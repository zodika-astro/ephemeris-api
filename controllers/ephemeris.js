'use strict';

const swisseph = require('swisseph');

// Configura o caminho para os dados das efemérides.
// É crucial que este caminho esteja correto no ambiente de produção.
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
 * @param {number} grau - O grau de longitude (0-360).
 * @returns {string} O nome do signo.
 */
const calcularSigno = (grau) => {
  // Garante que o grau está entre 0 e 360 e trata graus negativos corretamente
  const grauNormalizado = grau % 360;
  const index = Math.floor(grauNormalizado < 0 ? (grauNormalizado + 360) / 30 : grauNormalizado / 30);
  return signosZodiaco[index];
};

/**
 * Retorna o grau de início de um signo específico.
 * @param {string} signo - O nome do signo.
 * @returns {number} O grau de início do signo.
 */
const getGrauInicioSigno = (signo) => {
  const index = signosZodiaco.indexOf(signo);
  return index * 30;
};

/**
 * Retorna o grau de fim de um signo específico (com ajuste para precisão).
 * @param {string} signo - O nome do signo.
 * @returns {number} O grau de fim do signo.
 */
const getGrauFimSigno = (signo) => {
  const index = signosZodiaco.indexOf(signo);
  // Subtrair um pequeno valor para garantir que o fim do signo esteja estritamente dentro,
  // útil para comparações de ponto flutuante em limites.
  return ((index + 1) * 30) - 0.0001;
};

/**
 * Identifica as cúspides das casas e os signos interceptados.
 * @param {number[]} grausCuspides - Um array de 12 graus, um para cada cúspide de casa.
 * @returns {{cuspides: object, signosPresentes: string[], signosInterceptados: string[]}} Informações das casas e signos.
 */
const identificarSignos = (grausCuspides) => {
  const cuspides = {};
  const signosNasCuspides = new Set(); // Armazena os signos que são o início de uma casa

  // 1. Processa as cúspides para identificar os signos que iniciam as casas
  for (let i = 0; i < 12; i++) {
    const grau = grausCuspides[i] % 360;
    const signo = calcularSigno(grau);
    cuspides[`casa${i + 1}`] = { grau: parseFloat(grau.toFixed(2)), signo };
    signosNasCuspides.add(signo); // Adiciona o signo da cúspide ao Set
  }

  const signosInterceptados = new Set();

  // 2. Itera sobre cada casa para encontrar signos interceptados
  for (let i = 0; i < 12; i++) {
    const cuspideAtualGrau = grausCuspides[i] % 360;
    let cuspideProximaGrau = grausCuspides[(i + 1) % 12] % 360;

    // Ajusta o grau da próxima cúspide se a casa cruzar o ponto 0 de Áries
    if (cuspideProximaGrau < cuspideAtualGrau) {
      cuspideProximaGrau += 360;
    }

    // Itera por todos os signos do zodíaco para verificar se estão inteiramente dentro da casa
    for (let j = 0; j < signosZodiaco.length; j++) {
      const signoAtual = signosZodiaco[j];
      let grauInicioSigno = getGrauInicioSigno(signoAtual);
      let grauFimSigno = getGrauFimSigno(signoAtual);

      // Se a casa cruza 0 graus (e.g., começa em Sagitário e termina em Gêmeos do próximo ciclo)
      // e o signo também cruza, ajustamos os graus do signo para a "volta" extendida
      if (grauInicioSigno < cuspideAtualGrau && grauFimSigno < cuspideAtualGrau && cuspideProximaGrau > 360) {
        grauInicioSigno += 360;
        grauFimSigno += 360;
      }

      // Um signo é interceptado na casa se:
      // a) O início do signo está DENTRO da casa (depois da cúspide de início da casa)
      // b) O fim do signo está DENTRO da casa (antes da cúspide de fim da casa)
      // c) O signo NÃO é o signo de cúspide de NENHUMA casa (já presente em signosNasCuspides)
      if (grauInicioSigno > cuspideAtualGrau &&
          grauFimSigno < cuspideProximaGrau &&
          !signosNasCuspides.has(signoAtual)) {
        signosInterceptados.add(signoAtual);
      }
    }
  }

  // A astrologia define que se um signo está interceptado, seu oposto também está.
  // Vamos garantir que se um signo foi adicionado, seu oposto também seja.
  const signosFinaisInterceptados = new Set(signosInterceptados);
  signosInterceptados.forEach(s => {
    const idx = signosZodiaco.indexOf(s);
    const opostoIdx = (idx + 6) % 12; // O oposto é sempre 6 signos (180 graus) de distância
    signosFinaisInterceptados.add(signosZodiaco[opostoIdx]);
  });

  return {
    cuspides,
    // Retorna os signos que aparecem como cúspides de casas para clareza
    signosPresentes: Array.from(signosNasCuspides),
    signosInterceptados: Array.from(signosFinaisInterceptados)
  };
};

/**
 * Valida os parâmetros de entrada para o cálculo do mapa astral.
 * @param {object} input - Objeto contendo os parâmetros de entrada.
 * @param {number} input.year
 * @param {number} input.month
 * @param {number} input.date
 * @param {number} input.hours
 * @param {number} input.minutes
 * @param {number} input.seconds
 * @param {number} input.latitude
 * @param {number} input.longitude
 * @param {number} input.timezone - Fuso horário em horas (ex: -3 para GMT-3).
 * @returns {string[]} Um array de erros de validação, vazio se válido.
 */
const validateInput = (input) => {
  const errors = [];
  const { year, month, date, hours, minutes, seconds, latitude, longitude, timezone } = input;

  // Verifica se todos os campos necessários estão presentes
  const requiredFields = ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'latitude', 'longitude', 'timezone'];
  for (const field of requiredFields) {
    if (typeof input[field] === 'undefined' || input[field] === null) {
      errors.push(`Campo '${field}' é obrigatório.`);
    }
  }

  // Se campos obrigatórios estão faltando, não adianta validar tipos/ranges
  if (errors.length > 0) return errors;

  // Validação de tipos e ranges
  if (isNaN(year) || year < 1000 || year > 3000) errors.push('Ano inválido (1000-3000).');
  if (isNaN(month) || month < 1 || month > 12) errors.push('Mês inválido (1-12).');
  if (isNaN(date) || date < 1 || date > 31) errors.push('Dia inválido (1-31).');
  if (isNaN(hours) || hours < 0 || hours > 23) errors.push('Hora inválida (0-23).');
  if (isNaN(minutes) || minutes < 0 || minutes > 59) errors.push('Minutos inválidos (0-59).');
  if (isNaN(seconds) || seconds < 0 || seconds > 59) errors.push('Segundos inválidos (0-59).');
  if (isNaN(latitude) || latitude < -90 || latitude > 90) errors.push('Latitude inválida (-90 a 90).');
  if (isNaN(longitude) || longitude < -180 || longitude > 180) errors.push('Longitude inválida (-180 a 180).');
  // Fuso horário pode ser um float (ex: -3.5), então a validação é mais flexível
  if (isNaN(timezone) || timezone < -12 || timezone > 14) errors.push('Fuso horário inválido (-12 a +14).'); // Common timezone range

  // Validação de data completa (se a data é válida, e.g., 31 de Fevereiro)
  const d = new Date(Date.UTC(year, month - 1, date, hours, minutes, seconds));
  if (d.getUTCFullYear() !== year || (d.getUTCMonth() + 1) !== month || d.getUTCDate() !== date) {
      errors.push('Data ou hora inválida.');
  }

  return errors;
};


/**
 * Função principal para calcular as efemérides e o mapa astral.
 * Esta função é o que será exportado e chamado pelo `vers1.js`.
 * @param {object} input - Os parâmetros de entrada para o cálculo do mapa.
 * @returns {Promise<object>} Um objeto contendo os resultados do cálculo.
 */
const compute = async (input) => {
  try {
    // 1. Validação dos inputs
    const validationErrors = validateInput(input);
    if (validationErrors.length > 0) {
      // Lança um erro se a validação falhar, que será pego pelo try/catch no vers1.js
      const error = new Error('Erro de validação dos parâmetros de entrada.');
      error.details = validationErrors; // Adiciona os detalhes dos erros para depuração
      throw error;
    }

    const {
      year, month, date,
      hours, minutes, seconds,
      latitude, longitude, timezone
    } = input;

    // 2. Cálculo do Julian Date (JD)
    // swisseph.swe_utc_to_jd é mais robusto para lidar com fuso horário e DST se necessário,
    // mas swe_julday com decimalHoursUTC (já ajustado para UTC) também funciona se o input já reflete isso.
    // **Importante:** Certifique-se que 'hours' refere-se à hora local e 'timezone' é o offset da hora local para UTC.
    // Ex: Se local for 10:00 e timezone for -3, 10 - (-3) = 13:00 UTC.
    const decimalHoursUTC = (hours - timezone) + minutes / 60 + seconds / 3600;
    const jd = swisseph.swe_julday(year, month, date, decimalHoursUTC, swisseph.SE_GREG_CAL);

    // 3. Configura a localização topocêntrica para cálculos de casas e planetas.
    swisseph.swe_set_topo(longitude, latitude, 0); // 0 para altitude é padrão

    const planetCodes = [
      swisseph.SE_SUN, swisseph.SE_MOON, swisseph.SE_MERCURY,
      swisseph.SE_VENUS, swisseph.SE_MARS, swisseph.SE_JUPITER,
      swisseph.SE_SATURN, swisseph.SE_URANUS, swisseph.SE_NEPTUNE,
      swisseph.SE_PLUTO
    ];

    const ephemerides = { geo: {} }; // Mantenha a estrutura existente, se desejado
    const signosPlanetas = {};

    // 4. Cálculo das posições dos planetas
    for (const code of planetCodes) {
      const eph = await new Promise((resolve, reject) => {
        // swe_calc_ut usa o Julian Day (JD) calculado anteriormente
        swisseph.swe_calc_ut(jd, code, swisseph.SEFLG_SWIEPH, (res) => { // Adicione SEFLG_SWIEPH para usar os arquivos de efemérides
          if (res.error) reject(new Error(`Erro ao calcular ${planetNames[code]}: ${res.error}`));
          else resolve(res);
        });
      });
      // Popula o objeto ephemerides com dados brutos do swisseph
      ephemerides.geo[code] = [{
        longitude: eph.longitude,
        latitude: eph.latitude,
        distance: eph.distance,
        planet: code, // Mantém o código numérico para mapeamento posterior, se necessário
        model: 'geo'
      }];
      // Mapeia o signo de cada planeta pelo nome
      const nome = planetNames[code];
      signosPlanetas[nome] = calcularSigno(eph.longitude);
    }

    // 5. Cálculo das cúspides das casas e identificação de signos interceptados
    const casasInfo = await new Promise((resolve, reject) => {
      // 'P' para sistema de casas Plácidus.
      swisseph.swe_houses(jd, latitude, longitude, 'P', (houses) => {
        if (houses.error || !houses.house) {
          reject(new Error('Erro ao calcular casas astrológicas.'));
        } else {
          // Usa a função `identificarSignos` revisada
          resolve(identificarSignos(houses.house));
        }
      });
    });

    // 6. Retorna o resultado completo
    return {
      // statusCode e message serão definidos no `vers1.js`
      // Não precisa duplicar aqui se já é tratado na rota.
      ephemerisQuery: input, // Mantém os inputs da query na resposta para referência
      ephemerides, // Dados brutos das efemérides dos planetas
      signos: signosPlanetas, // Signo em que cada planeta está
      casas: casasInfo // Cúspides das casas e signos interceptados
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
