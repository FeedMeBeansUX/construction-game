// Prints 20 generated problems covering every skill, and validates each.
// Usage: node scripts/sample.mjs [seed]
import { readFileSync } from 'node:fs';
import { createRng, generate } from '../js/engines/math-engine.js';
import { validateChallenge } from '../js/engines/math-validate.js';

const rules = JSON.parse(readFileSync(new URL('../data/challenge-rules.json', import.meta.url)));
const seed = Number(process.argv[2] ?? 42);
const rng = createRng(seed);
const plan = ['missing.add.to20', 'missing.add.to20', 'missing.add.to30', 'missing.add.to30', 'add.within15', 'sub.within15',
  'add.to20', 'sub.to20', 'add.to30', 'sub.to30', 'missing.mixed.to30', 'missing.mixed.to30', 'mul.groups', 'mul.groups',
  'div.share', 'div.share', 'div.group', 'multi.addsub', 'multi.addsub', 'multi.mulAddSub'];

let invalid = 0;
const history = [];
plan.forEach((skill, i) => {
  const ch = generate(skill, { rules, rng, history });
  history.push(ch);
  const errors = validateChallenge(ch, rules);
  if (errors.length) invalid++;
  const why = ch.distractors.map(d => `${d.value}:${d.reason}`).join(', ');
  console.log(`${String(i + 1).padStart(2)}. ${skill.padEnd(18)} ${ch.equation.padEnd(16)} ans ${String(ch.answer).padStart(2)}  options [${ch.options.join(', ')}]  (${why})${errors.length ? '  INVALID: ' + errors.join('; ') : ''}`);
});
console.log(`\nseed ${seed}: ${invalid} invalid of ${plan.length}`);
process.exitCode = invalid ? 1 : 0;
