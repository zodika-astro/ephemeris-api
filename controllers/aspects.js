'use strict';

const logger = require('../logger');
// novo: importa o dicionário externo de textos
const { getAspectText } = require('./aspectstexts');

/* ========================= AUTH (mesma política do ephemeris) ========================= */
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

/* ========================= Configs gerais ========================= */

function normalizeLang(raw) {
  const v = String(raw || 'pt').toLowerCase();
  if (v.startsWith('pt')) return 'pt';
  if (v.startsWith('es')) return 'es';
  return 'pt';
}

const TYPE_WEIGHTS = { conjunction: 5.0, opposition: 5.0, square: 4.0, trine: 3.0, sextile: 3.0 };
const TYPE_LABELS_PT = { conjunction: 'conjunção', opposition: 'oposição', square: 'quadratura', trine: 'trígono', sextil: 'sextil' };

const PLANET_MULT = {
  ascendant: 2.5, mc: 2.5,
  sun: 2.5, moon: 2.5,
  mercury: 1.6, venus: 1.6, mars: 1.6,
  jupiter: 1.3, saturn: 1.3,
  uranus: 1.2, neptune: 1.2, pluto: 1.2,
  trueNode: 1.0, chiron: 1.0, lilith: 1.0
};

const GROUPS = {
  pessoais:    new Set(['sun','moon','mercury','venus','mars']),
  sociais:     new Set(['jupiter','saturn']),
  geracionais: new Set(['uranus','neptune','pluto']),
  pontos:      new Set(['ascendant','mc','trueNode','chiron','lilith'])
};

const typeOrder = ['conjunction','opposition','square','trine','sextile'];
const TOP_LIST_MAX = 10;
const SCORE_CAP = 10;

/* ========================= Parser robusto p/ aspects ========================= */
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

/* ========================= Scoring ========================= */
const houseBonus = (h) => {
  if (!Number.isFinite(h)) return 0;
  const n = Number(h);
  if ([1,4,7,10].includes(n)) return 0.5;
  if ([2,5,8,11].includes(n)) return 0.2;
  if ([3,6,9,12].includes(n)) return 0.1;
  return 0;
};

/* ========================= Vocabulário ========================= */
const PT_LABEL_BY_NAME = {
  sun: 'sol', moon: 'lua', mercury: 'mercúrio', venus: 'vênus', mars: 'marte',
  jupiter: 'júpiter', saturn: 'saturno', uranus: 'urano', neptune: 'netuno', pluto: 'plutão',
  ascendant: 'ascendente', mc: 'meio do céu', trueNode: 'nodo norte',
  chiron: 'quíron', lilith: 'lilith'
};

/* ========================= Helpers de texto ========================= */
function safeLabel(p) {
  return (p?.label && typeof p.label === 'string')
    ? p.label
    : (PT_LABEL_BY_NAME[p?.name] || p?.name || '').toString();
}
function safeSign(p) {
  return (p?.sign && typeof p.sign === 'string') ? p.sign : '';
}
function roleOf(name) {
  return ROLE_BY_NAME[name] || '';
}

const TYPE_CONNECTOR_PT = {
  conjunction: 'em conjunção com',
  opposition:  'em oposição a',
  square:      'em quadratura com',
  trine:       'em trígono com',
  sextile:     'em sextil com'
};

function cap(s){ return (s||'').charAt(0).toUpperCase()+String(s||'').slice(1); }
function isSame(x,y){ return String(x||'').toLowerCase()===String(y||'').toLowerCase(); }

function signSpan(p1, p2){
  if (!p1.sign && !p2.sign) return '';
  if (p1.sign && p2.sign){
    return isSame(p1.sign, p2.sign) ? `em ${p1.sign}` : `de ${p1.sign} a ${p2.sign}`;
  }
  return `em ${p1.sign || p2.sign}`;
}

// monta “planeta em signo casa N”, pulando casa para AC/MC
function formatBodyWithSignHouse(p) {
  const lbl = safeLabel(p);
  const sg  = safeSign(p);
  const h   = p?.house;

  const base = sg ? `${lbl} em ${sg}` : `${lbl}`;

  if (p?.name === 'ascendant' || p?.name === 'mc') {
    return base;
  }
  if (Number.isFinite(h)) {
    return `${base} casa ${h}`;
  }
  return base;
}

function makeTitle(a) {
  const left  = formatBodyWithSignHouse(a.p1);
  const right = formatBodyWithSignHouse(a.p2);
  const link  = TYPE_CONNECTOR_PT[a.type] || 'com';
  return `${left} ${link} ${right}`;
}

/* ========= NOVO: normalização e lookup tolerante ========= */

// mapeia aliases/variações para os slugs usados no dicionário
const NAME_ALIAS = {
  // pontos
  ascendant: 'asc', ac: 'asc', asc: 'asc',
  mc: 'mc', midheaven: 'mc', medium_coeli: 'mc', meio_do_ceu: 'mc', 'meio do céu': 'mc',
  // nodo norte
  truenode: 'north_node', 'true_node': 'north_node', 'trueNode': 'north_node',
  northnode: 'north_node', 'north_node': 'north_node', node: 'north_node',
  // planetas/corpos
  sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
  jupiter: 'jupiter', saturn: 'saturn', uranus: 'uranus', neptune: 'neptune',
  pluto: 'pluto', chiron: 'chiron', lilith: 'lilith'
};

