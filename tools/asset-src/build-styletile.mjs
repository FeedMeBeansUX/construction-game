// Generates out/style-tile.svg – importable into Figma (text stays editable, font: Nunito).
import { writeFileSync, mkdirSync } from 'node:fs';
import { color as C, type as T, size, contrast } from './tokens.mjs';

const F = `font-family="Nunito"`;
const txt = (x, y, s, w, fill, str, extra = '') =>
  `<text x="${x}" y="${y}" ${F} font-size="${s}" font-weight="${w}" fill="${fill}" ${extra}>${str}</text>`;
const label = (x, y, str) => txt(x, y, 16, 700, C.charcoal, str, 'fill-opacity="0.7"');
const h2 = (x, y, str) => txt(x, y, 22, 900, C.charcoal, str);

// 40×40 icons, stroke-based, charcoal
const ic = {
  play:  `<path d="M13 8 L33 20 L13 32 Z" fill="${C.charcoal}" stroke="${C.charcoal}" stroke-width="3" stroke-linejoin="round"/>`,
  hat:   `<path d="M7 28 Q7 9 20 9 Q33 9 33 28 Z" fill="${C.charcoal}"/><rect x="3" y="27" width="34" height="7" rx="3.5" fill="${C.charcoal}"/><rect x="18" y="5" width="4" height="10" rx="2" fill="${C.charcoal}"/>`,
  check: `<path d="M8 21 L17 30 L33 11" fill="none" stroke="${C.charcoal}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  house: `<path d="M5 20 L20 7 L35 20" fill="none" stroke="${C.charcoal}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18 V34 H30 V18" fill="none" stroke="${C.charcoal}" stroke-width="5" stroke-linejoin="round"/><rect x="17" y="24" width="6" height="10" fill="${C.charcoal}"/>`,
  arrow: `<path d="M6 20 H32 M22 10 L32 20 L22 30" fill="none" stroke="${C.charcoal}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  door:  `<rect x="10" y="5" width="20" height="30" rx="3" fill="none" stroke="${C.charcoal}" stroke-width="5"/><circle cx="24" cy="21" r="2.5" fill="${C.charcoal}"/>`,
};

// pill button: icon + word, 72 high
const button = (id, x, y, icon, word, fill, stroke = C.charcoal) => {
  const w = 28 + 40 + 14 + Math.round(word.length * 15.5) + 32;
  return { w, svg: `<g id="btn-${id}" transform="translate(${x} ${y})">
    <rect width="${w}" height="${size.buttonH}" rx="36" fill="${fill}" stroke="${stroke}" stroke-width="5"/>
    <rect x="4" y="${size.buttonH - 12}" width="${w - 8}" height="6" rx="3" fill="${C.charcoal}" fill-opacity="0.12"/>
    <g transform="translate(28 16)">${ic[icon]}</g>
    ${txt(82, 46, T.button.size, T.button.weight, C.charcoal, word)}
  </g>` };
};

const tile = (id, x, y, n, state) => {
  const s = size.tile;
  const st = {
    default:  { fill: C.white, stroke: C.charcoal, sw: 5, extra: '' },
    selected: { fill: C.white, stroke: C.sky, sw: 8, extra: '' },
    hint:     { fill: C.white, stroke: C.yellow, sw: 10, extra: '' },
    correct:  { fill: C.green, stroke: C.charcoal, sw: 5,
      extra: `<g transform="translate(${s - 30} -14)"><circle cx="20" cy="20" r="22" fill="${C.white}" stroke="${C.charcoal}" stroke-width="4"/>${ic.check}</g>` },
  }[state];
  return `<g id="tile-${id}" transform="translate(${x} ${y})">
    <rect width="${s}" height="${s}" rx="20" fill="${st.fill}" stroke="${st.stroke}" stroke-width="${st.sw}"/>
    <rect x="6" y="${s - 14}" width="${s - 12}" height="7" rx="3.5" fill="${C.charcoal}" fill-opacity="0.12"/>
    ${txt(s / 2, s / 2 + 21, T.numeralTile.size, T.numeralTile.weight, C.charcoal, n, 'text-anchor="middle"')}
    ${st.extra}
  </g>`;
};

const out = [];
const W = 1440, H = 1560;
out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
out.push(`<rect id="bg" width="${W}" height="${H}" fill="${C.sand}"/>`);
out.push(txt(64, 84, 44, 900, C.charcoal, 'Bouwmeesters'));
out.push(txt(64, 118, 20, 700, C.charcoal, 'Style tile v0.1 · Phase 2 · tokens in tokens.mjs', 'fill-opacity="0.7"'));

// 1. Colour
out.push(h2(64, 184, '1  Colour'));
const sw = [
  ['yellow', 'Primary'], ['orange', 'Secondary'], ['sky', 'Accent'], ['green', 'Positive'],
  ['sand', 'Background'], ['charcoal', 'Text / outline'], ['concrete', 'Neutral'],
  ['white', 'Tile / badge'], ['sandLight', 'Bed / card'], ['brick', 'Brick'], ['brickNew', 'Brick (new)'], ['tarp', 'Tarp'],
];
sw.forEach(([k, role], i) => {
  const x = 64 + i * 112, y = 208;
  out.push(`<g id="swatch-${k}"><rect x="${x}" y="${y}" width="96" height="96" rx="16" fill="${C[k]}" stroke="${C.charcoal}" stroke-width="3"/>
  ${txt(x, y + 122, 15, 800, C.charcoal, k)}${txt(x, y + 142, 14, 600, C.charcoal, C[k], 'fill-opacity="0.75"')}${txt(x, y + 160, 13, 600, C.charcoal, role, 'fill-opacity="0.6"')}</g>`);
});
out.push(label(64, 400, 'GDD 10.2 palette (first 7) + v0.1 additions. Red is not used anywhere, so it can never read as "wrong".'));

