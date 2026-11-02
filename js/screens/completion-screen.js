// S7 Completion – finished wall, Bram cheers. After ~5 missions in a session Bram suggests a break.
import { el, button, homeButton, speechBubble } from '../components/ui.js';
import { createCharacter } from '../components/character.js';

export function mount(ui, { t, controller, scene, assets }, { suggestStop }) {
  scene.reset();
  scene.setWall(controller.loadsPerMission);
  scene.showBoss(false);

  const bram = createCharacter(assets.bram, { pose: 'cheer', width: 300, className: 'brief-bram' });
  const bubble = speechBubble(t(suggestStop ? 'session.stopAsk' : 'complete.wall'));
  bubble.classList.add('brief-bubble');
  ui.append(
    homeButton(t, () => controller.home()),
    el('h1', { class: 'complete-title fade-in' }, [t(suggestStop ? 'session.lunch' : 'complete.title')]),
    bram.el, bubble,
    button({ icon: 'arrow', label: t('btn.next'), onTap: () => controller.next(), id: 'btn-next', extraClass: 'complete-next' }),
    button({ icon: 'door', label: t('btn.stop'), variant: 'secondary', onTap: () => controller.stop(), id: 'btn-stop', extraClass: 'complete-stop' }),
  );
}
