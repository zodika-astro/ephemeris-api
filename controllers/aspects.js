'use strict';

const logger = require('../logger');

/* ===================== AUTH helpers (mesma política do ephemeris) ===================== */
function parseBasicAuth(header) {
  if (!header || !header.startsWith('Basic ')) return null;
  const base64 = header.slice(6);
  try {
    const [user, pass] = Buffer.from(base64, 'base64').toString('utf8').split(':');
    return { user, pass };
  } catch {
    return null;
  }
}

function requireAuth(req) {
  const wantUser = process.env.API_USER || process.env.BASIC_USER;
  const wantPass = process.env.API_PASS || process.env.BASIC_PASS;
  const wantKey  = process.env.API_KEY  || process.env.X_API_KEY;

  const ba = parseBasicAuth(req.headers.authorization);
  const apiKey = req.headers['x-api-key'];

  if (!ba || ba.user !== wantUser || ba.pass !== wantPass) {
    return { ok: false, code: 401, msg: 'Unauthorized (basic auth)' };
  }
  if (!wantKey || apiKey !== wantKey) {
    return { ok: false, code: 401, msg: 'Unauthorized (api key)' };
  }
  return { ok: true };
}

/* ===================== Configurações e constantes ===================== */
const TYPE_WEIGHTS = { conjunction: 5.0, opposition: 5.0, square: 4.0, trine: 3.0, sextile: 3.0 };
const TYPE_LABELS_PT = { conjunction: 'conjunção', opposition: 'oposição', square: 'quadratura', trine: 'trígono', sextile: 'sextil' };

const TYPE_PHRASE = {
  conjunction: 'fusão de temas; foco importante no assunto.',
  opposition:  'puxões de dois polos; pede equilíbrio do eixo.',
  square:      'tensão produtiva; ajuste de rota pela ação.',
  trine:       'facilidade e fluxo; desenvolva para não dispersar energia.',
  sextile:     'oportunidades e sorte, demanda iniciativa.'
};

const PLANET_MULT = {
  ascendant: 2.5, mc: 2.5,
  sun: 2.5, moon: 2.5,
  mercury: 1.6, venus: 1.6, mars: 1.6,
  jupiter: 1.3, saturn: 1.3,
  uranus: 1.2, neptune: 1.2, pluto: 1.2,
  trueNode: 1.0, chiron: 1.0, lilith: 1.0
};

const GROUPS = {
  pessoais:   new Set(['sun','moon','mercury','venus','mars']),
  sociais:    new Set(['jupiter','saturn']),
  geracionais:new Set(['uranus','neptune','pluto']),
  pontos:     new Set(['ascendant','mc','trueNode','chiron','lilith'])
};

const typeOrder = ['conjunction','opposition','square','trine','sextile'];
const TOP_LIST_MAX = 10;
const SCORE_CAP = 10;

/* ===================== Utils de linguagem (default pt) ===================== */
function normalizeLang(raw) {
  const v = String(raw || 'pt').toLowerCase();
  if (v.startsWith('pt')) return 'pt';
  if (v.startsWith('es')) return 'es';
  return 'pt';
}

/* ===================== Parser robusto p/ aspects (objeto, JSON puro, ou "[Object: {...}]") ===================== */
function coerceAspects(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;

  if (typeof raw === 'string') {
    const s = raw.trim();

    // tenta recortar o primeiro bloco {...}
    const first = s.indexOf('{');
    const last  = s.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const core = s.slice(first, last + 1);
      try { return JSON.parse(core); } catch {}
    }

    // tenta parse direto
    try { return JSON.parse(s); } catch {}

    // caso venha array com um objeto dentro
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr) && arr.length) {
          return Object.assign({}, ...arr.filter(o => o && typeof o === 'object'));
        }
      } catch {}
    }
  }
  return {};
}

/* ===================== Scoring ===================== */
const houseBonus = (h) => {
  if (!Number.isFinite(h)) return 0;
  const n = Number(h);
  if ([1,4,7,10].includes(n)) return 0.5;
  if ([2,5,8,11].includes(n)) return 0.2;
  if ([3,6,9,12].includes(n)) return 0.1;
  return 0;
};