function normName(raw) {
  if (!raw) return '';
  const simple = String(raw)
    .normalize('NFD').replace(/\p{Diacritic}/gu, '') // remove acentos
    .toLowerCase()
    .replace(/\s+/g,'_');
  return NAME_ALIAS[simple] || NAME_ALIAS[raw] || simple;
}

// tenta em 3 ordens: recebida, invertida, alfabética
function tryGetAspectText(n1, n2, aspect) {
  const kA = getAspectText(n1, n2, aspect);
  if (kA) return kA;
  const kB = getAspectText(n2, n1, aspect);
  if (kB) return kB;
  const [a, b] = [n1, n2].sort();
  const kC = getAspectText(a, b, aspect);
  if (!kC) {
    logger && logger.warn && logger.warn(`TEXT MISSING for pair [${n1}|${n2}] aspect=${aspect}`);
  }
  return kC || '';
}

function makeText(a) {
  // normaliza nomes para os slugs esperados pelo aspectstexts.js
  const s1 = normName(a?.p1?.name);
  const s2 = normName(a?.p2?.name);
  const aspect = String(a?.type || '').toLowerCase();

  // não existe aspecto entre asc e mc — retorna string vazia
  if ((s1 === 'asc' && s2 === 'mc') || (s1 === 'mc' && s2 === 'asc')) {
    return '';
  }

  // chama o dicionário externo (sem fallback de texto gerado)
  const text = tryGetAspectText(s1, s2, aspect);
  return (text && typeof text === 'string') ? text.trim() : '';
}

/* ========================= Núcleo: aspects -> top10 placeholders ========================= */
function buildTop10Placeholders(rawAspects) {
  const aspectsObj = coerceAspects(rawAspects);

  // normaliza + pontua
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
        p1: { name:n1, label: p1.label || PT_LABEL_BY_NAME[n1] || n1, sign: p1.sign || '', house: p1.house },
        p2: { name:n2, label: p2.label || PT_LABEL_BY_NAME[n2] || n2, sign: p2.sign || '', house: p2.house },
        score
      });
    }
  }

  // dedup indiferente à ordem por tipo (guarda maior score)
  const dedup = new Map();
  for (const a of norm) {
    const key = `${a.type}|${[a.p1.name,a.p2.name].sort().join('_')}`;
    const prev = dedup.get(key);
    if (!prev || a.score > prev.score) dedup.set(key, a);
  }
  const list = Array.from(dedup.values());

  // ordena por score > tipo > título
  list.sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = typeOrder.indexOf(a.type), tb = typeOrder.indexOf(b.type);
    if (ta !== tb) return ta - tb;
    const la = `${safeLabel(a.p1)} ${TYPE_LABELS_PT[a.type]||a.type} ${safeLabel(a.p2)}`.toLocaleLowerCase('pt-BR');
    const lb = `${safeLabel(b.p1)} ${TYPE_LABELS_PT[b.type]||b.type} ${safeLabel(b.p2)}`.toLocaleLowerCase('pt-BR');
    return la.localeCompare(lb);
  });

  const top10 = list.slice(0, TOP_LIST_MAX);

  // placeholders (20 campos: 10 títulos + 10 textos)
  const placeholders = {};
  for (let i = 0; i < TOP_LIST_MAX; i++) {
    const a = top10[i];
    placeholders[`aspect${i+1}_title`] = a ? makeTitle(a) : '';
    placeholders[`aspect${i+1}_text`]  = a ? makeText(a)  : '';
  }

  return {
    placeholders,
    top_meta: top10.map(x => ({
      title: makeTitle(x),
      score: x.score,
      type: x.type,
      p1: x.p1.name, p2: x.p2.name,
      house1: x.p1.house ?? null, house2: x.p2.house ?? null
    }))
  };
}

/* ========================= Controller/handler ========================= */
async function buildFromAspects(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(auth.code).json({ ok:false, error: auth.msg });

    // lang mantido para futura expansão; hoje os textos são pt
    const _lang = normalizeLang(req.query.lang || req.body?.lang || 'pt');

    // onde pegar o campo aspects:
    // 1) req.body.aspects
    // 2) req.body.body?.ephemeris?.aspects (payload inteiro do Webhook)
    // 3) req.body.json?.body?.ephemeris?.aspects (compat extra)
    const rawAspects =
      req.body?.aspects ??
      req.body?.body?.ephemeris?.aspects ??
      req.body?.json?.body?.ephemeris?.aspects;

    if (!rawAspects) {
      return res.status(400).json({ ok:false, error:'Missing "aspects" in body' });
    }

    const parsedOk = !!Object.keys(coerceAspects(rawAspects)||{}).length;
    const out = buildTop10Placeholders(rawAspects);

    return res.json({
      ok: true,
      aspects_parsed_ok: parsedOk,
      placeholders: out.placeholders,
      top_debug: out.top_meta, // útil pra validar ranking no n8n; remova se quiser
      aspects_version: 'v1.3',   // bump por mudança de origem do texto
      scoring_version: 'v1.2'
    });
  } catch (err) {
    logger.error(`aspects controller error: ${err.message}`);
    return res.status(500).json({ ok:false, error: err.message });
  }
}

module.exports = {
  buildFromAspects,
  _buildTop10Placeholders: buildTop10Placeholders
};
