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

// ── 步驟資料 ─────────────────────────────────────────────────
// 粗體：用 [[文字]] 標記，渲染時自動變金色粗體
// el   : CSS 選擇器，null = 不高亮
// color: 光圈顏色
var STEPS = [
  // 階段一
  { phase:'階段一：認識環境',
    text:'嗨！我是你的貿易顧問翠席兒。',
    el:null, color:null, voice:VOICE },

  { phase:'階段一：認識環境',
    text:'今天我們的目標很簡單：在 [[28 回合]] 內拿到 [[15 分威望]]，贏下這場比賽！',
    el:null, color:null, voice:VOICE },

  { phase:'階段一：認識環境',
    text:'首先，這裡可以看目前第幾回合，還有你現在拿到了幾分。',
    el:'.status-bar', color:'#d4af37', voice:VOICE },

  { phase:'階段一：認識環境',
    text:'中間這三大排卡片就是我們要搶購的產業，每張卡片上面的寶石就是你購買此卡需要花的 [[籌碼費用]]！',
    el:'#guide-matrix', color:'#2ecc71', voice:VOICE },

  // 階段二
  { phase:'階段二：拿取籌碼',
    text:'沒有本金不能做生意。',
    el:null, color:null, voice:VOICE },

  { phase:'階段二：拿取籌碼',
    text:'來！請先點擊左邊，一次可以拿 [[3 顆不同顏色]] 或是 [[2 顆相同顏色]] 的寶石籌碼！',
    el:'#guide-actions', color:'#e74c3c', voice:VOICE },

  { phase:'階段二：拿取籌碼',
    text:'拿到的籌碼會放進你底部的金庫。[[大數字是寶石數量，小數字是買到的卡片數量]]。記住，身上最多只能塞 [[10 顆寶石]]，拿太多會放不下！',
    el:'#guide-dashboard', color:'#f1c40f', voice:VOICE },

  // 階段三
  { phase:'階段三：收購與保留',
    text:'注意看！只要你身上的籌碼夠多，買得起的卡片就會亮起 [[收購]] 字樣。',
    el:'#guide-matrix', color:'#d4af37', voice:VOICE },

  { phase:'階段三：收購與保留',
    text:'點擊「收購」買下它！[[寶石卡片本身還能讓你以後買卡永久減免 1 顆相同顏色的成本]]。買越多，後面買卡越便宜！',
    el:'#res-layer', color:'#2ecc71', voice:VOICE },

  { phase:'階段三：收購與保留',
    text:'如果想買的卡片怕被對手搶走，點擊「保留」就能鎖進你的手牌，還能免費拿到 [[1 顆萬能的黃金籌碼]]（當作任何顏色的百搭寶石）！',
    el:'#guide-reserved', color:'#9b59b6', voice:VOICE },

  { phase:'階段三：收購與保留',
    text:'要注意的是，不論「拿寶石」、「買卡」或「保留卡片」，[[都計算一個回合]] 喲！',
    el:null, color:null, voice:VOICE },

  // 階段四
  { phase:'階段四：貴族拜訪',
    text:'當你買下的卡片累積到對應貴族卡顯示的顏色數量，頂層的領主貴族就會 [[自動前來拜訪]]，免費送你 [[3 分]]！',
    el:'.nobles-section', color:'#3498db', voice:VOICE },

  // 階段五
  { phase:'階段五：輔助官特技',
    text:'最後，我有強大的隨行特技（像是幫你降低成本或擴大背包）。點擊下方按鈕，我們出發去 [[橫掃戰場]] 吧！',
    el:null, color:null, voice:VOICE }
];

// ── 狀態 ─────────────────────────────────────────────────────
var T = {
  active: false, idx: 0,
  prevEl: null,
  typeTimer: null, fullText: '', charN: 0, isTyping: false,
  voiceEl: null
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
    T.prevEl = null;
  }
  if (!sel) return;
  var el = document.querySelector(sel);
  if (!el) return;
  T.prevEl = el;
  el._os = el.style.boxShadow;
  el._oz = el.style.zIndex;
  var c = color || '#d4af37';
  el.style.outline       = '2px solid ' + c;
  el.style.outlineOffset = '4px';
  el.style.boxShadow     = '0 0 0 4px ' + c + '22, 0 0 24px ' + c + '66';
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

