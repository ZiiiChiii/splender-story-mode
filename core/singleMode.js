// core/singleMode.js
import { CoreState } from './state.js';

export const ALL_ACHIEVEMENTS = [
  { id: 1, symbol: "💰", title: "第一桶金", desc: "在單一回合中，一口氣拿取 3 枚不同顏色的普通寶石。", tier: "easy", color: "var(--diff-easy)" },
  { id: 2, symbol: "💎", title: "專一的收藏家", desc: "在單一回合中，拿取 2 枚相同顏色的普通寶石。", tier: "easy", color: "var(--diff-easy)" },
  { id: 3, symbol: "🏪", title: "開張大吉", desc: "成功購買第一張發展卡。", tier: "easy", color: "var(--diff-easy)" },
  { id: 4, symbol: "🪙", title: "黃金儲蓄狂", desc: "同時持有 3 枚黃金（百搭寶石）。", tier: "easy", color: "var(--diff-easy)" },
  { id: 5, symbol: "🎒", title: "滿載而歸", desc: "某個回合結束時，手上的寶石數量剛好達到上限 10 枚。", tier: "easy", color: "var(--diff-easy)" },
  { id: 6, symbol: "🪙", title: "不需找零", desc: "購買一張發展卡時，完全由手牌普通寶石支付，沒用到黃金。", tier: "easy", color: "var(--diff-easy)" },
  
  { id: 7, symbol: "🌈", title: "七彩尋寶家", desc: "玩家背包同時存在 5 種不同顏色的普通寶石各至少 1 枚。", tier: "normal", color: "var(--diff-normal)" },
  { id: 8, symbol: "🔄", title: "永續發展", desc: "完全不消耗任何實體寶石（僅靠已購卡片的減免功能）購買卡片。", tier: "normal", color: "var(--diff-normal)" },
  { id: 9, symbol: "⚡", title: "先搶先贏", desc: "執行「保留一張卡片並獲得 1 黃金」的行動。", tier: "normal", color: "var(--diff-normal)" },
  { id: 10, symbol: "🎯", title: "高瞻遠矚", desc: "成功將保留區的 3 張手牌全部補滿。", tier: "normal", color: "var(--diff-normal)" },
  { id: 11, symbol: "🏗️", title: "基礎紮實", desc: "成功在遊戲前 10 回合內，購買 5 張等級 1 的發展卡。", tier: "normal", color: "var(--diff-normal)" },
  { id: 12, symbol: "🧱", title: "金字塔底層", desc: "遊戲結束時，名下擁有 8 張（或以上）等級 1 的發展卡。", tier: "normal", color: "var(--diff-normal)" },
  
  { id: 13, symbol: "🧬", title: "打破鴨蛋", desc: "獲得遊戲中的第一張帶有分數的卡片。", tier: "hard", color: "var(--diff-hard)" },
  { id: 14, symbol: "🚀", title: "跨越階級", desc: "首次成功購買一張等級 3（Level 3）的發展卡。", tier: "hard", color: "var(--diff-hard)" },
  { id: 15, symbol: "⚜️", title: "貴族青睞", desc: "滿足貴族條件，獲得第一位貴族板塊的拜訪。", tier: "hard", color: "var(--diff-hard)" },
  { id: 16, symbol: "🔓", title: "清空庫存", desc: "成功將保留區的卡片購買下來，使保留區歸零。", tier: "hard", color: "var(--diff-hard)" },
  { id: 17, symbol: "🏭", title: "基建大師", desc: "單一顏色的發展卡減免效果達到 4 次。", tier: "hard", color: "var(--diff-hard)" },
  { id: 18, symbol: "📈", title: "精準投資", desc: "購買一張「價值 4 分以上（含）」的高級發展卡。", tier: "hard", color: "var(--diff-hard)" },
  { id: 19, symbol: "⏱️", title: "小試身手", desc: "成功通關（達到 15 分），且總消耗回合數小於 35 回合。", tier: "hard", color: "var(--diff-hard)" },
  
  { id: 20, symbol: "🔥", title: "真金不怕火煉", desc: "成功通關，且整局遊戲從未執行過「保留卡片」的行動。", tier: "expert", color: "var(--diff-expert)" },
  { id: 21, symbol: "🔓", title: "白手起家", desc: "成功通關，且名下沒有任何一位貴族拜訪。", tier: "expert", color: "var(--diff-expert)" },
  { id: 22, symbol: "🥂", title: "上流社會", desc: "成功通關，且分數來源有 9 分（或以上）是來自於貴族板塊。", tier: "expert", color: "var(--diff-expert)" },
  { id: 23, symbol: "🔋", title: "黃金絕緣體", desc: "成功通關，且通關當下持建立的寶石中完全沒有黃金。", tier: "expert", color: "var(--diff-expert)" },
  { id: 24, symbol: "🗺️", title: "全色制霸", desc: "5 種普通顏色的發展卡，每種顏色都至少擁有 3 張。", tier: "expert", color: "var(--diff-expert)" },
  { id: 25, symbol: "👥", title: "雙喜臨門", desc: "在單人局遊戲中，成功吸引裝飾裝進兩位（或以上）的貴族拜訪。", tier: "expert", color: "var(--diff-expert)" },
  { id: 26, symbol: "🧠", title: "精算大師", desc: "成功通關，且總消耗回合數小於 25 回合。", tier: "expert", color: "var(--diff-expert)" },
  
  { id: 27, symbol: "💥", title: "厚積薄發", desc: "在單一回合內，同時靠購買卡片+貴族拜訪，一舉獲得 6 分以上。", tier: "master", color: "var(--diff-master)" },
  { id: 28, symbol: "🎯", title: "壓軸登場", desc: "成功通關時，最終分數剛好精準落在 15 分，不多不少。", tier: "master", color: "var(--diff-master)" },
  { id: 29, symbol: "⚡", title: "璀璨神速", desc: "以極限速度通關，總消耗回合數小於 20 回合。", tier: "master", color: "var(--diff-master)" },
  { id: 30, symbol: "👑", title: "璀璨大師", desc: "達成上述 29 個成就中的任意 20 個。", tier: "master", color: "var(--diff-master)" }
];

