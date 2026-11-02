# Bouwmeesters – instructions for coding sessions

Dutch maths construction game for ages 4–6. Solo maker (UX designer, limited coding). Specs live in the Claude Project "Construction Game"; copies of the build-relevant ones are in `/docs` and `/data`.

## Stack and rules
- HTML, CSS, vanilla JS (ES modules), SVG, localStorage. PWA later. No frameworks, no Canvas, no backend, no build step, no runtime dependencies.
- Layers: presentation (`js/screens`, `js/components`) / game controller (`js/core`) / engines (`js/engines`: activity, math, adaptive, reward) / persistence (`js/core/persistence.js`). Maths and adaptive logic never live in screen code.
- Engines are pure: no DOM, no fetch, no Date/Math.random inside — pass rules, rng and history in.
- Content in JSON (`data/`). Dutch copy only via `data/copy-nl.json` IDs; never hard-code Dutch strings in JS.
- Code identifiers and comments in English.
- Privacy: no network calls during play, no analytics, no personal data.

## Design rules that affect code
- No scores, timers, lives, red, failure sounds or failure screens. Wrong answers go to the hint ladder.
- Max 3 answer options. Symbols (+ − × ÷ ?) only at the `equation` support level.
- Every drag has a tap alternative. Touch targets ≥ 64 px.

## Commands
- `npm test` – unit tests (node:test, no deps).
- `node scripts/sample.mjs [seed]` – print 20 generated problems.
- Serve locally: `npx serve .` or any static server (ES modules need http, not file://).

## Workflow
- One task per session, small verifiable steps, commit after each working step.
- State acceptance criteria first; verify against them before reporting done.
- Asset sources: `tools/asset-src/*.mjs` regenerate the SVGs in `assets/` (they write to `out/`; copy over).
