// core/singleMode.js
import { CoreState } from './state.js';

const ALL_ACHIEVEMENTS = [
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
  { id: 25, symbol: "👥", title: "雙喜臨門", desc: "在單人局遊戲中，成功吸引裝飾兩位（或以上）的貴族拜訪。", tier: "expert", color: "var(--diff-expert)" },
  { id: 26, symbol: "🧠", title: "精算大師", desc: "成功通關，且總消耗回合數小於 25 回合。", tier: "expert", color: "var(--diff-expert)" },
  
  { id: 27, symbol: "💥", title: "厚積薄發", desc: "在單一回合內，同時靠購買卡片+貴族拜訪，一舉獲得 6 分以上。", tier: "master", color: "var(--diff-master)" },
  { id: 28, symbol: "🎯", title: "壓軸登場", desc: "成功通關時，最終分數剛好精準落在 15 分，不多不少。", tier: "master", color: "var(--diff-master)" },
  { id: 29, symbol: "⚡", title: "璀璨神速", desc: "以極限速度通關，總消耗回合數小於 20 回合。", tier: "master", color: "var(--diff-master)" },
  { id: 30, symbol: "👑", title: "璀璨大師", desc: "達成上述 29 個成就中的任意 20 個。", tier: "master", color: "var(--diff-master)" }
];

