'use strict';

const logger = require('../logger');

// ====== AUTH helpers (mesma política do ephemeris) ======
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

// ====== Configurações e constantes ======
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
const TOP_CARDS_MAX = 3;
const SCORE_CAP = 10;

// ====== Utils de linguagem (default pt) ======
function normalizeLang(raw) {
  const v = String(raw || 'pt').toLowerCase();
  if (v.startsWith('pt')) return 'pt';
  if (v.startsWith('es')) return 'es';
  return 'pt';
}

// ====== Parser robusto p/ aspects (objeto, JSON puro, ou "[Object: {...}]") ======
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

// ====== Scoring ======
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

// ====== Geração dos textos ======
const makeChip = (a) => {
  const t = TYPE_LABELS_PT[a.type] || a.type;
  const s1 = (a.p1.sign ?? '').toString();
  const s2 = (a.p2.sign ?? '').toString();
  const h1 = (a.p1.house ?? '').toString();
  const h2 = (a.p2.house ?? '').toString();
  const phrase = TYPE_PHRASE[a.type] || '';
  return `${a.p1.label} ${t} ${a.p2.label} · ${s1} casa ${h1} × ${s2} casa ${h2} — ${phrase}`.trim();
};

const makeCard = (a) => {
  const EFFECTS = {
    conjunction: {
      pessoais: 'integra traços centrais; unir vontade e sentimento pede coerência diária.',
      sociais: 'alinha expansão com responsabilidade; foco em resultados sustentáveis.',
      geracionais: 'sensibilidade a tendências coletivas; use isso como visão de longo prazo.',
      pontos: 'marca de identidade/propósito; decisões redefinem rumos.'
    },
    opposition: {
      pessoais: 'oscilação entre necessidades e imagem; equilíbrio vem do diálogo interno.',
      sociais: 'expansão versus limites; encontre o meio-termo nas parcerias.',
      geracionais: 'tensões com mudanças coletivas; posicione-se sem perder raízes.',
      pontos: 'eixo de vida público–privado; calibrar presença e limites é vital.'
    },
    square: {
      pessoais: 'atrito produtivo; transforme impulso em plano simples e executável.',
      sociais: 'ambição enfrenta estrutura; avance por etapas, com métricas claras.',
      geracionais: 'pressão por adaptação; pequenas ações contínuas vencem inércia.',
      pontos: 'pede ajustes práticos na rotina e na exposição; menos é mais.'
    },
    trine: {
      pessoais: 'talento natural; pratique para que o dom gere consistência.',
      sociais: 'oportunidade de crescer com estabilidade; cultive hábitos.',
      geracionais: 'fluidez com o novo; aplique em projetos reais.',
      pontos: 'facilidade de visibilidade/rumo; direcione com intenção.'
    },
    sextile: {
      pessoais: 'portas se abrem com iniciativa; pequenos gestos contam.',
      sociais: 'conexões úteis surgem; faça follow-up e documente.',
      geracionais: 'janelas de inovação; teste rápido e aprenda.',
      pontos: 'toques de sorte em escolhas; dê o primeiro passo.'
    }
  };
  const g = dominantGroup(a.p1.name, a.p2.name);
  return {
    title: `${a.p1.label} ${TYPE_LABELS_PT[a.type]} ${a.p2.label}`,
    effect: (EFFECTS[a.type]?.[g]) || TYPE_PHRASE[a.type] || '',
    tip:
      (a.type==='conjunction' ? (g==='pontos' ? 'faça uma escolha pública simples e cumpra por 7 dias.' : 'defina 1 ritual diário de 10 minutos.') :
      a.type==='opposition'  ? (g==='pontos' ? 'defina horários de ligar/desligar presença por 1 semana.' : 'escreva “eu quero” × “eu preciso” e ajuste.') :
      a.type==='square'      ? 'antes de agir, rascunhe 3 passos e limite de tempo.' :
      a.type==='trine'       ? 'transforme talento em rotina: 20min/dia.' :
                               'envie 1 mensagem que pode abrir uma porta hoje.')
  };
};

