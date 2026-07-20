// core/action.js
import { CoreState } from './state.js';
import { GameEngine } from './gameEngine.js';
import { SingleMode } from './singleMode.js';
import { AiMode } from './aiMode.js';
import { STORY_MISSIONS } from './missions/levelsData.js';

const RAW_CARDS = {
  lv1: [
    {id:"101", points:0, provides:"w", cost:{u:1, g:1, r:1, k:1}},
    {id:"102", points:0, provides:"u", cost:{w:1, g:1, r:1, k:1}},
    {id:"103", points:0, provides:"g", cost:{w:1, u:1, r:1, k:1}},
    {id:"104", points:0, provides:"r", cost:{w:1, u:1, g:1, k:1}},
    {id:"105", points:0, provides:"k", cost:{w:1, u:1, g:1, r:1}},
    {id:"106", points:0, provides:"w", cost:{u:2, k:1}},
    {id:"107", points:0, provides:"u", cost:{g:2, r:1}},
    {id:"108", points:0, provides:"g", cost:{r:2, w:1}},
    {id:"109", points:0, provides:"r", cost:{k:2, u:1}},
    {id:"110", points:0, provides:"k", cost:{w:2, g:1}},
    {id:"111", points:1, provides:"w", cost:{g:4}},
    {id:"112", points:1, provides:"u", cost:{r:4}},
    {id:"113", points:1, provides:"g", cost:{k:4}},
    {id:"114", points:1, provides:"r", cost:{w:4}},
    {id:"115", points:1, provides:"k", cost:{u:4}},
    {id:"116", points:0, provides:"w", cost:{r:2, g:2}},
    {id:"117", points:0, provides:"u", cost:{k:2, w:2}},
    {id:"118", points:0, provides:"g", cost:{u:3}},
    {id:"119", points:0, provides:"r", cost:{g:3}},
    {id:"120", points:0, provides:"k", cost:{r:3}}
  ],
  lv2: [
    {id:"201", points:1, provides:"w", cost:{w:3, u:2, g:2}},
    {id:"202", points:1, provides:"u", cost:{u:3, g:2, r:2}},
    {id:"203", points:1, provides:"g", cost:{g:3, r:2, k:2}},
    {id:"204", points:2, provides:"r", cost:{r:4, k:2, w:1}},
    {id:"205", points:2, provides:"k", cost:{k:4, w:2, u:1}},
    {id:"206", points:2, provides:"w", cost:{w:5}},
    {id:"207", points:2, provides:"u", cost:{u:5}},
    {id:"208", points:3, provides:"g", cost:{g:6}},
    {id:"209", points:2, provides:"r", cost:{w:1, u:4, g:2}},
    {id:"210", points:3, provides:"k", cost:{k:6}},
    {id:"211", points:1, provides:"r", cost:{r:3, w:2, u:2}},
    {id:"212", points:1, provides:"k", cost:{k:3, g:2, w:2}},
    {id:"213", points:2, provides:"g", cost:{g:4, u:2, w:1}},
    {id:"214", points:2, provides:"u", cost:{u:4, r:2, g:1}},
    {id:"215", points:2, provides:"w", cost:{w:4, k:2, r:1}},
    {id:"216", points:2, provides:"g", cost:{g:5}},
    {id:"217", points:2, provides:"r", cost:{r:5}},
    {id:"218", points:2, provides:"k", cost:{u:1, g:4, r:2}},
    {id:"219", points:3, provides:"w", cost:{w:6}},
    {id:"220", points:3, provides:"u", cost:{u:6}}
  ],
  lv3: [
    {id:"301", points:4, provides:"w", cost:{k:7}},
    {id:"302", points:4, provides:"u", cost:{w:7}},
    {id:"303", points:4, provides:"g", cost:{u:7}},
    {id:"304", points:4, provides:"r", cost:{g:7}},
    {id:"305", points:4, provides:"k", cost:{r:7}},
    {id:"306", points:5, provides:"w", cost:{w:3, k:7}},
    {id:"307", points:5, provides:"u", cost:{w:7, u:3}},
    {id:"308", points:5, provides:"g", cost:{u:7, g:3}},
    {id:"309", points:3, provides:"w", cost:{u:3, g:3, r:5, k:3}},
    {id:"310", points:3, provides:"u", cost:{w:3, g:3, r:3, k:5}},
    {id:"311", points:3, provides:"g", cost:{w:5, u:3, r:3, k:3}},
    {id:"312", points:3, provides:"r", cost:{w:3, u:5, g:3, k:3}},
    {id:"313", points:3, provides:"k", cost:{w:3, u:3, g:5, r:3}},
    {id:"314", points:4, provides:"r", cost:{r:3, g:6, k:3}},
    {id:"315", points:4, provides:"k", cost:{k:3, r:6, g:3}},
    {id:"316", points:4, provides:"w", cost:{w:3, k:6, r:3}},
    {id:"317", points:4, provides:"u", cost:{u:3, w:6, k:3}},
    {id:"318", points:4, provides:"g", cost:{g:3, u:6, w:3}},
    {id:"319", points:5, provides:"r", cost:{g:7, r:3}},
    {id:"320", points:5, provides:"k", cost:{r:7, k:3}}
  ]
};

