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
let lastAiState = null;

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

function animateCardFlightToGoldVault(cardId, providesColor, callback, vaultPrefix = 'vault-target') {
  const sourceDom = document.getElementById(`dom-card-${cardId}`);
  const vaultDom = document.getElementById(`${vaultPrefix}-${providesColor}`);
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
  // 📱 一律使用舞台邏輯座標：飛行位置與縮放比例在任何螢幕縮放下皆一致
  const start = window.stageLocalRect(sourceDom);
  const fallbackDash = (vaultPrefix === 'ai-vault-target')
    ? (document.getElementById('ai-banner-vault') || document.getElementById('ai-dashboard-box'))
    : document.getElementById('guide-dashboard');
  // 🎯 精準命中：優先鎖定格內的「圓形寶石圖示」正中央，而非整個格子的幾何中心
  const gemIcon = vaultDom ? vaultDom.querySelector('.res-circle') : null;
  const finalTarget = gemIcon || vaultDom || fallbackDash || document.getElementById('stage') || document.body;
  const end = window.stageLocalRect(finalTarget);

  // ✨ 精準命中：以「起點中心 → 金庫對應寶石格中心」計算，貝茲曲線終點就是寶石格正中央
  const startC = { x: start.left + start.width / 2, y: start.top + start.height / 2 };
  const endC   = { x: end.left + end.width / 2,     y: end.top + end.height / 2 };

  const flyCard = sourceDom.cloneNode(true);
  flyCard.removeAttribute('id');
  flyCard.style.position = 'fixed';
  flyCard.style.left = start.left + 'px';
  flyCard.style.top = start.top + 'px';
  // ⚠️ 分身帶著 .card 類別，會吃到 style.css 的 width:100% / aspect-ratio !important
  //    常駐規則而被撐成巨卡（實測 491px）→ 幾何尺寸必須同樣以 !important 鎖死
  flyCard.style.setProperty('width',  start.width + 'px', 'important');
  flyCard.style.setProperty('height', start.height + 'px', 'important');
  flyCard.style.setProperty('max-width', 'none', 'important');
  flyCard.style.setProperty('aspect-ratio', 'auto', 'important');
  flyCard.style.transform = 'none';   // 清除源卡片殘留的閒置漂浮 transform
  flyCard.style.margin = '0';
  flyCard.style.zIndex = '10000';
  flyCard.style.pointerEvents = 'none';
  // 光暈初始為熄滅狀態（兩層陰影格式需與點亮後一致，GSAP 才能平滑補間）
  flyCard.style.boxShadow = `0 0 0px ${fxColor}00, 0 0 0px ${fxColor}00`;
  flyCard.style.borderRadius = '10px';

  gsap.set(flyCard, { transformOrigin: "center center", transformStyle: "preserve-3d", perspective: 800 });
  fxContainer.appendChild(flyCard);

  sourceDom.style.opacity = '0.15';

  // 🎬 起飛參數（⚠️ 放大不可過大：上限 1.18 倍，僅作「卡片被拾起」的視覺提示）
  const LIFT = 26;          // 起飛抬升高度
  const LIFT_SCALE = 1.18;  // 起飛放大倍率上限
  const liftedC = { x: startC.x, y: startC.y - LIFT };

  // 拋物線控制點：以「起飛後位置」為起點計算弧頂（銜接第一拍終點，飛行不跳動）
  const ctrl = {
    x: (liftedC.x + endC.x) / 2 + (endC.x > liftedC.x ? -50 : 50),
    y: Math.min(liftedC.y, endC.y) - 110
  };

  const prog = { t: 0 };
  let trailTick = 0;

  const tl = gsap.timeline();

  // 🎯 終點縮放 = 寶石圖示大小 ÷ 卡片大小（落地時恰好與寶石同尺寸，不多不少）
  const destScale = Math.max(0.06, Math.min(0.3, (end.width * 0.9) / start.width));

  // 第一拍：卡片自原位「飛起 + 輕微放大」，光暈同步點亮
  tl.to(flyCard, {
    duration: 0.26,
    scale: LIFT_SCALE,
    y: -LIFT,
    boxShadow: `0 0 24px ${fxColor}, 0 0 60px ${fxColor}66`,
    ease: "back.out(2.2)"
  })
  // 第二拍：帶著光暈沿貝茲曲線精準飛向「對應顏色」寶石格，途中 3D 翻轉 + 色彩拖尾
  .to(prog, {
    t: 1,
    duration: 0.68,
    ease: "power1.in",
    onUpdate: () => {
      const t = prog.t, mt = 1 - t;
      const cx = mt * mt * liftedC.x + 2 * mt * t * ctrl.x + t * t * endC.x;
      const cy = mt * mt * liftedC.y + 2 * mt * t * ctrl.y + t * t * endC.y;
      gsap.set(flyCard, { x: cx - startC.x, y: cy - startC.y });
      if (++trailTick % 2 === 0) spawnTrailSparkle(fxContainer, cx, cy, fxColor);
    }
  })
  .to(flyCard, {
    duration: 0.68,
    rotationY: 360,
    rotationX: 24,
    scale: destScale,
    ease: "power2.in"   /* 弧頂仍保持放大狀態，接近金庫時才快速收縮 */
  }, "<")
  // 第三拍：命中瞬間 —— 卡片縮小沒入金庫、色彩爆裂、寶石格彈跳發光
  .to(flyCard, {
    duration: 0.12,
    opacity: 0,
    scale: destScale * 0.4,
    ease: "power1.in",
    onComplete: () => {
      flyCard.remove();
      sourceDom.style.opacity = '';
      activeFlyingCardIds.delete(cardId);

      playNobleLandSfx(); // 🔔 寶石卡飛入金庫：與貴族入區相同音效
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

window.animateCardFlightToGoldVault = animateCardFlightToGoldVault;

// ==========================================
// 👑 貴族獲得動畫：飛出 → 中央放大旋轉展示 → 飛入已獲得貴族區
// ==========================================
// 🔔 飛入音效（貴族入區 / 寶石卡入庫共用）
// ⚠️ 修正：settings 並非全域變數（存在於 CoreState 內），原寫法拋出 ReferenceError，
// 不僅音效沒播，還炸斷 onComplete 鏈導致動畫計數卡死、勝利判定永遠被延後。
const NOBLE_LAND_SFX_URL = 'https://assets.mixkit.co/active_storage/sfx/2144/2144-preview.mp3';
const _landSfxBase = new Audio(NOBLE_LAND_SFX_URL); // 預載一次
_landSfxBase.preload = 'auto';
function playNobleLandSfx() {
  try {
    if (CoreState && CoreState.get().settings.isSfxMuted) return;
  } catch (e) { /* CoreState 未就緒時照常播放 */ }
  try {
    const a = _landSfxBase.cloneNode(); // 複製實體：多張連續飛入可重疊播放且免重新下載
    a.volume = 0.85;
    a.play().catch(() => {});
  } catch (e) {}
}

let _nobleAnimRunning = 0;        // 進行中的貴族動畫批次數
let _nobleAnimQueue = [];         // 動畫結束後才執行的回呼（例如勝利視窗）

// 供結算流程呼叫：動畫進行中回傳 true 並把回呼排入佇列；否則回傳 false 立即照常執行
window.deferUntilNobleAnim = function(cb) {
  if (_nobleAnimRunning <= 0) return false;
  _nobleAnimQueue.push(cb);
  return true;
};

function _nobleAnimBatchDone() {
  _nobleAnimRunning = Math.max(0, _nobleAnimRunning - 1);
  if (_nobleAnimRunning === 0) {
    isAnimating = false;
    window.render();
    const q = _nobleAnimQueue.splice(0);
    q.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
  }
}

window.animateNoblesEarned = function(nobles, actor = 'player') {
  const fxContainer = document.getElementById('effects-layer');
  const noblesLayer = document.getElementById('nobles-layer');
  const destEl = (actor === 'ai')
    ? (document.getElementById('ai-dashboard-box') || document.body)
    : (document.getElementById('earned-nobles-layer')
        || document.getElementById('left-earned-nobles')
        || document.body);
  if (!fxContainer || !nobles || nobles.length === 0) return;

  _nobleAnimRunning++;
  isAnimating = true;

  // 📱 舞台邏輯座標（恆為 430×716，任何縮放下呈現一致）
  const stage = window.getStageRect();
  const vw = stage.width, vh = stage.height;
  const N = nobles.length;
  const gap = Math.min(24, vw * 0.05);

  // ✨ 放大尺寸依「同時獲得的張數」動態計算：
  // 三張同時展示時 (舞台寬-邊距-間隔)/3，保證彼此完整並排、絕不重疊；單張上限 240px
  const targetW = Math.min(240, Math.max(70, (vw - 32 - (N - 1) * gap) / N));
  // 展示高度夾在舞台內，放大後上下緣都不出界
  const cy = Math.max(targetW / 2 + 24, Math.min(vh * 0.42, vh - targetW / 2 - 24));

  const destRect = window.stageLocalRect(destEl);
  const destC = { x: destRect.left + destRect.width / 2, y: destRect.top + destRect.height / 2 };

  let finished = 0;
  let batchClosed = false;
  const closeBatch = () => { if (!batchClosed) { batchClosed = true; _nobleAnimBatchDone(); } };
  const finishOne = () => { if (++finished >= N) closeBatch(); };
  // 🛡️ 保險絲：就算個別補間被外力殺掉，也在理論最長時長後強制收尾，勝利判定絕不卡死
  setTimeout(closeBatch, (0.65 + 0.5 + 0.55 + 0.1 + N * 0.14) * 1000 + 1500);

  nobles.forEach((n, i) => {
    // 從貴族議事堂找到本尊卡片（此刻尚未重繪，仍在原位）
    let srcCard = null;
    if (noblesLayer) {
      const img = noblesLayer.querySelector(`img[alt="${n.name}"]`);
      if (img) srcCard = img.closest('.noble-card');
    }
    const sr = srcCard
      ? window.stageLocalRect(srcCard)
      : { left: vw / 2 - 45, top: 60, width: 90, height: 90 };

    // 建立飛行分身
    let flyEl;
    if (srcCard) {
      flyEl = srcCard.cloneNode(true);
      srcCard.style.opacity = '0.1';
    } else {
      flyEl = document.createElement('div');
      flyEl.innerHTML = `<img src="${n.img}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
    }
    flyEl.style.cssText += `;position:fixed;left:${sr.left}px;top:${sr.top}px;` +
      `width:${sr.width}px;height:${sr.height}px;margin:0;z-index:10005;pointer-events:none;` +
      `border-radius:10px;box-shadow:0 0 26px rgba(212,175,55,0.95), 0 0 80px rgba(212,175,55,0.45);`;
    gsap.set(flyEl, { transformOrigin: 'center center', transformStyle: 'preserve-3d', perspective: 900 });
    fxContainer.appendChild(flyEl);

    const srcC = { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 };
    // 第 i 張的中央展示位（以舞台中心均分排開）
    const showX = vw / 2 + (i - (N - 1) / 2) * (targetW + gap);
    const showScale = targetW / sr.width;
    const destScale = Math.max(0.06, 18 / sr.width);

    const tl = gsap.timeline();

    // 第一幕：所有貴族「同時」旋轉飛出至中央 —— 邊飛邊放大並翻轉整整一圈，
    // rotationY 收在 360°（= 正面），抵達中央時剛好轉正
    tl.to(flyEl, {
      x: showX - srcC.x,
      y: cy - srcC.y,
      scale: showScale,
      rotationY: 360,
      duration: 0.65,
      ease: 'power2.out'
    })
    // 第二幕：正面定格展示 0.5 秒（金光僅微幅增亮，卡面保持正對玩家不再旋轉）
    .to(flyEl, {
      boxShadow: '0 0 40px rgba(255,224,153,1), 0 0 100px rgba(212,175,55,0.65)',
      duration: 0.5,
      ease: 'sine.inOut'
    })
    // 第三幕：依序（間隔 0.14s）俯衝飛入「已獲得貴族區」
    .to(flyEl, {
      x: destC.x - srcC.x,
      y: destC.y - srcC.y,
      scale: destScale,
      rotationY: '+=180',
      duration: 0.55,
      delay: i * 0.14,
      ease: 'power2.in'
    })
    .to(flyEl, {
      opacity: 0,
      duration: 0.1,
      ease: 'power1.in',
      onComplete: () => {
        // ⚠️ 任何裝飾特效出錯都不得阻斷計數，否則勝利視窗會被永久延後
        try {
          flyEl.remove();
          playNobleLandSfx(); // 🔔 飛入已獲得貴族區音效
          if (typeof spawnImpactBurst === 'function') {
            spawnImpactBurst(fxContainer, destC.x, destC.y, '#f1c40f');
          }
          gsap.timeline()
            .fromTo(destEl, { scale: 1 }, { scale: 1.18, duration: 0.14, ease: 'back.out(3)' })
            .to(destEl, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)' });
        } catch (e) { console.error(e); }
        finishOne();
      }
    });
  });
};

function renderDashboardGems(targetElementId, actorData, diffs, idPrefix = 'vault-target') {
  const container = document.getElementById(targetElementId);
  if (!container) return;

  const survivingDiffs = {};
  container.querySelectorAll('.floating-diff').forEach(span => {
    const block = span.closest('.res-block');
    if (block && block.id) {
      const color = block.id.replace(idPrefix + '-', '');
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
      <div class="res-block" id="${idPrefix}-${k}">
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
    const blockEl = document.getElementById(`${idPrefix}-${color}`);
    if (blockEl) spans.forEach(s => {
      blockEl.appendChild(s);
      // ✨ DOM 重掛會讓 CSS 動畫從頭重播（視覺上閃第二次）。
      // 用負值 animation-delay 讓動畫直接跳到原本的進度接續播放，只閃一次。
      const born = parseFloat(s.dataset.born || '0');
      if (born > 0) s.style.animationDelay = (-(performance.now() - born)) + 'ms';
    });
  }

  if (diffs) {
    ['w', 'u', 'g', 'r', 'k', 'o'].forEach(k => {
      const diff = diffs.tokens[k];
      if (!diff || diff === 0) return;

      const blockEl = document.getElementById(`${idPrefix}-${k}`);
      if (!blockEl) return;

      const diffSpan = document.createElement('span');
      diffSpan.className = `floating-diff ${diff > 0 ? 'plus' : 'minus'}`;
      diffSpan.textContent = diff > 0 ? `+${diff}` : `${diff}`;
      diffSpan.dataset.born = String(performance.now()); // 記錄出生時間，重掛時接續進度
      blockEl.appendChild(diffSpan);

      blockEl.classList.add('animate-pulse-glow');
      setTimeout(() => blockEl.classList.remove('animate-pulse-glow'), 700);
      setTimeout(() => { if (diffSpan.parentNode) diffSpan.remove(); }, 1300);
    });
  }
}

// ==========================================
// 📱 邏輯舞台系統：所有版面固定設計在 430×716，整體以 transform: scale 等比縮放。
// 手機 scale≈1 原生呈現；桌機 scale 放大 → 文字/卡牌物理變大，兩端像素級一致。
// ==========================================
const STAGE_W = 430;   // 邏輯設計寬
const STAGE_H = 716;   // 邏輯設計高（長寬比 2 : 1.2 → 430 × 2/1.2 ≈ 716）

function fitStageToPhoneRatio() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const vw = window.innerWidth, vh = window.innerHeight;

  // 等比縮放：手機版上下各留 0.5%、兩側各留 0.1% 空隙；桌機維持上下各 1%
  const isMobileView = vw <= 500;
  const vGap = vh * (isMobileView ? 0.005 : 0.01);
  const hGap = isMobileView ? vw * 0.001 : 0;
  const z = Math.min((vw - hGap * 2) / STAGE_W, (vGap ? vh - vGap * 2 : vh) / STAGE_H);
  stage.style.transform = `scale(${z})`;

  // 桌機（有明顯留白）時加上手機外框裝飾
  document.body.classList.toggle('stage-boxed', vw > 500);

  document.documentElement.style.setProperty('--stage-w', STAGE_W + 'px');
  document.documentElement.style.setProperty('--stage-h', STAGE_H + 'px');
}

// 目前舞台縮放倍率（自我校正：以實測渲染寬 ÷ 邏輯寬，任何瀏覽器行為皆正確）
window.getStageZoom = function() {
  const stage = document.getElementById('stage');
  if (!stage || !stage.offsetWidth) return 1;
  const w = stage.getBoundingClientRect().width;
  return w > 0 ? w / stage.offsetWidth : 1;
};

// 舞台邏輯矩形（恆為 0,0 → 430,716）
window.getStageRect = function() {
  return { left: 0, top: 0, right: STAGE_W, bottom: STAGE_H,
           width: STAGE_W, height: STAGE_H };
};

// 🔑 元素的「舞台區域座標」矩形：
// 把 getBoundingClientRect 的實體像素換算回 430×716 邏輯座標系。
// 舞台內 position:fixed 元素以舞台為包含塊，因此 style.left/top 直接吃這個座標。
window.stageLocalRect = function(el) {
  const stage = document.getElementById('stage');
  const z = window.getStageZoom();
  const r = el.getBoundingClientRect();
  const s = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 };
  return {
    left:   (r.left - s.left) / z,
    top:    (r.top - s.top) / z,
    right:  (r.right - s.left) / z,
    bottom: (r.bottom - s.top) / z,
    width:  r.width / z,
    height: r.height / z
  };
};

window.addEventListener('resize', fitStageToPhoneRatio);
window.addEventListener('orientationchange', fitStageToPhoneRatio);
// 模組載入當下立即套用一次（scripts 位於 body 末端，#stage 已存在），
// 並在 load 後再校正一次 —— 重新整理瞬間版面即正確，無需等待使用者拉動視窗
fitStageToPhoneRatio();
window.addEventListener('load', fitStageToPhoneRatio, { once: true });

// ==========================================
// 🤖 帝國爭霸：AI 對手選擇系統
// ==========================================
const AI_OPPONENTS = [
  { id: 'tracy',  name: '翠席兒', img: 'https://i.ibb.co/39L2xNMT/1.png',
    difficulty: 'easy',   diffLabel: '簡單・不限回合', quote: '讓我們一起享受遊戲吧！' },
  { id: 'midou',  name: '米斗',   img: 'https://i.ibb.co/V0RLs3Pz/image.png',
    difficulty: 'normal', diffLabel: '普通', quote: '看看你有多少能耐！' },
  // 狄菲克：策略型 AI（master 引擎流）— 懂得靠永久寶石產能滾雪球加速勝利
  { id: 'defik',  name: '狄菲克', img: 'https://i.ibb.co/7xHk6FN2/image.png',
    difficulty: 'master', diffLabel: '困難', quote: '哦？試著拿出你的全部本事來打敗我吧！' }
];
let _pickedOpponentIdx = null;

window.openAiOpponentModal = function() {
  const grid = document.getElementById('opponent-grid');
  const dlg = document.getElementById('opponent-dialogue');
  const btn = document.getElementById('btn-enter-battle');
  if (!grid) return;

  _pickedOpponentIdx = null;
  if (dlg) dlg.innerHTML = '<b style="color:#ffe099;">選擇一位對手</b>';
  if (btn) { btn.disabled = true; btn.classList.remove('ready'); }

  grid.innerHTML = AI_OPPONENTS.map((o, i) => `
    <div class="opponent-card" id="opp-card-${i}" onclick="playUniformSfx(); window.chooseAiOpponent(${i})">
      <img class="opponent-avatar" src="${o.img}" alt="${o.name}">
      <div class="opponent-name">${o.name}</div>
      <div class="opponent-diff ${o.difficulty}">難度：${o.diffLabel}</div>
    </div>
  `).join('');

  document.getElementById('ai-opponent-modal')?.classList.add('show');
};

window.chooseAiOpponent = function(idx) {
  _pickedOpponentIdx = idx;
  const o = AI_OPPONENTS[idx];

  AI_OPPONENTS.forEach((_, i) => {
    document.getElementById(`opp-card-${i}`)?.classList.toggle('selected', i === idx);
  });

  // 選擇後對話（角色宣言）
  const dlg = document.getElementById('opponent-dialogue');
  if (dlg) dlg.innerHTML = `<b style="color:#ffe099;">${o.name}</b>：「${o.quote}」`;

  // 💡 亮起【進入對戰】按鈕
  const btn = document.getElementById('btn-enter-battle');
  if (btn) { btn.disabled = false; btn.classList.add('ready'); }
};

window.confirmAiOpponentBattle = function() {
  if (_pickedOpponentIdx === null) return;
  const o = AI_OPPONENTS[_pickedOpponentIdx];
  const state = CoreState.get();
  state.settings.aiOpponent = { id: o.id, name: o.name, img: o.img, difficulty: o.difficulty };

  document.getElementById('ai-opponent-modal')?.classList.remove('show');
  ActionDispatcher.dispatch('INIT_GAME'); // setupNewGame 會依 aiOpponent 套用難度
};

// ✕ 取消選擇 → 退回成就模式
window.cancelAiOpponentSelect = function() {
  document.getElementById('ai-opponent-modal')?.classList.remove('show');
  ActionDispatcher.dispatch('SWITCH_MODE', { mode: 'singlePlayer' });
};

// 結算視窗「重新選擇對手」
window.reselectAiOpponent = function() {
  document.getElementById('win-modal')?.classList.remove('show');
  window.openAiOpponentModal();
};

// ==========================================
// 🎵 依遊戲模式切換背景音樂
// ==========================================
const BG_TRACKS = {
  default: 'https://assets.mixkit.co/music/785/785.mp3',
  vsAI:    'https://assets.mixkit.co/music/917/917.mp3'   // 帝國爭霸專屬戰曲
};
let _currentBgTrack = null;

function syncBgMusicToMode(mode) {
  const bg = document.getElementById('bg-music');
  if (!bg) return;
  const want = (mode === 'vsAI') ? BG_TRACKS.vsAI : BG_TRACKS.default;
  if (_currentBgTrack === want) return;
  _currentBgTrack = want;

  const wasPlaying = !bg.paused;
  bg.src = want;
  bg.load();

  let musicMuted = false;
  try { musicMuted = CoreState.get().settings.isMusicMuted; } catch (e) {}
  // 原本正在播放才自動續播（不違反瀏覽器自動播放限制，也尊重靜音設定）
  if (wasPlaying && !musicMuted) bg.play().catch(() => {});
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

  // 🎵 模式切換時自動換背景音樂（同曲目時零成本直接返回）
  syncBgMusicToMode(fullState.mode);
  const isAiBattle = ActionDispatcher.isAiBattle(fullState);
  const isPlayerTurn = fullState.currentTurnOwner === 'player';

  // 動態目標分數顯示
  const targetTxt = document.getElementById('target-txt');
  if (targetTxt) targetTxt.textContent = ActionDispatcher.getTargetScore(fullState);

  // AI 金庫面板：
  //   帝國爭霸(vsAI) → 金庫移駐頂部橫幅（原成就欄位置），底部面板隱藏
  //   故事模式 vsAI 關卡 → 維持底部面板（橫幅保留給關卡任務資訊）
  document.getElementById('ai-dashboard-box').style.display =
    (isAiBattle && !isvsAI) ? 'block' : 'none';

  // 🤝 首席輔助官欄位：專屬故事模式，成就模式與帝國爭霸一律隱藏
  const astPanel = document.getElementById('guide-assistant-container');
  if (astPanel) astPanel.style.display = isStoryMode ? 'flex' : 'none';

  // 回合歸屬指示器
  const turnIndicator = document.getElementById('turn-owner-indicator');
  if (turnIndicator) {
    if (isAiBattle) {
      turnIndicator.style.display = '';
      const isOnlineMatch = !!(fullState.onlineMatch && fullState.onlineMatch.active);
      turnIndicator.textContent = isPlayerTurn ? '👤 玩家回合'
        : (isOnlineMatch ? '🧑‍💻 對手思考中…' : '🤖 AI 思考中…');
      turnIndicator.style.borderColor = isPlayerTurn ? '#ffcc00' : '#e74c3c';
    } else {
      turnIndicator.style.display = 'none';
    }
  }

  const bannerZone = document.getElementById('dynamic-banner-zone');
  const bannerBadge = document.getElementById('dynamic-banner-badge');
  const bannerText = document.getElementById('dynamic-banner-text');

  // 🤖 AI 金庫內容節點的掛載位置切換（vsAI ↔ 底部面板），單一 DOM、id 不重複，
  //    飛卡動畫的 ai-vault-target-* 目標會自動跟著掛載位置移動
  const achContent    = document.getElementById('banner-ach-content');
  const aiBannerVault = document.getElementById('ai-banner-vault');
  const aiBannerSlot  = document.getElementById('ai-banner-slot');
  const aiVaultContent = document.getElementById('ai-vault-content');
  const aiBottomBox   = document.getElementById('ai-dashboard-box');

  if (bannerZone && bannerBadge && bannerText) {
    if (isvsAI) {
      // ── 🤖 帝國爭霸：橫幅化身 AI 金庫（原成就欄位置）──
      bannerZone.style.display = 'flex';
      bannerZone.style.cursor = 'default';
      if (achContent) achContent.style.display = 'none';
      if (aiBannerVault) {
        aiBannerVault.style.display = 'flex';
        // 保留一格顯示當前對戰對手頭像
        const av = document.getElementById('ai-banner-avatar');
        const opp = fullState.settings.aiOpponent;
        if (av && opp && av.getAttribute('src') !== opp.img) av.src = opp.img;
        if (aiVaultContent && aiBannerSlot && aiVaultContent.parentElement !== aiBannerSlot) {
          aiBannerSlot.appendChild(aiVaultContent);
        }
      }
    } else {
      bannerZone.style.display = 'flex';
      if (achContent) achContent.style.display = '';
      if (aiBannerVault) aiBannerVault.style.display = 'none';
      // 金庫內容歸位底部面板（故事模式 vsAI 關卡使用）
      if (aiVaultContent && aiBottomBox && aiVaultContent.parentElement !== aiBottomBox) {
        aiBottomBox.appendChild(aiVaultContent);
      }

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
    const oppNameEl = document.getElementById('ai-opponent-name');
    if (oppNameEl) {
      const isOnlineVault = !!(fullState.onlineMatch && fullState.onlineMatch.active);
      oppNameEl.textContent = (isvsAI && fullState.settings.aiOpponent)
        ? fullState.settings.aiOpponent.name : (isOnlineVault ? '對手' : '電腦 AI');
      const vaultPrefix = document.getElementById('ai-vault-prefix');
      if (vaultPrefix) vaultPrefix.textContent = isOnlineVault ? '👤' : '🤖';
    }
    // 🤖 AI 金庫同樣計算前後差異，浮動 +N（籌碼）與 +N🛡️（產量）動畫與玩家完全一致
    // ⚠️ AI 金庫只顯示籌碼 +N；「+N 🛡️」產量徽章動畫在 AI 側一律移除
    //（買卡動畫本身已足夠表達，且徽章曾因 keyframes 缺失而卡住不消失）
    let aiDiffs = { tokens: {}, bonus: {} };
    if (lastAiState) {
      for (let k in fullState.ai.tokens) aiDiffs.tokens[k] = fullState.ai.tokens[k] - lastAiState.tokens[k];
    }
    lastAiState = deepClone(fullState.ai);
    renderDashboardGems('ai-res-layer', fullState.ai, aiDiffs, 'ai-vault-target');

    // 🃏 對手保留牌縮圖：只顯示等級+永久寶石色圖例，點擊開窗查看所需籌碼
    const aiResMini = document.getElementById('ai-reserved-mini');
    if (aiResMini) {
      const rsv = fullState.ai.reserved || [];
      aiResMini.innerHTML = rsv.map((c, i) => `
        <div class="opp-reserved-thumb ${GEM_CLASSES[c.provides]}"
             title="對手保留牌：點擊查看所需籌碼"
             onclick="window.showOppReservedCard(${i})">
          <span>L${String(c.id)[0]}</span>
        </div>`).join('');
    }
  } else {
    lastAiState = null;
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
    resLayerReserved.innerHTML = `<div class="card empty reserved-empty-hint">🔒 暫無契約手牌</div>`;
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
        <div class="card ${afford.affordable ? 'reserved-buyable' : ''}" id="dom-card-${card.id}" style="background-image: url('${imgUrl}'); width: 100%; aspect-ratio: 1 / 1; transform: none;">
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
          reqHtml += `<div class="cost-dot"><span class="cost-dot-square ${GEM_CLASSES[k]}"></span><span>${n.req[k]}</span></div>`;
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

// 🎮 模式切換面板：預設收合，點「切換遊戲模式」按鈕才展開三種模式
window.toggleModeSwitchPanel = () => {
  const p = document.getElementById('mode-switch-panel');
  const t = document.getElementById('mode-switch-toggle');
  if (!p) return;
  const opening = (p.style.display === 'none' || !p.style.display);
  p.style.display = opening ? 'grid' : 'none';
  if (t) t.textContent = opening ? '🎮 切換遊戲模式 ▴' : '🎮 切換遊戲模式 ▾';
};

window.chooseGameMode = (mode) => {
  const p = document.getElementById('mode-switch-panel');
  const t = document.getElementById('mode-switch-toggle');
  if (p) p.style.display = 'none';
  if (t) t.textContent = '🎮 切換遊戲模式 ▾';
  ActionDispatcher.dispatch('SWITCH_MODE', { mode: mode });
  // 🏘️ 故事模式:切入後進 RPG 城鎮樞紐小地圖(桌局已於背景備妥,走到交易殿堂再進行)
  if (mode === 'storyMode' && window.TownMode) {
    if (window.StoryMode && window.StoryMode.loadStoryProgress) window.StoryMode.loadStoryProgress();
    window.TownMode.enter();
  }
};

// 供其他模組呼叫:回到城鎮樞紐(例如桌遊任務結束後)
window.returnToTown = () => {
  if (CoreState && CoreState.get().mode === 'storyMode' && window.TownMode) window.TownMode.enter();
};

window.openGameOptionsModal = () => {
  const s = CoreState.get().settings;
  const m = CoreState.get().mode;
  // 每次開窗重置模式面板為收合狀態
  const msp = document.getElementById('mode-switch-panel');
  const mst = document.getElementById('mode-switch-toggle');
  if (msp) msp.style.display = 'none';
  if (mst) mst.textContent = '🎮 切換遊戲模式 ▾';
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
window.showAchDetail = (id) => SingleMode.showAchDetail(id);
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
  bannerText.innerHTML = `<span style="color: ${currentAch.color}; font-weight: 800;">${currentAch.symbol} 獲得成就 [${tierText}] ${currentAch.title}</span>`;
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
    // 🤖 帝國爭霸對手立繪
    'https://i.ibb.co/V0RLs3Pz/image.png', 'https://i.ibb.co/7xHk6FN2/image.png',
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

// ══════════════════════════════════════════════
// 🃏 對手保留牌詳情視窗（AI 對戰 / 好友對戰共用）
// ══════════════════════════════════════════════
const OPP_GEM_NAMES = { w: '白鑽', u: '藍寶', g: '翡翠', r: '紅玉', k: '黑曜', o: '黃金' };
window.showOppReservedCard = function(idx) {
  if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
  const st = CoreState.get();
  const card = (st.ai.reserved || [])[idx];
  if (!card) return;

  let overlay = document.getElementById('opp-reserved-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'opp-reserved-modal';
    (document.getElementById('stage') || document.body).appendChild(overlay);
  }

  const costHtml = Object.keys(card.cost).map(k => `
    <div class="cost-dot" style="background:rgba(0,0,0,0.55) !important; border:1px solid rgba(255,255,255,0.15) !important; padding:2px 6px !important; font-size:0.75rem !important; gap:4px !important;">
      <span class="cost-dot-circle ${GEM_CLASSES[k]}" style="width:12px; height:12px;"></span>
      <span>${OPP_GEM_NAMES[k]} × ${card.cost[k]}</span>
    </div>`).join('');

  overlay.innerHTML = `
    <div class="modal" style="max-width:290px; padding:16px;" onclick="event.stopPropagation()">
      <h2 class="modal-title" style="font-size:0.9rem;">🃏 對手的保留牌</h2>
      <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin:8px 0;">
        <div class="card-gem-icon ${GEM_CLASSES[card.provides]}" style="width:22px; height:22px;"></div>
        <div style="font-size:0.75rem; color:#fff; text-align:left; line-height:1.5;">
          等級 Lv${String(card.id)[0]}　威望 <span style="color:#ffcc00; font-weight:800;">${card.points}</span> 分<br>
          產出：${OPP_GEM_NAMES[card.provides]}（永久減免）
        </div>
      </div>
      <div style="font-size:0.62rem; color:var(--text-muted); margin-bottom:6px;">收購所需籌碼</div>
      <div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-bottom:12px;">${costHtml}</div>
      <button class="btn-replay" style="width:100%; margin:0; padding:8px;"
        onclick="document.getElementById('opp-reserved-modal').classList.remove('show')">關閉</button>
    </div>`;
  overlay.onclick = () => overlay.classList.remove('show');
  overlay.classList.add('show');
};