const groupOf = (n) => {
  if (GROUPS.pontos.has(n)) return 'pontos';
  if (GROUPS.pessoais.has(n)) return 'pessoais';
  if (GROUPS.sociais.has(n)) return 'sociais';
  if (GROUPS.geracionais.has(n)) return 'geracionais';
  return 'pontos';
};

const dominantGroup = (n1, n2) => {
  const order = ['pontos','pessoais','sociais','geracionais'];
  const g1 = groupOf(n1), g2 = groupOf(n2);
  return order.indexOf(g1) <= order.indexOf(g2) ? g1 : g2;
};

/* ===================== Explicações simples por tipo × grupo (20 textos) ===================== */
const EXPLAIN = {
  conjunction: {
    pessoais:   'integra traços centrais; cuide da coerência entre intenção e rotina.',
    sociais:    'alinha expansão e limites; escolhas sustentáveis brilham no longo prazo.',
    geracionais:'sintoniza-se com tendências coletivas; transforme visão em prática.',
    pontos:     'marca de identidade/rumo; decisões públicas ganham peso.'
  },
  opposition: {
    pessoais:   'movimento entre necessidades e imagem; negocie com você mesmx.',
    sociais:    'crescer vs. conter; o meio-termo nas parcerias estabiliza.',
    geracionais:'pressões do zeitgeist; posicione-se sem perder raízes.',
    pontos:     'eixo privado–público; defina fronteiras e horários de presença.'
  },
  square: {
    pessoais:   'atrito produtivo; quebre em 3 passos e execute.',
    sociais:    'ambição encontra estrutura; metas pequenas e mensuráveis.',
    geracionais:'adaptação contínua; itere com consistência.',
    pontos:     'pede ajustes objetivos na rotina e na exposição; menos é mais.'
  },
  trine: {
    pessoais:   'talento natural; transforme em hábito diário.',
    sociais:    'facilidade com crescimento estável; documente avanços.',
    geracionais:'fluidez com o novo; aplique em projetos reais.',
    pontos:     'boa visibilidade/rumo; direcione com intenção.'
  },
  sextile: {
    pessoais:   'portas se abrem com iniciativa; comece pequeno.',
    sociais:    'conexões úteis; faça follow-up.',
    geracionais:'janelas de inovação; teste rápido e aprenda.',
    pontos:     'toques de sorte nas escolhas; dê o primeiro passo.'
  }
};

/* ===================== Formatação de Título/Textos ===================== */
function makeTitle(a) {
  const typeLabel = TYPE_LABELS_PT[a.type] || a.type;
  // lower-case para manter padrão visual igual ao exemplo
  return `${a.p1.label} ${typeLabel} ${a.p2.label}`.toLowerCase();
}

function makeText(a) {
  const typePhrase = TYPE_PHRASE[a.type] || '';
  const g = dominantGroup(a.p1.name, a.p2.name);
  const explain = EXPLAIN[a.type]?.[g] || '';
  const h1 = a.p1.house != null ? `casa ${a.p1.house}` : '';
  const h2 = a.p2.house != null ? `casa ${a.p2.house}` : '';
  // ex.: "quíron em leão casa 1 × ascendente leão casa 1 — fusão de temas; ... explicação"
  return `${a.p1.label} em ${a.p1.sign} ${h1} × ${a.p2.label} ${a.p2.sign} ${h2} — ${typePhrase} ${explain}`
    .replace(/\s+/g, ' ')
    .trim();
}

