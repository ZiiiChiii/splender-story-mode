// core/aiMode.js
import { GameEngine } from './gameEngine.js';
import { ActionDispatcher } from './action.js';
import { CoreState } from './state.js'; // 【修正 2】引入 CoreState 模組

export const AiMode = {
  // 自動化思考核心
  thinkAndExecute(state) {
    const ai = state.ai;

    // 策略 1: 優先遍歷 Level 3 -> Level 1 發展卡，只要買得起就直接截胡收購
    for (let lvl of ['lv3', 'lv2', 'lv1']) {
      const row = state.board[lvl];
      for (let i = 0; i < row.length; i++) {
        const card = row[i];
        if (!card) continue;
        const afford = GameEngine.canAffordCard(ai.bonus, ai.tokens, card.cost);
        if (afford.affordable) {
          console.log(`🤖 AI 決定購買卡牌: ${card.id}`);
          this.executeAiBuy(lvl, i, card, afford);
          return;
        }
      }
    }

    // 策略 2: 如果都買不起，則挑選目前銀行庫存大於 0 的前三種寶石籌碼拿走
    const targetColors = [];
    for (let k of ['w', 'u', 'g', 'r', 'k']) {
      if (state.bank[k] > 0) {
        targetColors.push(k);
        if (targetColors.length === 3) break;
      }
    }

    // 【修正 3】AI 拿籌碼分支需處理空庫存邊界
    if (targetColors.length > 0) {
      console.log(`🤖 AI 決定拿取籌碼: ${targetColors}`);
      targetColors.forEach(c => {
        state.bank[c]--;
        state.ai.tokens[c]++;
      });
      setTimeout(() => {
        ActionDispatcher.finalizeTurn('ai');
      }, 600);
    } else {
      // 銀行完全無普通籌碼可拿，AI 直接跳過防止戰局卡死
      ActionDispatcher.finalizeTurn('ai');
    }
  },

  executeAiBuy(level, idx, card, afford) {
    // 【修正 2】移除不存的方法，改用 CoreState.get()
    const state = CoreState.get();
    const ai = state.ai;

    // 扣除籌碼
    for (let k in card.cost) {
      const spent = afford.breakdown[k] || 0;
      ai.tokens[k] -= spent;
      state.bank[k] += spent;
    }
    if (afford.neededGold > 0) {
      ai.tokens.o -= afford.neededGold;
      state.bank.o += afford.neededGold;
    }

    // 更新 AI 永久資產
    ai.bonus[card.provides]++;
    ai.score += card.points;

    // 補牌
    state.board[level][idx] = state.decks[level].length > 0 ? state.decks[level].pop() : null;

    ActionDispatcher.finalizeTurn('ai');
  }
};