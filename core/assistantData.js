// core/assistantData.js
import { CoreState } from './state.js';

export const ASSISTANTS_DATABASE = {
  "ast1": { id: "ast1", name: "內政官 傑洛米", desc: "【烈焰援助】: 購買卡片時，紅色 (r) 成本少付 1 顆。", img: "https://i.ibb.co/zHGC8vsm/image.png" },
  "ast2": { id: "ast2", name: "財政卿 薇多莉亞", desc: "【翡翠退稅】: 購買卡片時，綠色 (g) 成本少付 1 顆。", img: "https://i.ibb.co/GQ2Yh0yH/image.png" },
  "ast3": { id: "ast3", name: "鐵血騎士 赫克特", desc: "【黑曜重甲】: 購買卡片時，黑色 (k) 成本少付 1 顆。", img: "https://i.ibb.co/zHGC8vsm/image.png" },
  "ast4": { id: "ast4", name: "聖騎士 羅蘭德", desc: "【聖光護佑】: 購買卡片時，白色 (w) 成本少付 1 顆。", img: "https://i.ibb.co/QvHvZZWc/image.png" },
  "ast5": { id: "ast5", name: "璀璨王后 桂妮薇兒", desc: "【深海恩賜】: 購買卡片時，藍色 (u) 成本少付 1 顆。", img: "https://i.ibb.co/GQ2Yh0yH/image.png" },
  "ast6": { id: "ast6", name: "帝國雄獅 亞瑟", desc: "【皇家巨囊】: 背包籌碼總上限提升至 12 顆。", img: "https://i.ibb.co/hzw3Vfm/image.png" },
  "ast7": { id: "ast7", name: "密盟密使 查理曼", desc: "【機密擴充】: 保密保留區的手牌上限提升至 4 張。", img: "https://i.ibb.co/nNSjxvvd/image.png" },
  "ast8": { id: "ast8", name: "傳奇鐵匠 瓦肯", desc: "【初始熔煉】: 開局自帶 1 張隨機的 Lv1 發展卡減免。", img: "https://i.ibb.co/zHGC8vsm/image.png" },
  "ast9": { id: "ast9", name: "大提琴家 塞巴斯蒂安", desc: "【雙色交響】: 只要銀行同色籌碼剩 1 顆即可執行拿同色2顆行動。", img: "https://i.ibb.co/QvHvZZWc/image.png" },
  "ast10": { id: "ast10", name: "異域商賈 阿里", desc: "【絲路奇蹟】: 遊戲開局時直接自帶 2 枚黃金籌碼。", img: "https://i.ibb.co/hzw3Vfm/image.png" },
  "ast11": { id: "ast11", name: "皇家占星師 露娜", desc: "【星啟合約】: 保留卡牌時，有 50% 機率外隨機多獲得 1 籌碼。", img: "https://i.ibb.co/nNSjxvvd/image.png" },
  "ast12": { id: "ast12", name: "鍊金術師 帕拉塞爾斯", desc: "【點石成金】: 執行拿3不同色籌碼行動時，其中1顆可自動替換成黃金。", img: "https://i.ibb.co/zHGC8vsm/image.png" },
  "ast13": { id: "ast13", name: "地下領主 索林", desc: "【真金回饋】: 成功收購 Lv3 卡片時，皇家金庫免費贈予 1 枚黃金。", img: "https://i.ibb.co/QvHvZZWc/image.png" },
  "ast14": { id: "ast14", name: "精靈遊俠 萊戈拉斯", desc: "【迅捷斥候】: 第一回合可以連續執行兩次「拿籌碼」行動。", img: "https://i.ibb.co/GQ2Yh0yH/image.png" },
  "ast15": { id: "ast15", name: "聖女 貞德", desc: "【信仰減免】: 持有威望卡達 3 張以上時，買卡總費用少付 1 寶石。", img: "https://i.ibb.co/nNSjxvvd/image.png" },
  "ast16": { id: "ast16", name: "帝國外交官 麥特尼", desc: "【外交捷徑】: 所有貴族前來拜訪所需的產量要求全部自動 -1。", img: "https://i.ibb.co/zHGC8vsm/image.png" },
  "ast17": { id: "ast17", name: "宮廷伯爵夫人 卡蜜拉", desc: "【晚宴加冕】: 每當有貴族前來拜訪時，贈予威望增加為 4 分。", img: "https://i.ibb.co/GQ2Yh0yH/image.png" },
  "ast18": { id: "ast18", name: "影刃刺客 澤德", desc: "【情報截胡】: 對局結束時，電腦 AI 的貴族拜訪分數全部無效化。", img: "https://i.ibb.co/QvHvZZWc/image.png" },
  "ast19": { id: "ast19", name: "大航海家 麥哲倫", desc: "【海外特許】: 卡牌矩陣中所有 Lv2 卡片收購成本隨機少付 1 顆。", img: "https://i.ibb.co/hzw3Vfm/image.png" },
  "ast20": { id: "ast20", name: "大文豪 莎士比亞", desc: "【傳奇商譽】: 開局時玩家直接獲得 2 分威望（起始分數為 2）。", img: "https://i.ibb.co/nNSjxvvd/image.png" },
  "ast21": { id: "ast21", name: "聖殿騎士團長 休", desc: "【聖殿金庫】: 買卡折抵時，你的 1 枚黃金可以當作 2 顆寶石使用。", img: "https://i.ibb.co/zHGC8vsm/image.png" },
  "ast22": { id: "ast22", name: "預言者 卡珊德拉", desc: "【命運翻牌】: 補牌系統會一次刷新兩張供玩家二選一。", img: "https://i.ibb.co/hzw3Vfm/image.png" },
  "ast23": { id: "ast23", name: "大魔導師 梅林", desc: "【元素裂變】: 收購帶威望分的卡牌時，右上角永久減免產量變2倍。", img: "https://i.ibb.co/nNSjxvvd/image.png" },
  "ast24": { id: "ast24", name: "帝國女皇 凱薩琳", desc: "【女皇鐵腕】: 購買 Lv3 卡片時隨機扣除電腦 AI 庫存 2 枚籌碼。", img: "https://i.ibb.co/GQ2Yh0yH/image.png" },
  "ast25": { id: "ast25", name: "璀璨至尊 大師", desc: "【大師矩陣】: 集結眾神加持，所有卡片五色收購成本全面永久 -1！", img: "https://i.ibb.co/zHGC8vsm/image.png" }
};

