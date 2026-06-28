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
  r: ["https://i.ibb.co/rf43Prw8/1.jpg", "https://i.ibb.co/gFPGMGK7/2.jpg", "https://i.ibb.co/bjgntGqQ/3.jpg", "https://i.ibb.co/NghmMzHM/4.jpg", "https://i.ibb.co/VWhLdVjL/5.jpg"],
  w: ["https://i.ibb.co/DDkcxCww/1.jpg", "https://i.ibb.co/Z6wkT9sw/2.jpg", "https://i.ibb.co/dstw94C5/3.jpg", "https://i.ibb.co/HLcpg8kB/4.jpg", "https://i.ibb.co/p6Y1Tt5M/5.jpg"],
  k: ["https://i.ibb.co/6cKPW5Ff/1.jpg", "https://i.ibb.co/7tRFCqBb/2.jpg", "https://i.ibb.co/gbGqKfnv/3.jpg", "https://i.ibb.co/zHS6cht3/4.jpg", "https://i.ibb.co/SwrD6WdV/5.jpg"]
};

// ==========================================
// 2. 音效與動畫全域追蹤暫存器
// ==========================================
let audioEl, sfxGemEl, sfxBuyEl, sfxReserveEl, sfxSelectEl, sfxUnselectEl, sfxNobleMale, sfxNobleFemale;
let sfxAchievementsMap = {};

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

