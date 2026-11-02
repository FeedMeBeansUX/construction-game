// S3 Location – Het Materialenmagazijn. Only the truck is active in the slice.
import { instructionLine, homeButton } from '../components/ui.js';

export function mount(ui, { t, controller, scene }) {
  scene.reset();
  scene.setWall(controller.wallSections());
  scene.setBossPose('wave');
  scene.showCue(true);
  scene.setTruckActive(true, () => controller.pickTruck());
  ui.append(homeButton(t, () => controller.home()), instructionLine(t('location.pickJob')));
  return () => scene.setTruckActive(false);
}
