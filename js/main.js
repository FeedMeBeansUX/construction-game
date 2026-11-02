// Boot: load data + assets, wire layers together, start the controller.
import { loadAssets } from './core/assets.js';
import { createCopy } from './core/copy.js';
import { createEventBus } from './core/event-bus.js';
import { createPersistence } from './core/persistence.js';
import { createStore } from './core/store.js';
import { createNavigator } from './core/navigation.js';
import { createController } from './core/game-controller.js';
import { createScene } from './components/scene.js';
import { icons } from './components/icons.js';
import * as start from './screens/start-screen.js';
import * as placement from './screens/placement-screen.js';
import * as locationScreen from './screens/location-screen.js';
import * as briefing from './screens/briefing-screen.js';
import * as gameplay from './screens/gameplay-screen.js';
import * as drive from './screens/drive-screen.js';
import * as completion from './screens/completion-screen.js';

const STAGE_W = 1280, STAGE_H = 800;

function fitStage() {
  const scale = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H);
  document.documentElement.style.setProperty('--scale', String(scale));
}

const json = async path => { const r = await fetch(path); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); };

async function boot() {
  fitStage();
  addEventListener('resize', fitStage);

  const [rules, copyDict, assets] = await Promise.all([json('data/challenge-rules.json'), json('data/copy-nl.json'), loadAssets()]);
  const t = createCopy(copyDict);
  const bus = createEventBus();
  const store = createStore({ rules, persistence: createPersistence({ rules }), bus });
  const scene = createScene(assets);
  document.getElementById('scene-layer').replaceChildren(scene.el);

  const hint = document.getElementById('rotate-hint');
  hint.innerHTML = icons.rotate;
  hint.append(t('orient.rotate'));

  const controller = createController({ store, rules });
  const nav = createNavigator({
    ui: document.getElementById('ui-layer'),
    screens: { start, placement, location: locationScreen, briefing, gameplay, drive, completion },
    ctx: { t, controller, scene, assets, store, bus, rules },
    bus,
  });
  controller.attach(nav);
  document.getElementById('boot')?.remove();
  if (new URLSearchParams(location.search).has('debug')) window.__bm = { store, nav, controller };
  controller.start();
}

boot().catch(err => {
  console.error(err);
  const b = document.getElementById('boot');
  if (b) b.textContent = 'Bouwmeesters could not start. Please reload.';
});
