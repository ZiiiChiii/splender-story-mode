// game.js - 3D 視覺大會堂整合版
// ==========================================
// 1. 全域 UI 樣式常數與 3D 基礎設定
// ==========================================
const GEM_TYPES = ['w', 'u', 'g', 'r', 'k']; 
const GEM_CLASSES = { w: 'bg-w', u: 'bg-u', g: 'bg-g', r: 'bg-r', k: 'bg-k', o: 'bg-o' };
const GEM_BTN_CLASSES = { w: 'token-btn-w', u: 'token-btn-u', g: 'token-btn-g', r: 'token-btn-r', k: 'token-btn-k', o: 'token-btn-o' };

const GEM_HEX_COLORS = { w: 0xffffff, u: 0x3333ff, g: 0x22cc22, r: 0xff3333, k: 0x222222, o: 0xd4af37 };

const TUTORIAL_STEPS_DATA = [
  { elementId: "guide-actions", title: "🟢 第一步：行動挑選面板", text: "輪到您的回合時，可以點擊 3D 最前排的旋轉原石，或者直接在鑄幣局收下。" },
  { elementId: "guide-dashboard", title: "🪙 第二步：皇家 3D 金庫", text: "底層顯示持有的資產。購買卡牌後會觸發先升空再墬入金庫的立體飛行拋物線！" },
  { elementId: "three-canvas-container", title: "💎 第三步：3D 卡牌戰略矩陣", text: "直接在 3D 桌面上點擊卡牌進行收購判定，滑鼠懸浮或點擊會有高亮或震盪。" }
];

// 3D 系統全域變數
let scene, camera, renderer, raycaster, mouse;
let meshGemsMap = new Map(); // 顏色 -> Mesh 陣列
let meshCardsMap = new Map(); // cardId -> Mesh
let meshNoblesMap = new Map(); // nobleId -> Mesh
let clickable3DObjects = [];

let audioEl, sfxGemEl, sfxBuyEl, sfxReserveEl, sfxSelectEl, sfxUnselectEl, sfxNobleMale, sfxNobleFemale;
let sfxAchievementsMap = {};
let lastPlayerState = null;
let currentTutorialStep = 0;
let CoreState, GameEngine, SingleMode, ActionDispatcher;

// ==========================================
// 2. 初始化 3D 視窗與基礎光影環境
// ==========================================
function init3DSpace() {
  const container = document.getElementById('three-canvas-container');
  if(!container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a140f); // 配合 Felt Green 天鵝絨氛圍
  scene.fog = new THREE.FogExp2(0x0a140f, 0.012);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 13, 13);
  camera.lookAt(0, -1.0, 1.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 光源佈局
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.6);
  dirLight.position.set(5, 22, 8);
  scene.add(dirLight);

  // 鋪設虛擬綠呢大理石桌面
  const tableGeo = new THREE.PlaneGeometry(60, 45);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x0c1a12, roughness: 0.6, metalness: 0.1 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.rotation.x = -Math.PI / 2;
  table.position.y = -1.2;
  scene.add(table);

  // 註冊 3D 視窗點擊交互射線
  window.addEventListener('click', handle3DSceneClick);
  window.addEventListener('resize', onWindowResize);
}

// ==========================================
// 3. 異步載入核心對接模組
// ==========================================
async function loadCoreModules() {
  const stateMod = await import('./core/state.js');
  const engineMod = await import('./core/gameEngine.js');
  const singleMod = await import('./core/singleMode.js');
  const actionMod = await import('./core/action.js');
  const storyMod = await import('./core/storyMode.js');
  const assistantMod = await import('./core/assistantData.js');
  const levelsMod = await import('./core/missions/levelsData.js'); 

  CoreState = stateMod.CoreState;
  GameEngine = engineMod.GameEngine;
  SingleMode = singleMod.SingleMode;
  ActionDispatcher = actionMod.ActionDispatcher;

  window.ActionDispatcher = ActionDispatcher;
  window.SingleMode = SingleMode;
  window.StoryMode = storyMod.StoryMode; 
  window.STORY_MISSIONS = levelsMod.STORY_MISSIONS; 
  
  storyMod.StoryMode.loadStoryProgress();
  assistantMod.AssistantManager.renderActiveAssistantUI();

  init3DSpace();
  animate3DLoop();
}

