'use strict';

const logger = require('../logger');

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
const TYPE_LABELS_PT = { conjunction: 'conjunção', opposition: 'oposição', square: 'quadratura', trine: 'trígono', sextile: 'sextil' };
const TYPE_INTRO = {
  conjunction: 'foco concentrado neste tema.',
  opposition:  'tensão entre dois polos pede balança.',
  square:      'atrito criativo pede ajustes práticos.',
  trine:       'facilidade e fluidez; cultivar consistência maximiza o potencial.',
  sextile:     'oportunidades que pedem o primeiro passo.'
};
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

const ROLE_BY_NAME = {
  sun: 'identidade e propósito',
  moon: 'emoções e necessidades',
  mercury: 'mente e comunicação',
  venus: 'vínculos e valores',
  mars: 'ação e desejo',
  jupiter: 'expansão e sentido',
  saturn: 'estrutura e limites',
  uranus: 'mudança e autonomia',
  neptune: 'imaginação e fé',
  pluto: 'poder e transformação',
  ascendant: 'persona e abordagem',
  mc: 'vocação e direção pública',
  trueNode: 'trajetória evolutiva',
  chiron: 'ferida/mentor e cura',
  lilith: 'instintos e autonomia'
};

const HOUSE_THEMES_PT = {
  1: 'identidade, presença e inícios',
  2: 'recursos, valores e segurança',
  3: 'comunicação, estudos e trocas',
  4: 'raízes, família e base emocional',
  5: 'criação, prazer e expressão',
  6: 'rotina, saúde e serviço',
  7: 'parcerias, contratos e espelhos',
  8: 'intimidade, fusões e crises',
  9: 'visão, fé e expansão intelectual',
  10: 'carreira, imagem pública e direção',
  11: 'redes, projetos e futuro',
  12: 'retiro, bastidores e integração interna'
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

function introByType(type) {
  return TYPE_INTRO[type] || '';
}
function connectorByType(type) {
  // frase curta do tipo, para atuar como "cola" entre P1 e P2
  return TYPE_PHRASE[type] || '';
}

function planetBlock(p, isFirst = true) {
  const lbl = safeLabel(p);
  const role = roleOf(p.name);
  const sg = safeSign(p);
  // Ex.: "vênus, planeta dos vínculos, busca harmonia e prazer"
  // mantemos tom prático-reflexivo, sem floreio
  const base =
    p.name === 'sun' ? `${lbl}, força central de ${role}, ilumina prioridades` :
    p.name === 'moon' ? `${lbl}, bússola de ${role}, sinaliza necessidades reais` :
    p.name === 'mercury' ? `${lbl}, foco em ${role}, organiza ideias e mensagens` :
    p.name === 'venus' ? `${lbl}, planeta de ${role}, busca harmonia e valor genuíno` :
    p.name === 'mars' ? `${lbl}, motor de ${role}, impulsiona decisões e coragem` :
    p.name === 'jupiter' ? `${lbl}, vetor de ${role}, amplia horizontes com propósito` :
    p.name === 'saturn' ? `${lbl}, alicerce de ${role}, estrutura compromissos e limites` :
    p.name === 'uranus' ? `${lbl}, catalisador de ${role}, provoca mudança autêntica` :
    p.name === 'neptune' ? `${lbl}, mar de ${role}, inspira imaginação e compaixão` :
    p.name === 'pluto' ? `${lbl}, eixo de ${role}, demanda profundidade e verdade` :
    p.name === 'ascendant' ? `${lbl}, fachada de ${role}, define o primeiro impacto` :
    p.name === 'mc' ? `${lbl}, norte de ${role}, orienta escolhas públicas` :
    p.name === 'trueNode' ? `${lbl}, chamado de ${role}, convida a crescer na direção certa` :
    p.name === 'chiron' ? `${lbl}, ponto de ${role}, transforma a dor em serviço útil` :
    p.name === 'lilith' ? `${lbl}, pulso de ${role}, sustenta autonomia sem culpas` :
    `${lbl}, expressão de ${role}`;

  const withSign = sg ? `${base}, em ${sg},` : `${base},`;
  // Se for o primeiro bloco, frase introdutória; se for o segundo, tom complementar
  return isFirst
    ? withSign + ' põe o tema em evidência'
    : withSign + ' complementa esse movimento';
}

function housesBlock(h1, h2, type) {
  if (!Number.isFinite(h1) && !Number.isFinite(h2)) return '';
  const t1 = Number.isFinite(h1) ? `casa ${h1}${HOUSE_THEMES_PT[h1] ? ` (${HOUSE_THEMES_PT[h1]})` : ''}` : '';
  const t2 = Number.isFinite(h2) ? `casa ${h2}${HOUSE_THEMES_PT[h2] ? ` (${HOUSE_THEMES_PT[h2]})` : ''}` : '';
  const tense = (type === 'square' || type === 'opposition');
  if (t1 && t2) {
    return tense
      ? `Entre ${t1} e ${t2}, surge um atrito útil: alinhar prioridades reduz fricção.`
      : `Entre ${t1} e ${t2}, há terreno fértil: coordene esforços para aproveitar o fluxo.`;
  }
  if (t1) {
    return tense
      ? `Na ${t1}, foque ajustes práticos para converter tensão em progresso.`
      : `Na ${t1}, há abertura para desenvolver o melhor do aspecto.`;
  }
  if (t2) {
    return tense
      ? `Na ${t2}, trate as arestas com presença e limites claros.`
      : `Na ${t2}, pequenas iniciativas destravam oportunidades.`;
  }
  return '';
}

function synthesisAdvice(p1, p2, type) {
  // fecho prático baseado no par + tipo (NÃO usa casas)
  const r1 = roleOf(p1.name), r2 = roleOf(p2.name);

  const pairKey = [p1.name, p2.name].sort().join('|');

  const specific = {
    'venus|saturn': 'amadureça vínculos: alinhe expectativas por escrito e combine limites antes de promessas.',
    'sun|saturn': 'construa autoridade simples: defina metas semanais mínimas e revise com honestidade.',
    'moon|mars': 'regule impulso emocional: pause 5 minutos, escolha 1 ação útil e execute.',
    'mercury|neptune': 'garanta clareza: use checklist de fatos e confirme por mensagem.',
    'venus|mars': 'alinhe afeto e ação: rituais curtos de presença valem mais que intensidade.',
    'sun|pluto': 'use potência com ética: influencie para resolver, não para controlar.',
    'moon|pluto': 'processe camadas: diário breve e constante ajuda a metabolizar.',
    'mercury|uranus': 'ideias disruptivas pedem protótipo: teste rápido e itere.',
    'jupiter|saturn': 'expanda com sustentação: métricas simples + cadência realista.',
    'uranus|neptune': 'transforme inspiração em algo tangível: um esboço já é um começo.',
    'ascendant|chiron': 'autoimagem terapêutica: pratique uma apresentação que acolhe sua história.',
    'ascendant|lilith': 'presença autêntica: negocie fronteiras sem pedir desculpas por existir.',
    'mc|venus': 'valorize entregas: beleza serve ao valor, não o contrário.',
    'mc|saturn': 'carreira com lastro: compromissos repetíveis constroem reputação.',
    'trueNode|sun': 'assuma o passo visível que te aproxima do que te faz crescer.',
    'trueNode|moon': 'nutra o futuro: crie rotinas que sustentem seu caminho.',
    'mc|pluto': 'poder público com propósito: transforme sistemas, evite imposição.',
    'ascendant|mars': 'comece pequeno hoje; ajuste em marcha.',
    'venus|pluto': 'intensidade com consentimento: transparência e limites claros.'
  }[pairKey];

  if (specific) return specific;

  // fallback por tipo
  return (
    type === 'conjunction' ? `una ${r1} e ${r2} com um gesto diário concreto.` :
    type === 'opposition'  ? `balanceie ${r1} e ${r2}: estabeleça um limite e um pedido claros.` :
    type === 'square'      ? `estruture ${r1} com ${r2} em 3 passos práticos e prazo curto.` :
    type === 'trine'       ? `transforme a facilidade entre ${r1} e ${r2} em hábito consistente.` :
                              `dê o primeiro passo para aproximar ${r1} de ${r2} hoje.`
  );
}

function makeTitle(a) {
  // Ex.: "quíron conjunção ascendente"
  return `${safeLabel(a.p1)} ${TYPE_LABELS_PT[a.type] || a.type} ${safeLabel(a.p2)}`;
}

function makeText(a) {
  // BLOCO 1 — intro por tipo
  const intro = introByType(a.type);

  // BLOCO 2 — planeta1 (arquétipo)
  const p1Block = planetBlock(a.p1, true);

  // BLOCO 3 — conector pelo tipo
  const connector = connectorByType(a.type);

  // BLOCO 4 — planeta2 (complementar)
  const p2Block = planetBlock(a.p2, false);

  // BLOCO 5 — casas (contexto de expressão)
  const hBlock = housesBlock(a.p1.house, a.p2.house, a.type);

  // BLOCO 6 — síntese (conselho), sem casas
  const synth = synthesisAdvice(a.p1, a.p2, a.type);

  // junção fluida + pontuação adaptada
  // exemplo desejado:
  // "a tensão entre desejo e estrutura se destaca. vênus..., em quadratura com saturno, ... entre a casa 7 e a 10, ... é hora de ..."
  const parts = [];
  if (intro) parts.push(`${intro.charAt(0).toLowerCase()}${intro.slice(1)}`); // caixa baixa no início, estilo natural
  if (p1Block) parts.push(`${p1Block}.`);
  if (connector) parts.push(`${connector}`);
  if (p2Block) parts.push(`${p2Block}.`);
  if (hBlock) parts.push(`${hBlock}`);
  if (synth) parts.push(`${synth}`);

  // limpar espaçamentos duplos
  return parts.join(' ').replace(/\s+/g, ' ').trim();
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
      aspects_version: 'v1.2',
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
