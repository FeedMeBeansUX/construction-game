// S4 Briefing – Bram explains the job.
import { button, homeButton, speechBubble } from '../components/ui.js';
import { createCharacter } from '../components/character.js';

const HELLO_MS = 1800;

export function mount(ui, { t, controller, scene, assets }, { firstTime }) {
  scene.reset();
  scene.setWall(controller.wallSections());
  scene.showBoss(false);
  scene.dim(true);

  const bram = createCharacter(assets.bram, { pose: 'wave', width: 300, className: 'brief-bram' });
  const bubble = speechBubble(t(firstTime ? 'briefing.hello' : 'briefing.task'));
  bubble.classList.add('brief-bubble');
  const text = bubble.querySelector('.bubble__text');
  ui.append(
    homeButton(t, () => controller.home()),
    bram.el, bubble,
    button({ icon: 'hat', label: t('btn.go'), onTap: () => controller.beginLoad(), id: 'btn-go', extraClass: 'brief-go' }),
  );

  let timer = null;
  if (firstTime) timer = setTimeout(() => { text.textContent = t('briefing.task'); bram.setPose('idle'); }, HELLO_MS);
  return () => clearTimeout(timer);
}
