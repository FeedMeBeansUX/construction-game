// End-to-end click-through of the slice flow in Chromium at iPad sizes.
// Usage: node scripts/e2e-flow.mjs [baseUrl]   (serve the repo first, e.g. python3 -m http.server 8765)
// Needs Playwright (global install is fine). Writes screenshots to out/e2e/.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }

const BASE = process.argv[2] ?? 'http://localhost:8765/';
const VIEWPORTS = [['ipad-9.7', 1024, 768], ['ipad-10.9', 1180, 820]];
mkdirSync('out/e2e', { recursive: true });

const failures = [];
const warnings = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

for (const [name, w, h] of VIEWPORTS) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) (/assets\/fonts\//.test(r.url()) ? warnings : errors).push(`${r.status()} ${r.url()}`); });

  const screen = () => page.locator('#ui-layer').getAttribute('data-screen');
  const waitScreen = async s => { await page.waitForFunction(x => document.querySelector('#ui-layer')?.dataset.screen === x, s, { timeout: 8000 }); };
  const shot = async label => page.screenshot({ path: `out/e2e/${name}-${label}.png` });
  const minButtonHeight = async () => page.$$eval('#ui-layer button', bs => Math.min(...bs.map(b => b.getBoundingClientRect().height)));
  const buttonsHaveIcons = async () => page.$$eval('#ui-layer .btn', bs => bs.every(b => b.querySelector('svg.icon') && b.textContent.trim().length > 0));
  const checkButtons = async label => {
    const mh = await minButtonHeight();
    check(mh >= 64, `${name} ${label}: smallest button ${mh.toFixed(1)}px < 64`);
    check(await buttonsHaveIcons(), `${name} ${label}: a .btn lacks icon or word`);
  };
  const huis = async label => check(await page.locator('#btn-home').count() === 1, `${name} ${label}: no Huis button`);

  await page.goto(BASE + '?debug');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // First run
  await waitScreen('start'); await shot('1-start-first'); await checkButtons('start');
  check(await page.locator('#btn-continue').count() === 0, `${name}: Verder spelen shown on first run`);
  await page.click('#btn-play');
  await waitScreen('placement'); await shot('2-placement');
  await page.click('#dev-skip-placement');
  await waitScreen('location'); await shot('3-location'); await huis('location'); await checkButtons('location');
  await page.click('#truck-mover');
  await waitScreen('briefing'); await huis('briefing'); await checkButtons('briefing');
  check((await page.textContent('.bubble')).includes('Bram'), `${name}: first briefing doesn't say hello`);
  await shot('4-briefing-hello');
  await page.waitForTimeout(2000);
  check((await page.textContent('.bubble')).includes('muur'), `${name}: briefing didn't switch to task`);
  await page.click('#btn-go');
  await waitScreen('gameplay'); await shot('5-gameplay'); await huis('gameplay');
  check((await page.textContent('.dev-panel')).includes('load 1/3'), `${name}: expected load 1`);
  await page.click('#dev-correct');
  await waitScreen('drive'); await page.waitForTimeout(1300); await shot('6-drive');
  await waitScreen('gameplay');
  check((await page.textContent('.dev-panel')).includes('load 2/3'), `${name}: expected load 2 after drive`);

  // Leave mid-load with Huis, then reload: resume at load 2
  await page.click('#btn-home');
  await waitScreen('location');
  check(await page.evaluate(() => window.__bm.controller.wallSections()) === 1, `${name}: wall should have 1 section`);
  await page.reload();
  await waitScreen('start'); await shot('1-start-returning');
  check(await page.locator('#btn-continue').count() === 1, `${name}: no Verder spelen after progress`);
  await page.click('#btn-continue');
  await waitScreen('location');
  await page.click('#truck-mover');
  await waitScreen('briefing');
  check((await page.textContent('.bubble')).includes('muur'), `${name}: returning briefing should skip hello`);
  await page.click('#btn-go');
  await waitScreen('gameplay');
  check((await page.textContent('.dev-panel')).includes('load 2/3'), `${name}: resume should be load 2`);

  // Load 2 with skip, load 3 to completion
  await page.click('#dev-correct');
  await waitScreen('drive'); await page.waitForTimeout(150); await page.click('#skip-layer');
  await waitScreen('gameplay');
  check((await page.textContent('.dev-panel')).includes('load 3/3'), `${name}: expected load 3`);
  await page.click('#dev-correct');
  await waitScreen('completion'); await page.waitForTimeout(400); await shot('7-completion'); await huis('completion'); await checkButtons('completion');
  await page.click('#btn-next');
  await waitScreen('location');
  check(await page.evaluate(() => window.__bm.controller.wallSections()) === 3, `${name}: wall should be full after mission`);
  await page.click('#truck-mover'); await waitScreen('briefing'); await page.click('#btn-go'); await waitScreen('gameplay');
  check((await page.textContent('.dev-panel')).includes('load 1/3'), `${name}: new mission should start at load 1`);
  await page.click('#btn-home'); await waitScreen('location');

  // Stoppen path
  const s = await screen();
  check(s === 'location', `${name}: ended on ${s}`);
  const copyMisses = errors.filter(e => /Missing copy id/.test(e));
  check(copyMisses.length === 0, `${name}: missing copy ids: ${copyMisses.join(', ')}`);
  check(errors.length === 0, `${name}: console errors: ${errors.join(' | ')}`);
  await browser.close();
}

if (warnings.length) console.log(`WARN (not failing): ${[...new Set(warnings)].join(', ')}`);
console.log(failures.length ? `FAIL\n- ${failures.join('\n- ')}` : 'PASS: flow, Huis, resume, button sizes, copy, no console errors');
process.exitCode = failures.length ? 1 : 0;
