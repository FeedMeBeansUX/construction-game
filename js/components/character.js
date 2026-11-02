// A character instance (Bram or Sam) cropped to one pose. Each instance gets its own id prefix.
import { instantiate } from '../core/assets.js';

const POSE_X = { idle: 0, wave: 240, cheer: 480 };
let counter = 0;

export function createCharacter(svgText, { pose = 'idle', width = 220, className = '' } = {}) {
  const svg = instantiate(svgText, `c${++counter}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', Math.round(width * 344 / 220));
  svg.setAttribute('class', `character ${className}`.trim());
  const setPose = p => svg.setAttribute('viewBox', `${POSE_X[p] ?? 0} 0 220 344`);
  setPose(pose);
  return { el: svg, setPose };
}
