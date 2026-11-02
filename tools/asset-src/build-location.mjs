// Generates out/location-magazijn.svg – Het Materialenmagazijn, 1280×800 (16:10, tablet landscape).
// The truck is NOT inside this file: place truck.svg at #truck-anchor (x 24, y 330, 940×340, scale 1).
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { color as C } from './tokens.mjs';

const K = C.charcoal;
const W = 1280, H = 800, GROUND = 654;
const SKY_LIGHT = '#D6EEF9', ROAD = '#E6D9BD';

// wall: 3 sections stacked bottom → top, each 3 rows of 40×20 running-bond bricks
const WALL = { x: 900, w: 320, base: 320, rowH: 20, brickW: 40 };
const wallSection = n => {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = (n - 1) * 3 + r, y = WALL.base - (row + 1) * WALL.rowH;
    const off = row % 2 ? WALL.brickW / 2 : 0;
    for (let x = WALL.x - off; x < WALL.x + WALL.w; x += WALL.brickW) {
      const x0 = Math.max(x, WALL.x), x1 = Math.min(x + WALL.brickW, WALL.x + WALL.w);
      rows.push(`<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${WALL.rowH}" fill="${C.brick}" stroke="${K}" stroke-width="2.5"/>`);
    }
  }
  const top = WALL.base - n * 3 * WALL.rowH;
  return `    <g id="wall-section-${n}-ghost"><rect x="${WALL.x}" y="${top}" width="${WALL.w}" height="${3 * WALL.rowH}" fill="none" stroke="${K}" stroke-opacity="0.45" stroke-width="3" stroke-dasharray="10 7"/></g>
    <g id="wall-section-${n}">${rows.join('')}</g>`;
};