// contrast table
out.push(h2(64, 452, 'Text contrast (charcoal text unless noted) · target ≥ 4.5:1'));
const pairs = [['charcoal', 'sand'], ['charcoal', 'yellow'], ['charcoal', 'orange'], ['charcoal', 'green'],
  ['charcoal', 'sky'], ['charcoal', 'white'], ['charcoal', 'sandLight'], ['white', 'orange'], ['white', 'green']];
const results = pairs.map(([fg, bg]) => ({ fg, bg, r: contrast(C[fg], C[bg]) }));
results.forEach(({ fg, bg, r }, i) => {
  const x = 64 + i * 148, y = 476, ok = r >= 4.5, large = r >= 3;
  out.push(`<g id="contrast-${fg}-on-${bg}"><rect x="${x}" y="${y}" width="136" height="64" rx="12" fill="${C[bg]}" stroke="${C.charcoal}" stroke-width="2"/>
  ${txt(x + 68, y + 42, 26, 900, C[fg], r.toFixed(1), 'text-anchor="middle"')}
  ${txt(x, y + 86, 13, 700, C.charcoal, `${fg} on ${bg}`)}${txt(x, y + 104, 13, 800, C.charcoal, ok ? 'OK' : large ? 'Avoid (large only)' : 'Do not use')}</g>`);
});

// 2. Type
out.push(h2(64, 652, '2  Type · Nunito'));
out.push(txt(64, 708, T.instruction.size, T.instruction.weight, C.charcoal, 'Hoeveel stenen moeten er nog bij?'));
out.push(label(64, 734, 'Instruction line · 36 / ExtraBold 800 · one line, max ~8 words'));
// speech bubble
out.push(`<g id="speech-bubble" transform="translate(64 760)">
  <path d="M0 20 Q0 0 20 0 H372 Q392 0 392 20 V60 Q392 80 372 80 H70 L40 104 L46 80 H20 Q0 80 0 60 Z" fill="${C.white}" stroke="${C.charcoal}" stroke-width="5" stroke-linejoin="round"/>
  ${txt(24, 51, T.bubble.size, T.bubble.weight, C.charcoal, 'We bouwen een muur.')}
</g>`);
out.push(label(64, 892, 'Speech bubble · 28 / Bold 700'));
out.push(txt(500, 800, T.parent.size, T.parent.weight, C.charcoal, 'Ouderhoek: wissen · export'));
out.push(label(500, 826, 'Parent zone only · 18 / 600'));

// numerals
out.push(h2(760, 652, 'Numerals · check in Figma with Nunito'));
out.push(txt(760, 760, 96, 900, C.charcoal, '0123456789', 'letter-spacing="4"'));
out.push(txt(760, 850, 60, 900, C.charcoal, '1 7 6 9 11 17 16 19'));
out.push(txt(760, 892, 32, 900, C.charcoal, '1 7 6 9 21 27 26 29'));
out.push(label(760, 920, 'Pass: 1 has a flag + is narrower than 7; 6/9 open tails differ at 32 px; 4 is open.'));

// 3. Buttons
out.push(h2(64, 988, '3  Buttons · icon + word · 72 high (≥ 64) · pill'));
let bx = 64;
const btns = [
  ['play', 'play', 'Spelen', C.yellow], ['continue', 'play', 'Verder spelen', C.yellow],
  ['go', 'hat', 'Aan de slag!', C.yellow], ['done', 'check', 'Klaar', C.green],
];
btns.forEach(([id, icon, word, fill]) => { const b = button(id, bx, 1012, icon, word, fill); out.push(b.svg); bx += b.w + 24; });
bx = 64;
[['home', 'house', 'Huis', C.white], ['next', 'arrow', 'Verder', C.yellow], ['stop', 'door', 'Stoppen', C.white]]
  .forEach(([id, icon, word, fill]) => { const b = button(id, bx, 1108, icon, word, fill); out.push(b.svg); bx += b.w + 24; });
out.push(label(64, 1212, 'Primary = yellow, positive confirm = green, secondary = white. Never text-only, never icon-only.'));

// 4. Answer tiles
out.push(h2(64, 1272, '4  Answer tiles · 112 × 112 (≥ 96) · gap 24 · max 3'));
const states = [['default', 'Default'], ['selected', 'Pressed / selected · sky 8'], ['hint', 'Hint highlight · yellow 10'], ['correct', 'Correct · green + check']];
states.forEach(([st, name], i) => {
  const x = 64 + i * 270;
  out.push(tile(`${st}`, x, 1300, st === 'default' ? 8 : 9, st));
  out.push(label(x, 1440, name));
});
out.push(label(64, 1470, 'Retry: tiles shake gently, no colour change, no sound. A wrong pick never turns red.'));

// badge + sign
out.push(`<g id="badge" transform="translate(1180 1300)"><circle cx="56" cy="56" r="44" fill="${C.white}" stroke="${C.charcoal}" stroke-width="5"/>${txt(56, 72, T.badge.size, T.badge.weight, C.charcoal, '15', 'text-anchor="middle"')}</g>`);
out.push(label(1180, 1440, 'Number badge · 40 / Black 900'));

out.push('</svg>');
mkdirSync('out', { recursive: true });
writeFileSync('out/style-tile.svg', out.join('\n'));
console.log(results.map(r => `${r.fg} on ${r.bg}: ${r.r.toFixed(2)}`).join('\n'));