// ==========================================
// 4. 3D 點擊射線事件分發 (完全整合原 2D 機制)
// ==========================================
function handle3DSceneClick(event) {
  // 避開 HTML 左側與置底的 UI 區塊
  if (event.clientX < 170 || event.clientY > window.innerHeight - 110) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(clickable3DObjects, true);
  if (intersects.length > 0) {
    let hitObj = intersects[0].object;
    while (hitObj.parent && !hitObj.userData.type) {
      hitObj = hitObj.parent;
    }

    const data = hitObj.userData;
    if (!data || !data.type) return;

    if (data.type === 'gem') {
      window.handleBankGemClick(data.color);
    } 
    else if (data.type === 'card' && !data.purchased) {
      const state = CoreState.get();
      const afford = GameEngine.canAffordCard(state.player.bonus, state.player.tokens, data.cardData.cost);
      
      if (afford.affordable && state.currentTurnOwner === 'player') {
        // 直接觸發 3D 特效與核心狀態更新
        trigger3DCardFlight(data.cardId, data.cardData.provides, () => {
          if (sfxBuyEl && !state.settings.isSfxMuted) sfxBuyEl.play().catch(()=>{});
          ActionDispatcher.dispatch('BUY_BOARD', { level: data.level, idx: data.idx });
        });
      } else {
        // 抖動搖晃動畫 (表示籌碼不足)
        gsap.to(hitObj.position, { x: hitObj.position.x + 0.2, duration: 0.05, yoyo: true, repeat: 3 });
        document.getElementById('error-msg').textContent = '⚠️ 籌碼或生產力不足以收購此產業！';
        setTimeout(() => { document.getElementById('error-msg').textContent = ''; }, 2000);
      }
    }
  }
}

// ==========================================
// 5. 核心 3D 特效：升空翻滾拋物線飛入手袋
// ==========================================
function trigger3DCardFlight(cardId, providesColor, onCompleteCallback) {
  const mesh = meshCardsMap.get(cardId);
  if (!mesh || mesh.userData.purchased) { if(onCompleteCallback) onCompleteCallback(); return; }

  mesh.userData.purchased = true;
  
  // 計算拋物線起終點
  const startX = mesh.position.x;
  const startY = mesh.position.y;
  const startZ = mesh.position.z;

  // 定義墜入螢幕下方手袋的 3D 座標終點 (靠近相機底部偏低位置)
  const targetX = camera.position.x;
  const targetY = camera.position.y - 7.0; 
  const targetZ = camera.position.z - 2.0;

  const animationObj = { t: 0 };

  gsap.to(animationObj, {
    t: 1.0,
    duration: 0.85,
    ease: "power2.inOut",
    onUpdate: () => {
      const currT = animationObj.t;
      // 直線插值
      mesh.position.x = startX + (targetX - startX) * currT;
      mesh.position.z = startZ + (targetZ - startZ) * currT;
      
      // Y 軸拋物線拱起
      const arc = 5.0 * Math.sin(currT * Math.PI);
      mesh.position.y = (startY + (targetY - startY) * currT) + arc;

      // 自轉翻滾
      mesh.rotation.y += 0.12;
      mesh.rotation.z += 0.06;

      // 墜入金庫時縮小淡出
      if (currT > 0.4) {
        const factor = (currT - 0.4) * 1.66;
        mesh.scale.set(1.0 - factor, 1.0 - factor, 1.0 - factor);
      }
    },
    onComplete: () => {
      scene.remove(mesh);
      meshCardsMap.delete(cardId);
      // 特效結束後回調，正式把通知傳給後端 state.js 做扣款更新
      if(onCompleteCallback) onCompleteCallback();
    }
  });
}

