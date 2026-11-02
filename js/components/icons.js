// 40×40 stroke icons from the style tile. currentColor = charcoal via CSS.
const svg = body => `<svg class="icon" viewBox="0 0 40 40" aria-hidden="true">${body}</svg>`;

export const icons = {
  play: svg('<path d="M13 8 L33 20 L13 32 Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>'),
  hat: svg('<path d="M7 28 Q7 9 20 9 Q33 9 33 28 Z" fill="currentColor"/><rect x="3" y="27" width="34" height="7" rx="3.5" fill="currentColor"/><rect x="18" y="5" width="4" height="10" rx="2" fill="currentColor"/>'),
  check: svg('<path d="M8 21 L17 30 L33 11" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'),
  house: svg('<path d="M5 20 L20 7 L35 20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18 V34 H30 V18" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><rect x="17" y="24" width="6" height="10" fill="currentColor"/>'),
  arrow: svg('<path d="M6 20 H32 M22 10 L32 20 L22 30" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'),
  door: svg('<rect x="10" y="5" width="20" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="24" cy="21" r="2.5" fill="currentColor"/>'),
  rotate: svg('<rect x="12" y="4" width="16" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="4"/><path d="M6 30 A16 16 0 0 0 30 36 M30 36 l-6 -1 M30 36 l-1 -6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'),
};
