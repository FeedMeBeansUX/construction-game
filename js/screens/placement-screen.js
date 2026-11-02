// S2 Placement – stub until Phase 3 step 7.
import { el, speechBubble } from '../components/ui.js';
import { createCharacter } from '../components/character.js';

export function mount(ui, { t, controller, scene, assets }) {
  scene.reset();
  scene.showBoss(false);
  scene.dim(true);
  const bram = createCharacter(assets.bram, { pose: 'wave', width: 300, className: 'brief-bram' });
  const bubble = speechBubble(t('placement.intro'));
  bubble.classList.add('brief-bubble');
  ui.append(bram.el, bubble, el('div', { class: 'dev-panel' }, [
    'Placement round: step 7',
    el('button', { type: 'button', id: 'dev-skip-placement', onclick: () => controller.finishPlacement() }, ['Skip →']),
  ]));
}
