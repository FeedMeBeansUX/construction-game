import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRng, generate, checkAnswer, crossesTen, equationString } from '../js/engines/math-engine.js';
import { validateChallenge } from '../js/engines/math-validate.js';

const rules = JSON.parse(readFileSync(new URL('../data/challenge-rules.json', import.meta.url)));
const SKILLS = Object.keys(rules.skills);

test('crossing ten', () => {
  assert.equal(crossesTen('+', 8, 5), true);
  assert.equal(crossesTen('+', 15, 5), false);   // lands on 20
  assert.equal(crossesTen('+', 15, 9), true);
  assert.equal(crossesTen('-', 23, 5), true);
  assert.equal(crossesTen('-', 25, 5), false);
  assert.equal(crossesTen('-', 20, 5), true);
});

test('equation string uses ? and real symbols', () => {
  assert.equal(equationString({ operands: [15, 9], ops: ['+'], result: 24, unknown: 1 }), '15 + ? = 24');
  assert.equal(equationString({ operands: [4, 5], ops: ['*'], result: 20, unknown: 2 }), '4 × 5 = ?');
  assert.equal(equationString({ operands: [20, 4], ops: ['/'], result: 5, unknown: 2 }), '20 ÷ 4 = ?');
  assert.equal(equationString({ operands: [27, 5], ops: ['-'], result: 22, unknown: 2 }), '27 − 5 = ?');
});

test('same seed gives same challenge', () => {
  for (const skill of SKILLS) {
    const a = generate(skill, { rules, rng: createRng(7) });
    const b = generate(skill, { rules, rng: createRng(7) });
    assert.deepEqual(a, b, skill);
  }
});

test('stress: 500 challenges per skill, all valid', () => {
  let n = 0;
  for (const skill of SKILLS) {
    const rng = createRng(1000 + n);
    const history = [];
    for (let i = 0; i < 500; i++) {
      const ch = generate(skill, { rules, rng, history });
      const errors = validateChallenge(ch, rules);
      assert.deepEqual(errors, [], `${skill} ${ch.equation} options ${ch.options}: ${errors.join('; ')}`);
      history.push(ch); n++;
    }
  }
  assert.equal(n, SKILLS.length * 500);
});

test('crossing-ten ratio stays near the configured value', () => {
  for (const [skill, s] of Object.entries(rules.skills)) {
    if (s.crossingTenRatio === undefined) continue;
    const rng = createRng(99);
    let cross = 0; const N = 1000;
    for (let i = 0; i < N; i++) cross += generate(skill, { rules, rng }).crossesTen ? 1 : 0;
    assert.ok(Math.abs(cross / N - s.crossingTenRatio) < 0.06, `${skill}: ${cross / N} vs ${s.crossingTenRatio}`);
  }
});

test('anti-repetition: no repeat within window, max 2 same answers in a row', () => {
  for (const skill of ['missing.add.to20', 'missing.add.to30']) {
    const rng = createRng(5), history = [];
    for (let i = 0; i < 300; i++) {
      const ch = generate(skill, { rules, rng, history });
      const window = history.slice(-rules.global.noRepeatWindow).map(h => h.equation);
      assert.ok(!window.includes(ch.equation), `repeat ${ch.equation}`);
      const last2 = history.slice(-2).map(h => h.answer);
      assert.ok(!(last2.length === 2 && last2.every(a => a === ch.answer)), `3× answer ${ch.answer}`);
      history.push(ch);
    }
  }
});

test('correct answer position is not biased', () => {
  const rng = createRng(3), pos = [0, 0, 0];
  for (let i = 0; i < 3000; i++) { const ch = generate('missing.add.to20', { rules, rng }); pos[ch.options.indexOf(ch.answer)]++; }
  for (const p of pos) assert.ok(p > 850 && p < 1150, `positions ${pos}`);
});

test('fallback distractors are rare (< 15%)', () => {
  const rng = createRng(11); let fb = 0, total = 0;
  for (const skill of SKILLS) for (let i = 0; i < 200; i++) {
    total++; if (generate(skill, { rules, rng }).distractors.some(d => d.reason === 'fallback')) fb++;
  }
  assert.ok(fb / total < 0.15, `fallback rate ${(fb / total).toFixed(3)}`);
});

test('checkAnswer', () => {
  const ch = generate('missing.add.to20', { rules, rng: createRng(1) });
  assert.equal(checkAnswer(ch, ch.answer), true);
  assert.equal(checkAnswer(ch, ch.distractors[0].value), false);
});

test('validator catches broken challenges', () => {
  const ch = generate('missing.add.to20', { rules, rng: createRng(2) });
  assert.ok(validateChallenge({ ...ch, answer: ch.answer + 1 }, rules).length > 0, 'wrong answer');
  assert.ok(validateChallenge({ ...ch, options: [ch.answer, ch.answer + 1, ch.answer - 1] }, rules).some(e => /even run/.test(e)), 'even run');
  assert.ok(validateChallenge({ ...ch, options: [ch.answer, 29, 30] }, rules).length > 0, 'ceiling / distance');
  assert.ok(validateChallenge({ ...ch, operands: [ch.operands[0], 1], result: ch.operands[0] + 1, answer: 1 }, rules).some(e => /b 1/.test(e)), 'gap too small');
});

test('slice mission skills generate', () => {
  for (const skill of rules.missions['slice.materialenwagen'].skills) {
    const ch = generate(skill, { rules, rng: createRng(42) });
    assert.equal(ch.form, 'a+?=c');
    assert.equal(ch.options.length, 3);
  }
});
