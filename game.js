// game.js
// ==========================================
// 1. 全域 UI 樣式常數定義
// ==========================================
const GEM_TYPES = ['w', 'u', 'g', 'r', 'k']; 
const GEM_CLASSES = { w: 'bg-w', u: 'bg-u', g: 'bg-g', r: 'bg-r', k: 'bg-k', o: 'bg-o' };
const GEM_BTN_CLASSES = { w: 'token-btn-w', u: 'token-btn-u', g: 'token-btn-g', r: 'token-btn-r', k: 'token-btn-k', o: 'token-btn-o' };

const CUSTOM_CARD_IMAGES = {
  g: ["https://i.ibb.co/KxX2gxBP/1.jpg", "https://i.ibb.co/35Wz9SGp/2.jpg", "https://i.ibb.co/4nRZhdV9/3.jpg", "https://i.ibb.co/VW851t3Q/4.jpg", "https://i.ibb.co/zh2mXJDS/5.jpg"],
  u: ["https://i.ibb.co/cc5LQG4Z/1.jpg", "https://i.ibb.co/JjQb4p1F/2.jpg", "https://i.ibb.co/spKMvZfr/3.jpg", "https://i.ibb.co/R4QS49Zj/4.jpg", "https://i.ibb.co/HLFX94d2/5.jpg"],
  r: ["https://i.ibb.co/rf43Prw8/1.jpg", "https://i.ibb.co/gFPGMG7/2.jpg", "https://i.ibb.co/bjgntGqQ/3.jpg", "https://i.ibb.co/NghmMzHM/4.jpg", "https://i.ibb.co/VWhLdVjL/5.jpg"],
  w: ["https://i.ibb.co/DDkcxCww/1.jpg", "https://i.ibb.co/Z6wkT9sw/2.jpg", "https://i.ibb.co/dstw94C5/3.jpg", "https://i.ibb.co/HLcpg8kB/4.jpg", "https://i.ibb.co/p6Y1Tt5M/5.jpg"],
  k: ["https://i.ibb.co/6cKPW5Ff/1.jpg", "https://i.ibb.co/7tRFCqBb/2.jpg", "https://i.ibb.co/gbGqKfnv/3.jpg", "https://i.ibb.co/zHS6cht3/4.jpg", "https://i.ibb.co/SwrD6WdV/5.jpg"]
};

const TUTORIAL_STEPS_DATA = [
  { elementId: "guide-actions", title: "🟢 第一步：行動挑選面板", text: "輪到您的回合時，可以點擊選擇拿取不同顏色或同色籌碼。" },
  { elementId: "guide-dashboard", title: "🪙 第二步：皇家金庫資產欄", text: "下方為持有的籌碼與卡片減免產量，注意背包籌碼總上限為 10 顆！" },
  { elementId: "guide-matrix", title: "💎 第三步：核心產業卡片矩陣", text: "可在此花費籌碼收購或保留卡片。左上為威望分數，右上是永久寶石產量。" },
  { elementId: "guide-nobles", title: "⚜️ 第四步：貴族覲見區", text: "當發展卡累積達到貴族所需的永久產量時，貴族會前來拜訪並贈予 3 分！" },
  { elementId: "guide-reserved", title: "🔒 第五步：機密保留契約", text: "可保留卡牌入此區並獲得 1 顆黃金。保留上限為 3 張。" }
];

let audioEl, sfxGemEl, sfxBuyEl, sfxReserveEl, sfxSelectEl, sfxUnselectEl, sfxNobleMale, sfxNobleFemale;
let sfxAchievementsMap = {};
let lastRenderedCardIds = new Set();
let lastPlayerState = null;
let currentTutorialStep = 0;
let activeFlyingCardIds = new Set();
let isAnimating = false; 

window._idleTweensMap = window._idleTweensMap || new Map(); 
let CoreState, GameEngine, SingleMode, AiMode, ActionDispatcher;

// 模組動態載入
async function loadCoreModules() {
  const stateMod = await import('./core/state.js');
  const engineMod = await import('./core/gameEngine.js');
  const singleMod = await import('./core/singleMode.js');
  const aiMod = await import('./core/aiMode.js');
  const actionMod = await import('./core/action.js');
  const storyMod = await import('./core/storyMode.js');
  const assistantMod = await import('./core/assistantData.js');
  const levelsMod = await import('./core/missions/levelsData.js'); 

  CoreState = stateMod.CoreState;
  GameEngine = engineMod.GameEngine;
  SingleMode = singleMod.SingleMode;
  AiMode = aiMod.AiMode;
  ActionDispatcher = actionMod.ActionDispatcher;

  window.ActionDispatcher = ActionDispatcher;
  window.SingleMode = SingleMode;
  window.StoryMode = storyMod.StoryMode; 
  window.STORY_MISSIONS = levelsMod.STORY_MISSIONS; 
  
  storyMod.StoryMode.loadStoryProgress();
  assistantMod.AssistantManager.renderActiveAssistantUI();
}

