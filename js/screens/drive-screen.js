// S6 Drive + wall: correct feedback → truck drives off → wall section pops up. Max ~4 s, tap anywhere to skip.
import { el, instructionLine } from '../components/ui.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, reduced() ? 0 : ms));

export function mount(ui, { t, controller, scene }, { wallBefore, wallAfter, missionComplete }) {
  scene.reset();
  scene.setWall(wallBefore);
  scene.setTruck({ a: 15, c: 24, added: 9 }); // placeholder: full truck
  scene.setBossPose('cheer');

  const line = instructionLine(t(`feedback.correct.${((wallAfter - 1) % 3) + 1}`));
  const skipLayer = el('div', { class: 'skip-layer', id: 'skip-layer' });
  ui.append(skipLayer, line);

  let finished = false, cancelled = false;
  const finish = () => {
    if (finished || cancelled) return;
    finished = true;
    scene.parkTruck();
    controller.driveDone({ missionComplete });
  };
  skipLayer.addEventListener('click', () => { scene._skipDrive?.(); scene.setWall(wallAfter); finish(); });

  (async () => {
    await wait(700); if (finished || cancelled) return;
    line.textContent = t('anim.drive');
    await scene.driveOut({ duration: reduced() ? 1 : 1400 }); if (finished || cancelled) return;
    line.textContent = t('anim.wall');
    scene.popWallSection(wallAfter);
    await wait(1100);
    finish();
  })();

  return () => { cancelled = true; scene.parkTruck(); };
}
