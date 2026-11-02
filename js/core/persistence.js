// Persistence: save/load game state, researcher event log, export/import code.
// Storage is injectable (tests pass a fake). If localStorage is unavailable or throws, we fall back to memory.

import { STATE_VERSION, createInitialState, syncSkills } from './game-state.js';

export const SAVE_KEY = 'bouwmeesters.save';
export const LOG_KEY = 'bouwmeesters.log';
export const LOG_MAX = 5000;
const CODE_PREFIX = 'BM1-';

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
  };
}

function usableStorage(storage) {
  try {
    if (!storage) return null;
    const probe = '__bm_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch { return null; }
}

function isValidState(s) {
  return s && typeof s === 'object' && s.version === STATE_VERSION
    && s.player && s.progress && typeof s.progress.missions === 'object' && s.skills && Array.isArray(s.recentChallenges);
}

export function createPersistence({ rules, storage = globalThis.localStorage } = {}) {
  const real = usableStorage(storage);
  const store = real ?? memoryStorage();
  const persistent = !!real;

  const readJSON = key => { try { const raw = store.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } };
  const writeJSON = (key, value) => { try { store.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };

  /** Load the save; anything unreadable or from another version gives a fresh state. */
  function load() {
    const s = readJSON(SAVE_KEY);
    return isValidState(s) ? syncSkills(s, rules) : createInitialState(rules);
  }

  const save = state => writeJSON(SAVE_KEY, state);

  function clear() {
    try { store.removeItem(SAVE_KEY); store.removeItem(LOG_KEY); } catch { /* ignore */ }
  }

  // --- researcher event log (no personal data: event type, skill, numbers, timings) ---
  function appendLog(event) {
    const log = readJSON(LOG_KEY) ?? [];
    log.push(event);
    return writeJSON(LOG_KEY, log.slice(-LOG_MAX));
  }
  const readLog = () => readJSON(LOG_KEY) ?? [];

  // --- export/import progress code (parent zone fallback for Safari storage eviction) ---
  function exportCode(state) {
    const json = JSON.stringify(state);
    return CODE_PREFIX + checksum(json) + '-' + toBase64(json);
  }

  /** Returns the imported state, or null if the code is invalid. */
  function importCode(code) {
    try {
      const m = /^BM1-([0-9a-z]+)-(.+)$/.exec(String(code).trim());
      if (!m) return null;
      const json = fromBase64(m[2]);
      if (checksum(json) !== m[1]) return null;
      const s = JSON.parse(json);
      return isValidState(s) ? syncSkills(s, rules) : null;
    } catch { return null; }
  }

  return { load, save, clear, appendLog, readLog, exportCode, importCode, persistent };
}

function checksum(str) { // FNV-1a, base36 – detects typos/truncation, not tampering
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
const toBase64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const fromBase64 = b => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)));
