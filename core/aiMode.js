// core/aiMode.js
import { GameEngine } from './gameEngine.js';
import { ActionDispatcher } from './action.js';
import { CoreState } from './state.js';

const GEMS = ['w', 'u', 'g', 'r', 'k'];
const AI_BAG_CAP = 10;

export const AiMode = {
  // 自動化思考核心（依難度分流）
  thinkAndExecute(state) {
    const ai = state.ai;
    const diff = state.aiDifficulty || (state.mode === 'vsAI' ? 'normal' : 'normal');

    // ── 步驟 1：搜集所有買得起的卡片（牌桌 + AI 自己的保留區）──
    const affordableList = [];
    for (let lvl of ['lv3', 'lv2', 'lv1']) {
      const row = state.board[lvl];
      for (let i = 0; i < row.length; i++) {
        const card = row[i];
        if (!card) continue;
        const afford = GameEngine.canAffordCard(ai.bonus, ai.tokens, card.cost, { actor: 'ai', level: lvl });
        if (afford.affordable) affordableList.push({ lvl, i, card, afford });
      }
    }
    // 保留區的卡也能買（lvl 標記 'reserved'）
    (ai.reserved || []).forEach((card, i) => {
      if (!card) return;
      const afford = GameEngine.canAffordCard(ai.bonus, ai.tokens, card.cost, { actor: 'ai', level: card.level || 'lv1' });
      if (afford.affordable) affordableList.push({ lvl: 'reserved', i, card, afford });
    });

    if (affordableList.length > 0) {
      let pick;
      if (diff === 'normal') {
        // 普通：遇到第一張買得起的就直接收購（原始行為）
        pick = affordableList[0];
      } else {
        // 困難以上：優先收購分數最高、等級最高的卡
        affordableList.sort((a, b) =>
          (b.card.points - a.card.points) || (b.lvl.localeCompare(a.lvl)));
        pick = affordableList[0];
      }
      console.log(`🤖 AI(${diff}) 決定購買卡牌: ${pick.card.id}`);
      this.executeAiBuy(pick.lvl, pick.i, pick.card, pick.afford);
      return;
    }

    // ── 步驟 2：買不起 → 拿籌碼 ──
    let targetColors = [];
    if (diff === 'expert' || diff === 'master') {
      // 高階 AI：鎖定場上最高分卡片，優先拿它缺少的顏色
      targetColors = this._pickColorsTowardBestCard(state, ai);
    }
    if (targetColors.length < 3) {
      // 補足：拿目前銀行庫存最多的顏色
      const rest = GEMS
        .filter(k => state.bank[k] > 0 && !targetColors.includes(k))
        .sort((a, b) => state.bank[b] - state.bank[a]);
      for (let k of rest) {
        targetColors.push(k);
        if (targetColors.length === 3) break;
      }
    }

    // 背包上限保護：超過上限就少拿
    let bag = 0; for (let k in ai.tokens) bag += ai.tokens[k];
    while (targetColors.length > 0 && bag + targetColors.length > AI_BAG_CAP) {
      targetColors.pop();
    }

    if (targetColors.length > 0) {
      console.log(`🤖 AI(${diff}) 決定拿取籌碼: ${targetColors}`);
      targetColors.forEach(c => {
        state.bank[c]--;
        state.ai.tokens[c]++;
      });
      // 神級 AI：精算補給，額外獲得 1 顆隨機籌碼
      if (diff === 'master' && bag + targetColors.length < AI_BAG_CAP) {
        const avail = GEMS.filter(c => state.bank[c] > 0);
        if (avail.length > 0) {
          const extra = avail[Math.floor(Math.random() * avail.length)];
          state.bank[extra]--; state.ai.tokens[extra]++;
        }
      }
      // ⚠️ 這裡「不」立即重繪：若先重繪一次、finalizeTurn 又重繪一次，
      // 浮動 +N 標籤會被搬移重掛而重播動畫（閃爍兩次）。統一由 finalize 的重繪呈現一次。
      setTimeout(() => {
        ActionDispatcher.finalizeTurn('ai');
      }, 600);
    } else {
      // 🃏 拿不了籌碼（背包滿 / 銀行空）→ 改為「保留一張卡」，仍然是有效行動
      if (this.executeAiReserve(state)) return;
      // 真的無路可走（買不起、拿不了、保留區也滿）才跳過，防止戰局卡死
      console.log('🤖 AI 本回合無任何合法行動，被迫跳過');
      ActionDispatcher.finalizeTurn('ai');
    }
  },

  // 保留一張最有價值的卡（含黃金獲取）。成功回傳 true
  executeAiReserve(state) {
    const ai = state.ai;
    if ((ai.reserved || []).length >= 3) return false;

    // 挑選：分數最高、等級最高的在場卡
    let best = null;
    for (let lvl of ['lv3', 'lv2', 'lv1']) {
      const row = state.board[lvl];
      for (let i = 0; i < row.length; i++) {
        const card = row[i];
        if (!card) continue;
        if (!best || card.points > best.card.points) best = { lvl, i, card };
      }
    }
    if (!best) return false;

    console.log(`🤖 AI 決定保留卡牌: ${best.card.id}`);
    ai.reserved.push(best.card);
    state.board[best.lvl][best.i] =
      state.decks[best.lvl].length > 0 ? state.decks[best.lvl].pop() : null;

    // 附贈黃金：銀行有金且背包未滿才拿
    let bag = 0; for (let k in ai.tokens) bag += ai.tokens[k];
    if (state.bank.o > 0 && bag < AI_BAG_CAP) {
      state.bank.o--;
      ai.tokens.o++;
    }

    setTimeout(() => { ActionDispatcher.finalizeTurn('ai'); }, 600);
    return true;
  },

  // 找出最想買的高分卡，計算缺口顏色
  _pickColorsTowardBestCard(state, ai) {
    let best = null, bestScore = -1;
    for (let lvl of ['lv3', 'lv2', 'lv1']) {
      for (let card of state.board[lvl]) {
        if (!card) continue;
        // 評分：卡片分數高 + 缺口小的優先
        let gap = 0;
        for (let k of GEMS) {
          const need = Math.max(0, (card.cost[k] || 0) - (ai.bonus[k] || 0) - (ai.tokens[k] || 0));
          gap += need;
        }
        const value = card.points * 3 - gap;
        if (value > bestScore) { bestScore = value; best = card; }
      }
    }
    if (!best) return [];
    const wanted = [];
    for (let k of GEMS) {
      const need = Math.max(0, (best.cost[k] || 0) - (ai.bonus[k] || 0) - (ai.tokens[k] || 0));
      if (need > 0 && state.bank[k] > 0) wanted.push(k);
      if (wanted.length === 3) break;
    }
    return wanted;
  },

  executeAiBuy(level, idx, card, afford) {
    const state = CoreState.get();
    const ai = state.ai;

    // 先定義「實際入帳」流程，等飛行動畫播完才執行（與玩家購買流程完全一致）
    const applyPurchase = () => {
      const s = CoreState.get();
      const a = s.ai;

      // 扣除籌碼
      for (let k in card.cost) {
        const spent = afford.breakdown[k] || 0;
        a.tokens[k] -= spent;
        s.bank[k] += spent;
      }
      if (afford.neededGold > 0) {
        a.tokens.o -= afford.neededGold;
        s.bank.o += afford.neededGold;
      }

      // 更新 AI 永久資產
      a.bonus[card.provides]++;
      a.score += card.points;

      if (level === 'reserved') {
        // 來源是保留區：移除該張保留卡，不補牌
        a.reserved.splice(idx, 1);
      } else {
        // 來源是牌桌：補牌
        s.board[level][idx] = s.decks[level].length > 0 ? s.decks[level].pop() : null;
      }

      ActionDispatcher.finalizeTurn('ai');
    };

    // 🎬 AI 購卡觸發與玩家相同的「卡片飛入金庫」動畫（飛向 AI 金庫的對應寶石格）
    if (typeof window !== 'undefined' && typeof window.animateCardFlightToGoldVault === 'function') {
      window.animateCardFlightToGoldVault(card.id, card.provides, applyPurchase, 'ai-vault-target');
    } else {
      applyPurchase();
    }
  }
};