// ==========================================
// 6. 全域 3D 模型渲染同步器 (取代原 2D Board HTML)
// ==========================================
window.render = function() {
  if (!CoreState || !scene) return;
  const fullState = CoreState.get();
  const player = fullState.player;

  document.getElementById('turn-txt').textContent = fullState.turn;
  document.getElementById('score-txt').textContent = player.score;

  const isSingleMode = fullState.mode === 'singlePlayer';
  const isvsAI = fullState.mode === 'vsAI';
  const isStoryMode = fullState.mode === 'storyMode';
  const isPlayerTurn = fullState.currentTurnOwner === 'player';

  document.getElementById('ai-dashboard-box').style.display = isvsAI ? 'block' : 'none';
  
  // 更新動態頂部橫幅
  const bannerZone = document.getElementById('dynamic-banner-zone');
  const bannerBadge = document.getElementById('dynamic-banner-badge');
  const bannerText = document.getElementById('dynamic-banner-text');

  if (bannerZone && bannerBadge && bannerText) {
    if (isvsAI) { bannerZone.style.display = 'none'; } else {
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
          bannerBadge.textContent = `第 ${currentLvl} 關 任務`;
          bannerText.innerHTML = `<span style="color:#ffe099; font-weight:800;">⚔️【${mission.name}】</span> 點擊桌面對應 3D 卡牌挑戰！`;
        }
      }
    }
  }

  // 同步下方 2D 背包資產
  renderDashboardGems('res-layer', player, null);
  if (isvsAI) {
    document.getElementById('ai-score-txt').textContent = fullState.ai.score;
    renderDashboardGems('ai-res-layer', fullState.ai, null);
  }
  document.getElementById('cap-txt').textContent = `背包: ${Object.values(player.tokens).reduce((a,b)=>a+b,0)} / 10`;

  // ── 3D 同步核心：發展卡矩陣 ──
  clickable3DObjects = [];
  const levels = ['lv1', 'lv2', 'lv3'];
  const spacingX = 3.6;
  const spacingZ = -3.8;

  levels.forEach((level, lIdx) => {
    document.getElementById(`deck-${level}-txt`).textContent = `剩餘: ${fullState.decks[level].length}`;
    
    fullState.board[level].forEach((card, cIdx) => {
      if (!card) return;

      // 如果該卡牌尚未建立 3D Mesh，在空間中生成它
      if (!meshCardsMap.has(card.id)) {
        const cardGeo = new THREE.BoxGeometry(2.2, 3.0, 0.1);
        const cardMat = new THREE.MeshStandardMaterial({ 
          color: GEM_HEX_COLORS[card.provides], 
          roughness: 0.3,
          metalness: 0.2
        });
        const cardMesh = new THREE.Mesh(cardGeo, cardMat);
        
        // 平躺於桌面
        cardMesh.rotation.x = -Math.PI / 2;
        const px = -5.4 + cIdx * spacingX;
        const pz = 1.0 + lIdx * spacingZ;
        cardMesh.position.set(px, -1.1, pz);

        // 附加立體指示頂球 (代表產出寶石)
        const topSphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const topSphereMat = new THREE.MeshStandardMaterial({ color: GEM_HEX_COLORS[card.provides], emissive: GEM_HEX_COLORS[card.provides], emissiveIntensity: 0.3 });
        const topSphere = new THREE.Mesh(topSphereGeo, topSphereMat);
        topSphere.position.set(0, 1.1, 0.15);
        cardMesh.add(topSphere);

        cardMesh.userData = { type: 'card', cardId: card.id, cardData: card, level, idx: cIdx, purchased: false };
        scene.add(cardMesh);
        meshCardsMap.set(card.id, cardMesh);
      }
      
      const currentMesh = meshCardsMap.get(card.id);
      if (currentMesh && !currentMesh.userData.purchased) {
        clickable3DObjects.push(currentMesh);
      }
    });
  });

  // ── 3D 同步核心：前排原石籌碼 ──
  const gemColors = ['w', 'u', 'g', 'r', 'k'];
  gemColors.forEach((color, idx) => {
    if (!meshGemsMap.has(color)) {
      const gemGeo = new THREE.OctahedronGeometry(0.7, 0);
      const gemMat = new THREE.MeshStandardMaterial({ 
        color: GEM_HEX_COLORS[color], 
        roughness: 0.1, 
        metalness: 0.6 
      });
      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      gemMesh.position.set(-6.0 + idx * 3.0, -0.4, 6.0);
      gemMesh.userData = { type: 'gem', color: color };
      
      scene.add(gemMesh);
      meshGemsMap.set(color, gemMesh);
    }
    const gMesh = meshGemsMap.get(color);
    clickable3DObjects.push(gMesh);
    
    // 如果籌碼庫存為 0，令其半透明
    gMesh.material.transparent = true;
    gMesh.material.opacity = fullState.bank[color] > 0 ? 1.0 : 0.25;
  });

  // 同步左側直排交易局 HTML 面板狀態點亮
  const unifiedBankLayer = document.getElementById('unified-bank-selectors');
  if (unifiedBankLayer) {
    unifiedBankLayer.innerHTML = ['w', 'u', 'g', 'r', 'k', 'o'].map(k => {
      const isGold = (k === 'o');
      const alreadySelected = isGold ? false : fullState.selectedDiff?.includes(k) || fullState.selectedSame === k;
      return `
        <div class="token-container-cell" style="justify-content: space-between; width: 100%; padding: 2px 6px; background: rgba(0,0,0,0.2); border-radius: 4px;">
          <button class="token-btn ${GEM_BTN_CLASSES[k]} ${alreadySelected ? 'selected' : ''}" style="width:22px; height:22px; margin:0;" ${isGold ? 'disabled' : ''} onclick="window.handleBankGemClick('${k}')"></button>
          <span class="token-count-label" style="font-size:0.6rem; color:#ffe099;">${isGold ? '金' : '庫'}:${fullState.bank[k]}</span>
        </div>
      `;
    }).join('');
  }

  // 保留契約區 DOM 渲染同步保持不變
  const resLayerReserved = document.getElementById('reserved-layer');
  if (player.reserved.length === 0) {
    resLayerReserved.innerHTML = `<div class="card empty" style="grid-column: span 4; height:100%;">🔒 3D 保密手牌空缺</div>`;
  } else {
    resLayerReserved.innerHTML = [0, 1, 2, 3].map(i => {
      const card = player.reserved[i];
      if (!card) return '';
      const afford = GameEngine.canAffordCard(player.bonus, player.tokens, card.cost);
      return `
        <div class="card" style="height: auto;">
          <div class="card-content-wrapper">
            <div class="card-top"><span class="card-pts">${card.points || ''}</span><div class="card-gem-icon ${GEM_CLASSES[card.provides]}"></div></div>
            <div class="card-actions"><button class="btn-card" ${!isPlayerTurn || !afford.affordable ? 'disabled' : ''} onclick="buyReservedCard(${i})">收購</button></div>
          </div>
        </div>
      `;
    }).join('');
  }

  let selectedCount = (fullState.selectedDiff?.length || 0) || (fullState.selectedSame ? 1 : 0);
  document.getElementById('btn-do-diff').disabled = !(isPlayerTurn && selectedCount >= 1);
  document.getElementById('btn-do-same').disabled = !(isPlayerTurn && fullState.selectedSame);
};

