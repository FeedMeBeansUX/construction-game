# Bouwmeesters

A Dutch browser game in which children aged 4–6 do construction jobs that need maths. Vanilla JS + SVG, no build step.

**Status:** Phase 3 – vertical slice "De materialenwagen". Steps 1–3 done: maths engine, state + persistence, navigation shell (gameplay and placement are stubs).

## Run
- Tests: `npm test`
- Sample problems: `node scripts/sample.mjs 42`
- Play (once screens exist): serve the folder with any static server and open `index.html`.

## Structure
```
index.html
css/            styles
js/core/        game controller, state, event bus, navigation, persistence
js/engines/     math, adaptive, activity, reward engines (pure, no DOM)
js/screens/     one module per screen
js/components/  reusable UI pieces
data/           challenge-rules.json, copy-nl.json, missions
assets/         SVG art (named layers)
docs/           specs
test/           unit tests
tools/          asset generators
```

## Hosting
GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