export const SingleMode = {
  // 💾 1. 安全獲取局內數據追蹤器
  getTracker() {
    const state = CoreState.get();
    if (!state.singlePlayerTracker) this.resetTracker();
    return state.singlePlayerTracker;
  },

  // 💾 開新局時重置局內追蹤器（由 ActionDispatcher.setupNewGame 呼叫）
  resetTracker() {
    const state = CoreState.get();
    state.singlePlayerTracker = {
      hasReservedThisGame: false,
      purchasedCardsCount: 0,
      purchasedCardsCountLv1: 0,
      lv1CardsCountBeforeTurn10: 0,
      goldUsedInThisPurchase: false
    };
  },

  // 💾 2. 安全獲取已解鎖成就集合 (轉換為 Set 方便局內比對)
  getUnlockedSet() {
    const state = CoreState.get();
    if (!state.achievements) {
      const archive = localStorage.getItem('splendor_achievements_v1');
      state.achievements = archive ? JSON.parse(archive) : {};
    }
    return new Set(Object.keys(state.achievements).map(Number));
  },

  // 💾 3. 數據與存檔加載歸一化（完美修復括號漏掉）
  loadTalentPool() {
    const savedProgress = localStorage.getItem('splendor_saved_progress_2026');
    if (!savedProgress) return;
    try {
      const data = JSON.parse(savedProgress);
      const state = CoreState.get();
      state.settings.difficulty = data.difficulty || 'easy';
      state.settings.talentPool = data.talentPool || [];
      state.settings.selectedAssistant = data.selectedAssistant || null;
      CoreState.set(state);
    } catch(e) {
      console.error("加載人才庫存檔失敗", e);
    }
  },

 saveCurrentProgress() {
    const state = CoreState.get();
    const s = state.settings;
    const progressData = { difficulty: s.difficulty, talentPool: s.talentPool, selectedAssistant: s.selectedAssistant };
    localStorage.setItem('splendor_saved_progress_2026', JSON.stringify(progressData));
    alert('💾 皇家進度已成功保存！');
  },

  // 🎯 核心重構：讓成就解鎖完全走 CoreState 記憶體，並推入全域動畫佇列
  triggerAchievementUnlock(id) {
    if (CoreState.get().mode !== 'singlePlayer') return; // 成就僅在單人模式解鎖
    const unlockedSet = this.getUnlockedSet();
    if (unlockedSet.has(id)) return;

    const state = CoreState.get();
    if (!state.achievements) state.achievements = {};
    state.achievements[id] = true; 

    const found = ALL_ACHIEVEMENTS.find(a => a.id === id);
    if (found) {
      // 🚀 壓進全域動畫佇列，交給 game.js 輪播
      if (!state.pendingAchievementsQueue) state.pendingAchievementsQueue = [];
      state.pendingAchievementsQueue.push(found);
      
      state.latestAchievementAlert = `當前已斬獲 <span style="color:#ffcc00; font-weight:800;">${Object.keys(state.achievements).length} / 30</span> 項皇家勳章！`;
    }

    // 璀璨大師連鎖判定 (滿 20 個自動開 30)
    const currentCount = Object.keys(state.achievements).filter(k => Number(k) !== 30).length;
    if (id !== 30 && currentCount >= 20) {
      localStorage.setItem('splendor_achievements_v1', JSON.stringify(state.achievements));
      this.triggerAchievementUnlock(30);
      return;
    }

    localStorage.setItem('splendor_achievements_v1', JSON.stringify(state.achievements));
    CoreState.set(state); // 廣播發動 game.js 的 render() 播放動畫
  },

  // 🎯 核心重構：將局內即時監聽與新架構對齊
  auditInstantAchievements(actionType, meta) {
    const state = CoreState.get();
    if (state.mode !== 'singlePlayer') return; 
    const p = state.player;
    const tracker = this.getTracker();

    if (actionType === "takeDiff" && meta.count === 3) this.triggerAchievementUnlock(1);
    if (actionType === "takeSame") this.triggerAchievementUnlock(2);
    if (p.tokens.o >= 3) this.triggerAchievementUnlock(4);
    
    let totalTokens = 0;
    for (let k in p.tokens) totalTokens += p.tokens[k];
    if (totalTokens === 10) this.triggerAchievementUnlock(5);

    if (p.tokens.w >= 1 && p.tokens.u >= 1 && p.tokens.g >= 1 && p.tokens.r >= 1 && p.tokens.k >= 1) {
      this.triggerAchievementUnlock(7);
    }
    if (actionType === "reserve") this.triggerAchievementUnlock(9);
    if (p.reserved.length === 3) this.triggerAchievementUnlock(10);

    if (actionType === "buy") {
      tracker.purchasedCardsCount++;
      if (meta.level === "lv1") {
        tracker.purchasedCardsCountLv1++;
        if (state.turn <= 10) {
          tracker.lv1CardsCountBeforeTurn10++;
          if (tracker.lv1CardsCountBeforeTurn10 >= 5) this.triggerAchievementUnlock(11);
        }
      }
      this.triggerAchievementUnlock(3);
      if (!tracker.goldUsedInThisPurchase) this.triggerAchievementUnlock(6);
      if (meta.totalGemsSpent === 0) this.triggerAchievementUnlock(8);
      if (meta.card.points > 0) this.triggerAchievementUnlock(13);
      if (meta.level === "lv3") this.triggerAchievementUnlock(14);
      if (meta.isReserved && p.reserved.length === 0) this.triggerAchievementUnlock(16);
      if (p.bonus[meta.card.provides] >= 4) this.triggerAchievementUnlock(17);
      if (meta.card.points >= 4) this.triggerAchievementUnlock(18);
    }
  },

  // 🎯 核心重構：局末結算對齊
  auditEndGameAchievements() {
    const state = CoreState.get();
    if (state.mode !== 'singlePlayer') return;
    const p = state.player;
    const tracker = this.getTracker();
    const totalTurns = state.turn - 1;

    if (tracker.purchasedCardsCountLv1 >= 8) this.triggerAchievementUnlock(12);
    if (totalTurns < 35) this.triggerAchievementUnlock(19);
    if (!tracker.hasReservedThisGame) this.triggerAchievementUnlock(20);

    const earnedNobles = state.nobles.filter(n => n.completed);
    if (earnedNobles.length === 0) this.triggerAchievementUnlock(21);
    if (earnedNobles.length * 3 >= 9) this.triggerAchievementUnlock(22);
    if (earnedNobles.length >= 2) this.triggerAchievementUnlock(25);
    if (p.tokens.o === 0) this.triggerAchievementUnlock(23);

    if (p.bonus.w >= 3 && p.bonus.u >= 3 && p.bonus.g >= 3 && p.bonus.r >= 3 && p.bonus.k >= 3) {
      this.triggerAchievementUnlock(24);
    }
    if (totalTurns < 25) this.triggerAchievementUnlock(26);
    if (p.score === 15) this.triggerAchievementUnlock(28);
    if (totalTurns < 20) this.triggerAchievementUnlock(29);

    const diffResultTxtEl = document.getElementById('modal-diff-result-txt');
    if (diffResultTxtEl) {
      diffResultTxtEl.innerHTML = `👑 戰局結算：本次單人成就挑戰共耗時 <strong>${totalTurns}</strong> 回合。`;
    }
  },

  // 🎯 皇家勳章牆：外層只顯示「符號＋名稱」，達成條件點入勳章後於聚光燈面板顯示
  openAchievementHistory() {
    const container = document.getElementById('ach-matrix-injector');
    const unlockedSet = this.getUnlockedSet();
    const TIER_NAME = { easy: "簡單", normal: "中階", hard: "進階", expert: "困難", master: "神人" };

    if (container) {
      // ── 各難度進度統計條（增添層次，避免單調）──
      const tiers = ['easy', 'normal', 'hard', 'expert', 'master'];
      const tierBar = tiers.map(t => {
        const list = ALL_ACHIEVEMENTS.filter(a => a.tier === t);
        const got = list.filter(a => unlockedSet.has(a.id)).length;
        const color = list[0].color;
        return `<div class="ach-tier-chip" style="--tier-c:${color};">
          <span class="ach-tier-chip-name">${TIER_NAME[t]}</span>
          <span class="ach-tier-chip-count">${got}/${list.length}</span>
          <div class="ach-tier-chip-bar"><div style="width:${Math.round(got / list.length * 100)}%;"></div></div>
        </div>`;
      }).join('');

      // ── 聚光燈詳情面板（預設提示；點勳章後由 showAchDetail 填入）──
      const spotlight = `
        <div class="ach-spotlight" id="ach-spotlight">
          <div class="ach-spot-symbol" id="ach-spot-symbol">👑</div>
          <div class="ach-spot-body">
            <div class="ach-spot-title" id="ach-spot-title">皇家勳章牆</div>
            <div class="ach-spot-desc" id="ach-spot-desc">點選下方任一勳章，於此查看達成條件。</div>
          </div>
          <div class="ach-spot-tag" id="ach-spot-tag" style="visibility:hidden;">—</div>
        </div>`;

      // ── 勳章牆：只放符號＋名稱（未解鎖顯示 ??），條件一律不外顯 ──
      const wall = `<div class="ach-wall">` + ALL_ACHIEVEMENTS.map(a => {
        const unlocked = unlockedSet.has(a.id);
        return `
          <button class="ach-medal ${unlocked ? 'unlocked' : 'locked'}" style="--tier-c:${a.color};"
            onclick="if(typeof playUniformSfx==='function')playUniformSfx(); window.showAchDetail(${a.id});">
            <span class="ach-medal-symbol">${unlocked ? a.symbol : '🔒'}</span>
            <span class="ach-medal-name">${unlocked ? a.title : '？？？'}</span>
          </button>`;
      }).join('') + `</div>`;

      container.innerHTML = `<div class="ach-tier-strip">${tierBar}</div>` + spotlight + wall;
    }
    const statsEl = document.getElementById('ach-stats-field');
    if (statsEl) { 
      statsEl.textContent = `${unlockedSet.size} / ${ALL_ACHIEVEMENTS.length}`; 
      statsEl.style.display = ''; 
    }
    document.getElementById('ach-history-modal-container')?.classList.add('show');
  },

  // 🔍 點選勳章 → 聚光燈面板顯示達成條件（唯一顯示條件的地方）
  showAchDetail(id) {
    const a = ALL_ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    const unlocked = this.getUnlockedSet().has(id);
    const TIER_NAME = { easy: "簡單", normal: "中階", hard: "進階", expert: "困難", master: "神人" };
    const sym = document.getElementById('ach-spot-symbol');
    const ttl = document.getElementById('ach-spot-title');
    const dsc = document.getElementById('ach-spot-desc');
    const tag = document.getElementById('ach-spot-tag');
    const pane = document.getElementById('ach-spotlight');
    if (!pane) return;
    sym.textContent = unlocked ? a.symbol : '🔒';
    ttl.textContent = unlocked ? a.title : '？？未知經商密盟？？';
    dsc.textContent = unlocked ? a.desc : '此勳章尚未解鎖 — 請在成就模式中持續經商，解鎖後即可查看達成條件。';
    tag.textContent = TIER_NAME[a.tier];
    tag.style.visibility = 'visible';
    tag.style.background = unlocked ? a.color : '#332a24';
    tag.style.color = unlocked ? '#110e0c' : '#73655c';
    pane.style.setProperty('--tier-c', a.color);
    pane.classList.remove('flash'); void pane.offsetWidth; pane.classList.add('flash');
    // 選中態標記
    document.querySelectorAll('.ach-medal.selected').forEach(m => m.classList.remove('selected'));
    const wall = document.querySelectorAll('.ach-medal');
    const idx = ALL_ACHIEVEMENTS.findIndex(x => x.id === id);
    if (wall[idx]) wall[idx].classList.add('selected');
  },

  closeAchievementHistory() {
    document.getElementById('ach-history-modal-container')?.classList.remove('show');
    const statsEl = document.getElementById('ach-stats-field');
    if (statsEl) statsEl.style.display = 'none';
  }
};
