// Small DOM builders shared by screens. Text always arrives already translated (from t()).
import { icons } from './icons.js';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

/** Icon + word button. variant: primary (yellow) | confirm (green) | secondary (white). */
export function button({ icon, label, variant = 'primary', onTap, id, extraClass = '' }) {
  let busy = false; // ignore double taps (young children often tap twice)
  const b = el('button', {
    class: `btn btn--${variant} ${extraClass}`.trim(), type: 'button', id,
    onclick: () => { if (busy) return; busy = true; setTimeout(() => { busy = false; }, 400); onTap?.(); },
    html: icons[icon],
  }, [el('span', { class: 'btn__label' }, [label])]);
  return b;
}

export const homeButton = (t, onTap) => button({ icon: 'house', label: t('btn.home'), variant: 'secondary', onTap, id: 'btn-home', extraClass: 'btn--home' });

/** The one instruction line at the top of play screens. */
export const instructionLine = text => el('div', { class: 'instruction', role: 'status' }, [text]);

/** Speech bubble (tail points down-left toward the speaker). */
export const speechBubble = text => el('div', { class: 'bubble' }, [el('span', { class: 'bubble__text' }, [text])]);
