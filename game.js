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

  window.CoreState = CoreState;
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
// 各寶石顏色的特效色票（拖尾、爆裂、光暈共用）
const GEM_FX_COLORS = { w:'#ffffff', u:'#4aa3ff', g:'#2ecc71', r:'#ff5f52', k:'#c9bde0', o:'#f1c40f' };

// ✦ 拖尾光點
function spawnTrailSparkle(fxContainer, x, y, color) {
  const s = document.createElement('div');
  s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:8px;height:8px;margin:-4px 0 0 -4px;` +
    `border-radius:50%;pointer-events:none;z-index:9999;` +
    `background:radial-gradient(circle, #fff 0%, ${color} 45%, transparent 75%);`;
  fxContainer.appendChild(s);
  gsap.to(s, {
    x: (Math.random() - 0.5) * 36,
    y: (Math.random() - 0.5) * 36 + 14,
    scale: 0.2, opacity: 0,
    duration: 0.5 + Math.random() * 0.3,
    ease: 'power1.out',
    onComplete: () => s.remove()
  });
}

// 💥 命中金庫：色彩爆裂 + 擴散光環
function spawnImpactBurst(fxContainer, x, y, color) {
  // 擴散光環
  const ring = document.createElement('div');
  ring.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:14px;height:14px;margin:-7px 0 0 -7px;` +
    `border-radius:50%;pointer-events:none;z-index:9999;border:3px solid ${color};` +
    `box-shadow:0 0 14px ${color};`;
  fxContainer.appendChild(ring);
  gsap.to(ring, { scale: 4.2, opacity: 0, duration: 0.55, ease: 'power2.out', onComplete: () => ring.remove() });

  // 放射粒子
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    const size = 5 + Math.random() * 6;
    p.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
      `margin:${-size/2}px 0 0 ${-size/2}px;border-radius:50%;pointer-events:none;z-index:9999;` +
      `background:radial-gradient(circle, #fff 0%, ${color} 55%, transparent 80%);`;
    fxContainer.appendChild(p);
    const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
    const dist = 34 + Math.random() * 42;
    gsap.to(p, {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist - 8,
      scale: 0.15, opacity: 0,
      duration: 0.5 + Math.random() * 0.35,
      ease: 'power2.out',
      onComplete: () => p.remove()
    });
  }
}

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

  const fxColor = GEM_FX_COLORS[providesColor] || '#f1c40f';
  const start = sourceDom.getBoundingClientRect();
  const finalTarget = vaultDom || document.getElementById('guide-dashboard') || document.body;
  const end = finalTarget.getBoundingClientRect();

  // ✨ 精準命中：以「起點中心 → 金庫對應寶石格中心」計算，貝茲曲線終點就是寶石格正中央
  const startC = { x: start.left + start.width / 2, y: start.top + start.height / 2 };
  const endC   = { x: end.left + end.width / 2,     y: end.top + end.height / 2 };

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
  flyCard.style.boxShadow = `0 0 22px ${fxColor}, 0 0 55px ${fxColor}55`;
  flyCard.style.borderRadius = '10px';

  gsap.set(flyCard, { transformOrigin: "center center", transformStyle: "preserve-3d", perspective: 800 });
  fxContainer.appendChild(flyCard);

  sourceDom.style.opacity = '0.15';

  // 拋物線控制點：飛行弧頂（往上拱、稍微偏向側面，弧線更有拋物感）
  const ctrl = {
    x: (startC.x + endC.x) / 2 + (endC.x > startC.x ? -70 : 70),
    y: Math.min(startC.y, endC.y) - 150
  };

  const prog = { t: 0 };
  let trailTick = 0;

  const tl = gsap.timeline();

  // 第一拍：卡片彈起發光（蓄力感）
  tl.to(flyCard, {
    duration: 0.18,
    scale: 1.16,
    y: -14,
    ease: "back.out(2.5)"
  })
  // 第二拍：沿貝茲曲線精準飛向對應寶石格，途中 3D 翻轉縮小 + 灑落色彩拖尾
  .to(prog, {
    t: 1,
    duration: 0.72,
    ease: "power1.in",
    onUpdate: () => {
      const t = prog.t, mt = 1 - t;
      const cx = mt * mt * startC.x + 2 * mt * t * ctrl.x + t * t * endC.x;
      const cy = mt * mt * startC.y + 2 * mt * t * ctrl.y + t * t * endC.y;
      gsap.set(flyCard, { x: cx - startC.x, y: cy - startC.y });
      if (++trailTick % 2 === 0) spawnTrailSparkle(fxContainer, cx, cy, fxColor);
    }
  })
  .to(flyCard, {
    duration: 0.72,
    rotationY: 360,
    rotationX: 24,
    scale: 0.12,
    ease: "power2.in"
  }, "<")
  // 第三拍：命中瞬間 —— 卡片湮滅、色彩爆裂、金庫寶石格彈跳發光
  .to(flyCard, {
    duration: 0.1,
    opacity: 0,
    ease: "power1.in",
    onComplete: () => {
      flyCard.remove();
      sourceDom.style.opacity = '';
      activeFlyingCardIds.delete(cardId);

      spawnImpactBurst(fxContainer, endC.x, endC.y, fxColor);

      if (vaultDom) {
        gsap.timeline()
          .fromTo(vaultDom, { scale: 1 }, { scale: 1.5, duration: 0.14, ease: "back.out(3)" })
          .to(vaultDom, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
        gsap.fromTo(vaultDom,
          { filter: `drop-shadow(0 0 14px ${fxColor})` },
          { filter: 'drop-shadow(0 0 0px transparent)', duration: 0.8, ease: 'power2.out',
            clearProps: 'filter' });
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
  const isAiBattle = ActionDispatcher.isAiBattle(fullState);
  const isPlayerTurn = fullState.currentTurnOwner === 'player';

  // 動態目標分數顯示
  const targetTxt = document.getElementById('target-txt');
  if (targetTxt) targetTxt.textContent = ActionDispatcher.getTargetScore(fullState);

  // AI 金庫面板：帝國爭霸 & 故事模式 vsAI 關卡皆顯示
  document.getElementById('ai-dashboard-box').style.display = isAiBattle ? 'block' : 'none';

  // 回合歸屬指示器
  const turnIndicator = document.getElementById('turn-owner-indicator');
  if (turnIndicator) {
    if (isAiBattle) {
      turnIndicator.style.display = '';
      turnIndicator.textContent = isPlayerTurn ? '👤 玩家回合' : '🤖 AI 思考中…';
      turnIndicator.style.borderColor = isPlayerTurn ? '#ffcc00' : '#e74c3c';
    } else {
      turnIndicator.style.display = 'none';
    }
  }

  const bannerZone = document.getElementById('dynamic-banner-zone');
  const bannerBadge = document.getElementById('dynamic-banner-badge');
  const bannerText = document.getElementById('dynamic-banner-text');

  if (bannerZone && bannerBadge && bannerText) {
    if (isvsAI) {
      bannerZone.style.display = 'none';
    } else {
      bannerZone.style.display = 'flex';

      // ── 🏆 1. 單人模式：常駐顯示成就進度（成就動畫由全域輪播器接手）──
      if (isSingleMode) {
        bannerBadge.textContent = "榮譽成就";
        bannerBadge.style.backgroundColor = 'rgba(230, 126, 34, 0.2)';
        bannerBadge.style.borderColor = '#e67e22';
        bannerZone.style.cursor = 'pointer';

        if (!window.isSfxBannerPlaying) {
          const achCount = fullState.achievements ? Object.keys(fullState.achievements).length : 0;
          bannerText.innerHTML = fullState.latestAchievementAlert
            || `🏆 當前已斬獲 <span style="color:#ffcc00; font-weight:800;">${achCount} / 30</span> 項皇家勳章 <span style="color:#ffcc00; font-size:0.55rem; margin-left:6px;">[ 點此開啟皇家榮譽堂 ]</span>`;
        }

      } else if (isStoryMode) {
        // ── 📜 2. 故事模式 ──
        const currentLvl = fullState.storyProgress?.currentLevel || 1;
        const mission = window.STORY_MISSIONS ? window.STORY_MISSIONS[currentLvl - 1] : null;

        bannerZone.style.cursor = 'pointer';
        if (mission) {
          bannerBadge.textContent = `第 ${currentLvl} 關 任務`;
          bannerBadge.style.borderColor = '#d4af37';
          bannerBadge.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';

          let conditionText = mission.winCondition.targetScore ? `威望達到 ${mission.winCondition.targetScore} 分` : '特定條件';
          if (mission.id === 2) conditionText = "達到15分，且紅寶石拿取少於8顆";
          if (mission.id === 3) conditionText = "達到15分，且保留並買下卡片達3次";
          if (mission.id === 4) conditionText = "達到15分，且整局禁止使用黃金籌碼";
          if (mission.id === 5) conditionText = "達到15分，且通關時5色卡片數量皆 >= 2張";
          if (mission.id === 7) conditionText = "達到15分，且任何回合結束時背包籌碼不超過6顆";
          if (mission.id === 8) conditionText = "達到15分，且本局 Lv1 發展卡全數封鎖";
          if (mission.id === 9) conditionText = "達到15分，且最終名下只能有黑與白卡";
          if (mission.id === 10) conditionText = "達到15分，且通關時手上持有至少4枚黃金籌碼";
          if (mission.id === 12) conditionText = "擊敗鍊金傀儡 AI，率先達到 15 分";
          if (mission.id === 13) conditionText = "最終分數必須「剛好等於 15 分」，超分算輸";
          if (mission.id === 15) conditionText = "達到15分，且至少3次買卡是「完全沒消耗籌碼」";
          if (mission.id === 16) conditionText = "不限分數，率先獲得 3 位貴族拜訪即可通關";
          if (mission.id === 17) conditionText = "通關那一回合，必須同時獲得卡片分與貴族分";
          if (mission.id === 18) conditionText = "擊敗侵略型 AI，且本局玩家的貴族分被無效化";
          if (mission.id === 19) conditionText = "達20分，移除Lv1卡，且有名下至少3張>=4分的卡";
          if (mission.id === 20) conditionText = "達到15分，且系統每過 5 個回合隨機扣2枚籌碼";
          if (mission.id === 21) conditionText = "達18分，且銀行普通籌碼初始庫存全為 0";
          if (mission.id === 22) conditionText = "擊敗高級AI（開局AI自帶8分與4張隨機Lv2卡）";
          if (mission.id === 23) conditionText = "威望達20分，且通關時5種顏色永久減免皆 >= 3";
          if (mission.id === 24) conditionText = "擊敗女皇親自操刀的神級精算 AI";
          if (mission.id === 25) conditionText = "威望達到 25 分，且成功吸引至少 2 位貴族進駐";

          const t = fullState.storyTracker;
          if (t && mission.id === 2) {
            conditionText += ` <span style="color:${t.redTokensTaken > 7 ? '#e74c3c' : '#2ecc71'};">(紅寶石已拿: ${t.redTokensTaken}/7)</span>`;
          } else if (t && mission.id === 3) {
            conditionText += ` <span style="color:#2ecc71;">(當前進度: ${t.reservedBuys}/3)</span>`;
          } else if (t && mission.id === 7) {
            conditionText += ` <span style="color:${t.maxBagEver > 6 ? '#e74c3c' : '#2ecc71'};">(史上最大背包: ${t.maxBagEver}/6)</span>`;
          } else if (t && mission.id === 15) {
            conditionText += ` <span style="color:#2ecc71;">(當前進度: ${t.freeBuys}/3)</span>`;
          } else if (t && mission.id === 19) {
            conditionText += ` <span style="color:#2ecc71;">(高分卡: ${t.highPointCards}/3)</span>`;
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
  if (isAiBattle) {
    document.getElementById('ai-score-txt').textContent = fullState.ai.score;
    renderDashboardGems('ai-res-layer', fullState.ai, null);
  }

  const currentBagCap = ActionDispatcher.getPlayerBagCap();
  const capTxtEl = document.getElementById('cap-txt');
  capTxtEl.textContent = `背包: ${totalTokens} / ${currentBagCap}`;

  capTxtEl.classList.remove('bag-warning-yellow', 'bag-danger-red');
  if (totalTokens >= currentBagCap) {
    capTxtEl.classList.add('bag-danger-red');
  } else if (totalTokens > currentBagCap - 3) {
    capTxtEl.classList.add('bag-warning-yellow');
  }

  const reserveCap = fullState.settings.selectedAssistant === 'ast7' ? 4 : 3;

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

      const afford = GameEngine.canAffordCard(player.bonus, player.tokens, card.cost, { actor: 'player', level });
      let imgUrl = CUSTOM_CARD_IMAGES[card.provides][parseInt(card.id) % CUSTOM_CARD_IMAGES[card.provides].length];

      return `
        <div class="card ${!lastRenderedCardIds.has(card.id) ? 'animate-deal' : ''}" id="dom-card-${card.id}" data-affordable="${afford.affordable}" style="background-image: url('${imgUrl}'); width: 100%; aspect-ratio: 1 / 1; transform: none;">
          <div class="card-content-wrapper">
            <div class="card-top"><span class="card-pts">${card.points > 0 ? card.points : ''}</span><div class="card-gem-icon ${GEM_CLASSES[card.provides]}"></div></div>
            <div>
              <div class="card-costs">${costHtml}</div>
              <div class="card-actions">
                <button class="btn-card" ${!isPlayerTurn || !afford.affordable ? 'disabled' : ''} onclick="buyBoardCard('${level}', ${idx})">收購</button>
                <button class="btn-card" ${!isPlayerTurn || player.reserved.length >= reserveCap ? 'disabled' : ''} onclick="reserveBoardCard('${level}', ${idx})">保留</button>
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
      if (!card) return i < reserveCap ? `<div class="card empty">空位</div>` : '';
      const cardLevel = 'lv' + String(card.id)[0];
      const afford = GameEngine.canAffordCard(player.bonus, player.tokens, card.cost, { actor: 'player', level: cardLevel });
      let imgUrl = CUSTOM_CARD_IMAGES[card.provides][parseInt(card.id) % CUSTOM_CARD_IMAGES[card.provides].length];

      let resCostHtml = '';
      for (let k in card.cost) {
        resCostHtml += `
          <div class="cost-dot ${(player.bonus[k] || 0) >= card.cost[k] ? 'free' : ''}">
            <span class="cost-dot-circle ${GEM_CLASSES[k]}"></span><span>${card.cost[k]}</span>
          </div>`;
      }

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

  // 同色拿 2 的最低庫存需求（大提琴家 ast9 只需 1 顆）
  const sameMinBank = fullState.settings.selectedAssistant === 'ast9' ? 1 : 2;
  const sameColorOk = fullState.selectedSame && (fullState.bank[fullState.selectedSame] || 0) >= sameMinBank;

  if (selectedCount === 1) {
    btnDiff.disabled = !isPlayerTurn;
    btnSame.disabled = !isPlayerTurn || !sameColorOk;
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
    if (sfxUnselectEl && !state.settings.isSfxMuted) { sfxUnselectEl.currentTime = 0; sfxUnselectEl.play().catch(() => {}); }
    if (state.selectedDiff.length === 1) state.selectedSame = state.selectedDiff[0];
    else state.selectedSame = null;
  } else {
    if (state.selectedDiff.length >= 3) state.selectedDiff.shift();
    state.selectedDiff.push(color);
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

    // ✨ 關鍵修正：render() 會整批重建卡片 DOM，舊補間其實綁在「已脫離文件的舊元素」上，
    // 導致新元素完全沒有漂浮 → 看起來就是被其他動畫打斷後停住。
    // 唯有補間仍綁在「目前這顆元素」且元素仍在畫面上時才沿用；
    // 否則殺掉殭屍補間、替新元素接續原本的漂浮相位重建（無縫，不會抖動歸零再重來）。
    const existing = window._idleTweensMap.get(cardId);
    if (existing) {
      const tgt = existing.targets ? existing.targets()[0] : null;
      if (tgt === el && el.isConnected) return; // 同一顆元素仍活著 → 漂浮完全不中斷
      const resumeAt = (typeof existing.time === 'function') ? existing.time() : 0;
      existing.kill();
      window._idleTweensMap.delete(cardId);
      createIdleFloatTween(el, cardId, i, resumeAt);
      return;
    }

    createIdleFloatTween(el, cardId, i, 0);
  });

  // 只有「已被買走離場」或「不再買得起」的卡才停止漂浮；
  // 停止時以 0.3 秒緩緩降回原位，而不是瞬間定格。
  for (const [id, tween] of window._idleTweensMap.entries()) {
    if (!currentCardIds.has(id)) {
      const tgt = tween.targets ? tween.targets()[0] : null;
      tween.kill();
      window._idleTweensMap.delete(id);
      const el = document.getElementById(id) || tgt;
      if (el && el.isConnected) {
        gsap.to(el, { y: 0, rotation: 0, duration: 0.3, ease: 'sine.out' });
      }
    }
  }
}

// 建立單張卡的漂浮補間；resumeAt > 0 時從原本的相位接續播放（重建 DOM 後視覺無縫）
function createIdleFloatTween(el, cardId, i, resumeAt) {
  gsap.killTweensOf(el);
  const tween = gsap.to(el, {
    y: -6,
    rotation: 0.8,
    duration: 1.6 + (i % 4) * 0.18,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: resumeAt > 0 ? 0 : (i % 4) * 0.3
  });
  if (resumeAt > 0) {
    const cycle = tween.duration() * 2; // yoyo 一去一回為一個完整週期
    tween.time(resumeAt % cycle);
  }
  window._idleTweensMap.set(cardId, tween);
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

// ==========================================
// 5. 故事模式視覺小說劇場（全 25 關自動接入靜態任務資料庫）
// ==========================================
window.storyModule = {
  currentStageId: 1, dialogueStep: 0, isTyping: false, currentTween: null, textObj: { charCount: 0 }, onStoryCompleteCallback: null,

  _getStageData(stageId) {
    const mission = (window.STORY_MISSIONS || [])[stageId - 1];
    if (!mission) return null;
    const chapterNames = [
      "👑 第一章：微光村的石匠（第 1 - 5 關）",
      "🏰 第二章：橡木鎮的崛起商賈（第 6 - 10 關）",
      "⚔️ 第三章：巨石要塞的邊境商戰（第 11 - 15 關）",
      "💎 第四章：翡翠首都的宮廷商戰（第 16 - 20 關）",
      "👑 第五章：皇家大會堂的璀璨至尊（第 21 - 25 關）"
    ];
    const chapter = chapterNames[Math.floor((stageId - 1) / 5)];
    const turnDisplay = (mission.setup.turnLimit >= 99) ? '不限回合' : `${mission.setup.turnLimit} 回合內`;
    const scoreDisplay = mission.winCondition.targetScore ? `${mission.winCondition.targetScore} 分` : '特定條件';
    return {
      chapter,
      title: `第 ${stageId} 關：${mission.name}`,
      bg: mission.story,
      condition: `${turnDisplay}達成 ${scoreDisplay}（詳見場上任務橫幅）`,
      name: mission.speaker,
      text: mission.dialogue,
      img: mission.imgUrl
    };
  },

  loadStage(stageId, callback) {
    if (CoreState && CoreState.get().mode !== 'storyMode') {
      if (callback) callback();
      return;
    }
    const stageData = this._getStageData(stageId);
    if (!stageData) { if (callback) callback(); return; }
    this.currentStageId = stageId; this.dialogueStep = 0; this.onStoryCompleteCallback = callback;

    const layer = document.getElementById("story-layer");
    if (layer) layer.classList.add('story-active');

    document.getElementById("story-chapter-title").innerText = stageData.chapter + " - " + stageData.title;
    document.getElementById("story-intro-panel").innerText = stageData.bg;
    document.getElementById("story-condition-badge").innerText = "🏆 目標：" + stageData.condition;
    document.getElementById("story-char-img").src = stageData.img || `https://images.placeholders.dev/?width=320&height=520&text=No.${stageId}&bgColor=%232c3e50&textColor=%23ffffff`;
    this.animateCharacterIn();
  },
  animateCharacterIn() { gsap.fromTo("#story-character", { x: -150, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "power2.out" }); this.renderDialogue(); },
  renderDialogue() {
    const stageData = this._getStageData(this.currentStageId);
    if (!stageData) return;
    let targetText = this.dialogueStep === 0 ? stageData.text : "準備挑戰！";
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

// ==========================================
// 6. 全域控制器：音樂 / 音效 / 歡迎彈窗 / 預載入
// ==========================================
window.handleMusicToggle = function() {
  const currentCore = window.CoreState || CoreState;
  if (!currentCore) return;
  const state = currentCore.get();

  state.settings.isMusicMuted = !state.settings.isMusicMuted;

  const bg = document.getElementById('bg-music');
  if (bg) {
    if (state.settings.isMusicMuted) bg.pause();
    else bg.play().catch(() => {});
  }
  if (window.openGameOptionsModal) window.openGameOptionsModal();
};

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
  localStorage.setItem('splendor_tutorial_seen', 'true');

  const tutorialWidget = document.getElementById('floating-tutorial-widget');
  if (tutorialWidget) tutorialWidget.style.display = 'none';

  const highlighted = document.querySelectorAll('.tutorial-highlight');
  highlighted.forEach(el => el.classList.remove('tutorial-highlight'));

  const bg = document.getElementById('bg-music');
  if (bg && !CoreState.get().settings.isMusicMuted) {
    bg.play().catch((err) => {
      console.log("音樂播放受阻：", err);
    });
  }
}
window.finishTutorialAndPlayMusic = finishTutorialAndPlayMusic;

// ✨ 點擊進入按鈕後淡出載入畫面，並精準啟動新手教學或歡迎彈窗
window.enterGameFromPreloader = function() {
  const preloader = document.getElementById('game-preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    preloader.style.pointerEvents = 'none';
    setTimeout(() => preloader.remove(), 500);
  }

  const seen = localStorage.getItem('splendor_tutorial_seen');
  const welcomeModal = document.getElementById('welcome-back-modal');

  if (!seen) {
    // 【首次進入】：直接啟動翠席兒教學（此時有點擊動作，音訊權限已解鎖）
    if (welcomeModal) {
      welcomeModal.classList.remove('show');
      welcomeModal.style.display = 'none';
    }
    localStorage.setItem('splendor_tutorial_seen', 'true');
    if (typeof window.startFloatingTutorial === 'function') {
      window.startFloatingTutorial();
    }
  } else {
    // 【非首次進入】：開啟歡迎回來彈窗
    if (welcomeModal) {
      welcomeModal.classList.add('show');
      welcomeModal.style.display = 'flex';
    }
  }
};

// ── 🎬 皇家成就全自動非同步輪播播放器（唯一入口，避免與 render 重複消費佇列）──
setInterval(() => {
  if (!CoreState || window.isSfxBannerPlaying) return;
  const fullState = CoreState.get();
  if (!fullState || fullState.mode !== 'singlePlayer') return;
  if (!fullState.pendingAchievementsQueue || fullState.pendingAchievementsQueue.length === 0) return;
  window.isSfxBannerPlaying = true;
  const bannerText = document.getElementById('dynamic-banner-text');
  if (!bannerText) { window.isSfxBannerPlaying = false; return; }

  const currentAch = fullState.pendingAchievementsQueue.shift();

  let tierText = { easy: "簡單", normal: "中階", hard: "進階", expert: "困難", master: "神人" }[currentAch.tier];
  bannerText.innerHTML = `<span style="color: ${currentAch.color}; font-weight: 800;">${currentAch.symbol} [${tierText}] ${currentAch.title} — ${currentAch.desc}</span>`;
  bannerText.classList.remove('has-ach');
  void bannerText.offsetWidth;
  bannerText.classList.add('has-ach');

  window.playAchievementSfx(currentAch.tier);

  setTimeout(() => {
    window.isSfxBannerPlaying = false;
    bannerText.classList.remove('has-ach');
    if (typeof window.render === 'function') window.render();
  }, 2200);
}, 250);

// ==========================================
// 7. 進入點：DOM 加載完畢後統一初始化
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
  setDynamicVh();

  // 音效元素綁定
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

  // 歡迎彈窗於預載入完成前一律隱藏（由 enterGameFromPreloader 決定是否顯示）
  const welcomeModal = document.getElementById('welcome-back-modal');
  if (welcomeModal) {
    welcomeModal.classList.remove('show');
    welcomeModal.style.display = 'none';
  }

  // 核心模組加載與開局
  await loadCoreModules();
  SingleMode.loadTalentPool();
  ActionDispatcher.dispatch('INIT_GAME');

  // ✨ 收集遊戲中所有需要快取的圖片網址（含 5 色卡片首圖、貴族、籌碼、輔助官立繪）
  const imagesToCache = [
    'https://i.ibb.co/ZpJqvt5d/white.png', 'https://i.ibb.co/4nGkn3HP/sapphire.png',
    'https://i.ibb.co/0pVz7WV5/green.png', 'https://i.ibb.co/wZ9gmt1p/red.png',
    'https://i.ibb.co/y72gvDj/black.png', 'https://i.ibb.co/PZ1dZDyH/gold.png',
    'https://i.ibb.co/zHGC8vsm/image.png', 'https://i.ibb.co/QvHvZZWc/image.png',
    'https://i.ibb.co/hzw3Vfm/image.png', 'https://i.ibb.co/nNSjxvvd/image.png',
    'https://i.ibb.co/GQ2Yh0yH/image.png', 'https://i.ibb.co/39L2xNMT/1.png'
  ];

  // 🎵 收集所有音訊資源（背景音樂、操作音效、成就音效）
  const audioToCache = [
    audioEl, sfxGemEl, sfxBuyEl, sfxReserveEl, sfxSelectEl, sfxUnselectEl,
    sfxNobleMale, sfxNobleFemale,
    ...Object.values(sfxAchievementsMap)
  ].filter(Boolean);

  // 📊 進度條：圖片 + 音訊全部載入完成才開放進入（無逾時放行）
  const totalResources = imagesToCache.length + audioToCache.length;
  let loadedCount = 0;
  const barFill = document.getElementById('preload-bar-fill');
  const percentTxt = document.getElementById('preload-percent');
  const statusTxt = document.getElementById('preloader-status-text');

  const revealEnterBtn = () => {
    if (statusTxt) statusTxt.textContent = "資產加載完畢！";
    const enterBtn = document.getElementById('preloader-enter-btn');
    if (enterBtn) {
      enterBtn.style.opacity = '1';
      enterBtn.style.pointerEvents = 'auto';
      enterBtn.style.transform = 'translateY(0)';
    }
  };

  const onResourceDone = () => {
    loadedCount++;
    const pct = Math.min(100, Math.round((loadedCount / totalResources) * 100));
    if (barFill) barFill.style.width = pct + '%';
    if (percentTxt) percentTxt.textContent = pct + '%';
    if (statusTxt) statusTxt.textContent = `大會堂資產載入中... (${loadedCount}/${totalResources})`;
    if (loadedCount >= totalResources) revealEnterBtn();
  };

  imagesToCache.forEach(url => {
    const img = new Image();
    img.onload = img.onerror = onResourceDone;
    img.src = url;
  });

  audioToCache.forEach(el => {
    let counted = false;
    const done = () => { if (!counted) { counted = true; onResourceDone(); } };
    // 已有快取的音訊可能早就可播放
    if (el.readyState >= 4) { done(); return; }
    el.addEventListener('canplaythrough', done, { once: true });
    el.addEventListener('error', done, { once: true });
    el.preload = 'auto';
    try { el.load(); } catch (e) { done(); }
  });
});

window.addEventListener('resize', setDynamicVh);