// brick stack: pyramid 4-3-2 of the SAME 56×56 brick as the truck (what you drag is what lands)
const pile = [];
[[4, 0], [3, 1], [2, 2]].forEach(([count, level]) => {
  const rowW = count * 60, x0 = 1120 - rowW / 2, y = 626 - (level + 1) * 58;
  for (let i = 0; i < count; i++) pile.push(`<use href="#brick" x="${x0 + i * 60 + 2}" y="${y}"/>`);
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <title>Bouwmeesters – Het Materialenmagazijn (location master v0.1)</title>
  <defs>
    <g id="brick">
      <rect x="0" y="0" width="56" height="56" rx="8" fill="${C.brick}" stroke="${K}" stroke-width="4"/>
      <rect x="6" y="6" width="44" height="10" rx="5" fill="${C.brickHi}"/>
    </g>
  </defs>

  <g id="bg">
    <rect id="bg-sky" width="${W}" height="330" fill="${SKY_LIGHT}"/>
    <g id="bg-clouds" fill="${C.white}">
      <path d="M150 80 a26 26 0 0 1 48 -10 a22 22 0 0 1 38 14 a18 18 0 0 1 -6 34 h-76 a20 20 0 0 1 -4 -38z"/>
      <path d="M700 58 a22 22 0 0 1 40 -8 a18 18 0 0 1 32 12 a15 15 0 0 1 -5 28 h-64 a17 17 0 0 1 -3 -32z"/>
    </g>
    <rect id="bg-ground" y="316" width="${W}" height="${H - 316}" fill="${C.sand}"/>
    <rect id="bg-grass" y="312" width="${W}" height="14" fill="${C.green}"/>
    <rect id="bg-road" y="596" width="${W}" height="110" fill="${ROAD}"/>
    <path id="bg-road-edge" d="M0 596 H${W}" stroke="${K}" stroke-opacity="0.25" stroke-width="3"/>
  </g>

  <g id="warehouse">
    <rect id="warehouse-body" x="60" y="172" width="480" height="150" fill="${C.sandLight}" stroke="${K}" stroke-width="5"/>
    <path id="warehouse-roof" d="M36 186 L300 104 L564 186 Z" fill="${C.orange}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
    <g id="warehouse-door">
      <rect x="210" y="208" width="180" height="114" fill="${K}"/>
      <path d="M216 246 H384 M216 284 H384" stroke="${C.yellow}" stroke-width="5"/>
      <rect x="230" y="222" width="30" height="22" rx="3" fill="${C.brick}"/><rect x="266" y="226" width="26" height="18" rx="3" fill="${C.concrete}"/>
      <rect x="330" y="260" width="34" height="22" rx="3" fill="${C.brick}"/><rect x="240" y="262" width="24" height="20" rx="3" fill="${C.sky}"/>
    </g>
    <rect id="warehouse-window-1" x="96" y="214" width="76" height="54" rx="8" fill="${C.sky}" stroke="${K}" stroke-width="4"/>
    <rect id="warehouse-window-2" x="428" y="214" width="76" height="54" rx="8" fill="${C.sky}" stroke="${K}" stroke-width="4"/>
  </g>

  <rect id="char-boss-anchor" x="590" y="150" width="110" height="172" fill="#000" fill-opacity="0"/>

  <g id="sign">
    <rect id="sign-post" x="806" y="210" width="16" height="112" rx="4" fill="${C.concrete}" stroke="${K}" stroke-width="4"/>
    <rect id="sign-board" x="744" y="140" width="140" height="84" rx="14" fill="${C.white}" stroke="${K}" stroke-width="5"/>
    <use href="#brick" x="756" y="154" transform="translate(756 154) scale(0.55) translate(-756 -154)"/>
    <text id="sign-text" x="844" y="202" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="48" fill="${K}">24</text>
  </g>

  <g id="wall">
${wallSection(1)}
${wallSection(2)}
${wallSection(3)}
    <rect id="wall-foundation" x="${WALL.x - 10}" y="${WALL.base}" width="${WALL.w + 20}" height="10" rx="3" fill="${C.concrete}" stroke="${K}" stroke-width="3"/>
  </g>

  <rect id="truck-anchor" x="24" y="330" width="940" height="340" fill="#000" fill-opacity="0"/>

  <g id="brick-stack">
    <rect id="brick-stack-hit" x="990" y="436" width="260" height="226" fill="#000" fill-opacity="0"/>
    <g id="brick-stack-pallet">
      <rect x="1000" y="626" width="240" height="14" rx="3" fill="${C.orange}" stroke="${K}" stroke-width="4"/>
      <rect x="1006" y="640" width="28" height="14" fill="${C.orange}" stroke="${K}" stroke-width="4"/>
      <rect x="1106" y="640" width="28" height="14" fill="${C.orange}" stroke="${K}" stroke-width="4"/>
      <rect x="1206" y="640" width="28" height="14" fill="${C.orange}" stroke="${K}" stroke-width="4"/>
    </g>
    <g id="brick-stack-pile">${pile.join('')}</g>
  </g>

  <g id="cue-next-job">
    <path d="M370 252 H410 V286 H432 L390 330 L348 286 H370 Z" fill="${C.orange}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
  </g>

  <g id="guides" display="none">
    <rect id="guide-instruction" x="0" y="0" width="${W}" height="88" fill="${C.sky}" fill-opacity="0.18" stroke="${C.sky}" stroke-width="2" stroke-dasharray="8 6"/>
    <rect id="guide-answers" x="0" y="680" width="${W}" height="120" fill="${C.sky}" fill-opacity="0.18" stroke="${C.sky}" stroke-width="2" stroke-dasharray="8 6"/>
    <rect id="guide-home" x="16" y="12" width="168" height="72" rx="36" fill="none" stroke="${C.sky}" stroke-width="3"/>
  </g>
</svg>
`;
mkdirSync('out', { recursive: true });
writeFileSync('out/location-magazijn.svg', svg);
console.log('wrote out/location-magazijn.svg');
