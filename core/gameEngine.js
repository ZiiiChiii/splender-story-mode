// core/gameEngine.js
import { CoreState } from './state.js';

export const GameEngine = {
  /**
   * 計算是否買得起卡片。
   * opts.actor  : 'player' | 'ai' — 輔助官減免只對玩家生效（修正 AI 蹭玩家外掛的 bug）
   * opts.level  : 'lv1' | 'lv2' | 'lv3' | 'reserved' — ast19 需要判斷 Lv2
   */
  canAffordCard(playerBonus, playerTokens, cardCost, opts = {}) {
    const actor = opts.actor || 'player';
    let neededGold = 0;
    let breakdown = { w: 0, u: 0, g: 0, r: 0, k: 0 };
    const GEM_TYPES = ['w', 'u', 'g', 'r', 'k'];
    const state = CoreState.get();
    const activeAssistant = (actor === 'player') ? state.settings.selectedAssistant : null;

    // 深拷貝一份卡牌原始成本，防止直接改動底層數據
    let cost = { ...cardCost };

    // 🏛️ 外掛式輔助官成本減免核心過濾器（僅玩家）
    if (activeAssistant === 'ast1') cost.r = Math.max(0, (cost.r || 0) - 1);
    if (activeAssistant === 'ast2') cost.g = Math.max(0, (cost.g || 0) - 1);
    if (activeAssistant === 'ast3') cost.k = Math.max(0, (cost.k || 0) - 1);
    if (activeAssistant === 'ast4') cost.w = Math.max(0, (cost.w || 0) - 1);
    if (activeAssistant === 'ast5') cost.u = Math.max(0, (cost.u || 0) - 1);

    // 大師矩陣傳奇能力：五色成本全面永久少付 1 顆
    if (activeAssistant === 'ast25') {
      GEM_TYPES.forEach(c => { cost[c] = Math.max(0, (cost[c] || 0) - 1); });
    }

    // 大航海家：Lv2 卡片收購成本少付 1 顆（扣在最貴的顏色上）
    if (activeAssistant === 'ast19' && opts.level === 'lv2') {
      this._reduceHighestCost(cost, GEM_TYPES);
    }

    // 聖女貞德：持有威望卡達 3 張以上時，買卡總費用少付 1 寶石
    if (activeAssistant === 'ast15' && (state.player.pointCards || 0) >= 3) {
      this._reduceHighestCost(cost, GEM_TYPES);
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

    // 聖殿騎士團長特技：黃金可以當作 2 顆寶石折抵（僅玩家）
    let goldPower = (activeAssistant === 'ast21') ? (playerTokens.o * 2) : playerTokens.o;

    // ast21 實付黃金 = 向上取整（1 枚黃金抵 2 顆）
    let goldToPay = neededGold;
    if (activeAssistant === 'ast21') goldToPay = Math.ceil(neededGold / 2);

    return {
      affordable: goldPower >= neededGold,
      neededGold: goldToPay,
      breakdown: breakdown
    };
  },

  _reduceHighestCost(cost, gems) {
    let maxColor = null, maxVal = 0;
    for (let c of gems) {
      if ((cost[c] || 0) > maxVal) { maxVal = cost[c]; maxColor = c; }
    }
    if (maxColor) cost[maxColor] = Math.max(0, cost[maxColor] - 1);
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  },

  /** 貴族拜訪檢定。actor 傳入 'player' 或 'ai'，輔助官效果只對玩家生效 */
  checkNoblesVisit(nobles, actorBonus, actor = 'player') {
    let newlyEarnedNobles = [];
    const activeAssistant = (actor === 'player')
      ? CoreState.get().settings.selectedAssistant : null;

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
