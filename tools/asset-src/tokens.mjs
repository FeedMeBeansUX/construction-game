// Design tokens for Bouwmeesters (style tile v0.1). GDD 10.2 palette + slice additions.
export const color = {
  yellow:   '#F5C542', // primary – construction yellow
  orange:   '#ED873A', // secondary – machine orange
  sky:      '#55B9E8', // accent – sky blue
  green:    '#65B96B', // positive – grass green
  sand:     '#F4E8D0', // background – light sand
  charcoal: '#30343B', // text + outlines
  concrete: '#A9B0B5', // neutral – concrete grey
  // additions (v0.1)
  white:     '#FFFFFF',
  sandLight: '#FFF7E6', // truck bed interior, cards
  brick:     '#C8754B', // existing bricks (a)
  brickHi:   '#E39A70', // brick top highlight
  brickNew:  '#EFB089', // newly loaded bricks – lighter, plus a dot marker
  tarp:      '#4E9A8C', // truck tarp (numerals level)
};

export const type = {
  family: 'Nunito',
  instruction: { size: 36, weight: 800 }, // one line, max ~8 words
  numeralTile: { size: 60, weight: 900 },
  badge:       { size: 40, weight: 900 },
  button:      { size: 28, weight: 800 },
  bubble:      { size: 28, weight: 700 },
  parent:      { size: 18, weight: 600 }, // parent zone / researcher only
};

export const size = {
  touchMin: 64, buttonH: 72, tile: 112, tileGap: 24, slot: 64, radius: 16, stroke: 5,
};

// WCAG relative-luminance contrast
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
