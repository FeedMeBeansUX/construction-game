// Independent validator for generated challenges. Written separately from math-engine.js on purpose:
// it recomputes everything from the rules and the challenge's own numbers. Returns a list of errors ([] = valid).

const calc = (x, op, y) => ({ '+': x + y, '-': x - y, '*': x * y, '/': x / y })[op];
const within = (v, r) => Number.isInteger(v) && v >= r[0] && v <= r[1];
const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

function crossing(operands, ops) {
  let acc = operands[0];
  return ops.some((op, i) => {
    const y = operands[i + 1];
    const c = op === '+' ? (acc % 10) + (y % 10) > 10 : op === '-' ? (acc % 10) < (y % 10) : false;
    acc = calc(acc, op, y);
    return c;
  });
}

/** All values that a given error type may produce (as a set, order irrelevant). */
function allowedByReason(reason, ch) {
  const [x, y, z] = ch.operands, c = ch.result, a = ch.answer, f = ch.form;
  switch (reason) {
    case 'offByOne': return [a - 1, a + 1];
    case 'offByTwo': return [a - 2, a + 2];
    case 'offByTen': return crossing(ch.operands, ch.ops) ? [a - 10, a + 10] : [];
    case 'wrongOp': return f === 'a+b=?' ? [x - y] : f === 'a-b=?' ? [x + y] : f === 'a-?=c' ? [x + c] : f === '?-b=c' ? [c - y] : [];
    case 'operand': return [x, y];
    case 'visiblePartA': return [x];
    case 'visiblePartB': return [y];
    case 'visiblePartC': return [c];
    case 'neighbourFact': return f === 'g*s=?' ? [(x - 1) * y, (x + 1) * y] : [calc((x - 1) * y, ch.ops[1], z), calc((x + 1) * y, ch.ops[1], z)];
    case 'addFactors': return [x + y];
    case 'divisorAsAnswer': return [y];
    case 'oneStepOnly': return [calc(x, ch.ops[0], y)];
    case 'wrongOpLastStep': return [calc(calc(x, ch.ops[0], y), ch.ops[1] === '+' ? '-' : '+', z)];
    default: return [];
  }
}

const FORM_SHAPE = { // number of operands, operator pattern, unknown index
  'a+b=?': [2, /^\+$/, 2], 'a-b=?': [2, /^-$/, 2], 'a+?=c': [2, /^\+$/, 1], '?+b=c': [2, /^\+$/, 0],
  'a-?=c': [2, /^-$/, 1], '?-b=c': [2, /^-$/, 0], 'g*s=?': [2, /^\*$/, 2], 'n/k=?': [2, /^\/$/, 2],
  'n/s=?': [2, /^\/$/, 2], 'a±b±c=?': [3, /^[+-][+-]$/, 3], 'g*s±d=?': [3, /^\*[+-]$/, 3],
};