// ── 動態位置：對話框 & 立繪自動躲開目標元素 ──────────────────
// ── 動態位置：對話框 & 立繪自動躲開目標元素（防外溢修正版） ──────────────────
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

  // ✨ 修正 1：嚴格攔截 null 與非目標步驟，防止重複刷屏渲染
  if (!step || !step.el || step.el === '') { setDefault(); return; }
  var el = document.querySelector(step.el);
  if (!el) { setDefault(); return; }

  var rect  = el.getBoundingClientRect();
  var targetCenterX = rect.left + rect.width / 2;
  var targetCenterY = rect.top + rect.height / 2;
  var upper = targetCenterY < vh * 0.52;
  var isLeft = targetCenterX < vw * 0.5; // ✨ 修正 2：補齊原本漏掉宣告的關鍵變數 isLeft
  
  clr(boxEl); clr(charEl);

  // 1. 【對話框智慧貼邊定位】
  var boxTop, boxBottom;
  if (upper) {
    boxTop = rect.bottom + 12;
    // 🛡️ 安全防護：介紹頂部狀態欄時，特別拉大下移間距，確保立繪頭頂不會被推到視窗外
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

  // 2. 【立繪水平與垂直連接計算】
  var boxTop, boxBottom;
  if (upper) {
    boxTop = rect.bottom + 12;
    if (rect.top < 30) { boxTop = rect.bottom + 55; }
    boxEl.style.top = boxTop + 'px'; 
    boxEl.style.bottom = 'auto';
  } else {
    boxBottom = vh - rect.top + 12;
    boxEl.style.bottom = boxBottom + 'px'; 
    boxEl.style.top = 'auto';
  }
  boxEl.style.left      = '50%';
  boxEl.style.transform = 'translateX(-50%)';

  // 2. 【立繪完美連接與遮擋計算】
  var boxW = boxEl.offsetWidth || 360; 
  var charH = charEl.offsetHeight || 240; // 預估放大後的立繪高度
  
  if (upper) {
    // 元素在上排（對話框在下）
    // 讓立繪的底部故意深入對話框上緣下方約 60px（約立繪的 1/3 高度），使其下半部被對話框遮擋
    charEl.style.top = (boxTop - charH + 60) + 'px';
    charEl.style.bottom = 'auto';
  } else {
    // 元素在下排（對話框在上）
    // 讓立繪的頂部深入對話框下緣上方，計算相對視窗底部的距離
    charEl.style.bottom = (boxBottom - charH + 60) + 'px';
    charEl.style.top = 'auto';
  }

  // 3. 【立繪左右位置與同時出現動畫】
  if (mob) {
    charEl.style.left = '8px';
    charEl.style.right = 'auto';
  } else {
    // 電腦版：無縫貼在對話框左側
    var charLeft = (vw / 2) - (boxW / 2) - 130; // 配合立繪放大，向左修正像素避免壓到文字
    if (charLeft < 15) charLeft = 15;
    charEl.style.left = charLeft + 'px';
    charEl.style.right = 'auto';
  }
  
  // 修改進入動畫：與對話框同步淡入，且不使用額外的旋轉或延遲位移
  charEl.style.transform = 'none';
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
  if (T.idx >= STEPS.length - 1) { tutClose(); return; }
  T.idx++;
  renderStep();
}

// ── 關閉 ─────────────────────────────────────────────────────
function tutClose() {
  T.active = false;
  clearTimeout(T.typeTimer);
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

      '#tut-char-wrapper { 
  position: fixed; 
  z-index: 10001; /* 立繪層級在對話框下面一層，會被對話框遮擋下部 */
  width: 200px;  /* ✨ 放大立繪：由原本的 140px/160px 放大至 200px (手機版會依據 max-width 縮放) */
  max-width: 45vw;
  transition: opacity 0.3s ease, top 0.3s ease, bottom 0.3s ease, transform 0.3s ease; /* 與對話框動畫完全同步 */
}',
      'filter:drop-shadow(0 8px 28px rgba(0,0,0,0.9));z-index:10000011;',
      'transition:top 0.32s ease,bottom 0.32s ease,left 0.32s ease,right 0.32s ease,opacity 0.18s ease;}',
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

      '#tut-box { 
  position: fixed; 
  z-index: 10005; /* 對話框層級在最上面 */
  transition: opacity 0.3s ease, top 0.3s ease, bottom 0.3s ease;
}',
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

      '@media(max-width:430px){',
      '#tut-char-wrapper{width:140px;max-width:38vw;}',
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
      '<div id="tut-footer">' +
        '<div id="tut-dots"></div>' +
        '<div id="tut-hint">點擊對話框繼續</div>' +
        '<button id="tut-next-btn" onclick="event.stopPropagation();window.__tut.next()">下一步 ▶</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);
}

// ── 掛到 window（避免 module 作用域問題） ─────────────────────
window.__tut = { next: tutNext, skip: tutClose };

window.startFloatingTutorial = function() {
  var sm = document.getElementById('tutorial-start-modal');
  if (sm) sm.classList.remove('show');
  tutOpen();
};

// 相容舊呼叫
window.nextFloatingStep = tutNext;

})(); // end IIFE
