// ============================================================
//  core/tutorial.js — 翠席兒の皇家特訓課 v2
//  • 全新劇本（5 階段 13 步）
//  • 動態位置：對話框 + 立繪自動躲開高亮區域
//  • 粗體標記：文字中 "..." 自動轉為 <strong>
//  • 每步語音（佔位，後補真實 URL）
//  • 首次進站自動觸發；之後由按鈕觸發
//  • 整合進現有 startFloatingTutorial() 鉤子
// ============================================================

// ── 立繪圖片 ──────────────────────────────────────────────────
const TUT_CHAR_IMG = "https://ibb.co/j9MfpTYy";

// ── 語音佔位 URL（後補真實音源） ────────────────────────────────
//   索引對應下方 STEPS 陣列的 voiceUrl 欄位
const VOICE_PLACEHOLDER = "https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3";

// ── 教學步驟資料 ─────────────────────────────────────────────
// text 中用 "..." 包住的文字會自動渲染為粗體
// el   : CSS 選擇器，null = 不高亮
// color: 高亮光圈顏色
// pos  : "auto" = 自動躲開 | "bottom" | "top" 強制指定
const STEPS = [

  // ══ 階段一：認識環境 ══
  {
    phase: "階段一：認識環境",
    text: "嗨！我是你的貿易顧問翠席兒。",
    el: null, color: null, pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段一：認識環境",
    text: "今天我們的目標很簡單：「在 "28 回合" 內拿到 "15 分威望"，贏下這場比賽！」",
    el: null, color: null, pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段一：認識環境",
    text: "首先，這裡可以看目前第幾回合，還有你現在拿到了幾分。",
    el: ".status-bar", color: "#d4af37", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段一：認識環境",
    text: "中間這三大排卡片就是我們要搶購的產業，每張卡片上面的寶石就是你購買此卡需要花的 "籌碼費用"！",
    el: "#guide-matrix", color: "#2ecc71", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },

  // ══ 階段二：拿取籌碼 ══
  {
    phase: "階段二：拿取籌碼",
    text: "沒有本金不能做生意。",
    el: null, color: null, pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段二：拿取籌碼",
    text: "來！請先點擊左邊，一次可以拿「 "3 顆不同顏色" 」或是「 "2 顆相同顏色" 」的寶石籌碼！",
    el: "#guide-actions", color: "#e74c3c", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段二：拿取籌碼",
    text: "拿到的籌碼會放進你底部的金庫。你可以即時查看，「 "大數字是寶石數量，小數字是買到的卡片數量" 」。記住，身上最多只能塞 "10 顆寶石"，拿太多會放不下！",
    el: "#guide-dashboard", color: "#f1c40f", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },

  // ══ 階段三：收購與保留 ══
  {
    phase: "階段三：收購與保留",
    text: "注意看！只要你身上的籌碼夠多，買得起的卡片就會亮起「 "收購" 」字樣。",
    el: "#guide-matrix", color: "#d4af37", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段三：收購與保留",
    text: "點擊「收購」買下它！卡片除了送你威望分數，"寶石卡片本身還能讓你以後買卡永久減免 1 顆相同顏色的成本"。也就是買越多，後面買卡越便宜！",
    el: "#res-layer", color: "#2ecc71", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段三：收購與保留",
    text: "如果想買的卡片怕被對手搶走，點擊「保留」就能鎖進你的手牌，還能免費拿到 "1 顆萬能的黃金籌碼"（當作任何顏色的百搭寶石）！",
    el: "#guide-reserved", color: "#9b59b6", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
  {
    phase: "階段三：收購與保留",
    text: "要注意的是，以上不論「拿寶石」或「買卡、保留卡片」，"都計算一個回合" 喲！",
    el: null, color: null, pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },

  // ══ 階段四：貴族拜訪 ══
  {
    phase: "階段四：貴族拜訪",
    text: "當你買下的卡片累積到對應貴族卡顯示的顏色數量，頂層的領主貴族就會 "自動前來拜訪"，免費送你 "3 分"！",
    el: ".nobles-section", color: "#3498db", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },

  // ══ 階段五：輔助官特技 ══
  {
    phase: "階段五：輔助官特技",
    text: "最後，我有強大的隨行特技（像是幫你降低成本或擴大背包）。點擊下方按鈕，我們出發去 "橫掃戰場" 吧！",
    el: "#btn-welcome-confirm", color: "#d4af37", pos: "auto",
    voiceUrl: VOICE_PLACEHOLDER
  },
];

// ── 教學系統內部狀態 ──────────────────────────────────────────
const TUT = {
  active: false,
  idx: 0,
  prevEl: null,
  typeTimer: null,
  fullText: "",
  charCount: 0,
  isTyping: false,
  voiceEl: null,
};

// ── 工具：解析粗體標記，text 中 "..." → <strong> ───────────────
function parseBold(raw) {
  // 將 "文字" 換成 <strong>文字</strong>
  return raw.replace(/"([^"]+)"/g, '<strong style="color:#ffe099;">$1</strong>');
}

