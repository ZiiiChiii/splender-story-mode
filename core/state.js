// core/state.js
let globalState = {
  mode: 'singlePlayer', // singlePlayer, vsAI, storyMode
  turn: 1,
  currentTurnOwner: 'player',
  aiEnabled: false,           // 故事模式中若該關為 vsAI 設定，此旗標開啟
  aiDifficulty: 'normal',     // normal / hard / expert / master
  bank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 },
  selectedDiff: [],
  selectedSame: null,
  player: {
    tokens: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 0 },
    bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 },
    reserved: [],
    score: 0,
    pointCards: 0   // 帶分數卡片張數 (ast15 判定用)
  },
  ai: {
    tokens: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 0 },
    bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 },
    reserved: [],
    score: 0,
    noblePoints: 0  // AI 貴族分獨立記帳 (ast18 無效化用)
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
    comboTriggered: false,
    redTokensTaken: 0,
    maxBagEver: 0,
    exclusiveViolated: false,
    noNoblesForPlayer: false
  },
  singlePlayerTracker: null,
  achievements: null,
  pendingAchievementsQueue: [],
  latestAchievementAlert: '',
  ast14TakeUsed: false,       // 精靈遊俠：第一回合雙重拿取旗標
  settings: {
    isMusicMuted: false,
    isSfxMuted: false,
    talentPool: [],
    selectedAssistant: null   // 輔助官專屬故事模式，非故事模式一律為 null
  }
};

export const CoreState = {
  get() { return globalState; },
  set(newState) { globalState = newState; },
  updatePlayer(updater) { updater(globalState.player); },
  updateBank(updater) { updater(globalState.bank); }
};
