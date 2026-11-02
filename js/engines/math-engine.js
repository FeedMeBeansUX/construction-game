// Math engine – generates challenges and answer options from challenge-rules.json.
// Pure module: no DOM, no fetch, no Math.random. Pass rules, an rng and history in.

/** Seeded PRNG (mulberry32) with small helpers. */
export function createRng(seed = 1) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: ([min, max]) => min + Math.floor(next() * (max - min + 1)),
    pick: arr => arr[Math.floor(next() * arr.length)],
    chance: p => next() < p,
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
  };
}

const SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const apply = (x, op, y) => (op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y);
const inRange = (v, [min, max]) => Number.isInteger(v) && v >= min && v <= max;

/** Crossing ten for one add/sub step: 8+5 crosses, 15+5 does not; 23−5 crosses, 25−5 does not. */
export function crossesTen(op, x, y) {
  if (op === '+') return (x % 10) + (y % 10) > 10;
  if (op === '-') return (x % 10) < (y % 10);
  return false;
}

// ---------- raw problem drawing (one attempt; returns null if constraints fail) ----------
// Each returns { form, operands, ops, result, unknown } where unknown indexes [...operands, result].

const DRAW = {
  'a+b=?': (s, r) => { const a = r.int(s.a), b = r.int(s.b), c = a + b; return inRange(c, s.result) ? { operands: [a, b], ops: ['+'], result: c, unknown: 2 } : null; },
  'a-b=?': (s, r) => { const a = r.int(s.a), b = r.int(s.b), c = a - b; return inRange(c, s.result) ? { operands: [a, b], ops: ['-'], result: c, unknown: 2 } : null; },
  'a+?=c': (s, r) => { const a = r.int(s.a), b = r.int(s.b), c = a + b; return inRange(c, s.result) ? { operands: [a, b], ops: ['+'], result: c, unknown: 1 } : null; },
  // missing.mixed.to30: unknownRange = the hidden number; knownRange = the other operand,
  // except in a−?=c where knownRange applies to c (so a can go up to 30).
  '?+b=c': (s, r) => { const a = r.int(s.unknownRange), b = r.int(s.knownRange), c = a + b; return inRange(c, s.result) ? { operands: [a, b], ops: ['+'], result: c, unknown: 0 } : null; },
  'a-?=c': (s, r) => { const b = r.int(s.unknownRange), c = r.int(s.knownRange), a = b + c; return inRange(c, s.result) && a <= 30 ? { operands: [a, b], ops: ['-'], result: c, unknown: 1 } : null; },
  '?-b=c': (s, r) => { const a = r.int(s.unknownRange), b = r.int(s.knownRange), c = a - b; return inRange(c, s.result) ? { operands: [a, b], ops: ['-'], result: c, unknown: 0 } : null; },
  'g*s=?': (s, r) => { const g = r.int(s.groups), z = r.int(s.size), c = g * z; return inRange(c, s.result) ? { operands: [g, z], ops: ['*'], result: c, unknown: 2 } : null; },
  'n/k=?': (s, r) => { const k = r.int(s.divisor), q = r.int(s.quotient), n = k * q; return inRange(n, s.dividend) ? { operands: [n, k], ops: ['/'], result: q, unknown: 2 } : null; },
  'n/s=?': (s, r) => { const z = r.int(s.groupSize), q = r.int(s.quotient), n = z * q; return inRange(n, s.dividend) ? { operands: [n, z], ops: ['/'], result: q, unknown: 2 } : null; },
  'a±b±c=?': (s, r) => {
    const a = r.int(s.a), b = r.int(s.b), c = r.int(s.c), o1 = r.pick(['+', '-']), o2 = r.pick(['+', '-']);
    const mid = apply(a, o1, b), res = apply(mid, o2, c);
    return inRange(mid, s.intermediate) && inRange(res, s.result) ? { operands: [a, b, c], ops: [o1, o2], result: res, unknown: 3 } : null;
  },
  'g*s±d=?': (s, r) => {
    const g = r.int(s.groups), z = r.int(s.size), d = r.int(s.d), o = r.pick(['+', '-']);
    const p = g * z, res = apply(p, o, d);
    return inRange(p, s.product) && inRange(res, s.result) ? { operands: [g, z, d], ops: ['*', o], result: res, unknown: 3 } : null;
  },
};

/** Does any add/sub step in the problem cross ten? */
export function problemCrossesTen({ operands, ops }) {
  let acc = operands[0], cross = false;
  ops.forEach((op, i) => { cross ||= crossesTen(op, acc, operands[i + 1]); acc = apply(acc, op, operands[i + 1]); });
  return cross;
}

export function equationString({ operands, ops, result, unknown }) {
  const vals = [...operands, result].map((v, i) => (i === unknown ? '?' : String(v)));
  const parts = [vals[0]];
  ops.forEach((op, i) => parts.push(SYMBOL[op], vals[i + 1]));
  return `${parts.join(' ')} = ${vals[vals.length - 1]}`;
}

// ---------- distractors ----------