export const AssistantManager = {
  renderTalentPoolModalUI() {
    const container = document.getElementById('talent-pool-modal-layer');
    if (!container) return;

    const state = CoreState.get();
    const unlockedIds = state.storyProgress.unlockedAssistantIds || ['ast1'];
    const currentSelected = state.settings.selectedAssistant;

    container.innerHTML = Object.values(ASSISTANTS_DATABASE).map(ast => {
      const isUnlocked = unlockedIds.includes(ast.id);
      const isSelected = currentSelected === ast.id ? 'selected' : '';
      const disabledAttr = isUnlocked ? '' : 'disabled style="opacity: 0.2; pointer-events: none;"';

      return `
        <div class="talent-mini-card ${isSelected}" ${disabledAttr} onclick="window.selectAssistant('${ast.id}')" title="${ast.desc}">
          <img src="${ast.img}" alt="${ast.name}">
          <div style="display:flex; flex-direction:column; text-align:left;">
            <span style="font-size:0.65rem;">${ast.name}</span>
            <span style="font-size:0.5rem; color:var(--text-muted); line-height:1.2;">${isUnlocked ? ast.desc : '🔒 故事關卡未解鎖'}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderActiveAssistantUI() {
    const layer = document.getElementById('assistant-display-layer');
    if (!layer) return;

    const currentSelected = CoreState.get().settings.selectedAssistant;
    const ast = ASSISTANTS_DATABASE[currentSelected];

    if (ast) {
      layer.innerHTML = `
        <div class="earned-noble-mini" title="${ast.desc}">
          <img src="${ast.img}">
          <span style="font-size:0.55rem; font-weight:700;">${ast.name} (隨行)</span>
        </div>
      `;
    } else {
      layer.innerHTML = `<p style="font-size:0.55rem; color:var(--text-muted); padding:4px 0;">孤軍奮戰中</p>`;
    }
  }
};

window.selectAssistant = function(id) {
  CoreState.get().settings.selectedAssistant = id;
  AssistantManager.renderTalentPoolModalUI();
};