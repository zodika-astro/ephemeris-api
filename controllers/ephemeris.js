'use strict';

const swisseph = require('swisseph');
swisseph.swe_set_ephe_path(__dirname + '/../ephe');

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

const grauParaSigno = (grau) => {
  return signos[Math.floor(normalizarGrau(grau) / 30)];
};

const normalizarGrau = (grau) => {
  return ((grau % 360) + 360) % 360;
};

const arcoContemSigno = (inicio, fim, signo) => {
  let grauInicial = normalizarGrau(inicio);
  let grauFinal = normalizarGrau(fim);

  if (grauFinal < grauInicial) grauFinal += 360;

  for (let g = grauInicial; g < grauFinal; g++) {
    const idx = Math.floor(normalizarGrau(g) / 30);
    if (signos[idx] === signo) return true;
  }

  return false;
};

const calcularCasas = (julianDayUT, latitude, longitude) => {
  const casas = swisseph.swe_houses(julianDayUT, latitude, longitude, 'P');
  return casas.house.slice(0, 12); // Casas 1 a 12
};

const identificarSignosCasas = (cuspides) => {
  let casas = [];

  for (let i = 0; i < 12; i++) {
    const inicio = cuspides[i];
    const fim = cuspides[(i + 1) % 12];

    const signoInicio = grauParaSigno(inicio);
    const signoFim = grauParaSigno(fim);

    let signos = [signoInicio];
    if (signoFim !== signoInicio) signos.push(signoFim);

    casas.push({
      casa: i + 1,
      inicio,
      fim,
      signos
    });
  }

  return casas;
};

const identificarInterceptacoes = (casas) => {
  let usados = new Set();
  casas.forEach(c => c.signos.forEach(s => usados.add(s)));

  const interceptados = signos.filter(s => !usados.has(s));
  const casasComInterceptacoes = [];

  interceptados.forEach(signo => {
    casas.forEach(casa => {
      if (arcoContemSigno(casa.inicio, casa.fim, signo)) {
        casasComInterceptacoes.push({
          casa: casa.casa,
          signoInterceptado: signo
        });
      }
    });
  });

  return {
    signosInterceptados: interceptados,
    casasComInterceptacoes
  };
};

async function compute(input) {
  const {
    year, month, date,
    hours, minutes, seconds,
    latitude, longitude, timezone
  } = input;

  const decimalHours = hours + minutes / 60 + seconds / 3600;
  const jdUT = swisseph.swe_julday(year, month, date, decimalHours - timezone, swisseph.SE_GREG_CAL);

  const cuspides = calcularCasas(jdUT, latitude, longitude);
  const casasDetalhadas = identificarSignosCasas(cuspides);
  const interceptacoes = identificarInterceptacoes(casasDetalhadas);

  const signosComDuplaRegencia = casasDetalhadas
    .map(c => c.signos[0])
    .filter((v, i, a) => a.indexOf(v) !== i);

  const cuspidesDetalhadas = cuspides.map((grau, i) => ({
    casa: i + 1,
    grau: normalizarGrau(grau),
    signo: grauParaSigno(grau),
    interceptado: interceptacoes.casasComInterceptacoes.some(c => c.casa === i + 1)
  }));

  return {
    casas: {
      cuspides: cuspidesDetalhadas,
      signosInterceptados: interceptacoes.signosInterceptados,
      casasComInterceptacoes: interceptacoes.casasComInterceptacoes,
      signosComDuplaRegencia
    }
  };
}

module.exports = { compute };