// ====== Núcleo: transforma aspects em placeholders ======
function buildPlaceholdersFromAspects(rawAspects, lang = 'pt') {
  const aspectsObj = coerceAspects(rawAspects);

  // normaliza e pontua
  const norm = [];
  for (const type of Object.keys(aspectsObj || {})) {
    if (!TYPE_WEIGHTS.hasOwnProperty(type)) continue;
    const arr = Array.isArray(aspectsObj[type]) ? aspectsObj[type] : [];
    for (const a of arr) {
      const p1 = a.planet1 || {}, p2 = a.planet2 || {};
      const n1 = (p1.name||'').toString(), n2 = (p2.name||'').toString();
      if (!n1 || !n2) continue;

      const base = TYPE_WEIGHTS[type];
      const mult = Math.max(PLANET_MULT[n1]||1, PLANET_MULT[n2]||1);
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

  // dedup indiferente à ordem
  const dedup = new Map();
  for (const a of norm) {
    const key = `${a.type}|${[a.p1.name,a.p2.name].sort().join('_')}`;
    const prev = dedup.get(key);
    if (!prev || a.score > prev.score) dedup.set(key, a);
  }
  const list = Array.from(dedup.values());

  // ordena por score > tipo > label
  list.sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = typeOrder.indexOf(a.type), tb = typeOrder.indexOf(b.type);
    if (ta !== tb) return ta - tb;
    const la = `${a.p1.label} ${a.type_label} ${a.p2.label}`.toLocaleLowerCase('pt-BR');
    const lb = `${b.p1.label} ${b.type_label} ${b.p2.label}`.toLocaleLowerCase('pt-BR');
    return la.localeCompare(lb);
  });

  // gera chips e cards
  const top10 = list.slice(0, TOP_LIST_MAX).map(a => ({...a, chip: makeChip(a)}));
  const top3cards = list
    // evita 100% geracional × geracional
    .filter(a => !(GROUPS.geracionais.has(a.p1.name) && GROUPS.geracionais.has(a.p2.name)))
    .slice(0, TOP_CARDS_MAX)
    .map(makeCard);

  // contagens por tipo (originais)
  const counts = { conjunction:0, opposition:0, square:0, trine:0, sextile:0 };
  for (const t of Object.keys(counts)) {
    counts[t] = Array.isArray(aspectsObj?.[t]) ? aspectsObj[t].length : 0;
  }

  // matriz grupo × tipo (com lista dedupada)
  const initTypeCounts = () => ({conjunction:0,opposition:0,square:0,trine:0,sextile:0});
  const matrix = { pessoais: initTypeCounts(), sociais: initTypeCounts(), geracionais: initTypeCounts(), pontos: initTypeCounts() };
  for (const a of list) {
    const t = a.type;
    for (const [g,set] of Object.entries(GROUPS)) {
      if (set.has(a.p1.name) || set.has(a.p2.name)) matrix[g][t] += 1;
    }
  }

  // placeholders p/ Replace Text
  const placeholders = {};
  for (let i=0;i<10;i++){ placeholders[`aspect${i+1}`] = top10[i]?.chip || ''; }
  for (let i=0;i<3;i++){
    placeholders[`card${i+1}_title`]  = top3cards[i]?.title  || '';
    placeholders[`card${i+1}_effect`] = top3cards[i]?.effect || '';
    placeholders[`card${i+1}_tip`]    = top3cards[i]?.tip    || '';
  }
  placeholders.count_conjunction = String(counts.conjunction);
  placeholders.count_opposition  = String(counts.opposition);
  placeholders.count_square      = String(counts.square);
  placeholders.count_trine       = String(counts.trine);
  placeholders.count_sextile     = String(counts.sextile);

  for (const g of Object.keys(matrix)){
    for (const t of Object.keys(matrix[g])){
      placeholders[`matrix_${g}_${t}`] = String(matrix[g][t]);
    }
  }
  placeholders.config1 = '';
  placeholders.config2 = '';
  placeholders.config3 = '';

  return {
    placeholders,
    top: top10.map(x => ({ chip: x.chip, score: x.score, type: x.type })),
    cards: top3cards,
    counts,
    matrix,
    aspects_version: 'v1.0',
    scoring_version: 'v1.1'
  };
}

// ====== Controller/handler ======
async function buildFromAspects(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return res.status(auth.code).json({ ok:false, error: auth.msg });

    const lang = normalizeLang(req.query.lang || req.body?.lang || 'pt');

    // onde pegar o campo aspects:
    // 1) req.body.aspects
    // 2) req.body.body?.ephemeris?.aspects (caso você mande o payload do Webhook inteiro)
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