// ── 高亮目標元素 ──────────────────────────────────────────────
function tutHighlight(selector, color) {
  // 清除舊高亮
  if (TUT.prevEl) {
    TUT.prevEl.style.outline = "";
    TUT.prevEl.style.outlineOffset = "";
    TUT.prevEl.style.boxShadow = TUT.prevEl._tutOrigShadow || "";
    TUT.prevEl.style.zIndex = TUT.prevEl._tutOrigZ || "";
    delete TUT.prevEl._tutOrigShadow;
    delete TUT.prevEl._tutOrigZ;
    TUT.prevEl = null;
  }
  if (!selector) return;
  const el = document.querySelector(selector);
  if (!el) return;

  TUT.prevEl = el;
  el._tutOrigShadow = el.style.boxShadow;
  el._tutOrigZ = el.style.zIndex;

  const c = color || "#d4af37";
  el.style.outline = `2px solid ${c}`;
  el.style.outlineOffset = "4px";
  el.style.boxShadow = `0 0 0 4px ${c}22, 0 0 22px ${c}66`;
  el.style.zIndex = "10000001";
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function tutClearHighlight() {
  if (TUT.prevEl) {
    TUT.prevEl.style.outline = "";
    TUT.prevEl.style.outlineOffset = "";
    TUT.prevEl.style.boxShadow = TUT.prevEl._tutOrigShadow || "";
    TUT.prevEl.style.zIndex = TUT.prevEl._tutOrigZ || "";
    delete TUT.prevEl._tutOrigShadow;
    delete TUT.prevEl._tutOrigZ;
    TUT.prevEl = null;
  }
}

// ── 計算對話框 & 立繪的安全位置 ──────────────────────────────────
// 規則：
//  1. 取得目標元素的 BoundingRect
//  2. 元素在上半部 → 對話框放下方，立繪放左下或右下
//  3. 元素在下半部 → 對話框放上方，立繪放左上或右上
//  4. 無目標 → 置中下方
function calcSafeLayout(step) {
  const boxEl  = document.getElementById("tut-box");
  const charEl = document.getElementById("tut-char-wrapper");
  if (!boxEl || !charEl) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw <= 430;

  // 重設所有方向
  function resetPos(el) {
    ["top","bottom","left","right","transform"].forEach(p => el.style[p] = "");
  }

  if (!step.el) {
    // 無目標：置中下方
    resetPos(boxEl);
    resetPos(charEl);
    boxEl.style.bottom    = "22px";
    boxEl.style.left      = "50%";
    boxEl.style.transform = "translateX(-50%)";
    charEl.style.bottom   = isMobile ? "195px" : "215px";
    charEl.style.left     = isMobile ? "10px"  : "50%";
    charEl.style.transform = isMobile ? "none" : "translateX(-340px)";
    return;
  }

  const el = document.querySelector(step.el);
  if (!el) {
    // 找不到元素：同無目標
    resetPos(boxEl);
    resetPos(charEl);
    boxEl.style.bottom    = "22px";
    boxEl.style.left      = "50%";
    boxEl.style.transform = "translateX(-50%)";
    charEl.style.bottom   = isMobile ? "195px" : "215px";
    charEl.style.left     = isMobile ? "10px"  : "50%";
    charEl.style.transform = isMobile ? "none" : "translateX(-340px)";
    return;
  }

  const rect = el.getBoundingClientRect();
  const elCY = rect.top + rect.height / 2;
  const elCX = rect.left + rect.width / 2;

  const isUpper = elCY < vh * 0.52;   // 目標在畫面上半
  const isLeft  = elCX < vw * 0.5;    // 目標在畫面左半

  resetPos(boxEl);
  resetPos(charEl);

  // ── 對話框位置 ──
  if (isUpper) {
    // 目標在上 → 對話框放下方
    boxEl.style.bottom    = "22px";
    boxEl.style.top       = "auto";
    boxEl.style.left      = "50%";
    boxEl.style.transform = "translateX(-50%)";
  } else {
    // 目標在下 → 對話框放上方
    boxEl.style.top       = "18px";
    boxEl.style.bottom    = "auto";
    boxEl.style.left      = "50%";
    boxEl.style.transform = "translateX(-50%)";
  }

  // ── 立繪位置（跟對話框同側，左右與目標元素錯開） ──
  const charW = isMobile ? 140 : 220;

  if (isUpper) {
    charEl.style.bottom = isMobile ? "195px" : "215px";
    charEl.style.top    = "auto";
  } else {
    // 對話框在上，立繪也在上方（跟對話框旁邊）
    charEl.style.top    = isMobile ? "90px" : "80px";
    charEl.style.bottom = "auto";
  }

  // 水平：避開目標元素所在的那一側
  if (isLeft) {
    // 目標在左 → 立繪放右側
    charEl.style.right = isMobile ? "8px" : "16px";
    charEl.style.left  = "auto";
  } else {
    // 目標在右 → 立繪放左側
    charEl.style.left  = isMobile ? "8px" : "16px";
    charEl.style.right = "auto";
  }
  charEl.style.transform = "none";
}

// ── 打字機效果 ────────────────────────────────────────────────
function tutTypewrite(html) {
  clearTimeout(TUT.typeTimer);
  TUT.fullText  = html;          // 這裡存的是含 HTML 標籤的字串
  TUT.charCount = 0;
  TUT.isTyping  = true;

  // 先計算純文字長度做動畫用
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const plainLen = tmp.textContent.length;

  const textEl = document.getElementById("tut-dialogue-text");
  if (!textEl) return;
  textEl.innerHTML = "";

  // 逐字顯示（直接操作 innerHTML，一次性設定避免標籤破碎）
  // 策略：每 tick 增加顯示的純文字數，再用比例截取 HTML
  let shown = 0;
  function tick() {
    if (!TUT.active) return;
    if (shown < plainLen) {
      shown++;
      // 用比例截取：依純文字進度線性插值 HTML
      // 簡化方案：直接顯示完整 HTML，只讓整個 div 以 clip 動畫
      // 以下改用「逐字累積純文字→完成後切換 HTML」方式：
      textEl.textContent = tmp.textContent.slice(0, shown);
      TUT.typeTimer = setTimeout(tick, 26);
    } else {
      // 打字完成後顯示完整帶粗體的 HTML
      textEl.innerHTML = html;
      TUT.isTyping = false;
    }
  }
  tick();
}

function tutSkipType() {
  clearTimeout(TUT.typeTimer);
  TUT.isTyping = false;
  const textEl = document.getElementById("tut-dialogue-text");
  if (textEl) textEl.innerHTML = TUT.fullText;
}

// ── 播放該步語音 ──────────────────────────────────────────────
function tutPlayVoice(url) {
  if (!url) return;
  if (!TUT.voiceEl) {
    TUT.voiceEl = new Audio();
    TUT.voiceEl.volume = 0.85;
  }
  TUT.voiceEl.pause();
  TUT.voiceEl.src = url;
  TUT.voiceEl.currentTime = 0;
  TUT.voiceEl.play().catch(() => {});
}

// ── 進度點 ────────────────────────────────────────────────────
function tutUpdateDots() {
  const c = document.getElementById("tut-dots");
  if (!c) return;
  c.innerHTML = STEPS.map((_, i) => {
    const w  = i === TUT.idx ? 18 : 7;
    const bg = i === TUT.idx ? "#d4af37" : i < TUT.idx ? "#6a5a2e" : "#2a2420";
    return `<span style="display:inline-block;width:${w}px;height:7px;border-radius:4px;background:${bg};transition:all 0.3s;"></span>`;
  }).join("");
}

// ── 渲染當前步驟 ─────────────────────────────────────────────
function tutRenderStep() {
  const step = STEPS[TUT.idx];
  if (!step) return;

  // 章節標籤
  const phaseEl = document.getElementById("tut-phase-label");
  if (phaseEl) phaseEl.textContent = step.phase;

  // 打字機（帶粗體解析）
  tutTypewrite(parseBold(step.text));

  // 高亮 & 安全位置（先算位置讓對話框移動，再高亮）
  // 短暫淡出 → 移位 → 淡入
  const boxEl  = document.getElementById("tut-box");
  const charEl = document.getElementById("tut-char-wrapper");
  if (boxEl && charEl) {
    boxEl.style.opacity  = "0";
    charEl.style.opacity = "0";
    setTimeout(() => {
      calcSafeLayout(step);
      boxEl.style.opacity  = "1";
      charEl.style.opacity = "1";
    }, 160);
  } else {
    calcSafeLayout(step);
  }

  tutHighlight(step.el, step.color);

  // 進度點 & 按鈕
  tutUpdateDots();
  const btn = document.getElementById("tut-next-btn");
  if (btn) btn.textContent = TUT.idx === STEPS.length - 1 ? "🎉 開始對局！" : "下一步 ▶";

  // 立繪抖動
  const img = document.getElementById("tut-char-img");
  if (img) {
    img.style.animation = "none";
    void img.offsetWidth;
    img.style.animation = "tutCharPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards";
  }

  // 語音
  tutPlayVoice(step.voiceUrl);
}

// ── 下一步 ───────────────────────────────────────────────────
window.tutorialNext = function () {
  if (!TUT.active) return;
  if (TUT.isTyping) { tutSkipType(); return; }
  if (TUT.idx >= STEPS.length - 1) { tutClose(); return; }
  TUT.idx++;
  tutRenderStep();
};

// ── 跳過 ─────────────────────────────────────────────────────
window.tutorialSkip = function () {
  tutClose();
};

// ── 關閉教學 ─────────────────────────────────────────────────
function tutClose() {
  TUT.active = false;
  clearTimeout(TUT.typeTimer);
  if (TUT.voiceEl) TUT.voiceEl.pause();
  tutClearHighlight();

  const ov = document.getElementById("tut-overlay");
  if (ov) {
    ov.style.opacity = "0";
    ov.style.pointerEvents = "none";
    setTimeout(() => { ov.style.display = "none"; }, 380);
  }

  // 關閉歡迎 & 教學 modal
  document.getElementById("welcome-back-modal")?.classList.remove("show");
  document.getElementById("tutorial-start-modal")?.classList.remove("show");

  // 標記「非首次」
  try { localStorage.setItem("splendor_tutorial_seen", "1"); } catch (e) {}
}

// ── 開啟教學 ─────────────────────────────────────────────────
function tutOpen() {
  // 確保 DOM 存在
  if (!document.getElementById("tut-overlay")) tutBuildDOM();

  TUT.active   = true;
  TUT.idx      = 0;
  TUT.prevEl   = null;

  const ov = document.getElementById("tut-overlay");
  ov.style.display      = "flex";
  ov.style.pointerEvents = "auto";
  void ov.offsetWidth;   // reflow
  ov.style.opacity = "1";

  tutRenderStep();
}

// ── 建立教學 DOM（只建一次） ──────────────────────────────────
function tutBuildDOM() {
  // CSS
  if (!document.getElementById("tut-css")) {
    const s = document.createElement("style");
    s.id = "tut-css";
    s.textContent = `
      /* ── 遮罩 ── */
      #tut-overlay {
        position: fixed; inset: 0; z-index: 10000010;
        display: none; opacity: 0; pointer-events: none;
        transition: opacity 0.35s ease;
        background: linear-gradient(
          to top,
          rgba(5,3,2,0.95) 0%,
          rgba(5,3,2,0.45) 52%,
          rgba(5,3,2,0.10) 100%
        );
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        padding-bottom: 20px;
        font-family: 'Microsoft JhengHei','Heiti TC','Inter',sans-serif;
      }

      /* ── 立繪 ── */
      #tut-char-wrapper {
        position: fixed;
        width: 220px; max-width: 30vw;
        pointer-events: none;
        filter: drop-shadow(0 8px 28px rgba(0,0,0,0.9));
        transition: top 0.32s ease, bottom 0.32s ease,
                    left 0.32s ease, right 0.32s ease,
                    opacity 0.18s ease;
        z-index: 10000011;
      }
      #tut-char-img {
        width: 100%; object-fit: contain; display: block;
      }
      @keyframes tutCharPop {
        0%  { transform: translateY(14px) scale(0.95); opacity: 0.6; }
        60% { transform: translateY(-5px) scale(1.03);  opacity: 1;   }
        100%{ transform: translateY(0)    scale(1);     opacity: 1;   }
      }

      /* ── 章節標籤 ── */
      #tut-phase-label {
        position: fixed; top: 18px; right: 18px; z-index: 10000015;
        font-family: 'Cinzel',serif; font-size: 0.72rem; font-weight: 700;
        color: #d4af37; background: rgba(0,0,0,0.72);
        border: 1px solid rgba(212,175,55,0.35); border-radius: 4px;
        padding: 4px 12px; letter-spacing: 0.06em;
      }

      /* ── 跳過按鈕 ── */
      #tut-skip-btn {
        position: fixed; top: 16px; left: 16px; z-index: 10000015;
        background: rgba(0,0,0,0.58); border: 1px solid rgba(212,175,55,0.25);
        color: #968a7f; border-radius: 4px; padding: 4px 14px;
        font-size: 0.7rem; cursor: pointer; transition: all 0.2s;
      }
      #tut-skip-btn:hover { color: #ffe099; border-color: #d4af37; }

      /* ── 對話框 ── */
      #tut-box {
        position: fixed; z-index: 10000012;
        width: 88%; max-width: 620px;
        background: rgba(4,6,10,0.97);
        border: 2px solid #d4af37;
        box-shadow: 0 0 32px rgba(212,175,55,0.2), 0 20px 50px rgba(0,0,0,0.95);
        border-radius: 12px;
        padding: 22px 24px 16px;
        cursor: pointer; user-select: none;
        transition: top 0.32s ease, bottom 0.32s ease,
                    left 0.32s ease, opacity 0.18s ease;
      }

      /* ── 名牌 ── */
      #tut-name-tag {
        position: absolute; top: -34px; left: 24px;
        background: linear-gradient(135deg,#d4af37,#ffe099,#aa7c11);
        color: #000; padding: 6px 24px; font-weight: 900;
        border-radius: 6px 6px 0 0; font-size: 1.05rem;
        box-shadow: 0 -4px 14px rgba(0,0,0,0.5);
        font-family: 'Cinzel',serif; letter-spacing: 0.05em;
      }

      /* ── 對話文字 ── */
      #tut-dialogue-text {
        font-size: 1.0rem; line-height: 1.8; color: #f1f2f6;
        letter-spacing: 0.5px; min-height: 3.2em;
      }

      /* ── 底部列 ── */
      #tut-footer {
        display: flex; justify-content: space-between;
        align-items: center; margin-top: 14px;
      }
      #tut-dots { display: flex; gap: 5px; align-items: center; }
      #tut-hint {
        font-size: 0.68rem; color: rgba(212,175,55,0.55);
        animation: tutHint 1.3s ease-in-out infinite alternate;
      }
      @keyframes tutHint { from{opacity:0.3;} to{opacity:0.9;} }

      /* ── 下一步按鈕 ── */
      #tut-next-btn {
        background: linear-gradient(135deg,#d4af37,#aa7c11);
        border: none; color: #000; padding: 9px 24px;
        font-size: 0.88rem; font-weight: 900; border-radius: 6px;
        cursor: pointer; font-family: 'Cinzel',serif;
        letter-spacing: 0.04em;
        box-shadow: 0 3px 14px rgba(212,175,55,0.45);
        transition: filter 0.15s, transform 0.1s;
        white-space: nowrap;
      }
      #tut-next-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
      #tut-next-btn:active { transform: translateY(1px); }

      /* ── 手機調整 ── */
      @media (max-width: 430px) {
        #tut-char-wrapper { width: 140px; max-width: 38vw; }
        #tut-box { padding: 16px 14px 13px; }
        #tut-dialogue-text { font-size: 0.85rem; }
        #tut-name-tag { font-size: 0.82rem; top: -28px; left: 14px; padding: 4px 14px; }
        #tut-next-btn { padding: 7px 16px; font-size: 0.75rem; }
        #tut-phase-label { font-size: 0.58rem; top: 12px; right: 12px; }
      }
    `;
    document.head.appendChild(s);
  }

  // DOM
  const ov = document.createElement("div");
  ov.id = "tut-overlay";
  ov.innerHTML = `
    <button id="tut-skip-btn" onclick="tutorialSkip()">✕ 跳過教學</button>
    <div id="tut-phase-label"></div>

    <div id="tut-char-wrapper">
      <img id="tut-char-img" src="${TUT_CHAR_IMG}" alt="翠席兒">
    </div>

    <div id="tut-box" onclick="tutorialNext()">
      <div id="tut-name-tag">翠席兒</div>
      <div id="tut-dialogue-text"></div>
      <div id="tut-footer">
        <div id="tut-dots"></div>
        <div id="tut-hint">點擊對話框繼續</div>
        <button id="tut-next-btn" onclick="event.stopPropagation();tutorialNext();">下一步 ▶</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
}

// ── 公開介面（供 index.html 按鈕 & 自動觸發使用） ───────────────
window.startFloatingTutorial = function () {
  document.getElementById("tutorial-start-modal")?.classList.remove("show");
  document.getElementById("welcome-back-modal")?.classList.remove("show");
  if (!document.getElementById("tut-overlay")) tutBuildDOM();
  tutOpen();
};

// 相容舊版呼叫
window.nextFloatingStep = function () { window.tutorialNext(); };

// ── 首次進站自動觸發 ──────────────────────────────────────────
// 掛在 DOMContentLoaded 後，等遊戲本身初始化完成（約 800ms）再啟動
(function autoTrigger() {
  let seen = false;
  try { seen = !!localStorage.getItem("splendor_tutorial_seen"); } catch (e) {}

  if (!seen) {
    // 監聽遊戲的歡迎 modal 出現後再觸發，避免遮罩疊加混亂
    const observer = new MutationObserver(() => {
      const welcome = document.getElementById("welcome-back-modal");
      if (welcome && welcome.classList.contains("show")) {
        observer.disconnect();
        // 等歡迎 modal 淡入完成再啟動教學
        setTimeout(() => {
          // 讓歡迎 modal 先保留（按鈕是教學最後一步的目標）
          // 直接開啟教學覆蓋在上方
          window.startFloatingTutorial();
        }, 800);
      }
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class"] });
  }
})();