// 音效模組對接
window.playUniformSfx = function() {
  if (!CoreState) return; 
  if (sfxSelectEl && !CoreState.get().settings.isSfxMuted) { sfxSelectEl.currentTime = 0; sfxSelectEl.play().catch(() => {}); }
};
window.playActionGemSfx = function() {
  if (!CoreState) return; 
  if (sfxGemEl && !CoreState.get().settings.isSfxMuted) { sfxGemEl.currentTime = 0; sfxGemEl.play().catch(() => {}); }
};
window.playNobleSfx = function(gender) {
  if (!CoreState || CoreState.get().settings.isSfxMuted) return;
  if (gender === 'female' && sfxNobleFemale) { sfxNobleFemale.currentTime = 0; sfxNobleFemale.play().catch(() => {}); }
  else if (gender === 'male' && sfxNobleMale) { sfxNobleMale.currentTime = 0; sfxNobleMale.play().catch(() => {}); }
};
window.playAchievementSfx = function(tier) {
  if (!CoreState) return; 
  const targetSFX = sfxAchievementsMap[tier] || sfxAchievementsMap['easy'];
  if (targetSFX && !CoreState.get().settings.isSfxMuted) { targetSFX.currentTime = 0; targetSFX.play().catch(() => {}); }
};

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function setDynamicVh() { document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`); }

// 3D 飛行拋物線動畫
function animateCardFlightToGoldVault(cardId, providesColor, callback) {
  const sourceDom = document.getElementById(`dom-card-${cardId}`);
  const vaultDom = document.getElementById(`vault-target-${providesColor}`);
  const fxContainer = document.getElementById('effects-layer');

  if (!sourceDom) { if (callback) callback(); return; }
  isAnimating = true; 
  activeFlyingCardIds.add(cardId);

  if (window._idleTweensMap.has(`dom-card-${cardId}`)) {
    window._idleTweensMap.get(`dom-card-${cardId}`).kill();
    window._idleTweensMap.delete(`dom-card-${cardId}`);
  }

  const start = sourceDom.getBoundingClientRect();
  const finalTarget = vaultDom || document.getElementById('guide-dashboard') || document.body;
  const end = finalTarget.getBoundingClientRect();

  const flyCard = sourceDom.cloneNode(true);
  flyCard.removeAttribute('id');
  flyCard.style.position = 'fixed';
  flyCard.style.left = start.left + 'px';
  flyCard.style.top = start.top + 'px';
  flyCard.style.width = start.width + 'px';
  flyCard.style.height = start.height + 'px';
  flyCard.style.zIndex = '10000';
  flyCard.style.pointerEvents = 'none';

  gsap.set(flyCard, { transformOrigin: "center center", transformStyle: "preserve-3d", perspective: 800 }); 
  fxContainer.appendChild(flyCard);
  sourceDom.style.opacity = '0.15';

  const deltaX = (end.left + end.width / 2) - (start.left + start.width / 2);
  const deltaY = (end.top + end.height / 2) - (start.top + start.height / 2);

  const tl = gsap.timeline();
  tl.to(flyCard, { duration: 0.15, scale: 1.12, ease: "power2.out" })
    .to(flyCard, { duration: 0.65, x: deltaX, y: deltaY - 90, rotationY: 180, rotationX: 15, scale: 0.15, ease: "power2.inOut" })
    .to(flyCard, { duration: 0.15, scale: 0, opacity: 0, ease: "power1.in", onComplete: () => {
      flyCard.remove();
      sourceDom.style.opacity = '';
      activeFlyingCardIds.delete(cardId); 
      if (vaultDom) { gsap.fromTo(vaultDom, { scale: 1 }, { scale: 1.35, duration: 0.12, yoyo: true, repeat: 1, ease: "back.out(2)" }); }
      if (callback) callback();
      isAnimating = false; 
    }});
}

// 渲染金庫面板
function renderDashboardGems(targetElementId, actorData, diffs) {
  const container = document.getElementById(targetElementId);
  if (!container) return;

  let html = '';
  ['w', 'u', 'g', 'r', 'k', 'o'].forEach(k => {
    const tokenVal = actorData.tokens[k] || 0;
    const bonusVal = actorData.bonus[k] || 0;
    const isGold = (k === 'o');
    let bDiffHtml = (diffs && !isGold && diffs.bonus[k] > 0) ? `<span class="floating-permanent-anim">+${diffs.bonus[k]} 🛡️</span>` : '';

    html += `
      <div class="res-block" id="vault-target-${k}">
        ${bDiffHtml}
        <div class="res-circle ${GEM_CLASSES[k]}"></div>
        <div class="res-text-group">
          <span class="res-count">${tokenVal}</span>
          ${!isGold ? (bonusVal > 0 ? `<span class="res-bonus">+${bonusVal}</span>` : `<span class="res-bonus" style="visibility:hidden;">+0</span>`) : `<span class="res-bonus" style="color:#968a7f; font-size:0.55rem;">百搭</span>`}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  if (diffs) {
    ['w', 'u', 'g', 'r', 'k', 'o'].forEach(k => {
      const diff = diffs.tokens[k];
      if (!diff) return;
      const blockEl = document.getElementById(`vault-target-${k}`);
      if (!blockEl) return;
      const diffSpan = document.createElement('span');
      diffSpan.className = `floating-diff ${diff > 0 ? 'plus' : 'minus'}`;
      diffSpan.textContent = diff > 0 ? `+${diff}` : `${diff}`;
      blockEl.appendChild(diffSpan);
      blockEl.classList.add('animate-pulse-glow');
      setTimeout(() => blockEl.classList.remove('animate-pulse-glow'), 700);
    });
  }
}

