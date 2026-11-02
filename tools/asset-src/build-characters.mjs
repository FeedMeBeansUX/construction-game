// Generates out/char-bram.svg and out/char-sam.svg – 3 poses each (idle, wave, cheer).
// Pose box 220×344 (= 2× the 110×172 #char-boss-anchor). Poses sit side by side at x 0 / 240 / 480.
import { writeFileSync, mkdirSync } from 'node:fs';
import { color as C } from './tokens.mjs';
const K = C.charcoal;

export const charColor = {
  skinBram: '#F0C29A', skinSam: '#9A6440',
  beard: '#7A4E2D', hairSam: '#2E2420',
  shoe: '#5A3D2B', cheek: '#E8907A',
};
const X = charColor;

// limb: thick outlined stroke (outline drawn as a wider charcoal stroke underneath)
const limb = (d, col, w = 24) =>
  `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + 10}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const hand = (x, y, skin) => `<circle cx="${x}" cy="${y}" r="15" fill="${skin}" stroke="${K}" stroke-width="5"/>`;

// arm end points per pose (shoulders at 62,206 and 158,206)
const ARMS = {
  idle:  { l: 'M62 206 Q46 236 46 270', lh: [46, 274], r: 'M158 206 Q174 236 174 270', rh: [174, 274] },
  wave:  { l: 'M62 206 Q46 236 46 270', lh: [46, 274], r: 'M158 206 Q196 186 200 130', rh: [201, 124] },
  cheer: { l: 'M62 206 Q30 180 24 128', lh: [23, 122], r: 'M158 206 Q190 180 196 128', rh: [197, 122] },
};

const face = (pose, skin, opts) => {
  const happy = pose === 'cheer';
  const eyes = happy
    ? `<path d="M80 128 Q90 116 100 128 M120 128 Q130 116 140 128" fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"/>`
    : `<ellipse cx="90" cy="126" rx="7" ry="9" fill="${K}"/><ellipse cx="130" cy="126" rx="7" ry="9" fill="${K}"/>
       <circle cx="92" cy="122" r="2.5" fill="${C.white}"/><circle cx="132" cy="122" r="2.5" fill="${C.white}"/>`;
  const brows = opts.brows ? `<path d="M78 108 Q90 101 102 107 M118 107 Q130 101 142 108" fill="none" stroke="${opts.brows}" stroke-width="6" stroke-linecap="round"/>` : '';
  const cheeks = `<ellipse cx="74" cy="146" rx="10" ry="6" fill="${X.cheek}" fill-opacity="0.55"/><ellipse cx="146" cy="146" rx="10" ry="6" fill="${X.cheek}" fill-opacity="0.55"/>`;
  const mouth = happy
    ? `<path d="M94 150 Q110 174 126 150 Z" fill="${K}"/><path d="M101 160 Q110 166 119 160" fill="none" stroke="${X.cheek}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M96 152 Q110 164 124 152" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  return { eyes: eyes + brows, cheeks, mouth };
};

const helmet = (col, extra = '') => `
  <path d="M50 112 Q50 52 110 52 Q170 52 170 112 Z" fill="${col}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M110 54 V108" stroke="${K}" stroke-opacity="0.25" stroke-width="8" stroke-linecap="round"/>
  <rect x="40" y="104" width="140" height="16" rx="8" fill="${col}" stroke="${K}" stroke-width="5"/>${extra}`;

function bram(pose) {
  const s = X.skinBram, f = face(pose, s, { brows: X.beard }), a = ARMS[pose];
  const clipboard = pose !== 'cheer' ? `<g id="bram-${pose}-clipboard">
      <rect x="${a.lh[0] - 26}" y="${a.lh[1] - 54}" width="44" height="58" rx="6" fill="${C.sandLight}" stroke="${K}" stroke-width="4"/>
      <rect x="${a.lh[0] - 14}" y="${a.lh[1] - 60}" width="20" height="10" rx="3" fill="${C.concrete}" stroke="${K}" stroke-width="3"/>
      <path d="M${a.lh[0] - 18} ${a.lh[1] - 36} h28 M${a.lh[0] - 18} ${a.lh[1] - 24} h20" stroke="${K}" stroke-width="3" stroke-linecap="round"/></g>` : '';
  return `<g id="bram-${pose}">
    <g id="bram-${pose}-legs">
      <rect x="72" y="282" width="32" height="40" fill="${K}"/><rect x="116" y="282" width="32" height="40" fill="${K}"/>
      <ellipse cx="86" cy="328" rx="24" ry="12" fill="${X.shoe}" stroke="${K}" stroke-width="4"/><ellipse cx="134" cy="328" rx="24" ry="12" fill="${X.shoe}" stroke="${K}" stroke-width="4"/>
    </g>
    <g id="bram-${pose}-body">
      <path d="M58 214 Q58 190 84 188 H136 Q162 190 162 214 V286 H58 Z" fill="${K}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M60 214 Q60 192 84 190 H100 L100 284 H60 Z" fill="${C.orange}"/>
      <path d="M160 214 Q160 192 136 190 H120 L120 284 H160 Z" fill="${C.orange}"/>
      <path d="M60 240 H100 M120 240 H160 M60 264 H100 M120 264 H160" stroke="${C.sandLight}" stroke-width="7"/>
      <path d="M58 214 Q58 190 84 188 H136 Q162 190 162 214 V286 H58 Z" fill="none" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
    </g>
    <g id="bram-${pose}-arm-left">${limb(a.l, C.orange)}${hand(...a.lh, s)}</g>
    ${clipboard}
    <g id="bram-${pose}-arm-right">${limb(a.r, C.orange)}${hand(...a.rh, s)}</g>
    <g id="bram-${pose}-head">
      <circle cx="110" cy="134" r="58" fill="${s}" stroke="${K}" stroke-width="5"/>
      <path id="bram-${pose}-beard" d="M53 142 Q66 178 94 172 Q110 180 126 172 Q154 178 167 142 Q166 200 110 202 Q54 200 53 142 Z" fill="${X.beard}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
      ${f.cheeks}${f.eyes}${f.mouth}
      <ellipse cx="110" cy="141" rx="9" ry="7" fill="${X.cheek}" stroke="${K}" stroke-width="3"/>
      <g id="bram-${pose}-helmet">${helmet(C.white, `<rect x="98" y="68" width="24" height="12" rx="4" fill="${C.orange}"/>`)}</g>
    </g>
  </g>`;
}

function sam(pose) {
  const s = X.skinSam, f = face(pose, s, { brows: X.hairSam }), a = ARMS[pose];
  const wrench = pose !== 'cheer' ? `<g id="sam-${pose}-wrench" transform="rotate(-20 ${a.lh[0]} ${a.lh[1]})">
      <rect x="${a.lh[0] - 6}" y="${a.lh[1] - 4}" width="12" height="46" rx="5" fill="${C.concrete}" stroke="${K}" stroke-width="4"/>
      <path d="M${a.lh[0] - 14} ${a.lh[1] + 40} a14 14 0 1 0 28 0 l-6 0 l0 8 l-16 0 l0 -8 z" fill="${C.concrete}" stroke="${K}" stroke-width="4" stroke-linejoin="round"/></g>` : '';
  const hair = `<path d="M56 116 q-8 14 2 26 q-10 10 0 22 M164 116 q8 14 -2 26 q10 10 0 22" fill="none" stroke="${X.hairSam}" stroke-width="12" stroke-linecap="round"/>`;
  const muffs = `<rect x="38" y="112" width="22" height="40" rx="10" fill="${C.orange}" stroke="${K}" stroke-width="4"/><rect x="160" y="112" width="22" height="40" rx="10" fill="${C.orange}" stroke="${K}" stroke-width="4"/>`;
  return `<g id="sam-${pose}">
    <g id="sam-${pose}-legs">
      <rect x="74" y="282" width="30" height="40" fill="${C.green}" stroke="${K}" stroke-width="4"/><rect x="116" y="282" width="30" height="40" fill="${C.green}" stroke="${K}" stroke-width="4"/>
      <ellipse cx="88" cy="328" rx="22" ry="12" fill="${K}"/><ellipse cx="132" cy="328" rx="22" ry="12" fill="${K}"/>
    </g>
    <g id="sam-${pose}-body">
      <path d="M62 216 Q62 192 86 190 H134 Q158 192 158 216 V288 H62 Z" fill="${C.yellow}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M72 230 H148 V288 H72 Z" fill="${C.green}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M78 192 L82 232 M142 192 L138 232" stroke="${C.green}" stroke-width="10" stroke-linecap="round"/>
      <rect x="96" y="244" width="28" height="20" rx="4" fill="none" stroke="${K}" stroke-width="4"/>
    </g>
    <g id="sam-${pose}-arm-left">${limb(a.l, C.yellow)}${hand(...a.lh, s)}</g>
    ${wrench}
    <g id="sam-${pose}-arm-right">${limb(a.r, C.yellow)}${hand(...a.rh, s)}</g>
    <g id="sam-${pose}-head">
      ${hair}
      <circle cx="110" cy="134" r="56" fill="${s}" stroke="${K}" stroke-width="5"/>
      ${f.cheeks}${f.eyes}${f.mouth}
      <g id="sam-${pose}-helmet">${helmet(C.yellow, muffs)}</g>
    </g>
  </g>`;
}

const sheet = (name, fn) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 344" width="700" height="344">
  <title>Bouwmeesters – ${name} (poses v0.1)</title>
  <g transform="translate(0 0)">${fn('idle')}</g>
  <g transform="translate(240 0)">${fn('wave')}</g>
  <g transform="translate(480 0)">${fn('cheer')}</g>
</svg>
`;
mkdirSync('out', { recursive: true });
writeFileSync('out/char-bram.svg', sheet('Bram', bram));
writeFileSync('out/char-sam.svg', sheet('Sam', sam));
console.log('wrote characters');
