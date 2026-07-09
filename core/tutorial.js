// ============================================================
//  core/tutorial.js  v3
//  注意：此檔案用 <script src="core/tutorial.js"></script>
//  「不加 type=module」載入，才能讓 window.startFloatingTutorial
//  在全域被 game.js 呼叫到
// ============================================================

(function () {

// ── 立繪 ─────────────────────────────────────────────────────
var CHAR_IMG = 'https://i.ibb.co/39L2xNMT/1.png';

// ── 語音佔位（後補真實 URL，換這裡即可） ────────────────────
var VOICE = 'https://assets.mixkit.co/active_storage/sfx/380/380-preview.mp3';
var VOICE01 = 'https://files.catbox.moe/cfx2qo.mp3';
var VOICE02 = 'https://files.catbox.moe/avkjuo.mp3';

// ── 步驟資料 ─────────────────────────────────────────────────
// 粗體：用 [[文字]] 標記，渲染時自動變金色粗體
// el   : CSS 選擇器，null = 不高亮
// color: 光圈顏色
var STEPS = [
  // 階段一：認識環境（敘述）
  { phase:'階段一：認識環境',
    text:'嗨！我是你的貿易顧問翠席兒。',
    el:null, color:null, voice:VOICE01 },

  { phase:'階段一：認識環境',
    text:'歡迎來到黃家寶石交易殿堂。',
    el:null, color:null, voice:VOICE02 },

  { phase:'階段一：認識環境',
    text:'今天我們的目標很簡單：在 [[28 回合]] 內拿到 [[15 分威望]]，贏下這場比賽！這次不用光聽我說——[[我教一步，你就實際操作一步]]！',
    el:null, color:null, voice:VOICE },

  { phase:'階段一：認識環境',
    text:'首先，這裡可以看目前第幾回合，還有你現在拿到了幾分。',
    el:'.status-bar', color:'#d4af37', voice:VOICE },

  { phase:'階段一：認識環境',
    text:'中間這三大排卡片就是我們要搶購的產業，每張卡片上面的寶石就是你購買此卡需要花的 [[籌碼費用]]！',
    el:'#guide-matrix', color:'#2ecc71', voice:VOICE },

  // 階段二：拿取籌碼（實戰）
  { phase:'階段二：拿取籌碼',
    text:'沒有本金不能做生意。接下來換你動手！',
    el:null, color:null, voice:VOICE },

  { phase:'階段二：拿取籌碼',
    text:'請在左側銀行點選 [[3 種不同顏色]] 的寶石，然後按下確認拿取！',
    el:'#guide-actions', color:'#e74c3c', voice:VOICE,
    task:{ goal:'🎯 任務：拿取 3 顆不同顏色的寶石籌碼', type:'diff3' } },

  { phase:'階段二：拿取籌碼',
    text:'漂亮！拿到的籌碼都放進你底部的金庫了。[[大數字是寶石數量，小數字是買到的卡片數量]]。記住，身上最多只能塞 [[10 顆寶石]]，拿太多會放不下！',
    el:'#guide-dashboard .dashboard', color:'#ffcc00', voice:VOICE },

  { phase:'階段二：拿取籌碼',
    text:'還有另一種拿法：[[連點同一種顏色兩下]]，一次帶走 [[2 顆相同]] 的寶石（該色庫存需 2 顆以上）。試試看！',
    el:'#guide-actions', color:'#e74c3c', voice:VOICE,
    task:{ goal:'🎯 任務：一次拿取 2 顆相同顏色的寶石', type:'same2' } },

  // 階段三：收購與保留（實戰）
  { phase:'階段三：收購與保留',
    text:'做得好！注意看牌桌：只要你身上的籌碼夠多，買得起的卡片就會亮起 [[收購]] 字樣。[[寶石卡片本身還能讓你以後買卡永久減免 1 顆相同顏色的成本]]！',
    el:'#guide-matrix', color:'#d4af37', voice:VOICE },

  { phase:'階段三：收購與保留',
    text:'如果想買的卡片怕被搶走，可以先鎖起來。請挑一張喜歡的卡片，點擊 [[保留]]！保留還能免費拿到 [[1 顆萬能的黃金籌碼]]（當作任何顏色的百搭寶石）。',
    el:'#guide-matrix', color:'#9b59b6', voice:VOICE,
    task:{ goal:'🎯 任務：保留任意一張卡片（獲得 1 顆黃金）', type:'reserve' } },

  { phase:'階段三：收購與保留',
    text:'這張卡已收進你的手牌區，隨時可以回來買它。要注意的是，不論「拿寶石」、「買卡」或「保留卡片」，[[都計算一個回合]] 喲！',
    el:'#guide-reserved', color:'#9b59b6', voice:VOICE },

  { phase:'階段三：收購與保留',
    text:'現在你手上有寶石又有黃金了！去買下第一張產業吧：點擊任何亮起 [[收購]] 的卡片。如果暫時都買不起，就再多拿幾回合寶石湊錢。',
    el:'#guide-matrix', color:'#d4af37', voice:VOICE,
    task:{ goal:'🎯 任務：成功收購 1 張卡片（買不起就先多拿寶石）', type:'buy' } },

  // 階段四：貴族拜訪（敘述）
  { phase:'階段四：貴族拜訪',
    text:'恭喜完成第一筆收購！當你買下的卡片累積到對應貴族卡顯示的顏色數量，頂層的領主貴族就會 [[自動前來拜訪]]，免費送你 [[3 分]]！',
    el:'.nobles-section', color:'#3498db', voice:VOICE },

  // 階段五：輔助官特技（敘述）
  { phase:'階段五：輔助官特技',
    text:'最後，我有強大的隨行特技（像是幫你降低成本或擴大背包）。基礎你都親手練過了，點擊下方按鈕，我們出發去 [[橫掃戰場]] 吧！',
    el:null, color:null, voice:VOICE }
];

// ── 狀態 ─────────────────────────────────────────────────────
var T = {
  active: false, idx: 0,
  prevEl: null,
  typeTimer: null, fullText: '', charN: 0, isTyping: false,
  voiceEl: null,
  taskTimer: null,     // 任務輪詢計時器
  taskBase: null,      // 任務開始時的玩家狀態基準
  taskDone: false      // 目前任務是否完成
};

// ── 粗體解析：[[文字]] → <strong> ────────────────────────────
function parseBold(text) {
  return text.replace(/\[\[([^\]]+)\]\]/g,
    '<strong style="color:#ffe099;font-weight:800;">$1</strong>');
}

// ── 高亮目標元素 ──────────────────────────────────────────────
function doHighlight(sel, color) {
  if (T.prevEl) {
    T.prevEl.style.outline      = '';
    T.prevEl.style.outlineOffset= '';
    T.prevEl.style.boxShadow    = T.prevEl._os || '';
    T.prevEl.style.zIndex       = T.prevEl._oz || '';
    T.prevEl.style.position     = T.prevEl._op || ''; // ✨ 清除自訂 position
    T.prevEl.style.isolation    = T.prevEl._oi || ''; // ✨ 清除自訂 isolation
    T.prevEl = null;
  }
  if (!sel) return;
  var el = document.querySelector(sel);
  if (!el) return;
  T.prevEl = el;
  el._os = el.style.boxShadow;
  el._oz = el.style.zIndex;
  el._op = el.style.position;
  el._oi = el.style.isolation;
  
  var goldColor = '#ffcc00'; 
  
  // ✨ 任務步驟採用較淺暗幕，讓玩家看清整個牌桌並可自由操作；講解步驟維持原本聚焦暗度
  var isTaskStep = STEPS[T.idx] && STEPS[T.idx].task;
  var dimAlpha = isTaskStep ? 0.35 : 0.78;
  el.style.outline       = '3px solid ' + goldColor;
  el.style.outlineOffset = '4px';
  el.style.boxShadow     = '0 0 0 4px rgba(255,204,0,0.2), 0 0 25px rgba(255,204,0,0.65), 0 0 0 9999px rgba(5,3,2,' + dimAlpha + ')';
  
  // ✨ 修正 2：層級與堆疊歸一化！強行加入 position 與 isolation，確保底部的金庫、牌庫能突破 Flex 容器邊界，完美浮出至最上層
  el.style.position      = 'relative';
  el.style.isolation     = 'isolate';
  el.style.zIndex        = '10000001'; 
  
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearHighlight() {
  if (T.prevEl) {
    T.prevEl.style.outline      = '';
    T.prevEl.style.outlineOffset= '';
    T.prevEl.style.boxShadow    = T.prevEl._os || '';
    T.prevEl.style.zIndex       = T.prevEl._oz || '';
    T.prevEl = null;
  }
}

function calcLayout(step) {
  var boxEl  = document.getElementById('tut-box');
  var charEl = document.getElementById('tut-char-wrapper');
  if (!boxEl || !charEl) return;

  var vw = window.innerWidth, vh = window.innerHeight;
  var mob = vw <= 430;

  function clr(el) {
    ['top','bottom','left','right','transform'].forEach(function(p){ el.style[p]=''; });
  }

  // 預設：置中下方
  function setDefault() {
    clr(boxEl); clr(charEl);
    boxEl.style.bottom    = '22px';
    boxEl.style.left      = '50%';
    boxEl.style.transform = 'translateX(-50%)';
    charEl.style.bottom   = mob ? '195px' : '215px';
    charEl.style.left     = mob ? '10px'  : '50%';
    charEl.style.transform = mob ? 'none' : 'translateX(-340px)';
  }

  if (!step || !step.el || step.el === '') { setDefault(); return; }
  var el = document.querySelector(step.el);
  if (!el) { setDefault(); return; }

  var rect  = el.getBoundingClientRect();
  var targetCenterX = rect.left + rect.width / 2;
  var targetCenterY = rect.top + rect.height / 2;
  var upper = targetCenterY < vh * 0.52;
  var isLeft = targetCenterX < vw * 0.5;
  
  clr(boxEl); clr(charEl);

  // 1. 【對話框智慧貼邊定位】
  var boxTop, boxBottom;
  if (upper) {
    boxTop = rect.bottom + 12;
    if (rect.top < 30) {
      boxTop = rect.bottom + 55; 
    }
    boxEl.style.top = boxTop + 'px'; 
    boxEl.style.bottom = 'auto';
  } else {
    boxBottom = vh - rect.top + 12;
    boxEl.style.bottom = boxBottom + 'px'; 
    boxEl.style.top = 'auto';
  }
  boxEl.style.left      = '50%';
  boxEl.style.transform = 'translateX(-50%)';

  // 2. 【立繪完美連接與後層遮擋計算】
  var boxW = boxEl.offsetWidth || 360; 
  var charH = charEl.offsetHeight || 260; // 獲取放大後的立繪高度
  
  /* 垂直重疊量由原先的 20px~35px 加深至 200px，強制讓大立繪下半身 1/3 被蓋在對話框後面 */
if (upper) {
  charEl.style.top = (boxTop - charH + 200) + 'px';
  charEl.style.bottom = 'auto';
} else {
  charEl.style.bottom = (boxBottom - charH + 200) + 'px';
  charEl.style.top = 'auto';
}

// 3. 【大立繪 X 軸水平貼合】
  if (mob) {
    charEl.style.left = '-40px'; 
    charEl.style.right = 'auto';
 } else {
    // 電腦版：智慧避讓邏輯（對話框置中在 vw/2，寬度左右各半為 boxW/2）
    // ✨ 修改這裡：加入特例判斷，如果介紹的目標是金庫相關元素，直接視同 isLeft = true 丟到右邊避讓
   /* 💡 保持原樣不變：因為我們新的選擇器依然含有 'dashboard' 字眼，判定會完美成立，立繪會乖乖待在右側 */
    var isDashboard = step.el && (step.el.indexOf('dashboard') !== -1 || step.el.indexOf('bank') !== -1);
    
    if (isLeft || isDashboard) {
      // 💡 當要介紹的區域在左邊，或是正在介紹金庫：大立繪自動改貼在對話框的「右側」
      // 修正：算式改用對話框右邊緣 (vw/2 + boxW/2) 減去 230px 的重疊量，讓立繪左側邊界無縫貼齊對話框
      var charRightSide = (vw / 2) + (boxW / 2) - 230;
      
      charEl.style.left = charRightSide + 'px';
      charEl.style.right = 'auto';
    } else {
      // 💡 當要介紹的區域在右邊（或預設）：大立繪保持貼在對話框的「左側」
      // 計算位置：對話框左邊緣 (vw/2 - boxW/2) 再往左推開立繪寬度並保留重疊量 (-380px)
      var charLeftSide = (vw / 2) - (boxW / 2) - 380; 
      if (charLeftSide < 5) charLeftSide = 5; // 螢幕邊界保險
      
      charEl.style.left = charLeftSide + 'px';
      charEl.style.right = 'auto';
    }
  }
  charEl.style.transform = 'none';
}

// ── 🎮 互動任務引擎 ───────────────────────────────────────────
var GEMS = ['w','u','g','r','k'];

function snapshotPlayer() {
  try {
    var s = window.CoreState && window.CoreState.get();
    if (!s || !s.player) return null;
    var bonusSum = 0;
    GEMS.forEach(function(c){ bonusSum += (s.player.bonus[c] || 0); });
    return {
      tokens: Object.assign({}, s.player.tokens),
      reserved: (s.player.reserved || []).length,
      bonusSum: bonusSum
    };
  } catch(e) { return null; }
}

function checkTask(type, base) {
  var s = window.CoreState && window.CoreState.get();
  if (!s || !s.player || !base) return false;
  if (type === 'diff3') {
    var inc = 0;
    GEMS.forEach(function(c){
      if ((s.player.tokens[c] || 0) >= (base.tokens[c] || 0) + 1) inc++;
    });
    return inc >= 3;
  }
  if (type === 'same2') {
    return GEMS.some(function(c){
      return (s.player.tokens[c] || 0) >= (base.tokens[c] || 0) + 2;
    });
  }
  if (type === 'reserve') {
    return (s.player.reserved || []).length > base.reserved;
  }
  if (type === 'buy') {
    var sum = 0;
    GEMS.forEach(function(c){ sum += (s.player.bonus[c] || 0); });
    return sum > base.bonusSum;
  }
  return false;
}

function stopTaskWatch() {
  if (T.taskTimer) { clearInterval(T.taskTimer); T.taskTimer = null; }
}

function startTaskWatch(step) {
  stopTaskWatch();
  T.taskDone = false;
  T.taskBase = snapshotPlayer();

  T.taskTimer = setInterval(function() {
    if (!T.active) { stopTaskWatch(); return; }

    // 遊戲重繪可能替換掉被高亮的元素，遺失時重新套用光圈
    if (step.el) {
      var cur = document.querySelector(step.el);
      if (cur && cur !== T.prevEl) doHighlight(step.el, step.color);
    }

    if (!T.taskDone && checkTask(step.task.type, T.taskBase)) {
      T.taskDone = true;
      stopTaskWatch();
      onTaskComplete();
    }
  }, 300);
}

function onTaskComplete() {
  // ✔ 成功回饋：對話框閃出完成訊息 + 音效，稍後自動進入下一步
  var txtEl = document.getElementById('tut-dialogue-text');
  clearTimeout(T.typeTimer); T.isTyping = false;
  if (txtEl) txtEl.innerHTML =
    '<span style="color:#2ecc71;font-weight:900;font-size:1.15rem;">✔ 任務完成！幹得漂亮！</span>';
  var goalEl = document.getElementById('tut-task-goal');
  if (goalEl) { goalEl.style.color = '#2ecc71'; goalEl.textContent = '✔ 已完成'; }
  try {
    var sfx = document.getElementById('sfx-buy');
    if (sfx && !(window.settings && window.settings.isSfxMuted)) {
      sfx.currentTime = 0; sfx.play().catch(function(){});
    }
  } catch(e) {}
  setTimeout(function() {
    if (!T.active) return;
    T.idx++;
    renderStep();
  }, 1100);
}

// 任務卡關保險：跳過目前任務
function skipCurrentTask() {
  var step = STEPS[T.idx];
  if (!step || !step.task || T.taskDone) return;
  stopTaskWatch();
  T.taskDone = true;
  T.idx++;
  renderStep();
}

// 依步驟切換「教學講解 / 實戰任務」兩種介面模式
function setTaskMode(on, step) {
  var ov = document.getElementById('tut-overlay');
  var nextBtn = document.getElementById('tut-next-btn');
  var hint = document.getElementById('tut-hint');
  var goalEl = document.getElementById('tut-task-goal');
  var skipTaskBtn = document.getElementById('tut-task-skip');
  var charEl = document.getElementById('tut-char-wrapper');

  if (on) {
    if (ov) ov.classList.add('task-mode');            // 背景放行點擊、取消變暗
    if (nextBtn) nextBtn.style.display = 'none';       // 任務中不能用按鈕跳過
    if (hint) hint.style.display = 'none';
    if (goalEl) {
      goalEl.style.display = 'block';
      goalEl.style.color = '#ffe099';
      goalEl.textContent = step.task.goal;
    }
    if (skipTaskBtn) skipTaskBtn.style.display = 'inline-block';
    if (charEl) charEl.classList.add('task-shrink');   // 立繪縮小避免擋住牌桌
  } else {
    if (ov) ov.classList.remove('task-mode');
    if (nextBtn) nextBtn.style.display = '';
    if (hint) hint.style.display = '';
    if (goalEl) goalEl.style.display = 'none';
    if (skipTaskBtn) skipTaskBtn.style.display = 'none';
    if (charEl) charEl.classList.remove('task-shrink');
  }
}

// ── 打字機 ────────────────────────────────────────────────────
function typewrite(html) {
  clearTimeout(T.typeTimer);
  T.fullText = html; T.charN = 0; T.isTyping = true;
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var plain = tmp.textContent;
  var el = document.getElementById('tut-dialogue-text');
  if (el) el.innerHTML = '';

  function tick() {
    if (!T.active) return;
    if (T.charN < plain.length) {
      T.charN++;
      if (el) el.textContent = plain.slice(0, T.charN);
      T.typeTimer = setTimeout(tick, 26);
    } else {
      if (el) el.innerHTML = html;
      T.isTyping = false;
    }
  }
  tick();
}

function skipType() {
  clearTimeout(T.typeTimer);
  T.isTyping = false;
  var el = document.getElementById('tut-dialogue-text');
  if (el) el.innerHTML = T.fullText;
}

// ── 語音 ─────────────────────────────────────────────────────
function playVoice(url) {
  if (!url) return;
  if (!T.voiceEl) T.voiceEl = new Audio();
  try {
    T.voiceEl.pause();
    T.voiceEl.src = url;
    T.voiceEl.currentTime = 0;
    T.voiceEl.play().catch(function(){});
  } catch(e) {}
}

// ── 進度點 ────────────────────────────────────────────────────
function updateDots() {
  var c = document.getElementById('tut-dots');
  if (!c) return;
  c.innerHTML = STEPS.map(function(_, i) {
    var w  = i === T.idx ? 18 : 7;
    var bg = i === T.idx ? '#d4af37' : i < T.idx ? '#6a5a2e' : '#2a2420';
    return '<span style="display:inline-block;width:' + w + 'px;height:7px;' +
           'border-radius:4px;background:' + bg + ';transition:all 0.3s;"></span>';
  }).join('');
}

// ── 渲染步驟 ─────────────────────────────────────────────────
function renderStep() {
  var step = STEPS[T.idx];
  if (!step) return;

  var phaseEl = document.getElementById('tut-phase-label');
  if (phaseEl) phaseEl.textContent = step.phase;

  // 淡出 → 移位 → 淡入
  var boxEl  = document.getElementById('tut-box');
  var charEl = document.getElementById('tut-char-wrapper');
  if (boxEl)  boxEl.style.opacity  = '0';
  if (charEl) charEl.style.opacity = '0';
  setTimeout(function() {
    calcLayout(step);
    if (boxEl)  boxEl.style.opacity  = '1';
    if (charEl) charEl.style.opacity = '1';
  }, 160);

  doHighlight(step.el, step.color);
  typewrite(parseBold(step.text));
  updateDots();

  // 🎮 任務步驟：切換為實戰模式並開始偵測玩家操作
  stopTaskWatch();
  if (step.task) {
    setTaskMode(true, step);
    startTaskWatch(step);
  } else {
    setTaskMode(false, step);
  }

  var btn = document.getElementById('tut-next-btn');
  if (btn) btn.textContent = T.idx === STEPS.length - 1 ? '🎉 開始對局！' : '下一步 ▶';

  var img = document.getElementById('tut-char-img');
  if (img) {
    img.style.animation = 'none';
    void img.offsetWidth;
    img.style.animation = 'tutCharPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards';
  }

  playVoice(step.voice);
}

// ── 下一步 ───────────────────────────────────────────────────
function tutNext() {
  if (!T.active) return;
  if (T.isTyping) { skipType(); return; }
  var step = STEPS[T.idx];
  if (step && step.task && !T.taskDone) return; // 任務中：需實際完成操作才前進
  if (T.idx >= STEPS.length - 1) { tutClose(); return; }
  T.idx++;
  renderStep();
}

// ── 關閉 ─────────────────────────────────────────────────────
function tutClose() {
  T.active = false;
  clearTimeout(T.typeTimer);
  stopTaskWatch();
  setTaskMode(false, null);
  if (T.voiceEl) T.voiceEl.pause();
  clearHighlight();

  var ov = document.getElementById('tut-overlay');
  if (ov) {
    ov.style.opacity      = '0';
    ov.style.pointerEvents= 'none';
    setTimeout(function(){ ov.style.display = 'none'; }, 380);
  }
  document.getElementById('welcome-back-modal') &&
    document.getElementById('welcome-back-modal').classList.remove('show');
  document.getElementById('tutorial-start-modal') &&
    document.getElementById('tutorial-start-modal').classList.remove('show');

  try { localStorage.setItem('splendor_tutorial_seen', '1'); } catch(e) {}
}

// ── 開啟 ─────────────────────────────────────────────────────
function tutOpen() {
  if (!document.getElementById('tut-overlay')) buildDOM();
  T.active = true;
  T.idx    = 0;
  T.prevEl = null;
  T.taskDone = false;
  stopTaskWatch();

  var ov = document.getElementById('tut-overlay');
  ov.style.display      = 'flex';
  ov.style.pointerEvents= 'auto';
  void ov.offsetWidth;
  ov.style.opacity = '1';

  renderStep();
}

// ── 建立 DOM ─────────────────────────────────────────────────
function buildDOM() {
  if (document.getElementById('tut-overlay')) return;

  if (!document.getElementById('tut-css')) {
    var s = document.createElement('style');
    s.id = 'tut-css';
    s.textContent = [
      '#tut-overlay{position:fixed;inset:0;z-index:10000010;display:none;opacity:0;',
      'pointer-events:none;transition:opacity 0.35s ease;',
      'background:linear-gradient(to top,rgba(5,3,2,0.95) 0%,rgba(5,3,2,0.45) 52%,rgba(5,3,2,0.10) 100%);',
      'flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:20px;',
      'font-family:"Microsoft JhengHei","Heiti TC","Inter",sans-serif;}',

      '#tut-char-wrapper{position:fixed;width:630px;max-width:85vw;pointer-events:none;',
      'filter:drop-shadow(0 8px 28px rgba(0,0,0,0.9));z-index:10000011;',
      'transition:top 0.3s ease,bottom 0.3s ease,left 0.3s ease,right 0.3s ease,opacity 0.3s ease,transform 0.3s ease;}',
      '#tut-char-img{width:100%;object-fit:contain;display:block;}',
      '@keyframes tutCharPop{',
      '0%{transform:translateY(14px) scale(0.95);opacity:0.6;}',
      '60%{transform:translateY(-5px) scale(1.03);opacity:1;}',
      '100%{transform:translateY(0) scale(1);opacity:1;}}',

      '#tut-phase-label{position:fixed;top:18px;right:18px;z-index:10000015;',
      'font-family:"Cinzel",serif;font-size:0.72rem;font-weight:700;color:#d4af37;',
      'background:rgba(0,0,0,0.72);border:1px solid rgba(212,175,55,0.35);',
      'border-radius:4px;padding:4px 12px;letter-spacing:0.06em;}',

      '#tut-skip-btn{position:fixed;top:16px;left:16px;z-index:10000015;',
      'background:rgba(0,0,0,0.58);border:1px solid rgba(212,175,55,0.25);',
      'color:#968a7f;border-radius:4px;padding:4px 14px;font-size:0.7rem;cursor:pointer;transition:all 0.2s;}',
      '#tut-skip-btn:hover{color:#ffe099;border-color:#d4af37;}',

      '#tut-box{position:fixed;z-index:10000012;width:88%;max-width:620px;',
      'background:rgba(4,6,10,0.97);border:2px solid #d4af37;',
      'box-shadow:0 0 32px rgba(212,175,55,0.2),0 20px 50px rgba(0,0,0,0.95);',
      'border-radius:12px;padding:22px 24px 16px;cursor:pointer;user-select:none;',
      'transition:top 0.32s ease,bottom 0.32s ease,left 0.32s ease,opacity 0.18s ease;}',

      '#tut-name-tag{position:absolute;top:-34px;left:24px;',
      'background:linear-gradient(135deg,#d4af37,#ffe099,#aa7c11);',
      'color:#000;padding:6px 24px;font-weight:900;border-radius:6px 6px 0 0;',
      'font-size:1.05rem;box-shadow:0 -4px 14px rgba(0,0,0,0.5);',
      'font-family:"Cinzel",serif;letter-spacing:0.05em;}',

      '#tut-dialogue-text{font-size:1.0rem;line-height:1.8;color:#f1f2f6;',
      'letter-spacing:0.5px;min-height:3.2em;}',

      '#tut-footer{display:flex;justify-content:space-between;align-items:center;margin-top:14px;}',
      '#tut-dots{display:flex;gap:5px;align-items:center;}',
      '#tut-hint{font-size:0.68rem;color:rgba(212,175,55,0.55);',
      'animation:tutHint 1.3s ease-in-out infinite alternate;}',
      '@keyframes tutHint{from{opacity:0.3;}to{opacity:0.9;}}',

      '#tut-next-btn{background:linear-gradient(135deg,#d4af37,#aa7c11);border:none;color:#000;',
      'padding:9px 24px;font-size:0.88rem;font-weight:900;border-radius:6px;cursor:pointer;',
      'font-family:"Cinzel",serif;letter-spacing:0.04em;white-space:nowrap;',
      'box-shadow:0 3px 14px rgba(212,175,55,0.45);transition:filter 0.15s,transform 0.1s;}',
      '#tut-next-btn:hover{filter:brightness(1.15);transform:translateY(-1px);}',
      '#tut-next-btn:active{transform:translateY(1px);}',

      '/* 🎮 實戰任務模式：背景全放行，玩家可直接操作遊戲 */',
      '#tut-overlay.task-mode{background:transparent!important;pointer-events:none!important;}',
      '#tut-overlay.task-mode #tut-box{pointer-events:auto;cursor:default;}',
      '#tut-overlay.task-mode #tut-skip-btn{pointer-events:auto;}',
      '#tut-char-wrapper.task-shrink{width:220px!important;opacity:0.92;}',
      '#tut-task-goal{display:none;margin-top:10px;padding:8px 14px;border-radius:8px;',
      'background:rgba(212,175,55,0.12);border:1px dashed rgba(212,175,55,0.6);',
      'color:#ffe099;font-weight:800;font-size:0.92rem;letter-spacing:0.04em;',
      'animation:tutGoalPulse 1.2s ease-in-out infinite alternate;}',
      '@keyframes tutGoalPulse{from{box-shadow:0 0 0 rgba(212,175,55,0);}to{box-shadow:0 0 16px rgba(212,175,55,0.45);}}',
      '#tut-task-skip{display:none;background:none;border:none;color:#968a7f;',
      'font-size:0.68rem;cursor:pointer;text-decoration:underline;padding:4px 8px;}',
      '#tut-task-skip:hover{color:#ffe099;}',
      '@media(max-width:430px){#tut-char-wrapper.task-shrink{width:110px!important;}}',
      '@media(max-width:430px){',
      '#tut-char-wrapper{width:160px;max-width:42vw;}',
      '#tut-box{padding:16px 14px 13px;}',
      '#tut-dialogue-text{font-size:0.85rem;}',
      '#tut-name-tag{font-size:0.82rem;top:-28px;left:14px;padding:4px 14px;}',
      '#tut-next-btn{padding:7px 16px;font-size:0.75rem;}',
      '#tut-phase-label{font-size:0.58rem;top:12px;right:12px;}}'
    ].join('');
    document.head.appendChild(s);
  }

  var ov = document.createElement('div');
  ov.id = 'tut-overlay';
  ov.innerHTML =
    '<button id="tut-skip-btn" onclick="window.__tut.skip()">✕ 跳過教學</button>' +
    '<div id="tut-phase-label"></div>' +
    '<div id="tut-char-wrapper">' +
      '<img id="tut-char-img" src="' + CHAR_IMG + '" alt="翠席兒">' +
    '</div>' +
    '<div id="tut-box" onclick="window.__tut.next()">' +
      '<div id="tut-name-tag">翠席兒</div>' +
      '<div id="tut-dialogue-text"></div>' +
      '<div id="tut-task-goal"></div>' +
      '<div id="tut-footer">' +
        '<div id="tut-dots"></div>' +
        '<div id="tut-hint">點擊對話框繼續</div>' +
        '<button id="tut-task-skip" onclick="event.stopPropagation();window.__tut.skipTask()">卡關了？跳過此步</button>' +
        '<button id="tut-next-btn" onclick="event.stopPropagation();window.__tut.next()">下一步 ▶</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);
}

// ── 掛到 window（避免 module 作用域問題） ─────────────────────
window.__tut = { next: tutNext, skip: tutClose, skipTask: skipCurrentTask };

window.startFloatingTutorial = function() {
  var sm = document.getElementById('tutorial-start-modal');
  if (sm) sm.classList.remove('show');
  tutOpen();
};

// 相容舊呼叫
window.nextFloatingStep = tutNext;

})(); // end IIFE
