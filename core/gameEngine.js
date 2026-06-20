// core/gameEngine.js
import { CoreState } from './state.js';

export const GameEngine = {
  canAffordCard(playerBonus, playerTokens, cardCost) {
    let neededGold = 0;
    let breakdown = { w: 0, u: 0, g: 0, r: 0, k: 0 };
    const GEM_TYPES = ['w', 'u', 'g', 'r', 'k'];
    const activeAssistant = CoreState.get().settings.selectedAssistant;

    // 深拷貝一份卡牌原始成本，防止直接改動底層數據
    let cost = { ...cardCost };

    // 🏛️ 外掛式輔助官成本減免核心過濾器
    if (activeAssistant === 'ast1') cost.r = Math.max(0, (cost.r || 0) - 1);
    if (activeAssistant === 'ast2') cost.g = Math.max(0, (cost.g || 0) - 1);
    if (activeAssistant === 'ast3') cost.k = Math.max(0, (cost.k || 0) - 1);
    if (activeAssistant === 'ast4') cost.w = Math.max(0, (cost.w || 0) - 1);
    if (activeAssistant === 'ast5') cost.u = Math.max(0, (cost.u || 0) - 1);
    
    // 大師矩陣傳奇能力：五色成本全面永久少付 1 顆
    if (activeAssistant === 'ast25') {
      GEM_TYPES.forEach(c => { cost[c] = Math.max(0, (cost[c] || 0) - 1); });
    }

    for (let k of GEM_TYPES) {
      const reqAmount = cost[k] || 0;
      const bonus = playerBonus[k] || 0;
      const net = Math.max(0, reqAmount - bonus);
      const token = playerTokens[k] || 0;

      if (token < net) {
        neededGold += (net - token);
        breakdown[k] = token; 
      } else {
        breakdown[k] = net; 
      }
    }

    // 聖殿騎士團長特技：黃金可以當作 2 顆寶石折抵
    let goldPower = (activeAssistant === 'ast21') ? (playerTokens.o * 2) : playerTokens.o;

    return {
      affordable: goldPower >= neededGold,
      neededGold: neededGold,
      breakdown: breakdown
    };
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  },

  checkNoblesVisit(nobles, actorBonus) {
    let newlyEarnedNobles = [];
    const activeAssistant = CoreState.get().settings.selectedAssistant;
    
    nobles.forEach(n => {
      if (n.completed) return;
      let satisfy = true;
      for (let k in n.req) {
        // 帝國外交官能力：貴族產量要求全部自動 -1
        let finalReq = (activeAssistant === 'ast16') ? Math.max(1, n.req[k] - 1) : n.req[k];
        if ((actorBonus[k] || 0) < finalReq) { satisfy = false; break; }
      }
      if (satisfy) {
        // 宮廷伯爵夫人：貴族拜訪威望分提升至 4 分
        if (activeAssistant === 'ast17') n.points = 4;
        newlyEarnedNobles.push(n);
      }
    });
    return newlyEarnedNobles;
  }
};