// ==========================================
// 7. 3D 動畫主迴圈：提供呼吸感震盪律動與自轉
// ==========================================
function animate3DLoop() {
  requestAnimationFrame(animate3DLoop);
  if (!scene) return;

  const time = performance.now() * 0.001;

  // 前排籌碼原石高階自轉與浮動
  meshGemsMap.forEach((gemMesh, color) => {
    gemMesh.rotation.y += 0.015;
    gemMesh.rotation.z = Math.sin(time * 0.8) * 0.1;
    gemMesh.position.y = -0.4 + Math.sin(time * 2.0 + color.charCodeAt(0)) * 0.05;
  });

  // 桌面卡牌未購置時的微幅呼吸感
  meshCardsMap.forEach((cardMesh) => {
    if (!cardMesh.userData.purchased) {
      cardMesh.position.y = -1.1 + Math.sin(time * 1.5 + cardMesh.userData.cardId) * 0.02;
    }
  });

  renderer.render(scene, camera);
}

// ── 基礎共用輔助模組函式與視窗自適應 ──
function onWindowResize() {
  if(!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.handleBankGemClick = function(color) {
  if (CoreState.get().currentTurnOwner !== 'player') return;
  const state = CoreState.get();
  if (state.selectedSame && state.selectedSame !== color) state.selectedSame = null;
  const diffIdx = state.selectedDiff.indexOf(color);
  if (diffIdx > -1) { state.selectedDiff.splice(diffIdx, 1); } else {
    if (state.selectedDiff.length === 0 && state.selectedSame === color) { state.selectedDiff.push(color); state.selectedSame = null; } 
    else { if (state.selectedDiff.length >= 3) state.selectedDiff.shift(); state.selectedDiff.push(color); }
    if (state.selectedDiff.length === 1) state.selectedSame = color; else state.selectedSame = null;
  }
  render();
};

window.playUniformSfx = () => { if (sfxSelectEl && !CoreState.get().settings.isSfxMuted) sfxSelectEl.play().catch(()=>{}); };
window.handleDoDiffClick = () => { const c = [...CoreState.get().selectedDiff]; CoreState.get().selectedDiff = []; CoreState.get().selectedSame = null; ActionDispatcher.dispatch('TAKE_DIFF', { colors: c }); };
window.handleDoSameClick = () => { const c = CoreState.get().selectedSame; CoreState.get().selectedSame = null; CoreState.get().selectedDiff = []; ActionDispatcher.dispatch('TAKE_SAME', { color: c }); };
window.buyReservedCard = (idx) => { ActionDispatcher.dispatch('BUY_RESERVED', { idx }); };
window.openGameOptionsModal = () => document.getElementById('game-options-modal').classList.add('show');
window.closeGameOptionsModal = () => document.getElementById('game-options-modal').classList.remove('show');
window.startFloatingTutorial = () => { document.getElementById('floating-tutorial-widget').style.display = 'block'; showStepData(0); };
window.hideWelcomeModal = () => { document.getElementById('welcome-back-modal').style.display = 'none'; if(audioEl) audioEl.play().catch(()=>{}); };

function showStepData(idx) {
  currentTutorialStep = idx; const step = TUTORIAL_STEPS_DATA[idx];
  if(step) {
    document.getElementById('floating-tutorial-widget-header').textContent = step.title;
    document.getElementById('floating-tutorial-text').textContent = step.text;
  }
  document.getElementById('floating-tutorial-next-btn').textContent = idx === TUTORIAL_STEPS_DATA.length - 1 ? "開始對局" : "下一步";
}
window.nextFloatingStep = () => { if (currentTutorialStep < TUTORIAL_STEPS_DATA.length - 1) showStepData(currentTutorialStep + 1); else document.getElementById('floating-tutorial-widget').style.display = 'none'; };

window.addEventListener('DOMContentLoaded', async () => {
  audioEl = document.getElementById('bg-music'); sfxSelectEl = document.getElementById('sfx-select'); sfxBuyEl = document.getElementById('sfx-buy');
  await loadCoreModules();
  document.getElementById('welcome-back-modal').classList.add('show');
});

// 視覺小說故事劇場模組 完整保留對接
window.storyModule = {
    gameStages: { 1: { chapter: "👑 第一章：3D 礦脈", title: "第 1 關", bg: "進入立體視覺會堂...", condition: "累積 15 分", name: "傑洛米", text: "歡迎來到全新的 3D 殿堂！" } },
    loadStage(id, cb) { const layer = document.getElementById("story-layer"); if(layer) layer.classList.add('story-active'); if(cb) cb(); },
    nextDialogue() { document.getElementById("story-layer").classList.remove('story-active'); }
};
