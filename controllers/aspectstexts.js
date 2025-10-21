'use strict';

/**
 * ZODIKA • Aspect Texts
 * -------------------------------------------------------------
 * Este módulo contém todos os microtextos dos aspectos (520 no total).
 * Cada texto deve estar em minúsculas, sem emojis, com até ~30 tokens.
 *
 * Estrutura:
 *   TEXTS = {
 *     "planetA|planetB": {
 *        conjunction: "texto...",
 *        opposition: "texto...",
 *        square: "texto...",
 *        trine: "texto...",
 *        sextile: "texto..."
 *     },
 *     ...
 *   };
 *
 * As chaves (planetA|planetB) **sempre em ordem alfabética**
 * usando slugs: sun, moon, mercury, venus, mars, jupiter,
 * saturn, uranus, neptune, pluto, chiron, north_node, lilith, asc, mc
 *
 * Exemplo: "mars|venus", "moon|saturn", "chiron|lilith"
 * O par "asc|mc" NÃO existe (sem aspectos entre si).
 */

const TEXTS = {
  // ========================= EXEMPLOS =========================

  

  // ========================= FIM DOS EXEMPLOS =========================
};

/* ============================================================
   Normalização de nomes
   - Recebe nomes brutos do ephemeris (ex: "trueNode", "Ascendant")
   - Retorna slugs padronizados usados no dicionário
============================================================ */
function normSlug(name) {
  const v = String(name || '').toLowerCase();
  if (v === 'truenode' || v === 'true_node' || v === 'truenode') return 'north_node';
  if (v === 'ascendant') return 'asc';
  if (v === 'midheaven' || v === 'mc') return 'mc';
  return v;
}

/* ============================================================
   getAspectText()
   - Retorna o texto correto, indiferente à ordem dos planetas
============================================================ */
function getAspectText(p1, p2, aspect) {
  if (!p1 || !p2 || !aspect) return '';
  const s1 = normSlug(p1);
  const s2 = normSlug(p2);
  const key = [s1, s2].sort().join('|');
  const group = TEXTS[key];
  if (!group) return '';
  return group[aspect] || '';
}

module.exports = { getAspectText };
