// The persistent location scene (Het Materialenmagazijn + truck + Bram). One instance for the whole app;
// screens configure it. Coordinates are the 1280×800 design space of location-magazijn.svg.
import { instantiate } from '../core/assets.js';

const NS = 'http://www.w3.org/2000/svg';
const POSE_X = { idle: 0, wave: 240, cheer: 480 };

export function createScene(assets) {
  const root = instantiate(assets.location);
  root.setAttribute('class', 'scene');
  root.removeAttribute('width'); root.removeAttribute('height');
  root.querySelector('defs #brick')?.remove(); // the truck file defines the same #brick

  // truck inside a mover group (CSS transforms work on <g>)
  const anchor = root.querySelector('#truck-anchor');
  const truck = instantiate(assets.truck);
  ['x', 'y', 'width', 'height'].forEach(a => truck.setAttribute(a, anchor.getAttribute(a)));
  const mover = document.createElementNS(NS, 'g');
  mover.setAttribute('id', 'truck-mover');
  mover.append(truck);
  anchor.after(mover);

  // Bram at his anchor (cropped nested svg, prefixed ids)
  const ba = root.querySelector('#char-boss-anchor');
  const boss = instantiate(assets.bram, 'scene');
  ['x', 'y', 'width', 'height'].forEach(a => boss.setAttribute(a, ba.getAttribute(a)));
  boss.setAttribute('id', 'scene-boss');
  ba.after(boss);

  const $ = id => root.querySelector('#' + id);
  const show = (node, on) => node?.setAttribute('display', on ? 'inline' : 'none');

  const api = {
    el: root,

    reset() {
      api.setWall(0); api.showCue(false); api.setBossPose('idle'); api.showBoss(true);
      api.setTruck({ a: 0, c: 0, added: 0, tarp: false, badge: false }); api.setSign(null);
      api.setTruckActive(false); api.dim(false); api.parkTruck();
    },

    setWall(n) {
      for (let i = 1; i <= 3; i++) { show($(`wall-section-${i}`), i <= n); show($(`wall-section-${i}-ghost`), i > n); }
    },
    popWallSection(i) {
      const s = $(`wall-section-${i}`); show(s, true); show($(`wall-section-${i}-ghost`), false);
      s.classList.remove('pop'); void s.getBBox(); s.classList.add('pop');
    },

    showCue(on) { show($('cue-next-job'), on); $('cue-next-job')?.classList.toggle('bounce', on); },
    showBoss(on) { show(boss, on); },
    setBossPose(p) { boss.setAttribute('viewBox', `${POSE_X[p] ?? 0} 0 220 344`); },

    /** a = bricks already in, c = bricks needed (slots shown), added = new bricks loaded. */
    setTruck({ a = 0, c = 0, added = 0, tarp = false, badge = false }) {
      const bricks = $('truck-bricks');
      bricks.replaceChildren();
      for (let n = 1; n <= 30; n++) {
        const slot = $('slot-' + String(n).padStart(2, '0'));
        show(slot, n <= c);
        if (n <= a + added && n <= c) {
          const u = document.createElementNS(NS, 'use');
          u.setAttribute('href', n <= a ? '#brick' : '#brick-new');
          u.setAttribute('x', slot.getAttribute('x')); u.setAttribute('y', slot.getAttribute('y'));
          bricks.append(u);
        }
      }
      show($('truck-tarp'), tarp);
      show($('truck-badge'), badge);
      $('truck-badge-text').textContent = String(a);
    },

    setSign(c) { show($('sign-text'), c != null); if (c != null) $('sign-text').textContent = String(c); },

    setTruckActive(on, onTap) {
      mover.classList.toggle('tappable', on);
      mover.onclick = on ? onTap : null;
    },

    dim(on) { root.classList.toggle('scene--dim', on); },

    /** Truck drives off to the right; resolves when done (or immediately if skipped). */
    driveOut({ duration = 1600 } = {}) {
      return new Promise(resolve => {
        mover.classList.add('driving');
        const anim = mover.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(1300px)' }],
          { duration, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
        const done = () => { mover.classList.remove('driving'); resolve(); };
        anim.onfinish = done;
        api._skipDrive = () => { anim.finish(); };
      });
    },
    parkTruck() { mover.getAnimations().forEach(a => a.cancel()); mover.style.transform = ''; },
  };
  api.reset();
  return api;
}
