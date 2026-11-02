// Generates assets/machinery/truck.svg – master file with named layers, no state applied.
import { writeFileSync, mkdirSync } from 'node:fs';
import { color as C, size } from './tokens.mjs';

const S = size.slot;                       // 64 – one slot = one touch target
const IN = { x: 64, y: 112 };              // first cell (top-left of grid)
const GAP5 = 16;                           // gap after 5 columns (5+5 structure)
const slotXY = n => {                      // n = 1..30, fill order: bottom row first, left → right
  const r = Math.floor((n - 1) / 10), c = (n - 1) % 10;
  return { x: IN.x + c * S + (c >= 5 ? GAP5 : 0), y: IN.y + (2 - r) * S };
};

const slots = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1, { x, y } = slotXY(n), id = String(n).padStart(2, '0');
  return `      <rect id="slot-${id}" data-slot="${n}" x="${x + 4}" y="${y + 4}" width="56" height="56" rx="8" fill="none" stroke="${C.charcoal}" stroke-opacity="0.6" stroke-width="3" stroke-dasharray="8 6"/>`;
}).join('\n');

const wheel = (id, cx) => `    <g id="${id}" data-cx="${cx}" data-cy="360">
      <circle cx="${cx}" cy="360" r="44" fill="${C.charcoal}"/>
      <circle cx="${cx}" cy="360" r="20" fill="${C.concrete}" stroke="${C.charcoal}" stroke-width="4"/>
      <rect x="${cx - 3}" y="342" width="6" height="12" rx="3" fill="${C.charcoal}"/>
    </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="16 80 940 340" width="940" height="340">
  <title>Bouwmeesters – truck (master v0.1)</title>
  <defs>
    <g id="brick">
      <rect x="0" y="0" width="56" height="56" rx="8" fill="${C.brick}" stroke="${C.charcoal}" stroke-width="4"/>
      <rect x="6" y="6" width="44" height="10" rx="5" fill="${C.brickHi}"/>
    </g>
    <g id="brick-new">
      <rect x="0" y="0" width="56" height="56" rx="8" fill="${C.brickNew}" stroke="${C.charcoal}" stroke-width="4"/>
      <rect x="6" y="6" width="44" height="10" rx="5" fill="${C.white}" fill-opacity="0.6"/>
      <circle cx="28" cy="34" r="6" fill="${C.white}" stroke="${C.charcoal}" stroke-width="2"/>
    </g>
  </defs>

  <g id="truck">
    <rect id="truck-dropzone" x="24" y="72" width="736" height="272" fill="#000" fill-opacity="0"/>

    <rect id="truck-chassis" x="32" y="308" width="900" height="36" rx="14" fill="${C.orange}" stroke="${C.charcoal}" stroke-width="5"/>

    <g id="truck-cab">
      <rect id="truck-beacon" x="798" y="108" width="28" height="24" rx="10" fill="${C.orange}" stroke="${C.charcoal}" stroke-width="4"/>
      <path id="truck-cab-body" d="M752 316 V150 Q752 128 774 128 H860 Q884 128 898 148 L916 190 Q920 200 920 212 V316 Z" fill="${C.yellow}" stroke="${C.charcoal}" stroke-width="5" stroke-linejoin="round"/>
      <path id="truck-window" d="M772 150 H866 L884 206 H772 Z" fill="${C.sky}" stroke="${C.charcoal}" stroke-width="4" stroke-linejoin="round"/>
      <rect id="truck-window-shine" x="784" y="160" width="10" height="34" rx="5" fill="${C.white}" fill-opacity="0.7"/>
      <circle id="truck-headlight" cx="905" cy="280" r="10" fill="${C.white}" stroke="${C.charcoal}" stroke-width="4"/>
      <rect id="truck-bumper" x="908" y="298" width="32" height="40" rx="10" fill="${C.charcoal}"/>
    </g>

    <g id="truck-badge">
      <circle cx="818" cy="262" r="36" fill="${C.white}" stroke="${C.charcoal}" stroke-width="5"/>
      <text id="truck-badge-text" x="818" y="276" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="40" fill="${C.charcoal}">15</text>
    </g>

    <g id="truck-bed">
      <rect id="truck-bed-frame" x="48" y="96" width="688" height="224" rx="18" fill="${C.yellow}" stroke="${C.charcoal}" stroke-width="5"/>
      <rect id="truck-bed-inner" x="58" y="106" width="668" height="204" rx="10" fill="${C.sandLight}" stroke="${C.charcoal}" stroke-width="4"/>
      <line id="truck-bed-five-divider" x1="392" y1="112" x2="392" y2="304" stroke="${C.concrete}" stroke-width="3" stroke-linecap="round"/>
      <g id="truck-slots">
${slots}
      </g>
      <g id="truck-bricks"><!-- runtime: <use href="#brick"> / <use href="#brick-new"> per filled slot --></g>
      <g id="truck-tarp" display="none">
        <rect x="52" y="100" width="680" height="216" rx="14" fill="${C.tarp}" stroke="${C.charcoal}" stroke-width="5"/>
        <path d="M200 104 V312 M392 104 V312 M584 104 V312" stroke="${C.charcoal}" stroke-opacity="0.35" stroke-width="4"/>
        <path d="M60 140 Q392 170 724 140" fill="none" stroke="${C.sandLight}" stroke-width="6" stroke-linecap="round"/>
      </g>
    </g>

${wheel('wheel-rear-1', 176)}
${wheel('wheel-rear-2', 320)}
${wheel('wheel-front', 820)}
  </g>
</svg>
`;

mkdirSync('out', { recursive: true });
writeFileSync('out/truck.svg', svg);
export { slotXY };
console.log('wrote out/truck.svg');
