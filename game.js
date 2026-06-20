// game.js
// ==========================================
// 1. 全域 UI 樣式常數定義
// ==========================================
const GEM_TYPES = ['w', 'u', 'g', 'r', 'k']; 
const GEM_CLASSES = { w: 'bg-w', u: 'bg-u', g: 'bg-g', r: 'bg-r', k: 'bg-k', o: 'bg-o' };
const GEM_BTN_CLASSES = { w: 'token-btn-w', u: 'token-btn-u', g: 'token-btn-g', r: 'token-btn-r', k: 'token-btn-k' };

const CUSTOM_CARD_IMAGES = {
  g: ["https://i.ibb.co/KxX2gxBP/1.jpg", "https://i.ibb.co/35Wz9SGp/2.jpg", "https://i.ibb.co/4nRZhdV9/3.jpg", "https://i.ibb.co/VW851t3Q/4.jpg", "https://i.ibb.co/zh2mXJDS/5.jpg"],
  u: ["https://i.ibb.co/cc5LQG4Z/1.jpg", "https://i.ibb.co/JjQb4p1F/2.jpg", "https://i.ibb.co/spKMvZfr/3.jpg", "https://i.ibb.co/R4QS49Zj/4.jpg", "https://i.ibb.co/HLFX94d2/5.jpg"],
  r: ["https://i.ibb.co/rf43Prw8/1.jpg", "https://i.ibb.co/gFPGMGK7/2.jpg", "https://i.ibb.co/bjgntGqQ/3.jpg", "https://i.ibb.co/NghmMzHM/4.jpg", "https://i.ibb.co/VWhLdVjL/5.jpg"],
  w: ["https://i.ibb.co/DDkcxCww/1.jpg", "https://i.ibb.co/Z6wkT9sw/2.jpg", "https://i.ibb.co/dstw94C5/3.jpg", "https://i.ibb.co/HLcpg8kB/4.jpg", "https://i.ibb.co/p6Y1Tt5M/5.jpg"],
  k: ["https://i.ibb.co/6cKPW5Ff/1.jpg", "https://i.ibb.co/7tRFCqBb/2.jpg", "https://i.ibb.co/gbGqKfnv/3.jpg", "https://i.ibb.co/zHS6cht3/4.jpg", "https://i.ibb.co/SwrD6WdV/5.jpg"]
};

const TUTORIAL_STEPS_DATA = [
  { elementId: "guide-actions", title: "🟢 第一步：行動挑選面板", text: "輪到您的回合時，可以選擇拿取 3 個不同顏色或 2 個同色籌碼。" },
  { elementId: "guide-dashboard", title: "🪙 第二步：皇家金庫資產欄", text: "左側為持有的籌碼與卡片減免產量，注意背包籌碼總上限為 10 顆！" },
  { elementId: "guide-matrix", title: "💎 第三步：核心產業卡片矩陣", text: "可在此花費籌碼收購或保留卡片。左上為威望分數，右上是永久寶石產量。" },
  { elementId: "guide-nobles", title: "⚜️ 第四步：貴族覲見區", text: "當發展卡累積達到貴族所需的永久產量時，貴族會前來拜訪並贈予 3 分！" },
  { elementId: "guide-reserved", title: "🔒 第五步：機密保留契約", text: "可保留卡牌入此區並獲得 1 顆黃金。保留上限為 3 張。" }
];

// ==========================================
// 2. 音效與動畫全域追蹤暫存器
// ==========================================
let audioEl, sfxGemEl, sfxBuyEl, sfxReserveEl, sfxSelectEl, sfxUnselectEl, sfxNobleMale, sfxNobleFemale;
let sfxAchievementsMap = {};

let lastRenderedCardIds = new Set();
let lastPlayerState = null;
let currentTutorialStep = 0;

let activeFlyingCardIds = new Set();
let isAnimating = false; 

window._idleTweensMap = window._idleTweensMap || new Map(); 