export const SingleMode = {
  unlockedAchievementIds: new Set(),
  sessionTracker: {
    hasReservedThisGame: false,
    purchasedCardsCount: 0,
    purchasedCardsCountLv1: 0, 
    lv1CardsCountBeforeTurn10: 0,
    singleTurnScoreGained: 0,
    goldUsedInThisPurchase: false
  },

  loadTalentPool() {
    const savedProgress = localStorage.getItem('splendor_saved_progress_2026');
    const s = CoreState.get().settings;
    if (savedProgress) {
      try {
        const data = JSON.parse(savedProgress);
        s.difficulty = data.difficulty || 'easy';
        s.talentPool = data.talentPool || [];
        s.selectedAssistant = data.selectedAssistant || null;
        this.renderActiveAssistantUI();
      } catch(e) {}
    }
  },

  saveCurrentProgress() {
    const s = CoreState.get().settings;
    const progressData = { difficulty: s.difficulty, talentPool: s.talentPool, selectedAssistant: s.selectedAssistant };
    localStorage.setItem('splendor_saved_progress_2026', JSON.stringify(progressData));
    alert('💾 皇家進度已成功保存！');
  },

  triggerAchievementUnlock(id) {
    if (this.unlockedAchievementIds.has(id)) return;
    this.unlockedAchievementIds.add(id);
    
    const found = ALL_ACHIEVEMENTS.find(a => a.id === id);
    if (found) {
      const latestEl = document.getElementById('ach-latest-field');
      if (latestEl) latestEl.innerHTML = `<span style="color:${found.color}; font-weight:800;">${found.symbol} [解鎖] ${found.title} — ${found.desc}</span>`;
    }
    
    if (id !== 30 && this.unlockedAchievementIds.size >= 20) {
      this.triggerAchievementUnlock(30);
    }

    if (typeof window.playAchievementSfx === 'function') {
      window.playAchievementSfx(found ? found.tier : 'easy');
    }
  },

  auditInstantAchievements(actionType, meta) {
    const state = CoreState.get();
    if (state.mode !== 'singlePlayer') return; 
    const p = state.player;

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
      this.triggerAchievementUnlock(3);
      if (!this.sessionTracker.goldUsedInThisPurchase) this.triggerAchievementUnlock(6);
      if (meta.totalGemsSpent === 0) this.triggerAchievementUnlock(8);
      if (meta.card.points > 0) this.triggerAchievementUnlock(13);
      if (meta.level === "lv3") this.triggerAchievementUnlock(14);
      if (meta.isReserved && p.reserved.length === 0) this.triggerAchievementUnlock(16);
      if (p.bonus[meta.card.provides] >= 4) this.triggerAchievementUnlock(17);
      if (meta.card.points >= 4) this.triggerAchievementUnlock(18);
    }
  },

  auditEndGameAchievements() {
    const state = CoreState.get();
    if (state.mode !== 'singlePlayer') return;
    const p = state.player;
    const totalTurns = state.turn - 1;

    if (this.sessionTracker.purchasedCardsCountLv1 >= 8) this.triggerAchievementUnlock(12);
    if (totalTurns < 35) this.triggerAchievementUnlock(19);
    if (!this.sessionTracker.hasReservedThisGame) this.triggerAchievementUnlock(20);

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

  openAchievementHistory() {
    const container = document.getElementById('ach-matrix-injector');
    if (container) {
      container.innerHTML = ALL_ACHIEVEMENTS.map(a => {
        const unlocked = this.unlockedAchievementIds.has(a.id);
        let tierName = { easy: "簡單", normal: "中階", hard: "進階", expert: "困難", master: "神人" }[a.tier];
        return `
          <div class="ach-item-row ${unlocked ? 'unlocked' : ''}" style="border-left: 4px solid ${a.color}; margin-bottom: 6px;">
            <div class="ach-row-meta">
              <div class="ach-row-name">${a.symbol} ${unlocked ? a.title : '?? 未知經商密盟 ??'}</div>
              <div class="ach-row-desc">${unlocked ? a.desc : '此成就尚未解鎖，請在單人模式下滿足條件。'}</div>
            </div>
            <div class="ach-row-tag" style="background: ${unlocked ? a.color : '#332a24'}; color:${unlocked ? '#110e0c' : '#73655c'};">${unlocked ? tierName : '未鎖'}</div>
          </div>
        `;
      }).join('');
    }
    const statsEl = document.getElementById('ach-stats-field');
    if (statsEl) { 
      statsEl.textContent = `${this.unlockedAchievementIds.size} / ${ALL_ACHIEVEMENTS.length}`; 
      statsEl.style.display = ''; 
    }
    document.getElementById('ach-history-modal-container')?.classList.add('show');
  },

  closeAchievementHistory() {
    document.getElementById('ach-history-modal-container')?.classList.remove('show');
    const statsEl = document.getElementById('ach-stats-field');
    if (statsEl) statsEl.style.display = 'none';
  },

  // 實體化輔助官選擇 UI 渲染
  renderTalentPoolModalUI() {
    const container = document.getElementById('talent-pool-modal-layer');
    if (!container) return;
    
    // 預設提供基本輔助官陣列
    const assistants = [
      { id: "ast1", name: "內政官 傑洛米", img: "https://i.ibb.co/zHGC8vsm/image.png" },
      { id: "ast2", name: "財政卿 薇多莉亞", img: "https://i.ibb.co/GQ2Yh0yH/image.png" }
    ];
    
    const s = CoreState.get().settings;
    container.innerHTML = assistants.map(ast => {
      const isSelected = s.selectedAssistant === ast.id ? 'selected' : '';
      return `
        <div class="talent-mini-card ${isSelected}" onclick="SingleMode.selectAssistant('${ast.id}', '${ast.name}', '${ast.img}')">
          <img src="${ast.img}" alt="${ast.name}">
          <span>${ast.name}</span>
        </div>
      `;
    }).join('');
  },

  selectAssistant(id, name, img) {
    const s = CoreState.get().settings;
    s.selectedAssistant = id;
    this.renderTalentPoolModalUI();
  },

  renderActiveAssistantUI() {
    const layer = document.getElementById('assistant-display-layer');
    if (!layer) return;
    const s = CoreState.get().settings;
    
    if (s.selectedAssistant === "ast1") {
      layer.innerHTML = `<div class="earned-noble-mini"><img src="https://i.ibb.co/zHGC8vsm/image.png"><span>傑洛米 (隨行中)</span></div>`;
    } else if (s.selectedAssistant === "ast2") {
      layer.innerHTML = `<div class="earned-noble-mini"><img src="https://i.ibb.co/GQ2Yh0yH/image.png"><span>薇多莉亞 (隨行中)</span></div>`;
    } else {
      layer.innerHTML = `<p style="font-size:0.55rem; color:var(--text-muted); padding:4px 0;">孤軍奮戰中</p>`;
    }
  }
};