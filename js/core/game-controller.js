// Game controller: owns the flow between screens. Screens call these actions; they never decide
// where to go next themselves, and they never touch maths or adaptive logic.

export const SLICE_MISSION = 'slice.materialenwagen';
const LUNCH_AFTER_MISSIONS = 5;

export function createController({ store, rules }) {
  let nav = null;
  let missionsThisSession = 0;
  const loads = rules.missions[SLICE_MISSION].loads;

  const mission = () => store.state.progress.missions[SLICE_MISSION] ?? { loadsDone: 0, timesCompleted: 0 };

  return {
    attach(navigator) { nav = navigator; },

    start() { store.startSession(); nav.go('start'); },

    // S1
    play() { nav.go(store.state.player.placementDone ? 'location' : 'placement'); },
    continueGame() { nav.go('location'); },

    // S2 (stub until step 7)
    finishPlacement() { store.setPlacementDone(); nav.go('location'); },

    // S3
    pickTruck() {
      const firstTime = mission().loadsDone === 0 && mission().timesCompleted === 0;
      store.startMission(SLICE_MISSION);
      nav.go('briefing', { firstTime });
    },

    // S4
    beginLoad() { nav.go('gameplay', { load: store.resumePoint().load, loads }); },

    // S5 → S6
    loadCorrect() {
      const load = store.resumePoint().load;
      const missionComplete = store.completeLoad(SLICE_MISSION);
      if (missionComplete) missionsThisSession++;
      nav.go('drive', { wallBefore: load - 1, wallAfter: load, missionComplete });
    },

    // S6 → S5 or S7
    driveDone({ missionComplete }) {
      if (missionComplete) nav.go('completion', { suggestStop: missionsThisSession > 0 && missionsThisSession % LUNCH_AFTER_MISSIONS === 0 });
      else { store.startMission(SLICE_MISSION); nav.go('gameplay', { load: store.resumePoint().load, loads }); }
    },

    // S7
    next() { nav.go('location'); },
    stop() { nav.go('start'); },

    // persistent Huis button: no confirmation; an unfinished load simply restarts next time
    home() { nav.go('location'); },

    // read helpers for screens
    hasProgress: () => store.hasProgress(),
    wallSections: () => store.wallSections(SLICE_MISSION),
    loadsPerMission: loads,
  };
}
