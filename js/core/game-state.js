// Game state shape and pure update functions. Every function returns a NEW state object;
// nothing here touches storage, the DOM or the clock (pass `now` in).

export const STATE_VERSION = 1;
const RECENT_CHALLENGES = 30;

export function createInitialState(rules) {
  return {
    version: STATE_VERSION,
    player: { placementDone: false, firstPlayedAt: null, lastPlayedAt: null },
    progress: { currentMission: null, missions: {} },
    skills: Object.fromEntries(Object.entries(rules.skills).map(([id, s]) => [id, newSkill(s)])),
    recentChallenges: [],
    settings: { sound: false },
  };
}

const newSkill = s => ({ support: s.startSupport, attempts: [] });

const missionEntry = (state, id) => state.progress.missions[id] ?? { loadsDone: 0, timesCompleted: 0 };

/** Add skills that appeared in the rules after this save was made; keep existing ones untouched. */
export function syncSkills(state, rules) {
  const skills = { ...state.skills };
  for (const [id, s] of Object.entries(rules.skills)) if (!skills[id]) skills[id] = newSkill(s);
  return { ...state, skills };
}

export function markPlayed(state, now) {
  return { ...state, player: { ...state.player, firstPlayedAt: state.player.firstPlayedAt ?? now, lastPlayedAt: now } };
}

export const setPlacementDone = state => ({ ...state, player: { ...state.player, placementDone: true } });

/** Start (or resume) a mission. The load to play is always the first one not yet completed. */
export function startMission(state, missionId) {
  const m = missionEntry(state, missionId);
  return {
    ...state,
    progress: {
      ...state.progress,
      currentMission: { id: missionId, load: m.loadsDone + 1 },
      missions: { ...state.progress.missions, [missionId]: m },
    },
  };
}

/**
 * Checkpoint after a correct load. Returns { state, missionComplete }.
 * After the last load the mission resets to 0 loads and timesCompleted goes up.
 */
export function completeLoad(state, missionId, loadsPerMission) {
  const m = missionEntry(state, missionId);
  const loadsDone = m.loadsDone + 1;
  const missionComplete = loadsDone >= loadsPerMission;
  const next = missionComplete
    ? { loadsDone: 0, timesCompleted: m.timesCompleted + 1 }
    : { ...m, loadsDone };
  return {
    missionComplete,
    state: {
      ...state,
      progress: {
        currentMission: missionComplete ? null : { id: missionId, load: loadsDone + 1 },
        missions: { ...state.progress.missions, [missionId]: next },
      },
    },
  };
}

/** Where "Verder spelen" should go, or null if there's nothing to resume. */
export function getResumePoint(state) {
  const cm = state.progress.currentMission;
  if (!cm) return null;
  const m = missionEntry(state, cm.id);
  return { missionId: cm.id, load: m.loadsDone + 1 };
}

export const hasProgress = state =>
  state.player.placementDone || Object.values(state.progress.missions).some(m => m.loadsDone > 0 || m.timesCompleted > 0);

/** Wall sections to show on the location screen: built loads, or a full wall after a finished mission. */
export function wallSections(state, missionId, loadsPerMission) {
  const m = missionEntry(state, missionId);
  if (m.loadsDone > 0) return m.loadsDone;
  return m.timesCompleted > 0 ? loadsPerMission : 0;
}

/** Record one attempt for the adaptive window. attempt = { skill, representation, support, success, hints }. */
export function recordAttempt(state, attempt, windowSize) {
  const sk = state.skills[attempt.skill];
  if (!sk) throw new Error(`Unknown skill: ${attempt.skill}`);
  const entry = { representation: attempt.representation, support: attempt.support, success: !!attempt.success, hints: attempt.hints ?? 0 };
  const attempts = [...sk.attempts, entry].slice(-windowSize * 4); // keep a few windows (window is per representation)
  return { ...state, skills: { ...state.skills, [attempt.skill]: { ...sk, attempts } } };
}

export function setSupport(state, skillId, support) {
  const sk = state.skills[skillId];
  if (!sk) throw new Error(`Unknown skill: ${skillId}`);
  return { ...state, skills: { ...state.skills, [skillId]: { ...sk, support } } };
}

/** Keep a short history for the math engine's anti-repetition. */
export function rememberChallenge(state, ch) {
  const slim = { skill: ch.skill, equation: ch.equation, answer: ch.answer };
  return { ...state, recentChallenges: [...state.recentChallenges, slim].slice(-RECENT_CHALLENGES) };
}

export const setSetting = (state, key, value) => ({ ...state, settings: { ...state.settings, [key]: value } });
