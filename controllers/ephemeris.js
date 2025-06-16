'use strict';

const swisseph = require('swisseph');
swisseph.swe_set_ephe_path(__dirname + '/../ephe');

const signos = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

const calcularCasas = (julianDayUT, latitude, longitude) => {
  const casas = swisseph.swe_houses(julianDayUT, latitude, longitude, 'P');
  return casas.house.slice(0, 12); // 0-11 = Casas 1 a 12
};

const grauParaSigno = (grau) => {
  return signos[Math.floor(grau / 30)];
};

const normalizarGrau = (grau) => {
  return ((grau % 360) + 360) % 360;
};

const arcoContemSigno = (inicio, fim, signo) => {
  let arco = [];
  let grauInicial = normalizarGrau(inicio);
  let grauFinal = normalizarGrau(fim);

  if (grauFinal < grauInicial) grauFinal += 360;

  for (let g = grauInicial; g < grauFinal; g++) {
    arco.push(Math.floor(normalizarGrau(g) / 30));
  }

  return arco.includes(signos.indexOf(signo));
};

const identificarSignosCasas = (cuspides) => {
  let casas = [];
  for (let i = 0; i < 12; i++) {
    let inicio = cuspides[i];
    let fim = cuspides[(i + 1) % 12];
    casas.push({
      casa: i + 1,
      inicio,
      fim,
      signos: [],
    });

    let signoInicio = grauParaSigno(inicio);
    let signoFim = grauParaSigno(fim);

    casas[i].signos.push(signoInicio);
    if (signoInicio !== signoFim) casas[i].signos.push(signoFim);
  }

  return casas;
};

const identificarInterceptacoes = (casas) => {
  let todosSignos = new Set(signos);
  casas.forEach(c => c.signos.forEach(s => todosSignos.delete(s)));

  let interceptados = Array.from(todosSignos);

  let casasComInterceptacoes = [];
  interceptados.forEach(signo => {
    casas.forEach(casa => {
      if (arcoContemSigno(casa.inicio, casa.fim, signo)) {
        casasComInterceptacoes.push({
          casa: casa.casa,
          signoInterceptado: signo,
        });
      }
    });
  });

  return {
    signosInterceptados: interceptados,
    casasComInterceptacoes,
  };
};

module.exports = {
  calcularMapa: (input) => {
    return new Promise((resolve, reject) => {
      const {
        year, month, date,
        hours, minutes, seconds,
        latitude, longitude, timezone
      } = input;

      const julianDayUT = swisseph.swe_julday(year, month, date, hours + minutes / 60 + seconds / 3600 - timezone, swisseph.SE_GREG_CAL);
      const cuspides = calcularCasas(julianDayUT, latitude, longitude);
      const casasDetalhadas = identificarSignosCasas(cuspides);
      const interceptacoes = identificarInterceptacoes(casasDetalhadas);

      resolve({
        casas: {
          cuspides: cuspides.map((grau, i) => ({
            casa: i + 1,
            grau: normalizarGrau(grau),
            signo: grauParaSigno(grau),
            interceptado: interceptacoes.casasComInterceptacoes.some(c => c.casa === i + 1)
          })),
          signosInterceptados: interceptacoes.signosInterceptados,
          casasComInterceptacoes: interceptacoes.casasComInterceptacoes,
          signosComDuplaRegencia: casasDetalhadas
            .map(c => c.signos[0])
            .filter((v, i, a) => a.indexOf(v) !== i) // Signos repetidos
        }
      });
    });
  }
};