let lastRenderedCardIds = new Set();
let lastPlayerState = null;

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
  window.StoryMode = storyMod.StoryMode; 
  window.STORY_MISSIONS = levelsMod.STORY_MISSIONS; 
  
  storyMod.StoryMode.loadStoryProgress();
  assistantMod.AssistantManager.renderActiveAssistantUI();
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
// 4. 全域 Render 控制器 (版面模式完全分離)
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
  
  const bannerZone = document.getElementById('dynamic-banner-zone');
  const bannerBadge = document.getElementById('dynamic-banner-badge');
  const bannerText = document.getElementById('dynamic-banner-text');

  if (bannerZone && bannerBadge && bannerText) {
    if (isvsAI) {
      bannerZone.style.display = 'none';
    } else {
      bannerZone.style.display = 'flex';
      
      // ── 🏆 1. 單人模式：安全全域化動畫排隊播放器 ──
      if (isSingleMode) {
        bannerBadge.textContent = "榮譽成就";
        bannerBadge.style.backgroundColor = 'rgba(230, 126, 34, 0.2)';
        bannerBadge.style.borderColor = '#e67e22';
        bannerZone.style.cursor = 'pointer';
        
        // 即時計算總數
       // 如果目前全域沒有在播放特殊成就動畫，就顯示平常的常駐進度
      if (fullState.pendingAchievementsQueue && fullState.pendingAchievementsQueue.length > 0 && !window.isSfxBannerPlaying) {
          window.isSfxBannerPlaying = true;
          // 抽出隊伍中的第一個成就
          const currentAch = fullState.pendingAchievementsQueue.shift();
          let tierText = { easy: "簡單", normal: "中階", hard: "進階", expert: "困難", master: "神人" }[currentAch.tier];
          
          // 渲染畫面
          bannerText.innerHTML = `<span style="color: ${currentAch.color}; font-weight: 800;">${currentAch.symbol} [${tierText}] ${currentAch.title} — ${currentAch.desc}</span>`;
          
          // 經典重繪魔法：重製 CSS 動態外觀
          bannerText.classList.remove('has-ach');
          void bannerText.offsetWidth; 
          bannerText.classList.add('has-ach');
          
          // 播放對應難度的古典音效
          const targetSFX = document.getElementById(`sfx-ach-${currentAch.tier}`);
          if (targetSFX && !window.isSfxMuted) {
            targetSFX.currentTime = 0;
            targetSFX.play().catch(() => {});
          }
          
          // 1.5秒後釋放紅綠燈，並更新 State 讓下一個成就排隊浮現
          setTimeout(() => {
            window.isSfxBannerPlaying = false;
            CoreState.set(fullState);
          }, 1500);          
        } 
        
      } else if (isStoryMode) {
      // ── 📜 2. 故事模式
     
        const currentLvl = fullState.storyProgress?.currentLevel || 1;
        const mission = window.STORY_MISSIONS ? window.STORY_MISSIONS[currentLvl - 1] : null;
        
        bannerZone.style.cursor = 'pointer';
        if (mission) {
          bannerBadge.textContent = `第 ${currentLvl} 關 任務`;
          bannerBadge.style.borderColor = '#d4af37';
          bannerBadge.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
          
          let conditionText = mission.winCondition.targetScore ? `威望達到 ${mission.winCondition.targetScore} 分` : '特定條件';
          if (mission.id === 2) conditionText = "達到15分，且紅寶石限制少於8顆";
          if (mission.id === 3) conditionText = "達到15分，且保留並買下卡片達3次";
          if (mission.id === 4) conditionText = "達到15分，且整局禁止使用黃金籌碼";
          if (mission.id === 5) conditionText = "達到15分，且通關時5色卡片數量皆 >= 2張";
          if (mission.id === 7) conditionText = "達到15分，且任何回合結束時背包籌碼不超過6顆";
          if (mission.id === 8) conditionText = "達到15分，且整局禁止購買任何Lv1發展卡";
          if (mission.id === 9) conditionText = "達到15分，且最終名下只能有黑與白卡";
          if (mission.id === 10) conditionText = "達到15分，且通關時手上持有至少4枚黃金籌碼";
          if (mission.id === 13) conditionText = "最終分數必須「剛好等於 15 分」，超分算輸";
          if (mission.id === 15) conditionText = "達到15分，且至少3次買卡是「完全沒消耗籌碼」";
          if (mission.id === 16) conditionText = "不限分數，率先獲得 3 位貴族拜訪即可通關";
          if (mission.id === 17) conditionText = "通關那一回合，必須同時獲得卡片分與貴族分";
          if (mission.id === 18) conditionText = "擊敗侵略型 AI，且整局玩家獲得的貴族分必須為 0";
          if (mission.id === 19) conditionText = "達20分，移除Lv1卡，且有名下至少3張>=4分的卡";
          if (mission.id === 20) conditionText = "達到15分，且系統每過 5 個回合隨機扣2枚籌碼";
          if (mission.id === 21) conditionText = "達15分，且銀行普通籌碼初始庫存全為 0";
          if (mission.id === 22) conditionText = "擊敗高級AI（開局AI自帶8分與4張隨機Lv2卡）";
          if (mission.id === 23) conditionText = "威望達20分，且通關時5種顏色永久減免皆 >= 3";
          if (mission.id === 25) conditionText = "威望達到 25 分，且成功吸引至少 2 位貴族進駐";

          if (fullState.storyTracker && mission.id === 3) {
            conditionText += ` <span style="color:#2ecc71;">(當前進度: ${fullState.storyTracker.reservedBuys}/3)</span>`;
          } else if (fullState.storyTracker && mission.id === 15) {
            conditionText += ` <span style="color:#2ecc71;">(當前進度: ${fullState.storyTracker.freeBuys}/3)</span>`;
          }
          
          bannerText.innerHTML = `<span style="color:#ffe099; font-weight:800;">⚔️【${mission.name}】</span> 目標：${conditionText} <span style="color:#ffcc00; font-size:0.55rem; margin-left:6px;">[ 🗺️ 點此可自選或重挑關卡 ]</span>`;
        } else {
          bannerText.textContent = "📜 故事戰役檔案加載中...";
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
  if (totalTokens === 10) {
    capTxtEl.classList.add('bag-danger-red');
  } else if (totalTokens > 7) {
    capTxtEl.classList.add('bag-warning-yellow');
  }

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

      // 修改位置（原第 389 行）：將 style 縮放替換為真正寬度比例設定
      return `
        <div class="card ${!lastRenderedCardIds.has(card.id) ? 'animate-deal' : ''}" id="dom-card-${card.id}" data-affordable="${afford.affordable}" style="background-image: url('${imgUrl}'); width: 100%; aspect-ratio: 1 / 1; transform: none;">
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
    resLayerReserved.innerHTML = `<div class="card empty" style="grid-column: span 4; height:100%;">🔒 暫無契約手牌</div>`;
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

      // 修改位置（原第 425 行）：將 style 縮放替換為真正寬度比例設定
      return `
        <div class="card" id="dom-card-${card.id}" style="background-image: url('${imgUrl}'); width: 100%; aspect-ratio: 1 / 1; transform: none;">
          <div class="card-content-wrapper">
            <div class="card-top"><span class="card-pts">${card.points > 0 ? card.points : ''}</span><div class="card-gem-icon ${GEM_CLASSES[card.provides]}"></div></div>
            <div class="card-costs">${resCostHtml}</div>
            <div class="card-actions"><button class="btn-card" ${!isPlayerTurn || !afford.affordable ? 'disabled' : ''} onclick="buyReservedCard(${i})">收購</button></div>
          </div>
        </div>
      `;
    }).join('');
  }

  ['lv1', 'lv2', 'lv3'].forEach(l => fullState.board[l]?.forEach(c => { if(c) lastRenderedCardIds.add(c.id); }));

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

  const earnedNoblesLayer = document.getElementById('earned-nobles-layer');
  if (earnedNoblesLayer) {
    const earned = fullState.nobles.filter(n => n.completed);
    earnedNoblesLayer.innerHTML = earned.length === 0
      ? `<p style="font-size:0.52rem; color:var(--text-muted); padding: 2px 0; text-align:center;">無</p>`
      : earned.map(n => `
          <div class="earned-noble-mini" style="padding:1px 3px;">
            <img src="${n.img}" style="width:14px; height:14px;">
            <span style="font-size:0.52rem;">${n.name}</span>
          </div>
        `).join('');
  }

  const allBankColors = ['w', 'u', 'g', 'r', 'k', 'o'];
  const unifiedBankLayer = document.getElementById('unified-bank-selectors');
  if (unifiedBankLayer) {
    unifiedBankLayer.innerHTML = allBankColors.map(k => {
      const isGold = (k === 'o');
      const alreadySelected = isGold ? false : fullState.selectedDiff?.includes(k) || fullState.selectedSame === k;
      const inBank = fullState.bank[k] > 0;
      
      const clickAttr = isGold ? '' : `onclick="handleBankGemClick('${k}')"`;
      const disabledStyle = (!isGold && !inBank) ? 'style="opacity:0.12; cursor:not-allowed;"' : '';

      return `
        <div class="token-container-cell" style="flex-direction: row; justify-content: space-between; width: 100%; padding: 2px 6px;  border-radius: 4px;">
          <button class="token-btn ${GEM_BTN_CLASSES[k]} ${alreadySelected ? 'selected' : ''}" style="width:22px; height:22px; background-size:16px 16px; margin:0;"
            ${isGold ? 'disabled' : ''} ${disabledStyle} ${clickAttr}>
          </button>
          <span class="token-count-label" style="font-size:0.6rem; color:#ffe099; text-align: right; line-height: 22px;">${isGold ? '金' : '庫'}:${fullState.bank[k]}</span>
        </div>
      `;
    }).join('');
  }

  let selectedCount = 0;
  if (fullState.selectedDiff && fullState.selectedDiff.length > 0) {
    selectedCount = fullState.selectedDiff.length;
  } else if (fullState.selectedSame) {
    selectedCount = 1; 
  }

  const btnDiff = document.getElementById('btn-do-diff');
  const btnSame = document.getElementById('btn-do-same');

  if (selectedCount === 1) {
    btnDiff.disabled = !isPlayerTurn;
    btnSame.disabled = !isPlayerTurn;
  } else if (selectedCount === 2 || selectedCount === 3) {
    btnDiff.disabled = !isPlayerTurn;
    btnSame.disabled = true;
  } else {
    btnDiff.disabled = true;
    btnSame.disabled = true;
  }

  import('./core/assistantData.js').then(m => m.AssistantManager.renderActiveAssistantUI());

  requestAnimationFrame(() => setupIdleCardAnimations());
}

window.handleBankGemClick = function(color) {
  if (CoreState.get().currentTurnOwner !== 'player') return;
  const state = CoreState.get();
  document.getElementById('error-msg').textContent = '';
  if (state.selectedSame && state.selectedSame !== color) { state.selectedSame = null; }
  
  const diffIdx = state.selectedDiff.indexOf(color);
  if (diffIdx > -1) {
    state.selectedDiff.splice(diffIdx, 1);
    if (document.getElementById('sfx-unselect') && !state.settings.isSfxMuted) document.getElementById('sfx-unselect').play();
  } else {
    if (state.selectedDiff.length === 0 && state.selectedSame === color) {
      state.selectedDiff.push(color); state.selectedSame = null;
    } else {
      if (state.selectedDiff.length >= 3) state.selectedDiff.shift();
      state.selectedDiff.push(color);
    }
    if (state.selectedDiff.length === 1) { state.selectedSame = color; } else { state.selectedSame = null; }
    playUniformSfx();
  }
  render();
};

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

window.handleBannerZoneClick = function() {
  if (!CoreState) return;
  playUniformSfx();
  const m = CoreState.get().mode;
  if (m === 'singlePlayer') {
    window.openAchievementHistory();
  } else if (m === 'storyMode') {
    if (window.StoryMode) {
      window.StoryMode.openStoryMapModal();
    }
  }
};

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

window.addEventListener('DOMContentLoaded', async () => {
  setDynamicVh();
  if (typeof window.render === 'function') window.render();
  
  // 2. 檢查是否為第一次進入網頁
  const seen = localStorage.getItem('splendor_tutorial_seen');
  const welcomeModal = document.getElementById('welcome-back-modal');
  
  if (!seen) {
    // ✨ 修改後：首次登入時，在 DOM 加載完畢後「什麼都不做」（不跳歡迎，也不開啟教學）
    // 讓畫面保持在純淨的加載頁面看鑽石旋轉
    if (welcomeModal) {
      welcomeModal.classList.remove('show');
      welcomeModal.style.display = 'none';
    }
  } else {
    // 【第二次以上進入】：不觸發教學，維持原本邏輯顯示歡迎彈窗
    if (welcomeModal) {
      welcomeModal.classList.add('show');
      welcomeModal.style.display = 'flex'; 
    }
  }
});
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
  
  // ✨ 修改這裡：收集遊戲中所有需要快取的圖片網址（包含 5 色卡片首圖、貴族、籌碼、輔助官立繪）
  const imagesToCache = [
    'https://i.ibb.co/ZpJqvt5d/white.png', 'https://i.ibb.co/4nGkn3HP/sapphire.png',
    'https://i.ibb.co/0pVz7WV5/green.png', 'https://i.ibb.co/wZ9gmt1p/red.png',
    'https://i.ibb.co/y72gvDj/black.png', 'https://i.ibb.co/PZ1dZDyH/gold.png',
    'https://i.ibb.co/zHGC8vsm/image.png', 'https://i.ibb.co/QvHvZZWc/image.png',
    'https://i.ibb.co/hzw3Vfm/image.png', 'https://i.ibb.co/nNSjxvvd/image.png',
    'https://i.ibb.co/GQ2Yh0yH/image.png', 'https://i.ibb.co/39L2xNMT/1.png'
  ];

  // 動態非同步 Image 載入器，確保瀏覽器成功將圖片存入使用者快取中
  let loadedCount = 0;
  imagesToCache.forEach(url => {
    const img = new Image();
    img.src = url;
    img.onload = img.onerror = () => {
      loadedCount++;
      if (loadedCount === imagesToCache.length) {
        // 當所有圖片全部快取完畢，文字改變並浮現進入按鈕
        document.getElementById('preloader-status-text').textContent = "資產加載完畢！";
        const enterBtn = document.getElementById('preloader-enter-btn');
        if (enterBtn) {
          enterBtn.style.opacity = '1';
          enterBtn.style.pointerEvents = 'auto';
          enterBtn.style.transform = 'translateY(0)';
        }
      }
    };
  });

window.addEventListener('resize', setDynamicVh);

window.storyModule = {
    gameStages: {
        1: { chapter: "👑 第一章：微光村的石匠（第 1 - 5 關）", title: "第 1 關：初入礦脈", bg: "微光村的後山藏著廢棄的紅岩礦床。老內政官傑洛米提著油燈攔住你，不屑地看著你手中的劣質鑿子，要你證明基本的經商手段。", condition: "25回合內威望達到15分（無AI）", name: "內政官 傑洛米", text: "年輕人，這片紅岩礦不歡迎空有熱血的傻瓜。在 25 回合內拿到 15 分，我就承認你是個合格的學徒。" },
        2: { chapter: "👑 第一章：微光村的石匠（第 1 - 5 關）", title: "第 2 關：稅率與翡翠", bg: "你帶著紅寶石敲開了鎮公所的大門。刻薄的財政卿薇多莉亞正為當季的綠寶石稅收發愁，她決定用高額的稅率刁難你這個外來者。", condition: "達到15分，且紅寶石籌碼拿取/使用少於8顆", name: "財政卿 薇多莉亞", text: "噢？聽說傑洛米看好你？但我的帳本只認實力。這局你的紅寶石籌碼被課了重稅，少用點紅寶石，拿到 15 分給我看！" }
    },
    currentStageId: 1, dialogueStep: 0, isTyping: false, currentTween: null, textObj: { charCount: 0 }, onStoryCompleteCallback: null,
    loadStage(stageId, callback) {
        if (CoreState && CoreState.get().mode !== 'storyMode') {
            if (callback) callback();
            return;
        }
        if (!this.gameStages[stageId]) { if (callback) callback(); return; }
        this.currentStageId = stageId; this.dialogueStep = 0; this.onStoryCompleteCallback = callback;
        
        const layer = document.getElementById("story-layer"); 
        if (layer) layer.classList.add('story-active');
        
        const stageData = this.gameStages[stageId];
        document.getElementById("story-chapter-title").innerText = stageData.chapter + " - " + stageData.title;
        document.getElementById("story-intro-panel").innerText = stageData.bg;
        document.getElementById("story-condition-badge").innerText = "🏆 目標：" + stageData.condition;
        document.getElementById("story-char-img").src = `https://images.placeholders.dev/?width=320&height=520&text=No.${stageId}&bgColor=%232c3e50&textColor=%23ffffff`;
        this.animateCharacterIn();
    },
    animateCharacterIn() { gsap.fromTo("#story-character", { x: -150, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "power2.out" }); this.renderDialogue(); },
    renderDialogue() {
        const stageData = this.gameStages[this.currentStageId]; let targetText = this.dialogueStep === 0 ? stageData.text : "準備挑戰！";
        document.getElementById('story-name-tag').innerText = stageData.name;
        const textElement = document.getElementById('story-dialogue-text'); textElement.innerText = ""; this.isTyping = true; this.textObj.charCount = 0;
        this.currentTween = gsap.to(this.textObj, { charCount: targetText.length, duration: targetText.length * 0.04, ease: "none", onUpdate: () => { textElement.innerText = targetText.substr(0, Math.ceil(this.textObj.charCount)); }, onComplete: () => { this.isTyping = false; } });
    },
    nextDialogue() { if (this.isTyping) { if (this.currentTween) this.currentTween.progress(1); return; } if (this.dialogueStep === 0) { this.dialogueStep = 1; this.renderDialogue(); } else { this.endStory(); } },
    endStory() { 
        const layer = document.getElementById("story-layer");
        if (layer) layer.classList.remove('story-active');
        if (typeof this.onStoryCompleteCallback === "function") {
            this.onStoryCompleteCallback();
        }
    }
};

// 🎵 全域背景音樂開關控制器 (修復 get 報錯安全版)
window.handleMusicToggle = function() {
  const currentCore = window.CoreState || CoreState;
  if (!currentCore) return;
  const state = currentCore.get();
  
  state.settings.isMusicMuted = !state.settings.isMusicMuted;
  
  const audioEl = document.getElementById('bg-music');
  if (audioEl) {
    if (state.settings.isMusicMuted) {
      audioEl.pause();
    } else {
      audioEl.play().catch(() => {});
    }
  }
};

// ── 🎬 皇家成就全自動非同步輪播播放器（頁面載入後常駐運行）──
setInterval(() => {
  if (typeof CoreState === 'undefined' || window.isSfxBannerPlaying) return;
  const fullState = CoreState.get();
  if (!fullState || !fullState.pendingAchievementsQueue || fullState.pendingAchievementsQueue.length === 0) return;
  window.isSfxBannerPlaying = true;
  const bannerText = document.getElementById('dynamic-banner-text');
  if (!bannerText) { window.isSfxBannerPlaying = false; return; }
  const currentAch = fullState.pendingAchievementsQueue.shift();
  let tierText = { easy: "簡單", normal: "中階", hard: "進階", expert: "困難", master: "神人" }[currentAch.tier];
  bannerText.innerHTML = `<span style="color: ${currentAch.color}; font-weight: 800;">${currentAch.symbol} [${tierText}] ${currentAch.title} — ${currentAch.desc}</span>`;
  bannerText.style.transition = 'none';
  bannerText.style.opacity = '1';
  bannerText.style.filter = 'brightness(1.5)';
  void bannerText.offsetWidth;
  setTimeout(() => {
    bannerText.style.transition = 'opacity 2.5s cubic-bezier(0.25, 1, 0.5, 1), filter 0.5s ease';
    bannerText.style.opacity = '0.3';
    bannerText.style.filter = 'brightness(1)';
  }, 200);
  const targetSFX = document.getElementById(`sfx-ach-${currentAch.tier}`);
  if (targetSFX && !window.isSfxMuted) {
    targetSFX.currentTime = 0;
    targetSFX.play().catch(() => {});
  }
  setTimeout(() => {
    window.isSfxBannerPlaying = false;
    if (fullState.pendingAchievementsQueue.length === 0) {
      bannerText.style.transition = 'opacity 0.3s ease';
      bannerText.style.opacity = '1';
    } else {
      CoreState.set(fullState);
    }
  }, 2500);
}, 200);

// 🔊 全域遊戲音效開關控制器
window.handleSfxToggle = function() {
  const currentCore = window.CoreState || CoreState;
  if (!currentCore) return;
  const state = currentCore.get();
  state.settings.isSfxMuted = !state.settings.isSfxMuted;
  if (window.openGameOptionsModal) window.openGameOptionsModal();
};
window.hideWelcomeModal = function() {
  document.getElementById('welcome-back-modal').classList.remove('show');
  const bg = document.getElementById('bg-music');
  if (bg && !CoreState.get().settings.isMusicMuted) {
    bg.play().catch(() => {});
  }
};
function finishTutorialAndPlayMusic() {
 // 1. 標記新手教學已看過，以後再次進網頁就會改成跳出「歡迎回來」
  localStorage.setItem('splendor_tutorial_seen', 'true');
  
  // 2. 隱藏翠席兒的對話框並移除所有外框高亮 (.tutorial-highlight)
  const tutorialWidget = document.getElementById('floating-tutorial-widget');
  if (tutorialWidget) tutorialWidget.style.display = 'none';
  
  const highlighted = document.querySelectorAll('.tutorial-highlight');
  highlighted.forEach(el => el.classList.remove('tutorial-highlight'));

  // 3. 首次播放背景音樂（此時玩家有點擊「結束教學」的行為，瀏覽器絕對會放行音訊）
  const bg = document.getElementById('bg-music');
  if (bg && !CoreState.get().settings.isMusicMuted) {
    bg.play().catch((err) => {
      console.log("音樂播放受阻：", err);
    });
  }
}
// ✨ 全域橋接函式：點擊進入按鈕後淡出載入畫面，並精準啟動新手教學或歡迎彈窗
window.enterGameFromPreloader = function() {
  const preloader = document.getElementById('game-preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    preloader.style.pointerEvents = 'none';
    setTimeout(() => preloader.remove(), 500); // 500ms 淡出後完全從 DOM 拔除釋放記憶體
  }

  // 接續你原有的核心檢查分流
  const seen = localStorage.getItem('splendor_tutorial_seen');
  const welcomeModal = document.getElementById('welcome-back-modal');

  if (!seen) {
    // 【首次進入】：隱藏歡迎回來，直接啟動翠席兒教學（此時有點擊動作，語音及音樂權限全數解鎖）
    if (welcomeModal) {
      welcomeModal.classList.remove('show');
      welcomeModal.style.display = 'none';
    }
    if (typeof window.startFloatingTutorial === 'function') {
      window.startFloatingTutorial();
    }
  } else {
    // 【非首次進入】：正常開啟歡迎回來欄位
    if (welcomeModal) {
      welcomeModal.classList.add('show');
      welcomeModal.style.display = 'flex';
    }
  }
};
