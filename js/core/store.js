// Store: the single owner of the current game state. Every change is saved, emitted on the bus
// ('state:changed' plus a named event) and appended to the researcher log.

import * as S from './game-state.js';

export function createStore({ rules, persistence, bus, now = () => Date.now() }) {
  let state = persistence.load();

  function commit(next, event) {
    state = next;
    persistence.save(state);
    bus.emit('state:changed', state);
    if (event) {
      persistence.appendLog({ t: now(), ...event });
      bus.emit(event.type, event);
    }
  }

  const loadsFor = missionId => rules.missions[missionId].loads;

  return {
    get state() { return state; },
    get persistent() { return persistence.persistent; },

    startSession() { commit(S.markPlayed(state, now()), { type: 'session.start' }); },

    startMission(missionId) {
      const next = S.startMission(state, missionId);
      commit(next, { type: 'mission.start', missionId, load: next.progress.currentMission.load });
    },

    /** Checkpoint after a correct load. Returns true when the mission is complete. */
    completeLoad(missionId) {
      const load = S.getResumePoint(state)?.load ?? null;
      const { state: next, missionComplete } = S.completeLoad(state, missionId, loadsFor(missionId));
      commit(next, { type: 'load.complete', missionId, load });
      if (missionComplete) { persistence.appendLog({ t: now(), type: 'mission.complete', missionId }); bus.emit('mission.complete', { missionId }); }
      return missionComplete;
    },

    recordAttempt(attempt) {
      commit(S.recordAttempt(state, attempt, rules.adaptive.windowSize), { type: 'attempt', ...attempt });
    },

    rememberChallenge(ch) { commit(S.rememberChallenge(state, ch)); },
    setSupport(skillId, support) { commit(S.setSupport(state, skillId, support), { type: 'support.change', skillId, support }); },
    setPlacementDone() { commit(S.setPlacementDone(state), { type: 'placement.done' }); },
    setSetting(key, value) { commit(S.setSetting(state, key, value)); },

    resumePoint: () => S.getResumePoint(state),
    hasProgress: () => S.hasProgress(state),
    wallSections: missionId => S.wallSections(state, missionId, loadsFor(missionId)),

    /** Parent zone. */
    reset() { persistence.clear(); commit(S.createInitialState(rules), { type: 'progress.reset' }); },
    exportCode: () => persistence.exportCode(state),
    importCode(code) {
      const imported = persistence.importCode(code);
      if (!imported) return false;
      commit(imported, { type: 'progress.import' });
      return true;
    },
    readLog: () => persistence.readLog(),
  };
}