export function validateChallenge(ch, rules) {
  const err = [];
  const s = rules.skills[ch.skill];
  if (!s) return [`unknown skill ${ch.skill}`];
  const g = rules.global, ceiling = g.levelCeiling[s.level];
  const forms = s.form ? [s.form] : s.forms;
  if (!forms.includes(ch.form)) err.push(`form ${ch.form} not allowed for ${ch.skill}`);
  const shape = FORM_SHAPE[ch.form];
  if (!shape) return [...err, `unknown form ${ch.form}`];
  const [nOps, opPattern, unk] = shape;
  if (ch.operands.length !== nOps) err.push('wrong operand count');
  if (!opPattern.test(ch.ops.join(''))) err.push(`ops ${ch.ops.join('')} don't match ${ch.form}`);
  if (ch.unknown !== unk) err.push('unknown position wrong');

  // arithmetic
  let acc = ch.operands[0];
  const steps = [];
  ch.ops.forEach((op, i) => { acc = calc(acc, op, ch.operands[i + 1]); steps.push(acc); });
  if (acc !== ch.result) err.push(`result ${ch.result} ≠ computed ${acc}`);
  const all = [...ch.operands, ...steps, ch.result];
  if (!all.every(v => within(v, g.valueRange))) err.push(`value outside ${g.valueRange} or not whole: ${all}`);
  const answer = [...ch.operands, ch.result][ch.unknown];
  if (answer !== ch.answer) err.push(`answer ${ch.answer} ≠ ${answer}`);
  if (ch.answer > ceiling) err.push(`answer above ceiling ${ceiling}`);

  // per-skill ranges
  const [x, y, z] = ch.operands;
  const need = (cond, msg) => { if (!cond) err.push(msg); };
  switch (ch.form) {
    case 'a+b=?': case 'a-b=?': case 'a+?=c':
      need(within(x, s.a), `a ${x} ∉ ${s.a}`); need(within(y, s.b), `b ${y} ∉ ${s.b}`); need(within(ch.result, s.result), `result ∉ ${s.result}`); break;
    case '?+b=c': case '?-b=c':
      need(within(x, s.unknownRange), 'unknown out of range'); need(within(y, s.knownRange), 'known out of range'); need(within(ch.result, s.result), 'result out of range'); break;
    case 'a-?=c':
      need(within(y, s.unknownRange), 'unknown out of range'); need(within(ch.result, s.knownRange), 'c out of known range'); need(within(ch.result, s.result), 'result out of range'); break;
    case 'g*s=?':
      need(within(x, s.groups), 'groups'); need(within(y, s.size), 'size'); need(within(ch.result, s.result), 'product'); break;
    case 'n/k=?':
      need(within(y, s.divisor), 'divisor'); need(within(ch.result, s.quotient), 'quotient'); need(within(x, s.dividend), 'dividend'); need(x % y === 0, 'not exact'); break;
    case 'n/s=?':
      need(within(y, s.groupSize), 'groupSize'); need(within(ch.result, s.quotient), 'quotient'); need(within(x, s.dividend), 'dividend'); need(x % y === 0, 'not exact'); break;
    case 'a±b±c=?':
      need(within(x, s.a) && within(y, s.b) && within(z, s.c), 'operand range'); need(within(steps[0], s.intermediate), 'intermediate'); need(within(ch.result, s.result), 'result'); break;
    case 'g*s±d=?':
      need(within(x, s.groups) && within(y, s.size) && within(z, s.d), 'operand range'); need(within(steps[0], s.product), 'product'); need(within(ch.result, s.result), 'result'); break;
  }
  if (ch.crossesTen !== crossing(ch.operands, ch.ops)) err.push('crossesTen flag wrong');

  // equation string: exactly one '?', symbols only from the operator set
  const vals = [...ch.operands, ch.result].map((v, i) => (i === ch.unknown ? '?' : String(v)));
  const expect = vals.slice(0, -1).reduce((acc2, v, i) => (i === 0 ? v : `${acc2} ${SYM[ch.ops[i - 1]]} ${v}`), '') + ` = ${vals.at(-1)}`;
  if (ch.equation !== expect) err.push(`equation "${ch.equation}" ≠ "${expect}"`);

  // options
  const opts = ch.options ?? [];
  if (opts.length !== g.answerOptions) err.push(`expected ${g.answerOptions} options, got ${opts.length}`);
  if (new Set(opts).size !== opts.length) err.push('duplicate options');
  if (!opts.includes(ch.answer)) err.push('answer missing from options');
  const ds = opts.filter(o => o !== ch.answer);
  const reasons = rules.distractors[ch.form] ?? [];
  const realistic = new Set(reasons.flatMap(r => allowedByReason(r, ch)));
  const usable = [...realistic].filter(v => within(v, g.valueRange) && v !== ch.answer && v <= ceiling && Math.abs(v - ch.answer) <= g.maxDistractorDistance);
  for (const d of ds) {
    if (!within(d, g.valueRange)) err.push(`option ${d} outside value range`);
    if (d > ceiling) err.push(`option ${d} above ceiling ${ceiling}`);
    if (Math.abs(d - ch.answer) > g.maxDistractorDistance) err.push(`option ${d} too far from ${ch.answer}`);
    if (!realistic.has(d) && usable.length >= 2) {
      // fallback is only acceptable if realistic errors couldn't fill 2 slots without an even run
      const pairsOk = usable.some((u, i) => usable.slice(i + 1).some(w => !evenRunMiddle(ch.answer, u, w)));
      if (pairsOk) err.push(`option ${d} isn't a realistic error and fallback wasn't needed`);
    }
  }
  if (ds.length === 2 && evenRunMiddle(ch.answer, ds[0], ds[1])) err.push(`answer ${ch.answer} is middle of even run ${opts}`);
  return err;
}

function evenRunMiddle(ans, d1, d2) {
  const [lo, mid, hi] = [ans, d1, d2].sort((a, b) => a - b);
  return mid === ans && mid - lo === hi - mid;
}
