# Maths content spec v0.1 – Bouwmeesters

Copy of the Project doc (2 Nov 2026). Machine-readable rules: `data/challenge-rules.json`. Where they differ, the JSON wins.

## 1. Skill taxonomy

Entry baseline: the player can add and subtract within 15. Level 1 is consolidation, not teaching.

| Level | Skill ID | Form | Range | Start support |
|---|---|---|---|---|
| 1 Starter | `add.within15`, `sub.within15` | a + b, a − b | result ≤ 15 | numerals |
| 2 Bouwer | `add.to20`, `sub.to20` | a + b, a − b | 16–20 (add), from 16–20 (sub), 50% crossing ten | objects+numerals |
| 2 Bouwer | `missing.add.to20` | a + ? = c | c 11–20, gap 3–9 | objects |
| 3 Expert | `add.to30`, `sub.to30` | a + b, a − b | 21–30, 50% crossing ten | objects+numerals |
| 3 Expert | `missing.add.to30` | a + ? = c | c 21–30, gap 4–10, 60% crossing ten | objects |
| 3 Expert | `missing.mixed.to30` | ? + b = c, a − ? = c, ? − b = c | all values ≤ 30 | objects |
| 4 Vermenigvuldiger | `mul.groups` | g groups of s | g 2–5, s 2–6, product ≤ 30 | objects |
| 5 Verdeler | `div.share`, `div.group` | fair sharing / how many groups | divisor 2–5, exact only, dividend ≤ 30 | objects |
| 6 Meesterbouwer | `multi.addsub`, `multi.mulAddSub` | a ± b ± c, g × s ± d | every intermediate 0–30, result 1–30 | objects / objects+numerals |

Each skill has two representations (objects + number line; groups + rows; share + groups). Levels are a content order, not a gate. The slice mission uses `missing.add.to20` and `missing.add.to30`.

Engine interpretation (v0.1): in `missing.mixed.to30`, `unknownRange` is the hidden number and `knownRange` the other operand, except in `a − ? = c`, where `knownRange` applies to `c`.

## 2. Generator constraints
- All operands, intermediates, answers and options are whole numbers in 0–30. No negatives. Division is exact.
- Crossing ten is drawn at the skill's `crossingTenRatio`. Crossing = units sum > 10 (add) or minuend units < subtrahend units (sub). 15 + 5 = 20 does not cross.
- Missing-addend gaps start at 3 (to 20) or 4 (to 30).
- Multi-step results are ≥ 1.
- Anti-repetition: no identical problem within the last 10 for that skill; same answer at most 2 times in a row.

## 3. Answer options and distractors
Exactly 3 options: the answer plus 2 distractors, taken in priority order (per form, see JSON) from realistic errors: off by one, off by ten (only when crossing ten), wrong operation, visible number, neighbour fact, add the factors, divisor as answer, one step only.

Filters: distinct, ≠ answer, within ±10, ≤ level ceiling (15 / 20 / 30); the answer is never the middle of an even run. If fewer than 2 survive, fall back to ans+2, +3 on the same side as an existing off-by-one. Options are shuffled.

## 4. Support levels and answer mode
`objects → objects-numerals → numerals → equation`. Objects levels: load bricks, tap Klaar, then 1 of 3 "how many did you add?". Numerals/equation: choose 1 of 3, then bricks load visibly. Symbols only at equation level. No number pad in slice or Alpha.

## 5. Placement round, 6. Adaptive rules
See `data/challenge-rules.json` (`placement`, `adaptive`). Window 8; less support at ≥ 6 attempts and ≥ 85%; more support at ≥ 4 attempts and ≤ 40%; mastery = less-support criteria met at numerals/equation in 2 representations.

## 7. Validation
`npm test` runs 7,000 generated problems (500 per skill) through the independent validator (`js/engines/math-validate.js`). `node scripts/sample.mjs 42` prints a 20-problem sample.
