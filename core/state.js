// core/state.js
let globalState = {
  mode: 'singlePlayer', // singlePlayer, vsAI, storyMode
  turn: 1,
  currentTurnOwner: 'player', 
  bank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 },
  selectedDiff: [],   
  selectedSame: null, 
  player: {
    tokens: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 0 },
    bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 },
    reserved: [],
    score: 0
  },
  ai: { 
    tokens: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 0 },
    bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 },
    reserved: [],
    score: 0
  },
  nobles: [],
  decks: { lv1: [], lv2: [], lv3: [] },
  board: { lv1: [], lv2: [], lv3: [] },
  storyProgress: {
    currentLevel: 1,
    maxUnlockedLevel: 1,
    unlockedAssistantIds: ['ast1']
  },
  storyTracker: {
    reservedBuys: 0,
    freeBuys: 0,
    highPointCards: 0,
    comboTriggered: false
  },
  settings: {
    isMusicMuted: false,
    isSfxMuted: false,
    talentPool: [],
    selectedAssistant: 'ast1'
  }
};
export const CoreState = {
  get() { return globalState; },
  set(newState) { globalState = newState; },
  updatePlayer(updater) { updater(globalState.player); },
  updateBank(updater) { updater(globalState.bank); }
};
