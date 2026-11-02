// S5 Gameplay – stub until Phase 3 step 4 (load bricks + 3-option selection).
import { el, instructionLine, homeButton } from '../components/ui.js';

export function mount(ui, { t, controller, scene }, { load, loads }) {
  scene.reset();
  scene.setWall(controller.wallSections());
  scene.setBossPose('idle');
  scene.setTruck({ a: 15, c: 24, added: 0, badge: true }); // placeholder state
  scene.setSign(24);
  ui.append(
    homeButton(t, () => controller.home()),
    instructionLine(t('game.instr.load')),
    el('div', { class: 'dev-panel' }, [
      `Gameplay: step 4 · load ${load}/${loads}`,
      el('button', { type: 'button', id: 'dev-correct', onclick: () => controller.loadCorrect() }, ['Simulate correct load']),
    ]),
  );
}