/** Realistic wrong answers for one error type, in priority order. */
function candidates(reason, p, ans, rng) {
  const [x, y, z] = p.operands, c = p.result, cross = problemCrossesTen(p);
  const pair = d => rng.shuffle([ans - d, ans + d]);
  switch (reason) {
    case 'offByOne': return pair(1);
    case 'offByTwo': return pair(2);
    case 'offByTen': return cross ? pair(10) : [];
    case 'wrongOp':
      if (p.form === 'a+b=?') return [x - y];
      if (p.form === 'a-b=?') return [x + y];
      if (p.form === 'a-?=c') return [x + c];
      if (p.form === '?-b=c') return [c - y];
      return [];
    case 'operand': return [x, y];
    case 'visiblePartA': return [x];
    case 'visiblePartB': return [y];
    case 'visiblePartC': return [c];
    case 'unitsOfC': return c % 10 ? [c % 10] : []; // 22 + ? = 26 → 6 (reads the last digit)
    case 'neighbourFact':
      if (p.form === 'g*s=?') return rng.shuffle([(x - 1) * y, (x + 1) * y]);
      return rng.shuffle([apply((x - 1) * y, p.ops[1], z), apply((x + 1) * y, p.ops[1], z)]);
    case 'addFactors': return [x + y];
    case 'divisorAsAnswer': return [y];
    case 'oneStepOnly': return [apply(x, p.ops[0], y)];
    case 'wrongOpLastStep': {
      const flip = p.ops[1] === '+' ? '-' : '+';
      return [apply(apply(x, p.ops[0], y), flip, z)];
    }
    default: return [];
  }
}

const isEvenRunMiddle = (ans, ds) => {
  if (ds.length < 2) return false;
  const [lo, mid, hi] = [ans, ...ds].sort((a, b) => a - b);
  return mid === ans && mid - lo === hi - mid;
};

/** Pick exactly 2 distractors following the rules; returns [{ value, reason }]. */
export function pickDistractors(p, ans, rules, rng) {
  const g = rules.global, ceiling = g.levelCeiling[p.level];
  const order = rules.distractors[p.form] ?? [];
  const chosen = [];
  const ok = v => Number.isInteger(v) && v >= g.valueRange[0] && v <= g.valueRange[1] && v <= ceiling
    && v !== ans && Math.abs(v - ans) <= g.maxDistractorDistance && !chosen.some(d => d.value === v)
    && !(g.forbidAnswerInMiddleOfEvenRun && isEvenRunMiddle(ans, [...chosen.map(d => d.value), v]));
  // Realistic candidates in priority order (deduplicated, individually valid).
  const pool = [];
  for (const reason of order) {
    for (const v of candidates(reason, p, ans, rng)) {
      if (ok(v) && !pool.some(d => d.value === v)) pool.push({ value: v, reason });
    }
  }
  // Highest-priority pair that doesn't put the answer in the middle of an even run.
  outer: for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (!(g.forbidAnswerInMiddleOfEvenRun && isEvenRunMiddle(ans, [pool[i].value, pool[j].value]))) {
        chosen.push(pool[i], pool[j]);
        break outer;
      }
    }
  }
  if (!chosen.length && pool.length) chosen.push(pool[0]);
  if (chosen.length < 2) { // fallback, not error-based
    const side = chosen.some(d => d.value === ans + 1) ? [1] : chosen.some(d => d.value === ans - 1) ? [-1] : [1, -1];
    for (let k = 2; k <= g.maxDistractorDistance && chosen.length < 2; k++) {
      for (const dir of side) { const v = ans + dir * k; if (chosen.length < 2 && ok(v)) chosen.push({ value: v, reason: 'fallback' }); }
    }
    if (chosen.length < 2) { // other side as last resort
      for (let k = 2; k <= g.maxDistractorDistance && chosen.length < 2; k++) {
        for (const dir of [1, -1]) { const v = ans + dir * k; if (chosen.length < 2 && ok(v)) chosen.push({ value: v, reason: 'fallback' }); }
      }
    }
  }
  return chosen;
}

// ---------- public API ----------

const problemKey = ch => `${ch.skill}|${ch.equation}`;

/**
 * Generate one challenge.
 * @param {string} skillId e.g. 'missing.add.to20'
 * @param {object} opts { rules, rng, history?: challenge[] (most recent last) }
 */
export function generate(skillId, { rules, rng, history = [] }) {
  const skill = rules.skills[skillId];
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  const g = rules.global;
  const recent = history.filter(h => h.skill === skillId);
  const recentKeys = new Set(recent.slice(-g.noRepeatWindow).map(problemKey));
  const lastAnswers = recent.slice(-g.maxSameAnswerInRow).map(h => h.answer);

  for (let attempt = 0; attempt < 200; attempt++) {
    const form = skill.form ?? rng.pick(skill.forms);
    const wantCross = skill.crossingTenRatio !== undefined ? rng.chance(skill.crossingTenRatio) : undefined;
    let raw = null;
    for (let i = 0; i < 2000 && !raw; i++) {
      const r = DRAW[form](skill, rng);
      if (r && (wantCross === undefined || problemCrossesTen(r) === wantCross)) raw = r;
    }
    if (!raw) continue;
    const p = { ...raw, form, level: skill.level };
    const answer = [...p.operands, p.result][p.unknown];
    const ch = {
      skill: skillId, level: skill.level, form, operands: p.operands, ops: p.ops, result: p.result,
      unknown: p.unknown, answer, crossesTen: problemCrossesTen(p), equation: equationString(p),
    };
    if (recentKeys.has(problemKey(ch))) continue;
    if (lastAnswers.length === g.maxSameAnswerInRow && lastAnswers.every(a => a === answer)) continue;
    ch.distractors = pickDistractors(p, answer, rules, rng);
    ch.options = rng.shuffle([answer, ...ch.distractors.map(d => d.value)]);
    return ch;
  }
  throw new Error(`Could not generate a valid challenge for ${skillId}`);
}

export const checkAnswer = (challenge, value) => value === challenge.answer;
