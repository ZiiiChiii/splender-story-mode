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

    // ── 步驟 1：搜集所有買得起的卡片 ──
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
      // 🎬 立即重繪：AI 金庫即刻浮出 +N 動畫（與玩家拿取籌碼時相同）
      if (typeof window !== 'undefined' && window.render) window.render();
      setTimeout(() => {
        ActionDispatcher.finalizeTurn('ai');
      }, 600);
    } else {
      // 銀行完全無普通籌碼可拿，AI 直接跳過防止戰局卡死
      ActionDispatcher.finalizeTurn('ai');
    }
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

      // 補牌
      s.board[level][idx] = s.decks[level].length > 0 ? s.decks[level].pop() : null;

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