/* ===================== Núcleo: transforma aspects em 10 títulos/textos ===================== */
function buildPlaceholdersFromAspects(rawAspects, lang = 'pt') {
  const aspectsObj = coerceAspects(rawAspects);

  // 1) normaliza e pontua
  const norm = [];
  for (const type of Object.keys(aspectsObj || {})) {
    if (!TYPE_WEIGHTS.hasOwnProperty(type)) continue;
    const arr = Array.isArray(aspectsObj[type]) ? aspectsObj[type] : [];
    for (const a of arr) {
      const p1 = a.planet1 || {}, p2 = a.planet2 || {};
      const n1 = (p1.name||'').toString(), n2 = (p2.name||'').toString();
      if (!n1 || !n2) continue;

      const base  = TYPE_WEIGHTS[type];
      const mult  = Math.max(PLANET_MULT[n1]||1, PLANET_MULT[n2]||1);
      const bonus = Math.max(houseBonus(p1.house), houseBonus(p2.house));
      const score = Math.min(SCORE_CAP, base * mult + bonus);

      norm.push({
        type,
        type_label: TYPE_LABELS_PT[type],
        p1: { name:n1, label:p1.label||n1, sign:p1.sign, house:p1.house },
        p2: { name:n2, label:p2.label||n2, sign:p2.sign, house:p2.house },
        score
      });
    }
  }

  // 2) dedup indiferente à ordem
  const dedup = new Map();
  for (const a of norm) {
    const key = `${a.type}|${[a.p1.name,a.p2.name].sort().join('_')}`;
    const prev = dedup.get(key);
    if (!prev || a.score > prev.score) dedup.set(key, a);
  }
  const list = Array.from(dedup.values());

  // 3) ordena por score desc, depois prioridade de tipo, depois label
  list.sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = typeOrder.indexOf(a.type), tb = typeOrder.indexOf(b.type);
    if (ta !== tb) return ta - tb;
    const la = `${a.p1.label} ${a.type_label} ${a.p2.label}`.toLocaleLowerCase('pt-BR');
    const lb = `${b.p1.label} ${b.type_label} ${b.p2.label}`.toLocaleLowerCase('pt-BR');
    return la.localeCompare(lb);
  });

  // 4) seleciona top 10 e monta placeholders (title/text)
  const top10 = list.slice(0, TOP_LIST_MAX);
  const placeholders = {};
  const list_top = [];

  top10.forEach((a, idx) => {
    const i = idx + 1;
    const title = makeTitle(a);
    const text  = makeText(a);
    placeholders[`aspect${i}_title`] = title;
    placeholders[`aspect${i}_text`]  = text;
    list_top.push({ title, text, score: a.score, type: a.type });
  });

  // completa os que faltarem até 10
  for (let i = top10.length + 1; i <= 10; i++) {
    placeholders[`aspect${i}_title`] = '';
    placeholders[`aspect${i}_text`]  = '';
  }

  // 5) contagens por tipo (do objeto original) — útil para telemetria
  const counts = { conjunction:0, opposition:0, square:0, trine:0, sextile:0 };
  for (const t of Object.keys(counts)) {
    counts[t] = Array.isArray(aspectsObj?.[t]) ? aspectsObj[t].length : 0;
  }

  return {
    placeholders,      // somente 20 chaves: aspect{1..10}_title/_text
    top: list_top,     // para debug/QA
    counts,
    aspects_version: 'v1.0',
    scoring_version: 'v1.1'
  };
}

/* ===================== Controller/handler ===================== */
async function buildFromAspects(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(auth.code).json({ ok:false, error: auth.msg });

    const lang = normalizeLang(req.query.lang || req.body?.lang || 'pt');

    // onde pegar o campo aspects:
    // 1) req.body.aspects
    // 2) req.body.body?.ephemeris?.aspects (payload completo do webhook)
    // 3) req.body.json?.body?.ephemeris?.aspects (compat extra)
    const rawAspects =
      req.body?.aspects ??
      req.body?.body?.ephemeris?.aspects ??
      req.body?.json?.body?.ephemeris?.aspects;

    if (!rawAspects) {
      return res.status(400).json({ ok:false, error:'Missing "aspects" in body' });
    }

    const out = buildPlaceholdersFromAspects(rawAspects, lang);

    return res.json({
      ok: true,
      aspects_parsed_ok: !!Object.keys(coerceAspects(rawAspects)||{}).length,
      ...out
    });
  } catch (err) {
    logger.error(`aspects controller error: ${err.message}`);
    return res.status(500).json({ ok:false, error: err.message });
  }
}

module.exports = {
  buildFromAspects,
  // também exporto a função pura para testes/unit
  _buildPlaceholdersFromAspects: buildPlaceholdersFromAspects
};
