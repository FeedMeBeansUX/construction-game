// S1 Start
import { el, button } from '../components/ui.js';
import { createCharacter } from '../components/character.js';

const RESEARCHER_HOLD_MS = 5000;

export function mount(ui, { t, controller, scene, assets, store }) {
  scene.reset();
  scene.setWall(controller.wallSections());
  scene.showBoss(false);
  scene.dim(true);

  const has = controller.hasProgress();
  const title = el('h1', { class: 'title' }, [t('game.title')]);
  const bram = createCharacter(assets.bram, { pose: 'wave', width: 250, className: 'start-bram' });
  const sam = createCharacter(assets.sam, { pose: 'idle', width: 230, className: 'start-sam' });

  const buttons = has
    ? [button({ icon: 'play', label: t('btn.continue'), onTap: () => controller.continueGame(), id: 'btn-continue', extraClass: 'start-main' }),
       button({ icon: 'play', label: t('btn.play'), variant: 'secondary', onTap: () => controller.play(), id: 'btn-play', extraClass: 'start-second' })]
    : [button({ icon: 'play', label: t('btn.play'), onTap: () => controller.play(), id: 'btn-play', extraClass: 'start-main' })];

  ui.append(bram.el, sam.el, title, ...(has ? [el('p', { class: 'welcome' }, [t('start.welcomeBack')])] : []), ...buttons);

  // Hidden researcher mode: press and hold the title for 5 s (adults only, English allowed)
  let timer = null;
  const cancel = () => clearTimeout(timer);
  title.addEventListener('pointerdown', () => { timer = setTimeout(() => openResearcher(ui, store), RESEARCHER_HOLD_MS); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => title.addEventListener(e, cancel));
  return cancel;
}

function openResearcher(ui, store) {
  const download = () => {
    const blob = new Blob([JSON.stringify(store.readLog(), null, 1)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `bouwmeesters-log-${Date.now()}.json` });
    document.body.append(a); a.click(); a.remove();
  };
  const panel = el('div', { class: 'researcher', id: 'researcher' }, [
    el('h2', {}, ['Researcher mode']),
    el('p', {}, [`${store.readLog().length} events stored on this device.`]),
    el('div', { class: 'researcher__row' }, [
      el('button', { type: 'button', onclick: download }, ['Export log']),
      el('button', { type: 'button', onclick: () => panel.remove() }, ['Close']),
    ]),
  ]);
  ui.append(panel);
}