// ==========================================
// 4. 全域新版 整合高解析渲染控制器
// ==========================================
window.render = function() {
  if (!CoreState) return;
  const fullState = CoreState.get();
  const player = fullState.player;

  document.getElementById('turn-txt').textContent = fullState.turn;
  document.getElementById('score-txt').textContent = player.score;

  const isSingleMode = fullState.mode === 'singlePlayer';
  const isvsAI = fullState.mode === 'vsAI';
  const isStoryMode = fullState.mode === 'storyMode';
  const isPlayerTurn = fullState.currentTurnOwner === 'player';

  document.getElementById('ai-dashboard-box').style.display = isvsAI ? 'block' : 'none';
  
  // 橫幅異步對接
  const bannerZone = document.getElementById('dynamic-banner-zone');
  const bannerBadge = document.getElementById('dynamic-banner-badge');
  const bannerText = document.getElementById('dynamic-banner-text');

  if (bannerZone && bannerBadge && bannerText) {
    if (isvsAI) { bannerZone.style.display = 'none'; } 
    else {
      bannerZone.style.display = 'flex';
      if (isSingleMode) {
        bannerBadge.textContent = "榮譽成就";
        const archive = localStorage.getItem('splendor_achievements_v1');
        let unlCount = 0; if (archive) { try { unlCount = Object.keys(JSON.parse(archive)).length; } catch(e){} }
        bannerText.innerHTML = `🏆 當前已斬獲 <span style="color:#ffcc00; font-weight:800;">${unlCount} / 30</span> 項皇家勳章！`;
      } else if (isStoryMode) {
        const currentLvl = fullState.storyProgress?.currentLevel || 1;
        const mission = window.STORY_MISSIONS ? window.STORY_MISSIONS[currentLvl - 1] : null;
        if (mission) {
          bannerBadge.textContent = `第 ${currentLvl} 關`;
          bannerText.innerHTML = `<span style="color:#ffe099; font-weight:800;">⚔️【${mission.name}】</span> 目標：${mission.winCondition.targetScore ? '威望達' + mission.winCondition.targetScore : '特殊條件'}`;
        }
      }
    }
  }

  let totalTokens = 0;
  for (let k in player.tokens) totalTokens += player.tokens[k];
  let diffs = { tokens: {}, bonus: {} };
  if (lastPlayerState) {
    for (let k in player.tokens) diffs.tokens[k] = player.tokens[k] - lastPlayerState.tokens[k];
    for (let k in player.bonus) diffs.bonus[k] = player.bonus[k] - lastPlayerState.bonus[k];
  }
  lastPlayerState = deepClone(player);

  renderDashboardGems('res-layer', player, diffs);
  if (isvsAI) { renderDashboardGems('ai-res-layer', fullState.ai, null); }

  const currentBagCap = (fullState.settings.selectedAssistant === 'ast6') ? 12 : 10;
  document.getElementById('cap-txt').textContent = `背包: ${totalTokens} / ${currentBagCap}`;

  // ── 產業矩陣大卡牌渲染渲染 (01 版型) ──
  ['lv1', 'lv2', 'lv3'].forEach(level => {
    document.getElementById(`deck-${level}-txt`).textContent = `剩餘: ${fullState.decks[level].length}`;
    document.getElementById(`row-${level}`).innerHTML = fullState.board[level].map((card, idx) => {
      if (!card) return `<div class="card empty">已全數售罄</div>`;
      let costHtml = '';
      for (let k in card.cost) {
        costHtml += `<div class="cost-dot ${(player.bonus[k] || 0) >= card.cost[k] ? 'free' : ''}"><span class="cost-dot-circle ${GEM_CLASSES[k]}"></span><span>${card.cost[k]}</span></div>`;
      }
      const afford = GameEngine.canAffordCard(player.bonus, player.tokens, card.cost);
      let imgUrl = CUSTOM_CARD_IMAGES[card.provides][parseInt(card.id) % CUSTOM_CARD_IMAGES[card.provides].length];

      return `
        <div class="card ${!lastRenderedCardIds.has(card.id) ? 'animate-deal' : ''}" id="dom-card-${card.id}" data-affordable="${afford.affordable}" style="background-image: url('${imgUrl}');">
          <div class="card-content-wrapper">
            <div class="card-top"><span class="card-pts">${card.points > 0 ? card.points : ''}</span><div class="card-gem-icon ${GEM_CLASSES[card.provides]}"></div></div>
            <div>
              <div class="card-costs">${costHtml}</div>
              <div class="card-actions">
                <button class="btn-card" ${!isPlayerTurn || !afford.affordable ? 'disabled' : ''} onclick="buyBoardCard('${level}', ${idx})">收購</button>
                <button class="btn-card" ${!isPlayerTurn || player.reserved.length >= 3 ? 'disabled' : ''} onclick="reserveBoardCard('${level}', ${idx})">保留</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });

  // 保留完整契約區渲染
  const resLayerReserved = document.getElementById('reserved-layer');
  if (player.reserved.length === 0) {
    resLayerReserved.innerHTML = `<div class="card empty" style="grid-column: span 4; height:100%;">🔒 暫無契約手牌</div>`;
  } else {
    resLayerReserved.innerHTML = [0, 1, 2].map(i => {
      const card = player.reserved[i];
      if (!card) return `<div class="card empty">空位</div>`;
      const afford = GameEngine.canAffordCard(player.bonus, player.tokens, card.cost);
      let imgUrl = CUSTOM_CARD_IMAGES[card.provides][parseInt(card.id) % CUSTOM_CARD_IMAGES[card.provides].length];
      let resCostHtml = '';
      for (let k in card.cost) { resCostHtml += `<div class="cost-dot"><span class="cost-dot-circle ${GEM_CLASSES[k]}"></span><span>${card.cost[k]}</span></div>`; }

      return `
        <div class="card" id="dom-card-${card.id}" style="background-image: url('${imgUrl}');">
          <div class="card-content-wrapper">
            <div class="card-top"><span class="card-pts">${card.points > 0 ? card.points : ''}</span><div class="card-gem-icon ${GEM_CLASSES[card.provides]}"></div></div>
            <div class="card-costs">${resCostHtml}</div>
            <div class="card-actions"><button class="btn-card" ${!isPlayerTurn || !afford.affordable ? 'disabled' : ''} onclick="buyReservedCard(${i})">收購</button></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 貴族與直排鑄幣挑選連動邏輯 (相容 02 版點擊切換)
  const unifiedBankLayer = document.getElementById('unified-bank-selectors');
  if (unifiedBankLayer) {
    unifiedBankLayer.innerHTML = ['w', 'u', 'g', 'r', 'k', 'o'].map(k => {
      const isGold = (k === 'o');
      const alreadySelected = isGold ? false : fullState.selectedDiff?.includes(k) || fullState.selectedSame === k;
      return `
        <div class="token-container-cell">
          <button class="token-btn ${GEM_BTN_CLASSES[k]} ${alreadySelected ? 'selected' : ''}" ${isGold ? 'disabled' : ''} onclick="handleBankGemClick('${k}')"></button>
          <span class="token-count-label">${isGold ? '黃金' : '庫': ' + fullState.bank[k]}</span>
        </div>
      `;
    }).join('');
  }

  // 決策按鈕狀態
  let selectedCount = fullState.selectedDiff?.length || (fullState.selectedSame ? 1 : 0);
  document.getElementById('btn-do-diff').disabled = !isPlayerTurn || selectedCount === 0;
  document.getElementById('btn-do-same').disabled = !isPlayerTurn || !fullState.selectedSame;

  ['lv1', 'lv2', 'lv3'].forEach(l => fullState.board[l]?.forEach(c => { if(c) lastRenderedCardIds.add(c.id); }));
  requestAnimationFrame(() => setupIdleCardAnimations());
};

window.handleBankGemClick = function(color) {
  if (CoreState.get().currentTurnOwner !== 'player') return;
  const state = CoreState.get();
  if (state.selectedSame && state.selectedSame !== color) { state.selectedSame = null; }
  const diffIdx = state.selectedDiff.indexOf(color);
  if (diffIdx > -1) {
    state.selectedDiff.splice(diffIdx, 1);
  } else {
    if (state.selectedDiff.length === 0 && state.selectedSame === color) { state.selectedDiff.push(color); state.selectedSame = null; } 
    else {
      if (state.selectedDiff.length >= 3) state.selectedDiff.shift();
      state.selectedDiff.push(color);
    }
    state.selectedSame = state.selectedDiff.length === 1 ? color : null;
    playUniformSfx();
  }
  render();
};

function setupIdleCardAnimations() {
  document.querySelectorAll('.board-matrix .card[data-affordable="true"]').forEach((el, i) => {
    const cardId = el.id || ''; if (!cardId) return;
    if (window._idleTweensMap.has(cardId)) return;
    const tween = gsap.to(el, { y: -6, rotation: 0.8, duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
    window._idleTweensMap.set(cardId, tween);
  });
}

// 其餘互動方法對接
window.handleDoDiffClick = function() { const colors = [...CoreState.get().selectedDiff]; CoreState.get().selectedDiff = []; ActionDispatcher.dispatch('TAKE_DIFF', { colors }); };
window.handleDoSameClick = function() { const color = CoreState.get().selectedSame; CoreState.get().selectedSame = null; ActionDispatcher.dispatch('TAKE_SAME', { color }); };
window.buyBoardCard = function(level, idx) { const card = CoreState.get().board[level][idx]; animateCardFlightToGoldVault(card.id, card.provides, () => { ActionDispatcher.dispatch('BUY_BOARD', { level, idx }); }); };
window.buyReservedCard = function(idx) { const card = CoreState.get().player.reserved[idx]; animateCardFlightToGoldVault(card.id, card.provides, () => { ActionDispatcher.dispatch('BUY_RESERVED', { idx }); }); };
window.reserveBoardCard = function(level, idx) { ActionDispatcher.dispatch('RESERVE_CARD', { level, idx }); };

window.storyModule = {
    gameStages: {
        1: { chapter: "👑 第一章：微光村的石匠", title: "第 1 關：初入礦脈", bg: "微光村的後山藏著廢棄的紅岩礦床。", condition: "25回合內威望達到15分", name: "內政官 傑洛米", text: "在 25 回合內拿到 15 分，我就承認你是個合格的學徒。" }
    },
    currentStageId: 1, dialogueStep: 0, isTyping: false, currentTween: null, textObj: { charCount: 0 },
    loadStage(stageId, callback) {
        if (CoreState && CoreState.get().mode !== 'storyMode') { if (callback) callback(); return; }
        const layer = document.getElementById("story-layer"); if (layer) layer.classList.add('story-active');
        this.renderDialogue();
    },
    renderDialogue() { /* 保持劇情動態打字效果與GSAP連動 */ },
    nextDialogue() { this.endStory(); },
    endStory() { document.getElementById("story-layer").classList.remove('story-active'); if (this.onStoryCompleteCallback) this.onStoryCompleteCallback(); }
};

window.addEventListener('DOMContentLoaded', async () => {
  setDynamicVh();
  audioEl = document.getElementById('bg-music');
  sfxGemEl = document.getElementById('sfx-gem');
  sfxBuyEl = document.getElementById('sfx-buy');
  sfxReserveEl = document.getElementById('sfx-reserve');
  sfxSelectEl = document.getElementById('sfx-select');
  sfxUnselectEl = document.getElementById('sfx-unselect');
  sfxNobleMale = document.getElementById('sfx-noble-male');
  sfxNobleFemale = document.getElementById('sfx-noble-female');
  await loadCoreModules();
  ActionDispatcher.dispatch('INIT_GAME');
});