let CoreState, GameEngine, SingleMode, AiMode, ActionDispatcher;

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
  window.STORY_MISSIONS = levelsMod.STORY_MISSIONS; 
  
  storyMod.StoryMode.loadStoryProgress();
  assistantMod.AssistantManager.renderActiveAssistantUI();
}

window.playUniformSfx = function() {
  if (!CoreState) return; 
  if (sfxSelectEl && !CoreState.get().settings.isSfxMuted) {
    sfxSelectEl.currentTime = 0; sfxSelectEl.play().catch(() => {});
  }
}

window.playActionGemSfx = function() {
  if (!CoreState) return; 
  if (sfxGemEl && !CoreState.get().settings.isSfxMuted) {
    sfxGemEl.currentTime = 0; sfxGemEl.play().catch(() => {});
  }
}

window.playNobleSfx = function(gender) {
  if (!CoreState) return; 
  if (CoreState.get().settings.isSfxMuted) return;
  if (gender === 'female' && sfxNobleFemale) {
    sfxNobleFemale.currentTime = 0; sfxNobleFemale.play().catch(() => {});
  } else if (gender === 'male' && sfxNobleMale) {
    sfxNobleMale.currentTime = 0; sfxNobleMale.play().catch(() => {});
  }
}

window.playAchievementSfx = function(tier) {
  if (!CoreState) return; 
  const targetSFX = sfxAchievementsMap[tier] || sfxAchievementsMap['easy'];
  if (targetSFX && !CoreState.get().settings.isSfxMuted) {
    targetSFX.currentTime = 0; targetSFX.play().catch(() => {});
  }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function setDynamicVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// ==========================================
// 3. GSAP 3D 拋物線飛行與金庫 Bounce 動畫
// ==========================================
function animateCardFlightToGoldVault(cardId, providesColor, callback) {
  const sourceDom = document.getElementById(`dom-card-${cardId}`);
  const vaultDom = document.getElementById(`vault-target-${providesColor}`);
  const fxContainer = document.getElementById('effects-layer');

  if (!sourceDom) { if (callback) callback(); return; }

  isAnimating = true; 
  activeFlyingCardIds.add(cardId);

  const flyingCardDomId = `dom-card-${cardId}`;
  if (window._idleTweensMap && window._idleTweensMap.has(flyingCardDomId)) {
    window._idleTweensMap.get(flyingCardDomId).kill();
    window._idleTweensMap.delete(flyingCardDomId);
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
  flyCard.style.margin = '0';
  flyCard.style.zIndex = '10000';
  flyCard.style.pointerEvents = 'none';

  gsap.set(flyCard, { transformOrigin: "center center", transformStyle: "preserve-3d", perspective: 800 }); 
  fxContainer.appendChild(flyCard);

  sourceDom.style.opacity = '0.15';

  const deltaX = (end.left + end.width / 2) - (start.left + start.width / 2);
  const deltaY = (end.top + end.height / 2) - (start.top + start.height / 2);

  const tl = gsap.timeline();

  tl.to(flyCard, {
    duration: 0.15,
    scale: 1.12,
    ease: "power2.out"
  })
  .to(flyCard, {
    duration: 0.65,
    x: deltaX,
    y: deltaY - 90, 
    rotationY: 180, 
    rotationX: 15,
    scale: 0.15,
    ease: "power2.inOut"
  })
  .to(flyCard, {
    duration: 0.15,
    scale: 0,
    opacity: 0,
    ease: "power1.in",
    onComplete: () => {
      flyCard.remove();
      sourceDom.style.opacity = '';
      activeFlyingCardIds.delete(cardId); 

      if (vaultDom) { 
        gsap.fromTo(vaultDom,
          { scale: 1 },
          { scale: 1.35, duration: 0.12, yoyo: true, repeat: 1, ease: "back.out(2)",
            onComplete: () => { gsap.set(vaultDom, { scale: 1 }); }
          }
        );
      }

      if (callback) callback();
      isAnimating = false; 
    }
  });
}

function renderDashboardGems(targetElementId, actorData, diffs) {
  const container = document.getElementById(targetElementId);
  if (!container) return;

  const survivingDiffs = {};
  container.querySelectorAll('.floating-diff').forEach(span => {
    const block = span.closest('.res-block');
    if (block && block.id) {
      const color = block.id.replace('vault-target-', '');
      survivingDiffs[color] = survivingDiffs[color] || [];
      span.remove(); 
      survivingDiffs[color].push(span); 
    }
  });

  let html = '';
  ['w', 'u', 'g', 'r', 'k', 'o'].forEach(k => {
    const tokenVal = actorData.tokens[k] || 0;
    const bonusVal = actorData.bonus[k] || 0;
    const isGold = (k === 'o');
    
    let bDiffHtml = (diffs && !isGold && diffs.bonus[k] > 0)
      ? `<span class="floating-permanent-anim">+${diffs.bonus[k]} 🛡️</span>` : '';

    html += `
      <div class="res-block" id="vault-target-${k}">
        ${bDiffHtml}
        <div class="res-circle ${GEM_CLASSES[k]}"></div>
        <div class="res-text-group">
          <span class="res-count">${tokenVal}</span>
          ${!isGold
            ? (bonusVal > 0
                ? `<span class="res-bonus">+${bonusVal}</span>`
                : `<span class="res-bonus" style="visibility:hidden;">+0</span>`)
            : `<span class="res-bonus" style="color:#968a7f; font-size:0.55rem;">百搭</span>`}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  for (const [color, spans] of Object.entries(survivingDiffs)) {
    const blockEl = document.getElementById(`vault-target-${color}`);
    if (blockEl) spans.forEach(s => blockEl.appendChild(s));
  }

  if (diffs) {
    ['w', 'u', 'g', 'r', 'k', 'o'].forEach(k => {
      const diff = diffs.tokens[k];
      if (!diff || diff === 0) return;

      const blockEl = document.getElementById(`vault-target-${k}`);
      if (!blockEl) return;

      const diffSpan = document.createElement('span');
      diffSpan.className = `floating-diff ${diff > 0 ? 'plus' : 'minus'}`;
      diffSpan.textContent = diff > 0 ? `+${diff}` : `${diff}`;
      blockEl.appendChild(diffSpan);

      blockEl.classList.add('animate-pulse-glow');
      setTimeout(() => blockEl.classList.remove('animate-pulse-glow'), 700);
      setTimeout(() => { if (diffSpan.parentNode) diffSpan.remove(); }, 1300);
    });
  }
}

// ==========================================
// 4. 全域 Render 控制器
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
  document.getElementById('player-dashboard-title').style.display = isvsAI ? 'block' : 'none';
  
  // ─── 【全新三模式成就欄狀態變更核心】 ───
  const bannerZone = document.getElementById('dynamic-banner-zone');
  const bannerBadge = document.getElementById('dynamic-banner-badge');
  const bannerText = document.getElementById('dynamic-banner-text');

  if (bannerZone && bannerBadge && bannerText) {
    if (isvsAI) {
      // 狀態 2: 電腦對戰模式下，完全隱藏成就欄位
      bannerZone.style.display = 'none';
    } else {
      bannerZone.style.display = 'flex';
      
      if (isSingleMode) {
        // 狀態 1: 單人成就大師模式下，維持原樣顯示最新成就進度，並提供手勢指引
        bannerBadge.textContent = "榮譽成就";
        bannerBadge.style.backgroundColor = 'rgba(230, 126, 34, 0.2)';
        bannerBadge.style.borderColor = '#e67e22';
        bannerZone.style.cursor = 'pointer';
        
        // 讀取本地最新解鎖成就
        const archive = localStorage.getItem('splendor_achievements_v1');
        let unlCount = 0;
        if (archive) { try { unlCount = Object.keys(JSON.parse(archive)).length; } catch(e){} }
        bannerText.innerHTML = `🏆 當前已斬獲 <span style="color:#ffcc00; font-weight:800;">${unlCount} / 30</span> 項皇家勳章！<span style="color:var(--text-muted); font-size:0.55rem; margin-left:6px;">[ 💡 點此可開啟榮譽堂查看完整清單 ]</span>`;
        
      } else if (isStoryMode) {
        // 狀態 3: 故事模式下，改成當前關卡名稱與特殊勝利條件追蹤
        const currentLvl = fullState.storyProgress?.currentLevel || 1;
        const mission = window.STORY_MISSIONS ? window.STORY_MISSIONS[currentLvl - 1] : null;
        
        bannerZone.style.cursor = 'pointer';
        if (mission) {
          bannerBadge.textContent = `第 ${currentLvl} 關 任務`;
          bannerBadge.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
          bannerBadge.style.borderColor = '#d4af37';
          
          let conditionText = mission.dialogue || '';
          // 實時追蹤故事動態計數
          if (fullState.storyTracker && mission.winCondition.type === 'score_and_reserve_buy') {
            conditionText += ` <span style="color:#2ecc71;">(契約收購進度: ${fullState.storyTracker.reservedBuys}/${mission.winCondition.minReservedBuys})</span>`;
          } else if (fullState.storyTracker && mission.winCondition.type === 'score_and_free_buys') {
            conditionText += ` <span style="color:#2ecc71;">(免籌碼收購進度: ${fullState.storyTracker.freeBuys}/${mission.winCondition.minFreeBuysRequired})</span>`;
          } else if (fullState.storyTracker && mission.winCondition.type === 'high_score_and_tier3_count') {
            const highCards = fullState.storyTracker.highPointCards || 0;
            conditionText += ` <span style="color:#2ecc71;">(高階物業進度: ${highCards}/${mission.winCondition.requiredTier3CardsWithPoints4})</span>`;
          }
          
          bannerText.innerHTML = `<span style="color:#ffe099; font-weight:800;">⚔️【${mission.name}】</span> ${conditionText} <span style="color:#ffcc00; font-size:0.55rem; margin-left:6px;">[ 🗺️ 點此可自由切換戰役關卡 ]</span>`;
        } else {
          bannerText.textContent = "📜 皇家故事戰役檔案加載中...";
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
  if (isvsAI) {
    document.getElementById('ai-score-txt').textContent = fullState.ai.score;
    renderDashboardGems('ai-res-layer', fullState.ai, null);
  }

  const isAst6Active = (fullState.settings.selectedAssistant === 'ast6');
  const currentBagCap = isAst6Active ? 12 : 10;
  const capTxtEl = document.getElementById('cap-txt');
  capTxtEl.textContent = `背包: ${totalTokens} / ${currentBagCap}`;
  capTxtEl.classList.remove('bag-warning-yellow', 'bag-danger-red');
  if (totalTokens === currentBagCap) capTxtEl.classList.add('bag-danger-red');
  else if (totalTokens > (currentBagCap - 3)) capTxtEl.classList.add('bag-warning-yellow');

  ['lv1', 'lv2', 'lv3'].forEach(level => {
    document.getElementById(`deck-${level}-txt`).textContent = `剩餘: ${fullState.decks[level].length}`;
    
    document.getElementById(`row-${level}`).innerHTML = fullState.board[level].map((card, idx) => {
      if (!card) return `<div class="card empty">已全數售罄</div>`;
      
      let costHtml = '';
      for (let k in card.cost) {
        costHtml += `
          <div class="cost-dot ${(player.bonus[k] || 0) >= card.cost[k] ? 'free' : ''}">
            <span class="cost-dot-circle ${GEM_CLASSES[k]}"></span><span>${card.cost[k]}</span>
          </div>`;
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
                <button class="btn-card" ${!isPlayerTurn || player.reserved.length >= (fullState.settings.selectedAssistant === 'ast7' ? 4 : 3) ? 'disabled' : ''} onclick="reserveBoardCard('${level}', ${idx})">保留</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });

  const resLayerReserved = document.getElementById('reserved-layer');
  if (player.reserved.length === 0) {
    resLayerReserved.innerHTML = `<div class="card empty" style="grid-column: span 4;">🔒 當前保密保留區尚無契約手牌 (上限 3 張)</div>`;
  } else {
    resLayerReserved.innerHTML = [0, 1, 2, 3].map(i => {
      const card = player.reserved[i];
      if (!card) return i < (fullState.settings.selectedAssistant === 'ast7' ? 4 : 3) ? `<div class="card empty">空位</div>` : '';
      const afford = GameEngine.canAffordCard(player.bonus, player.tokens, card.cost);
      let imgUrl = CUSTOM_CARD_IMAGES[card.provides][parseInt(card.id) % CUSTOM_CARD_IMAGES[card.provides].length];
      
      let resCostHtml = '';
      for (let k in card.cost) {
        resCostHtml += `
          <div class="cost-dot ${(player.bonus[k] || 0) >= card.cost[k] ? 'free' : ''}">
            <span class="cost-dot-circle ${GEM_CLASSES[k]}"></span><span>${card.cost[k]}</span>
          </div>`;
      }

      return `
        <div class="card" id="dom-card-${card.id}" style="background-image: url('${imgUrl}');">
          <div class="card-content-wrapper">
            <div class="card-top"><span class="card-pts">${card.points > 0 ? card.points : ''}</span><div class="card-gem-icon ${GEM_CLASSES[card.provides]}"></div></div>
            <div class="card-costs">${resCostHtml}</div>
            <div class="card-actions"><button class="btn-card" ${!isPlayerTurn || !afford.affordable ? 'disabled' : ''} onclick="buyReservedCard(${i})">簽署收購</button></div>
          </div>
        </div>
      `;
    }).join('');
  }

  ['lv1', 'lv2', 'lv3'].forEach(l => fullState.board[l]?.forEach(c => { if(c) lastRenderedCardIds.add(c.id); }));

  // ── 渲染貴族區 ──
  const noblesLayer = document.getElementById('nobles-layer');
  if (noblesLayer) {
    noblesLayer.innerHTML = fullState.nobles
      .filter(n => !n.completed)
      .map(n => {
        let reqHtml = '';
        for (let k in n.req) {
          reqHtml += `<div class="cost-dot"><span class="cost-dot-circle ${GEM_CLASSES[k]}"></span><span>${n.req[k]}</span></div>`;
        }
        return `
          <div class="noble-card">
            <img src="${n.img}" alt="${n.name}" class="noble-img">
            <div class="noble-overlay">
              <div class="card-top">
                <span class="noble-pts">${n.points}</span>
                <span class="noble-name">${n.name}</span>
              </div>
              <div class="noble-reqs">${reqHtml}</div>
            </div>
          </div>
        `;
      }).join('');
  }

  // ── 渲染已拜訪貴族區 ──
  const earnedNoblesLayer = document.getElementById('earned-nobles-layer');
  if (earnedNoblesLayer) {
    const earned = fullState.nobles.filter(n => n.completed);
    earnedNoblesLayer.innerHTML = earned.length === 0
      ? `<p style="font-size:0.55rem; color:var(--text-muted); padding: 4px 0;">尚無貴族拜訪</p>`
      : earned.map(n => `
          <div class="earned-noble-mini">
            <img src="${n.img}" alt="${n.name}">
            <span>${n.name}</span>
          </div>
        `).join('');
  }

  // ── 渲染銀行寶石 Token 選取區 ──
  const gemColors = ['w', 'u', 'g', 'r', 'k'];
  const diffLayer = document.getElementById('diff-selectors'); 
  const sameLayer = document.getElementById('same-selectors'); 

  if (diffLayer) {
    diffLayer.innerHTML = gemColors.map(k => {
      const inBank = fullState.bank[k] > 0;
      const alreadySelected = fullState.selectedDiff?.includes(k);
      return `
        <div class="token-container-cell">
          <button class="token-btn ${GEM_BTN_CLASSES[k]} ${alreadySelected ? 'selected' : ''}"
            ${!inBank || !isPlayerTurn ? 'disabled style="opacity:0.08;"' : ''}
            onclick="toggleSelectDiff('${k}')">
          </button>
          <span class="token-count-label">庫存:${fullState.bank[k]}</span>
        </div>
      `;
    }).join('');
  }

  if (sameLayer) {
    sameLayer.innerHTML = gemColors.map(k => {
      const needBankCount = (fullState.settings.selectedAssistant === 'ast9') ? 1 : 2;
      const canTake2 = fullState.bank[k] >= needBankCount;
      const alreadySelected = fullState.selectedSame === k;
      return `
        <div class="token-container-cell">
          <button class="token-btn ${GEM_BTN_CLASSES[k]} ${alreadySelected ? 'selected' : ''}"
            ${!canTake2 || !isPlayerTurn ? 'disabled style="opacity:0.08;"' : ''}
            onclick="toggleSelectSame('${k}')">
          </button>
          <span class="token-count-label">庫存:${fullState.bank[k]}</span>
        </div>
      `;
    }).join('');
  }

  const btnDiff = document.getElementById('btn-do-diff');
  const btnSame = document.getElementById('btn-do-same');
  if (btnDiff) btnDiff.disabled = !isPlayerTurn || fullState.selectedDiff.length === 0;
  if (btnSame) btnSame.disabled = !isPlayerTurn || !fullState.selectedSame;

  requestAnimationFrame(() => setupIdleCardAnimations());
}

function setupIdleCardAnimations() {
  const currentCardIds = new Set();
  
  document.querySelectorAll('.board-matrix .card[data-affordable="true"]').forEach((el, i) => {
    const cardId = el.id || '';
    if (!cardId) return;
    
    const pureId = cardId.replace('dom-card-', '');
    if (activeFlyingCardIds.has(pureId)) return; 
    
    currentCardIds.add(cardId);
    
    if (window._idleTweensMap.has(cardId)) {
      const existingTween = window._idleTweensMap.get(cardId);
      if (existingTween && !existingTween.killed) {
        return; 
      }
      window._idleTweensMap.delete(cardId); 
    }
    
    gsap.killTweensOf(el);
    gsap.set(el, { y: 0, rotation: 0 });
    
    const tween = gsap.to(el, {
      y: -6,
      rotation: 0.8,
      duration: 1.6 + (i % 4) * 0.18,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: (i % 4) * 0.3
    });
    window._idleTweensMap.set(cardId, tween);
  });

  for (const [id, tween] of window._idleTweensMap.entries()) {
    if (!currentCardIds.has(id)) {
      tween.kill();
      window._idleTweensMap.delete(id);
      
      const el = document.getElementById(id);
      if (el) gsap.set(el, { y: 0, rotation: 0 });
    }
  }
}

// ─── 【全新重塑：多功能橫幅點擊分發代理】 ───
window.handleBannerZoneClick = function() {
  if (!CoreState) return;
  playUniformSfx();
  const m = CoreState.get().mode;
  if (m === 'singlePlayer') {
    // 狀態 1 點擊：點入後顯示榮譽堂與所有成就
    window.openAchievementHistory();
  } else if (m === 'storyMode') {
    // 狀態 3 點擊：點入後直接顯示關卡選擇地圖，可隨意切換已解鎖關卡
    import('./core/storyMode.js').then(mod => {
      mod.StoryMode.openStoryMapModal();
    });
  }
};

// ==========================================
// 5. 其餘事件分發代理
// ==========================================
window.toggleSelectDiff = function(color) {
  if(CoreState.get().currentTurnOwner !== 'player') return;
  document.getElementById('error-msg').textContent = '';
  const state = CoreState.get();
  state.selectedSame = null;
  
  const idx = state.selectedDiff.indexOf(color);
  if (idx > -1) {
    state.selectedDiff.splice(idx, 1);
    const sfxUnselectEl = document.getElementById('sfx-unselect');
    if (sfxUnselectEl && !state.settings.isSfxMuted) sfxUnselectEl.play();
  } else {
    if (state.selectedDiff.length >= 3) state.selectedDiff.shift();
    state.selectedDiff.push(color);
    playUniformSfx();
  }
  render();
};

window.toggleSelectSame = function(color) {
  if(CoreState.get().currentTurnOwner !== 'player') return;
  document.getElementById('error-msg').textContent = '';
  const state = CoreState.get();
  state.selectedDiff = [];
  
  if (state.selectedSame === color) {
    state.selectedSame = null;
    const sfxUnselectEl = document.getElementById('sfx-unselect');
    if (sfxUnselectEl && !state.settings.isSfxMuted) sfxUnselectEl.play();
  } else {
    state.selectedSame = color;
    playUniformSfx();
  }
  render();
};

window.handleMusicToggle = () => ActionDispatcher.dispatch('TOGGLE_MUSIC');
window.handleSfxToggle = () => ActionDispatcher.dispatch('TOGGLE_SFX');
window.handleDoDiffClick = function() {
  const state = CoreState.get();
  if (state.selectedDiff.length === 0) return;
  playActionGemSfx();
  const colors = [...state.selectedDiff];
  state.selectedDiff = [];      
  state.selectedSame = null;
  ActionDispatcher.dispatch('TAKE_DIFF', { colors });
};

window.handleDoSameClick = function() {
  const state = CoreState.get();
  if (!state.selectedSame) return;
  playActionGemSfx();
  const color = state.selectedSame;
  state.selectedSame = null;    
  state.selectedDiff = [];
  ActionDispatcher.dispatch('TAKE_SAME', { color });
};

window.buyBoardCard = function(level, idx) {
  const card = CoreState.get().board[level][idx];
  if (!card) return;

  const cardId = String(card.id);
  if (activeFlyingCardIds.has(cardId)) return;

  animateCardFlightToGoldVault(cardId, card.provides, () => {
    if (sfxBuyEl && !CoreState.get().settings.isSfxMuted) {
      sfxBuyEl.currentTime = 0; sfxBuyEl.play().catch(() => {});
    }
    ActionDispatcher.dispatch('BUY_BOARD', { level, idx });
  });
};

window.buyReservedCard = function(idx) {
  const card = CoreState.get().player.reserved[idx];
  if (!card) return;

  const cardId = String(card.id);
  if (activeFlyingCardIds.has(cardId)) return;

  animateCardFlightToGoldVault(cardId, card.provides, () => {
    if (sfxBuyEl && !CoreState.get().settings.isSfxMuted) {
      sfxBuyEl.currentTime = 0; sfxBuyEl.play().catch(() => {});
    }
    ActionDispatcher.dispatch('BUY_RESERVED', { idx });
  });
};

window.reserveBoardCard = function(level, idx) {
  if (sfxReserveEl && !CoreState.get().settings.isSfxMuted) {
    sfxReserveEl.currentTime = 0; sfxReserveEl.play().catch(() => {});
  }
  ActionDispatcher.dispatch('RESERVE_CARD', { level, idx });
};

window.openGameOptionsModal = () => {
  const s = CoreState.get().settings;
  const m = CoreState.get().mode;
  document.getElementById('menu-toggle-music').textContent = s.isMusicMuted ? "🔇 背景音樂：靜音" : "🎵 背景音樂：開啟";
  document.getElementById('menu-toggle-sfx').textContent = s.isSfxMuted ? "🔇 遊戲音效：靜音" : "🔊 遊戲音效：開啟";
  
  document.getElementById('mode-btn-single').classList.toggle('active', m === 'singlePlayer');
  document.getElementById('mode-btn-ai').classList.toggle('active', m === 'vsAI');
  document.getElementById('mode-btn-story').classList.toggle('active', m === 'storyMode');
  
  document.getElementById('game-options-modal').classList.add('show');
};

window.closeGameOptionsModal = () => document.getElementById('game-options-modal').classList.remove('show');
window.closeWinModal = () => { document.getElementById('win-modal').classList.remove('show'); };
window.restartGame = () => { document.getElementById('win-modal').classList.remove('show'); ActionDispatcher.dispatch('INIT_GAME'); };

window.openTalentPoolModal = () => { 
  import('./core/assistantData.js').then(m => {
    m.AssistantManager.renderTalentPoolModalUI(); 
    document.getElementById('talent-pool-modal').classList.add('show'); 
  });
};

window.closeTalentPoolModal = () => { 
  document.getElementById('talent-pool-modal').classList.remove('show'); 
  import('./core/assistantData.js').then(m => m.AssistantManager.renderActiveAssistantUI()); 
};

window.openAchievementHistory = () => SingleMode.openAchievementHistory();
window.closeAchievementHistory = () => SingleMode.closeAchievementHistory();
window.saveCurrentProgress = () => SingleMode.saveCurrentProgress();
window.startFloatingTutorial = () => { document.getElementById('tutorial-start-modal').classList.remove('show'); hideWelcomeModal(); document.getElementById('floating-tutorial-widget').style.display = 'block'; showStepData(0); };
window.hideWelcomeModal = () => { document.getElementById('welcome-back-modal').style.display = 'none'; if (!CoreState.get().settings.isMusicMuted && audioEl) audioEl.play().catch(() => {}); };

function showStepData(stepIdx) {
  currentTutorialStep = stepIdx;
  TUTORIAL_STEPS_DATA.forEach((s, i) => document.getElementById(s.elementId)?.classList.toggle('tutorial-highlight', i === stepIdx));
  const step = TUTORIAL_STEPS_DATA[stepIdx];
  if (step) {
    document.getElementById(step.elementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('floating-tutorial-widget-header').textContent = step.title;
    document.getElementById('floating-tutorial-text').textContent = step.text;
  }
  document.getElementById('floating-tutorial-dots').innerHTML = TUTORIAL_STEPS_DATA.map((_, i) => `<div class="t-dot ${i === stepIdx ? 'active' : ''}\"></div>`).join('');
  document.getElementById('floating-tutorial-next-btn').textContent = stepIdx === TUTORIAL_STEPS_DATA.length - 1 ? "進入大會堂" : "下一步";
}

window.nextFloatingStep = () => {
  if (currentTutorialStep < TUTORIAL_STEPS_DATA.length - 1) showStepData(currentTutorialStep + 1);
  else {
    TUTORIAL_STEPS_DATA.forEach(s => document.getElementById(s.elementId)?.classList.remove('tutorial-highlight'));
    document.getElementById('floating-tutorial-widget').style.display = 'none';
    localStorage.setItem('splendor_tutorial_completed_2026', 'true');
  }
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

  sfxAchievementsMap = {
    easy: document.getElementById('sfx-ach-easy'),
    normal: document.getElementById('sfx-ach-normal'),
    hard: document.getElementById('sfx-ach-hard'),
    expert: document.getElementById('sfx-ach-expert'),
    master: document.getElementById('sfx-ach-master')
  };

  await loadCoreModules();
  SingleMode.loadTalentPool();
  ActionDispatcher.dispatch('INIT_GAME');
  if (!localStorage.getItem('splendor_tutorial_completed_2026')) {
    document.getElementById('tutorial-start-modal').classList.add('show');
  } else {
    document.getElementById('welcome-back-modal').classList.add('show');
  }
});

window.addEventListener('resize', setDynamicVh);
