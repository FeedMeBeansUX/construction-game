import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createEventBus } from '../js/core/event-bus.js';
import { createPersistence, memoryStorage, SAVE_KEY, LOG_KEY, LOG_MAX } from '../js/core/persistence.js';
import { createStore } from '../js/core/store.js';
import * as S from '../js/core/game-state.js';

const rules = JSON.parse(readFileSync(new URL('../data/challenge-rules.json', import.meta.url)));
const M = 'slice.materialenwagen';

const setup = (storage = memoryStorage()) => {
  let t = 1000;
  const bus = createEventBus();
  const store = createStore({ rules, persistence: createPersistence({ rules, storage }), bus, now: () => t++ });
  return { store, bus, storage };
};
// simulate a page reload: new persistence + store on the same storage
const reload = storage => setup(storage).store;

test('event bus: on, once, off, wildcard, isolated errors', () => {
  const errors = [];
  const bus = createEventBus({ onError: e => errors.push(e) });
  const got = [];
  const off = bus.on('a', p => got.push(['on', p]));
  bus.once('a', p => got.push(['once', p]));
  bus.on('*', e => got.push(['*', e.type]));
  bus.on('a', () => { throw new Error('boom'); });
  bus.emit('a', 1); bus.emit('a', 2); off(); bus.emit('a', 3);
  assert.deepEqual(got, [['on', 1], ['once', 1], ['*', 'a'], ['on', 2], ['*', 'a'], ['*', 'a']]);
  assert.equal(errors.length, 3);
});

test('fresh state: every skill at its startSupport, nothing to resume', () => {
  const { store } = setup();
  for (const [id, s] of Object.entries(rules.skills)) assert.equal(store.state.skills[id].support, s.startSupport);
  assert.equal(store.resumePoint(), null);
  assert.equal(store.hasProgress(), false);
});

test('checkpoint after each load survives reload; leaving mid-load resumes at the same load', () => {
  const { store, storage } = setup();
  store.startMission(M);
  assert.equal(store.state.progress.currentMission.load, 1);
  store.completeLoad(M);                         // load 1 done
  store.startMission(M);                         // child starts load 2 …
  // … and presses Huis / closes the tab mid-load (nothing saved for load 2)
  const after = reload(storage);
  assert.deepEqual(after.resumePoint(), { missionId: M, load: 2 });
  assert.equal(after.wallSections(M), 1);
  assert.equal(after.hasProgress(), true);
});

test('mission completes after 3 loads; wall stays full until the next mission starts', () => {
  const { store, bus } = setup();
  let completed = 0; bus.on('mission.complete', () => completed++);
  store.startMission(M);
  assert.equal(store.completeLoad(M), false);
  assert.equal(store.completeLoad(M), false);
  assert.equal(store.completeLoad(M), true);
  assert.equal(completed, 1);
  assert.equal(store.resumePoint(), null);
  assert.equal(store.wallSections(M), 3);
  assert.equal(store.state.progress.missions[M].timesCompleted, 1);
  store.startMission(M);
  assert.equal(store.state.progress.currentMission.load, 1);
  store.completeLoad(M);
  assert.equal(store.wallSections(M), 1);
});

test('corrupt, wrong-version and empty saves fall back to a fresh state', () => {
  for (const raw of ['{not json', JSON.stringify({ version: 99 }), JSON.stringify(null), '']) {
    const storage = memoryStorage(); storage.setItem(SAVE_KEY, raw);
    const store = reload(storage);
    assert.equal(store.state.version, S.STATE_VERSION);
    assert.equal(store.resumePoint(), null);
  }
});

test('missing or throwing localStorage: game keeps working in memory', () => {
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() {} };
  for (const storage of [null, throwing]) {
    const { store } = setup(storage);
    assert.equal(store.persistent, false);
    store.startMission(M); store.completeLoad(M);
    assert.equal(store.wallSections(M), 1);
  }
});

test('quota exceeded on save does not crash', () => {
  const storage = memoryStorage();
  const { store } = setup(storage);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.doesNotThrow(() => { store.startMission(M); store.completeLoad(M); });
});

test('new skills in the rules are added to old saves', () => {
  const storage = memoryStorage();
  const old = S.createInitialState(rules);
  delete old.skills['div.group'];
  old.skills['add.to20'].support = 'equation';
  storage.setItem(SAVE_KEY, JSON.stringify(old));
  const store = reload(storage);
  assert.equal(store.state.skills['div.group'].support, rules.skills['div.group'].startSupport);
  assert.equal(store.state.skills['add.to20'].support, 'equation');
});

test('attempts and recent challenges are kept and capped', () => {
  const { store } = setup();
  for (let i = 0; i < 100; i++) store.recordAttempt({ skill: 'missing.add.to20', representation: 'objects', support: 'objects', success: i % 2 === 0, hints: 0 });
  assert.equal(store.state.skills['missing.add.to20'].attempts.length, rules.adaptive.windowSize * 4);
  for (let i = 0; i < 50; i++) store.rememberChallenge({ skill: 'missing.add.to20', equation: `${i} + ? = 20`, answer: 20 - i, options: [1, 2, 3] });
  assert.equal(store.state.recentChallenges.length, 30);
  assert.deepEqual(Object.keys(store.state.recentChallenges[0]), ['skill', 'equation', 'answer']);
});

test('event log: events appended with time, capped, no personal data fields', () => {
  const storage = memoryStorage();
  const { store } = setup(storage);
  store.startSession(); store.startMission(M); store.completeLoad(M);
  const log = store.readLog();
  assert.deepEqual(log.map(e => e.type), ['session.start', 'mission.start', 'load.complete']);
  assert.ok(log.every(e => typeof e.t === 'number'));
  storage.setItem(LOG_KEY, JSON.stringify(Array.from({ length: LOG_MAX }, (_, i) => ({ t: i, type: 'x' }))));
  store.startMission(M);
  assert.equal(store.readLog().length, LOG_MAX);
  assert.equal(store.readLog().at(-1).type, 'mission.start');
});

test('export/import code round-trips; bad codes are rejected', () => {
  const { store } = setup();
  store.startMission(M); store.completeLoad(M); store.setSupport('add.to20', 'numerals');
  const code = store.exportCode();
  assert.match(code, /^BM1-/);
  const other = setup().store;
  assert.equal(other.importCode(code), true);
  assert.deepEqual(other.resumePoint(), { missionId: M, load: 2 });
  assert.equal(other.state.skills['add.to20'].support, 'numerals');
  assert.equal(other.importCode(code.slice(0, -4)), false);
  assert.equal(other.importCode('hallo'), false);
});

test('reset clears progress and log', () => {
  const { store } = setup();
  store.startMission(M); store.completeLoad(M);
  store.reset();
  assert.equal(store.resumePoint(), null);
  assert.equal(store.wallSections(M), 0);
  assert.deepEqual(store.readLog().map(e => e.type), ['progress.reset']);
});

test('state functions never mutate their input', () => {
  const s0 = S.createInitialState(rules);
  const snapshot = JSON.stringify(s0);
  S.startMission(s0, M); S.completeLoad(s0, M, 3); S.recordAttempt(s0, { skill: 'add.to20', success: true }, 8);
  S.setSupport(s0, 'add.to20', 'equation'); S.rememberChallenge(s0, { skill: 'a', equation: 'b', answer: 1 }); S.markPlayed(s0, 5);
  assert.equal(JSON.stringify(s0), snapshot);
});