const ALL_NOBLES_POOL = [
  {id:"n1", name:"赫克特", gender:"male", points:3, img:"https://i.ibb.co/zHGC8vsm/image.png", req:{w:3, u:3, g:3}},
  {id:"n2", name:"羅蘭德", gender:"male", points:3, img:"https://i.ibb.co/QvHvZZWc/image.png", req:{u:3, g:3, r:3}},
  {id:"n3", name:"亞瑟", gender:"male", points:3, img:"https://i.ibb.co/hzw3Vfm/image.png", req:{g:3, r:3, k:3}},
  {id:"n4", name:"查理曼", gender:"male", points:3, img:"https://i.ibb.co/nNSjxvvd/image.png", req:{w:3, u:3, k:3}},
  {id:"n5", name:"桂妮薇兒", gender:"female", points:3, img:"https://i.ibb.co/GQ2Yh0yH/image.png", req:{w:3, u:3, g:3}}
];

const GEMS = ['w', 'u', 'g', 'r', 'k'];

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) {
    el.textContent = msg;
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3000);
  }
}

function bagTotal(actorData) {
  let t = 0;
  for (let k in actorData.tokens) t += actorData.tokens[k];
  return t;
}

export const ActionDispatcher = {
  /** 玩家背包上限（帝國雄獅 ast6 提升至 12） */
  getPlayerBagCap() {
    return CoreState.get().settings.selectedAssistant === 'ast6' ? 12 : 10;
  },

  /** 目前對局是否有 AI 參戰（帝國爭霸模式，或故事關卡設定為 vsAI） */
  isAiBattle(state) {
    return state.mode === 'vsAI' || (state.mode === 'storyMode' && state.aiEnabled);
  },

  /** 目前關卡的目標分數（供 UI 顯示與結算） */
  getTargetScore(state) {
    if (state.mode === 'storyMode') {
      const mission = STORY_MISSIONS[(state.storyProgress?.currentLevel || 1) - 1];
      return mission?.winCondition?.targetScore || 15;
    }
    return 15;
  },

  dispatch(actionType, payload) {
    const state = CoreState.get();
    const p = state.player;
    const ast = state.settings.selectedAssistant;

    switch (actionType) {
      case 'INIT_GAME':
        this.setupNewGame();
        break;

      case 'SWITCH_MODE':
        state.mode = payload.mode;
        // 🤖 進入帝國爭霸：先讓玩家選擇對手，選定後才真正開局
        if (payload.mode === 'vsAI' && typeof window.openAiOpponentModal === 'function') {
          window.openAiOpponentModal();
          break;
        }
        this.setupNewGame();
        break;

      case 'TAKE_DIFF': {
        // 合法性防呆：庫存不足即中止，不消耗回合
        for (let k of payload.colors) {
          if ((state.bank[k] || 0) <= 0) { showError('⚠️ 銀行該色籌碼已空'); window.render(); return; }
        }
        // 背包上限檢查
        const cap = this.getPlayerBagCap();
        if (bagTotal(p) + payload.colors.length > cap) {
          showError(`⚠️ 背包上限 ${cap} 顆，無法再拿 ${payload.colors.length} 顆`);
          window.render(); return;
        }

        let colorsToTake = [...payload.colors];

        // 鍊金術師 ast12：拿 3 不同色時，其中 1 顆自動替換成黃金
        let alchemyGold = false;
        if (ast === 'ast12' && colorsToTake.length === 3 && state.bank.o > 0) {
          colorsToTake.pop(); // 少拿一顆普通
          state.bank.o--; p.tokens.o++;
          alchemyGold = true;
        }

        colorsToTake.forEach(k => {
          state.bank[k]--; p.tokens[k]++;
          if (state.mode === 'storyMode' && k === 'r') state.storyTracker.redTokensTaken++;
        });
        if (alchemyGold) showError('⚗️ 點石成金：1 顆籌碼已替換為黃金！');

        SingleMode.auditInstantAchievements("takeDiff", { count: payload.colors.length });
        this.finalizeTurn('player', { wasTake: true });
        break;
      }

      case 'TAKE_SAME': {
        const c = payload.color;
        const bankHas = state.bank[c] || 0;
        // 大提琴家 ast9：庫存剩 1 顆也能執行同色拿 2；否則需 2 顆以上
        const minRequired = (ast === 'ast9') ? 1 : 2;
        if (bankHas < minRequired) {
          showError(ast === 'ast9' ? '⚠️ 銀行該色籌碼已空' : '⚠️ 同色拿 2 需銀行庫存 2 顆以上');
          window.render(); return;
        }
        const cap = this.getPlayerBagCap();
        if (bagTotal(p) + 2 > cap) {
          showError(`⚠️ 背包上限 ${cap} 顆，無法再拿 2 顆`);
          window.render(); return;
        }

        const actuallyFromBank = Math.min(2, bankHas);
        state.bank[c] -= actuallyFromBank;
        p.tokens[c] += 2; // ast9 情況下第 2 顆由樂章憑空補足
        if (state.mode === 'storyMode' && c === 'r') state.storyTracker.redTokensTaken += 2;

        SingleMode.auditInstantAchievements("takeSame", {});
        this.finalizeTurn('player', { wasTake: true });
        break;
      }

      case 'BUY_BOARD': {
        const { level, idx } = payload;
        const card = state.board[level][idx];
        if (!card) return;
        const afford = GameEngine.canAffordCard(p.bonus, p.tokens, card.cost, { actor: 'player', level });
        if (!afford.affordable) { showError('⚠️ 資產不足，無法收購'); window.render(); return; }

        const totalGemsSpent = this._payForCard(state, p, card, afford);
        this._gainCard(state, p, card, level);

        state.board[level][idx] = this._drawReplacement(state, level);
        SingleMode.auditInstantAchievements("buy", { card, level, totalGemsSpent, isReserved: false });

        this.finalizeTurn('player', { cardPoints: card.points });
        break;
      }

      case 'BUY_RESERVED': {
        const { idx } = payload;
        const card = p.reserved[idx];
        if (!card) return;
        const level = 'lv' + String(card.id)[0];
        const afford = GameEngine.canAffordCard(p.bonus, p.tokens, card.cost, { actor: 'player', level });
        if (!afford.affordable) { showError('⚠️ 資產不足，無法收購'); window.render(); return; }

        const totalGemsSpent = this._payForCard(state, p, card, afford);
        this._gainCard(state, p, card, level);
        p.reserved.splice(idx, 1);

        if (state.mode === 'storyMode' && state.storyTracker) {
          state.storyTracker.reservedBuys++;
        }

        SingleMode.auditInstantAchievements("buy", { card, level, totalGemsSpent, isReserved: true });
        this.finalizeTurn('player', { cardPoints: card.points });
        break;
      }

      case 'RESERVE_CARD': {
        const { level, idx } = payload;
        const card = state.board[level][idx];
        if (!card) return;
        const reserveCap = (ast === 'ast7') ? 4 : 3;
        if (p.reserved.length >= reserveCap) { showError('⚠️ 保留區已滿'); window.render(); return; }

        p.reserved.push(card);
        SingleMode.getTracker().hasReservedThisGame = true;

        const cap = this.getPlayerBagCap();
        if (state.bank.o > 0 && bagTotal(p) < cap) { state.bank.o--; p.tokens.o++; }

        // 皇家占星師 ast11：保留時 50% 機率額外隨機多獲得 1 籌碼
        if (ast === 'ast11' && Math.random() < 0.5 && bagTotal(p) < cap) {
          const avail = GEMS.filter(c => state.bank[c] > 0);
          if (avail.length > 0) {
            const lucky = avail[Math.floor(Math.random() * avail.length)];
            state.bank[lucky]--; p.tokens[lucky]++;
            showError('🔮 星啟合約：額外獲得 1 顆隨機籌碼！');
          }
        }

        state.board[level][idx] = this._drawReplacement(state, level);
        SingleMode.auditInstantAchievements("reserve", {});
        this.finalizeTurn('player');
        break;
      }

      case 'TOGGLE_MUSIC': {
        state.settings.isMusicMuted = !state.settings.isMusicMuted;
        const bgMusic = document.getElementById('bg-music');
        if (bgMusic) { if (state.settings.isMusicMuted) bgMusic.pause(); else bgMusic.play().catch(()=>{}); }
        break;
      }

      case 'TOGGLE_SFX':
        state.settings.isSfxMuted = !state.settings.isSfxMuted;
        break;
    }
    window.render();
  },

  /** 支付卡片費用，回傳實際消耗籌碼總數 */
  _payForCard(state, p, card, afford) {
    SingleMode.getTracker().goldUsedInThisPurchase = (afford.neededGold > 0);
    let totalGemsSpent = 0;

    for (let k in card.cost) {
      const spent = afford.breakdown[k] || 0;
      p.tokens[k] -= spent; state.bank[k] += spent;
      totalGemsSpent += spent;
    }
    if (afford.neededGold > 0) {
      p.tokens.o -= afford.neededGold; state.bank.o += afford.neededGold;
      totalGemsSpent += afford.neededGold;
    }
    if (state.mode === 'storyMode' && state.storyTracker && totalGemsSpent === 0) {
      state.storyTracker.freeBuys++;
    }
    return totalGemsSpent;
  },

  /** 玩家獲得卡片：加產量 / 加分 / 輔助官特效 / 故事追蹤 */
  _gainCard(state, p, card, level) {
    const ast = state.settings.selectedAssistant;

    // 大魔導師 ast23：收購帶威望分的卡牌時，永久減免產量變 2 倍
    const bonusGain = (ast === 'ast23' && card.points > 0) ? 2 : 1;
    p.bonus[card.provides] += bonusGain;
    p.score += card.points;
    if (card.points > 0) p.pointCards = (p.pointCards || 0) + 1;

    const isLv3 = (level === 'lv3');

    // 地下領主 ast13：成功收購 Lv3 卡片時免費贈予 1 枚黃金
    if (ast === 'ast13' && isLv3 && state.bank.o > 0 && bagTotal(p) < this.getPlayerBagCap()) {
      state.bank.o--; p.tokens.o++;
      showError('💰 真金回饋：獲贈 1 枚黃金！');
    }

    // 帝國女皇 ast24：購買 Lv3 卡片時隨機扣除電腦 AI 庫存 2 枚籌碼
    if (ast === 'ast24' && isLv3 && this.isAiBattle(state)) {
      let stolen = 0;
      const order = [...GEMS, 'o'].sort(() => Math.random() - 0.5);
      for (let c of order) {
        while (state.ai.tokens[c] > 0 && stolen < 2) {
          state.ai.tokens[c]--; state.bank[c]++; stolen++;
        }
        if (stolen >= 2) break;
      }
      if (stolen > 0) showError(`👑 女皇鐵腕：AI 被扣除 ${stolen} 枚籌碼！`);
    }

    if (state.mode === 'storyMode' && state.storyTracker) {
      if (card.points >= 4) state.storyTracker.highPointCards++;
    }
  },

  /** 補牌。預言者 ast22：一次翻兩張自動保留分數較高者（另一張置回牌庫底） */
  _drawReplacement(state, level) {
    const deck = state.decks[level];
    if (deck.length === 0) return null;
    if (state.settings.selectedAssistant === 'ast22' && deck.length >= 2) {
      const a = deck.pop(), b = deck.pop();
      const keep = (b.points > a.points) ? b : a;
      const back = (keep === a) ? b : a;
      deck.unshift(back);
      return keep;
    }
    return deck.pop();
  },

  finalizeTurn(actionActor, meta = {}) {
    const state = CoreState.get();
    const actorData = actionActor === 'player' ? state.player : state.ai;
    const initialScore = actorData.score;

    // 貴族拜訪（第 18 關：玩家貴族分被刺客無效化）
    const skipPlayerNobles = (actionActor === 'player'
      && state.mode === 'storyMode' && state.storyTracker?.noNoblesForPlayer);

    let noblePointsGained = 0;
    if (!skipPlayerNobles) {
      const earnedNobles = GameEngine.checkNoblesVisit(state.nobles, actorData.bonus, actionActor);
      earnedNobles.forEach(n => {
        n.completed = true;
        if (actionActor === 'player') {
          state.player.score += n.points;
          noblePointsGained += n.points;
          window.playNobleSfx(n.gender);
        } else {
          state.ai.score += n.points;
          state.ai.noblePoints += n.points;
        }
      });

      // 👑 獲得貴族（玩家或 AI 皆同）：啟動「飛出 → 放大旋轉 → 飛入」動畫
      //（必須在任何 render() 之前呼叫，動畫才能從貴族卡當前位置起飛；
      //  AI 獲得時飛入 AI 金庫面板，勝利視窗一律等動畫播完）
      if (earnedNobles.length > 0
          && typeof window.animateNoblesEarned === 'function') {
        window.animateNoblesEarned(earnedNobles, actionActor);
      }
    }

    // 單人成就 27：單回合卡片+貴族共 6 分以上
    if (actionActor === 'player') {
      const turnGain = (meta.cardPoints || 0) + noblePointsGained;
      if (turnGain >= 6) SingleMode.triggerAchievementUnlock(27);
    }

    if (actionActor === 'player' && state.mode === 'storyMode' && state.storyTracker) {
      if ((meta.cardPoints || 0) > 0 && noblePointsGained > 0) {
        state.storyTracker.comboTriggered = true;
      }
      // 第 7 關：追蹤史上最大背包
      const bag = bagTotal(state.player);
      if (bag > state.storyTracker.maxBagEver) state.storyTracker.maxBagEver = bag;
    }

    // ─── 故事模式勝負判定 ───
    if (state.mode === 'storyMode') {
      if (this._resolveStoryTurn(state, actionActor, meta)) return;
      return;
    }

    // ─── 成就 / 對戰模式勝負判定 ───
    // 影刃刺客 ast18：結算時 AI 貴族分無效化
    const aiEffectiveScore = (state.settings.selectedAssistant === 'ast18')
      ? state.ai.score - state.ai.noblePoints : state.ai.score;

    // 🌊 簡單對手（翠席兒）：不限回合數，只以 15 分定勝負
    const noTurnLimit = state.mode === 'vsAI'
      && state.settings.aiOpponent && state.settings.aiOpponent.difficulty === 'easy';

    if (state.player.score >= 15 || aiEffectiveScore >= 15 || (!noTurnLimit && state.turn > 28)) {
      window.render();
      // 🌐 線上對戰：本地行動觸發終局 → 先把最終棋局傳給對手，讓雙方同步看到結算
      if (state.onlineMatch?.active && actionActor === 'player' && window.OnlineMode) {
        window.OnlineMode.broadcastState('end');
      }
      SingleMode.auditEndGameAchievements();
      this._showEndModal(state, aiEffectiveScore);
      return;
    }

    this._advanceTurn(state, actionActor, meta);
  },

  /** 回合推進（含 vsAI 換手 / ast14 首回合雙拿） */
  _advanceTurn(state, actionActor, meta = {}) {
    // 精靈遊俠 ast14：第一回合可連續執行兩次「拿籌碼」
    if (actionActor === 'player' && meta.wasTake
        && state.settings.selectedAssistant === 'ast14'
        && state.turn === 1 && !state.ast14TakeUsed) {
      state.ast14TakeUsed = true;
      showError('🏹 迅捷斥候：第一回合可再拿取一次籌碼！');
      window.render();
      return; // 不換手、不進回合
    }

    // ── 🌐 線上好友對戰：本地行動完成 → 換手給遠端對手並同步全狀態 ──
    //    （對手佔用 ai 席位但 AI 思考停用；對方的行動由收包套用，不會走到這裡）
    if (state.onlineMatch?.active) {
      if (actionActor === 'player') {
        if (state.onlineMatch.role === 'guest') state.turn++; // 客方為後手，行動完進位回合
        state.currentTurnOwner = 'ai';
        window.render();
        if (window.OnlineMode) window.OnlineMode.broadcastState('turn');
      }
      return;
    }

    if (this.isAiBattle(state)) {
      if (actionActor === 'player') {
        state.currentTurnOwner = 'ai';
        window.render();
        setTimeout(() => { AiMode.thinkAndExecute(CoreState.get()); }, 1000);
        return;
      } else {
        state.currentTurnOwner = 'player';
        state.turn++;
      }
    } else {
      if (actionActor === 'player') state.turn++;
    }
    window.render();
  },

  /** 故事模式回合結算。回傳 true 表示對局已結束 */
  _resolveStoryTurn(state, actionActor, meta) {
    const currentLvl = state.storyProgress?.currentLevel || 1;
    const mission = STORY_MISSIONS[currentLvl - 1];
    if (!mission) { state.turn++; window.render(); return true; }

    const cfg = mission.setup;
    const win = mission.winCondition;
    const p = state.player;
    const t = state.storyTracker || {};
    const turnLimit = cfg.turnLimit || 99;

    const isTimeUp = (turnLimit < 99) && (state.turn > turnLimit);

    // ast18 對玩家的鏡像：某些關卡玩家也可裝備 ast18 打 AI
    const aiEffectiveScore = (state.settings.selectedAssistant === 'ast18')
      ? state.ai.score - state.ai.noblePoints : state.ai.score;

    let isWin = false;
    let isFail = false;
    let failReason = '';

    switch (win.type) {
      case 'score_only':
        isWin = p.score >= win.targetScore;
        break;
      case 'score_and_token_limit': // 第 2 關：紅寶石拿取上限
        isWin = p.score >= win.targetScore && t.redTokensTaken <= (win.maxTokenAllowed || 7);
        if (t.redTokensTaken > (win.maxTokenAllowed || 7)) {
          isFail = true; failReason = `已拿取 ${t.redTokensTaken} 顆紅寶石籌碼，超過 ${win.maxTokenAllowed} 顆的稅務上限！`;
        }
        break;
      case 'score_and_reserve_buy':
        isWin = p.score >= win.targetScore && (t.reservedBuys || 0) >= win.minReservedBuys;
        break;
      case 'score_and_color_balance':
        isWin = p.score >= win.targetScore &&
          GEMS.every(c => (p.bonus[c] || 0) >= win.minCardsPerColor);
        break;
      case 'score_and_max_bag_limit': // 第 7 關：背包永不超過 6
        if ((t.maxBagEver || 0) > win.maxBagSizeEver) {
          isFail = true; failReason = `背包籌碼曾達到 ${t.maxBagEver} 顆，超過 ${win.maxBagSizeEver} 顆的黑市規矩！`;
        }
        isWin = !isFail && p.score >= win.targetScore;
        break;
      case 'score_and_gold_reserve':
        isWin = p.score >= win.targetScore && (p.tokens.o || 0) >= win.requiredGoldOnHand;
        break;
      case 'score_and_free_buys':
        isWin = p.score >= win.targetScore && (t.freeBuys || 0) >= win.minFreeBuysRequired;
        break;
      case 'nobles_count_only':
        isWin = state.nobles.filter(n => n.completed).length >= win.targetNoblesCount;
        break;
      case 'exact_score': // 第 13 關：超分算輸
        if (p.score > win.targetScore) {
          isFail = true; failReason = `最終分數 ${p.score} 分，超過了索林要求的精準 ${win.targetScore} 分！`;
        }
        isWin = p.score === win.targetScore;
        break;
      case 'beat_ai':
        isWin = p.score >= win.targetScore && p.score > aiEffectiveScore;
        if (aiEffectiveScore >= win.targetScore && aiEffectiveScore >= p.score) {
          isFail = true; failReason = `電腦 AI 已率先達到 ${aiEffectiveScore} 分，商戰失利！`;
        }
        break;
      case 'high_score_and_tier3_count':
        isWin = p.score >= win.targetScore && (t.highPointCards || 0) >= win.requiredTier3CardsWithPoints4;
        break;
      case 'score_and_exclusive_colors': { // 第 9 關：只允許黑白卡
        const allowed = win.allowedColors || ['w', 'k'];
        const violated = GEMS.some(c => !allowed.includes(c) && (p.bonus[c] || 0) > 0);
        if (violated) {
          isFail = true; failReason = `名下出現了黑白以外顏色的產業卡，破壞了塞巴斯蒂安的雙色協奏曲！`;
        }
        isWin = !violated && p.score >= win.targetScore;
        break;
      }
      case 'score_and_combo_trigger':
        isWin = p.score >= win.targetScore && (t.comboTriggered || false);
        break;
      case 'score_and_perfect_colors':
        isWin = p.score >= win.targetScore &&
          GEMS.every(c => (p.bonus[c] || 0) >= win.requiredMinBonusAllColors);
        break;
      case 'master_final_challenge':
        isWin = p.score >= win.targetScore &&
          state.nobles.filter(n => n.completed).length >= win.targetNoblesCount;
        break;
      default:
        isWin = p.score >= (win.targetScore || 15);
    }

    if (isWin || isTimeUp || isFail) {
      window.render();
      this._showStoryEndModal(state, mission, currentLvl, isWin, isFail ? failReason : null, turnLimit);
      return true;
    }

    // 第 20 關：命運詛咒 — 每過 tokenTaxInterval 回合充公籌碼
    if (actionActor === 'player' && cfg.tokenTaxInterval && (state.turn % cfg.tokenTaxInterval === 0)) {
      let taxCount = 0;
      for (let c of [...GEMS, 'o']) {
        if (p.tokens[c] > 0) {
          const deduct = Math.min(p.tokens[c], cfg.tokenTaxAmount - taxCount);
          p.tokens[c] -= deduct;
          state.bank[c] += deduct;
          taxCount += deduct;
          if (taxCount >= cfg.tokenTaxAmount) break;
        }
      }
      if (taxCount > 0) showError(`📜 命運詛咒發動：被國庫充公了 ${taxCount} 枚籌碼！`);
    }

    this._advanceTurn(state, actionActor, meta);
    return true;
  },

  _showStoryEndModal(state, mission, currentLvl, isWin, failReason, turnLimit) {
    // 👑 貴族動畫尚未播完 → 延後到動畫全部結束再展示捷報
    if (window.deferUntilNobleAnim
        && window.deferUntilNobleAnim(() => this._showStoryEndModal(state, mission, currentLvl, isWin, failReason, turnLimit))) {
      return;
    }
    const iconEl = document.getElementById('win-modal-icon');
    const titleEl = document.getElementById('win-modal-title');
    const bodyEl = document.getElementById('modal-body-txt');
    const modalBox = document.getElementById('win-modal').querySelector('.modal');
    const restartBtn = document.getElementById('btn-restart');
    const diffTxt = document.getElementById('modal-diff-result-txt');
    if (diffTxt) diffTxt.textContent = '';

    // 🏘️ 故事模式:備用鈕改造為「返回城鎮樞紐」
    const townBtn = document.getElementById('btn-reselect-opponent');
    if (townBtn) {
      townBtn.style.display = '';
      townBtn.textContent = '🏘️ 返回城鎮';
      townBtn.onclick = () => {
        window.playUniformSfx();
        document.getElementById('win-modal').classList.remove('show');
        if (window.TownMode) window.TownMode.enter();
      };
    }

    if (isWin) {
      iconEl.textContent = '📜';
      titleEl.textContent = `戰役捷報：第 ${currentLvl} 關突破！`;
      bodyEl.textContent = `精湛的商賈巨擘！您成功在 ${state.turn} 回合內完成挑戰！\n已成功收服此關卡劇情對應的首席輔助官能力！`;
      modalBox.style.borderColor = '#2ecc71';

      if (window.StoryMode) window.StoryMode.saveStoryProgress(mission.id);

      if (currentLvl < 25) {
        // 🔗 劇情閘門:下一關若被戰線鎖住,按鈕改為「銜接劇情」——播鎖定對話後回城鎮出征,
        //    關卡維持鎖定、絕不跳關;戰線打贏後回殿堂即可繼續。
        const nextId = currentLvl + 1;
        const nextGate = (window.StoryMode && window.StoryMode.levelGate)
          ? window.StoryMode.levelGate(nextId) : { ok: true };
        if (!nextGate.ok) {
          restartBtn.textContent = `⚔️ 前線告急：銜接劇情(需先打贏戰線第 ${nextGate.needTx} 戰)`;
          restartBtn.className = "btn-primary";
          restartBtn.onclick = () => {
            window.playUniformSfx();
            document.getElementById('win-modal').classList.remove('show');
            window.StoryMode.playLevelLockStory(nextId, () => {
              if (window.TownMode) window.TownMode.enter();   // 對話結束 → 回城鎮,出城參戰
            });
          };
        } else {
          restartBtn.textContent = `📜 命運推進：挑戰第 ${nextId} 關`;
          restartBtn.className = "btn-primary";
          restartBtn.onclick = () => {
            window.playUniformSfx();
            // 保險:點擊當下再驗一次閘門(避免視窗停留期間狀態變動)
            if (window.StoryMode && window.StoryMode.levelGate && !window.StoryMode.levelGate(nextId).ok) {
              document.getElementById('win-modal').classList.remove('show');
              window.StoryMode.playLevelLockStory(nextId, () => { if (window.TownMode) window.TownMode.enter(); });
              return;
            }
            document.getElementById('win-modal').classList.remove('show');
            state.storyProgress.currentLevel = nextId;
            if (window.storyModule && window.storyModule.loadStage) {
              window.storyModule.loadStage(nextId, () => ActionDispatcher.dispatch('INIT_GAME'));
            } else {
              ActionDispatcher.dispatch('INIT_GAME');
            }
          };
        }
      } else {
        restartBtn.textContent = "🏆 完美通關全戰役！";
        restartBtn.className = "btn-primary";
        restartBtn.onclick = () => document.getElementById('win-modal').classList.remove('show');
      }
    } else {
      iconEl.textContent = '❌';
      titleEl.textContent = `戰役失敗：未能突破考驗！`;
      bodyEl.textContent = failReason
        ? failReason
        : `對局已消耗 ${state.turn} 回合（上限: ${turnLimit} 回合），得分為 ${state.player.score} 分。`;
      modalBox.style.borderColor = '#e74c3c';

      restartBtn.textContent = "🔄 再次挑戰本關";
      restartBtn.className = "btn-replay";
      restartBtn.onclick = () => {
        window.playUniformSfx();
        document.getElementById('win-modal').classList.remove('show');
        ActionDispatcher.dispatch('INIT_GAME');
      };
    }
    document.getElementById('win-modal').classList.add('show');
  },

  _showEndModal(state, aiEffectiveScore) {
    // 👑 貴族動畫尚未播完 → 延後到動畫全部結束再展示結算
    if (window.deferUntilNobleAnim
        && window.deferUntilNobleAnim(() => this._showEndModal(state, aiEffectiveScore))) {
      return;
    }
    const iconEl = document.getElementById('win-modal-icon');
    const titleEl = document.getElementById('win-modal-title');
    const bodyEl = document.getElementById('modal-body-txt');
    const modal = document.getElementById('win-modal');
    const modalBox = modal.querySelector('.modal');
    const restartBtn = document.getElementById('btn-restart');

    const isAiBattle = this.isAiBattle(state);
    const isVsAiMode = state.mode === 'vsAI';
    const isOnline = !!(state.onlineMatch && state.onlineMatch.active);

    // 帝國爭霸：重新開始（維持原對手）＋ 重新選擇對手；線上對戰：再戰一場＋重新配對
    const reselectBtn = document.getElementById('btn-reselect-opponent');
    if (isOnline) {
      restartBtn.textContent = '⚔️ 再戰一場';
      restartBtn.className = "btn-replay";
      restartBtn.onclick = () => { window.playUniformSfx(); window.OnlineMode?.requestRematch(); };
      if (reselectBtn) {
        reselectBtn.style.display = '';
        reselectBtn.textContent = '🔄 重新配對';
        reselectBtn.onclick = () => {
          window.playUniformSfx();
          document.getElementById('win-modal')?.classList.remove('show');
          window.OnlineMode?.rematchNewPeer();
        };
      }
    } else {
      restartBtn.textContent = isVsAiMode ? '🔁 重新開始（維持原對手）' : '重開新局';
      restartBtn.className = "btn-replay";
      restartBtn.onclick = () => { window.playUniformSfx(); window.restartGame(); };
      if (reselectBtn) {
        reselectBtn.style.display = isVsAiMode ? '' : 'none';
        reselectBtn.textContent = '🔄 重新選擇對手';
        reselectBtn.onclick = () => { window.playUniformSfx(); window.reselectAiOpponent(); };
      }
    }
    const diffTxtEl = document.getElementById('modal-diff-result-txt');
    if (diffTxtEl) diffTxtEl.textContent = '';

    const playerWin = state.player.score >= 15
      && (state.mode === 'singlePlayer' || state.player.score >= aiEffectiveScore);

    if (playerWin) {
      if (isOnline) {
        // 🏆 好友對戰：恭喜打敗對手
        iconEl.textContent = '👑';
        titleEl.textContent = '恭喜獲勝：成功打敗對手！';
        bodyEl.textContent = `您在第 ${state.turn} 回合率先完成霸業，以威望徹底壓制了對手！`;
        if (diffTxtEl) diffTxtEl.textContent = `最終比分 — 👤 你 ${state.player.score} 分 : 🧑‍💻 對手 ${aiEffectiveScore} 分`;
      } else if (isAiBattle) {
        // 🏆 帝國爭霸：擊敗 AI 的專屬捷報
        iconEl.textContent = '👑';
        titleEl.textContent = '帝國爭霸告捷：AI 俯首稱臣！';
        bodyEl.textContent = `您在第 ${state.turn} 回合率先完成霸業，以威望徹底壓制了 AI 帝國！`;
        if (diffTxtEl) diffTxtEl.textContent = `最終比分 — 👤 玩家 ${state.player.score} 分 : 🤖 AI ${aiEffectiveScore} 分`;
      } else {
        iconEl.textContent = '🏆';
        titleEl.textContent = '傳奇大師，實至名歸！';
        bodyEl.textContent = `恭喜您成功在 28 回合內奪得 ${state.player.score} 分威望！`;
      }
      modalBox.style.borderColor = '#d4af37';
    } else {
      if (isOnline) {
        // ❌ 好友對戰：對手獲勝（搶先達標 / 回合耗盡）
        if (aiEffectiveScore >= 15) {
          iconEl.textContent = '🧑‍💻';
          titleEl.textContent = '敗北：對手獲勝！';
          bodyEl.textContent = `對手在第 ${state.turn} 回合率先突破 15 分威望防線，您以 ${state.player.score} 分飲恨敗陣。再戰一場討回來吧！`;
        } else {
          iconEl.textContent = '⏳';
          titleEl.textContent = '敗北：回合耗盡，霸業未竟！';
          bodyEl.textContent = `28 回合內雙方皆未完成霸業，您未能壓制對手。請重整旗鼓，再次挑戰！`;
        }
        if (diffTxtEl) diffTxtEl.textContent = `最終比分 — 👤 你 ${state.player.score} 分 : 🧑‍💻 對手 ${aiEffectiveScore} 分`;
      } else if (isAiBattle) {
        // ❌ 帝國爭霸：敗因分流（被 AI 搶先 / 回合耗盡）
        if (aiEffectiveScore >= 15) {
          iconEl.textContent = '🤖';
          titleEl.textContent = '敗北：AI 帝國搶先稱霸！';
          bodyEl.textContent = `AI 帝國在第 ${state.turn} 回合率先突破 15 分威望防線，您以 ${state.player.score} 分飲恨敗陣。重整商路，捲土重來吧！`;
        } else {
          iconEl.textContent = '⏳';
          titleEl.textContent = '敗北：回合耗盡，霸業未竟！';
          bodyEl.textContent = `28 回合內雙方皆未完成霸業，您未能壓制 AI 帝國。請重整旗鼓，再次挑戰！`;
        }
        if (diffTxtEl) diffTxtEl.textContent = `最終比分 — 👤 玩家 ${state.player.score} 分 : 🤖 AI ${aiEffectiveScore} 分`;
      } else {
        iconEl.textContent = '⏳';
        titleEl.textContent = '對局結算，未能在挑戰中勝出！';
        bodyEl.textContent = `已超過 28 回合的限制。請重整旗鼓，再次挑戰！`;
      }
      modalBox.style.borderColor = '#e74c3c';
    }
    modal.classList.add('show');
  },

  setupNewGame() {
    const state = CoreState.get();
    state.selectedDiff = [];
    state.selectedSame = null;

    // 🤝 輔助官專屬故事模式：成就模式 / 帝國爭霸開局一律清空
    //（故事模式稍後由關卡設定指派對應輔助官）
    if (state.mode !== 'storyMode') state.settings.selectedAssistant = null;

    state.turn = 1;
    state.currentTurnOwner = 'player';
    state.aiEnabled = false;
    // 🤖 帝國爭霸：依玩家所選對手套用 AI 難度；其他模式重置為 normal
    state.aiDifficulty = (state.mode === 'vsAI' && state.settings.aiOpponent)
      ? state.settings.aiOpponent.difficulty : 'normal';
    state.ast14TakeUsed = false;
    state.bank = { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 };

    state.player = { tokens: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 0 }, bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 }, reserved: [], score: 0, pointCards: 0 };
    state.ai = { tokens: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 0 }, bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 }, reserved: [], score: 0, noblePoints: 0 };

    // 🎯 統一局內追蹤器（單人成就模式）
    SingleMode.resetTracker();

    state.decks.lv1 = JSON.parse(JSON.stringify(RAW_CARDS.lv1));
    state.decks.lv2 = JSON.parse(JSON.stringify(RAW_CARDS.lv2));
    state.decks.lv3 = JSON.parse(JSON.stringify(RAW_CARDS.lv3));

    GameEngine.shuffle(state.decks.lv1);
    GameEngine.shuffle(state.decks.lv2);
    GameEngine.shuffle(state.decks.lv3);

    // 貴族委派
    const fullNoblesPool = JSON.parse(JSON.stringify(ALL_NOBLES_POOL));
    GameEngine.shuffle(fullNoblesPool);
    state.nobles = fullNoblesPool.slice(0, 3);

    // ─── 故事模式關卡特殊設定 ───
    let bannedLevels = [];
    if (state.mode === 'storyMode') {
      const currentLvl = state.storyProgress?.currentLevel || 1;
      const mission = STORY_MISSIONS[currentLvl - 1];

      if (mission?.setup?.initBank) state.bank = { ...mission.setup.initBank };
      if (mission?.setup?.initPlayerScore) state.player.score = mission.setup.initPlayerScore;
      if (mission?.setup?.bannedLevels) bannedLevels = mission.setup.bannedLevels;

      state.storyTracker = {
        reservedBuys: 0, freeBuys: 0, highPointCards: 0, comboTriggered: false,
        redTokensTaken: 0, maxBagEver: 0, exclusiveViolated: false,
        noNoblesForPlayer: !!mission?.setup?.disableNoblesForPlayer
      };

      // 該關為 vsAI 商戰
      if (mission?.setup?.mode === 'vsAI') {
        state.aiEnabled = true;
        state.aiDifficulty = mission.setup.aiDifficulty || 'normal';
        if (mission.setup.initAiScore) state.ai.score = mission.setup.initAiScore;
        // 第 22 關：AI 開局自帶 4 張隨機 Lv2 產業（含分數與產量）
        if (mission.setup.initAiTier2Bonus) {
          for (let i = 0; i < mission.setup.initAiTier2Bonus && state.decks.lv2.length > 0; i++) {
            const c = state.decks.lv2.pop();
            state.ai.bonus[c.provides]++;
            // 分數已含在 initAiScore 中，不再重複加分
          }
        }
      }

      state.settings.selectedAssistant = `ast${currentLvl}`;
    }

    // 發牌（被禁用的等級整排封鎖）
    ['lv1', 'lv2', 'lv3'].forEach(lvl => {
      if (bannedLevels.includes(lvl)) {
        state.decks[lvl] = [];
        state.board[lvl] = [null, null, null, null];
      } else {
        state.board[lvl] = [state.decks[lvl].pop(), state.decks[lvl].pop(), state.decks[lvl].pop(), state.decks[lvl].pop()];
      }
    });

    // ─── 輔助官開局特效 ───
    const ast = state.settings.selectedAssistant;
    if (ast === 'ast8') {
      // 傳奇鐵匠：開局自帶 1 張隨機 Lv1 發展卡減免
      const lucky = GEMS[Math.floor(Math.random() * GEMS.length)];
      state.player.bonus[lucky]++;
    }
    if (ast === 'ast10') {
      // 異域商賈：開局自帶 2 枚黃金
      const grant = Math.min(2, state.bank.o);
      state.bank.o -= grant; state.player.tokens.o += grant;
    }
    if (ast === 'ast20') {
      // 大文豪：開局威望 2 分（與關卡 initPlayerScore 取較大值，避免重複疊加）
      state.player.score = Math.max(state.player.score, 2);
    }

    if (document.getElementById('game-options-modal')) {
      document.getElementById('game-options-modal').classList.remove('show');
    }

    import('./assistantData.js').then(m => m.AssistantManager.renderActiveAssistantUI());
  }
};
