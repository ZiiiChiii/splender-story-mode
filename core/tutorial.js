// ============================================================
//  tutorial.js — 翠席兒の皇家特訓課 (新手引導系統)
//  整合至現有遊戲架構，無需修改其他模組
// ============================================================

const TUTORIAL_STEPS = [
  // ── 階段一：初登大會堂 ──────────────────────────────────────
  {
    phase: "階段一：初登大會堂",
    speaker: "翠席兒",
    text: "呼～（擦汗）總算把你拉進大會堂了！你好呀，我是你的首席貿易顧問翠席兒！別發呆，看著這滿桌的閃亮原石，今天我們的目標是在 28 回合內，率先拿下 15 分的威望，成為名震帝國的璀璨大師！",
    highlight: null,
    glowColor: null,
  },
  {
    phase: "階段一：初登大會堂",
    speaker: "翠席兒",
    text: "首先，我們得隨時盯緊時間跟自己的名望，這可是商人的命根子！注意上方的狀態欄——「回合」告訴你還剩多少機會，「威望」就是你的得分，衝到 15 分就贏了！",
    highlight: ".status-bar",
    glowColor: "#d4af37",
  },
  {
    phase: "階段一：初登大會堂",
    speaker: "翠席兒",
    text: "接下來看看中間這塊琳瑯滿目的卡牌矩陣，這就是我們今天要爭奪的產業。從下到上分成「基礎礦脈」、「中階產業」和「頂級物業」。站得越高，能提供的威望分數就越多喔！",
    highlight: "#guide-matrix",
    glowColor: "#2ecc71",
  },

  // ── 階段二：鑄幣交易局 ──────────────────────────────────────
  {
    phase: "階段二：鑄幣交易局",
    speaker: "翠席兒",
    text: "手頭沒有本金可不行。看到左邊這個金庫了嗎？這就是我們的「鑄幣交易局」。每回合你只能執行一個主要動作。最穩健的手段：一次拿取 3 顆不同顏色的寶石！",
    highlight: "#guide-actions",
    glowColor: "#e74c3c",
  },
  {
    phase: "階段二：鑄幣交易局",
    speaker: "翠席兒",
    text: "太棒了！你看，籌碼立刻飛進了你底部的個人金庫囉！不過要小心，商人的背包是有上限的，一般只能裝 10 顆籌碼，拿太多可是會被充公的喔！",
    highlight: "#guide-dashboard",
    glowColor: "#f1c40f",
  },
  {
    phase: "階段二：鑄幣交易局",
    speaker: "翠席兒",
    text: "對了，如果你看到某種顏色的寶石庫存充足（≥ 2 顆），你也可以一口氣拿走 2 顆同色寶石。這招在你想壟斷資源、惡性競爭時特別好用，嘿嘿！",
    highlight: "#btn-do-same",
    glowColor: "#e74c3c",
  },

  // ── 階段三：實業家的第一步 ──────────────────────────────────
  {
    phase: "階段三：收購發展卡",
    speaker: "翠席兒",
    text: "有了籌碼，就能開始收購產業了。仔細看卡片的左下角，那是收購它所需要的寶石代價。如果你身上的籌碼和卡片減免足夠，卡片就會亮起準備起飛的微光！",
    highlight: "#guide-matrix",
    glowColor: "#d4af37",
  },
  {
    phase: "階段三：收購發展卡",
    speaker: "翠席兒",
    text: "買下卡片後，它除了給你左上角的威望分，右上角還會多出一個永久寶石標誌。以後你買任何卡片，這個標誌都能幫你永久減免 1 顆相應顏色的成本！這就是「空手套白狼」的財富密碼！",
    highlight: "#res-layer",
    glowColor: "#2ecc71",
  },
  {
    phase: "階段三：收購發展卡",
    speaker: "翠席兒",
    text: "哎呀，要是看到一張神級卡片但籌碼不夠，又怕被對手搶走怎麼辦？別慌！點擊「保留」，這張契約就會藏進你的保密手牌區，別人再也碰不到，而且銀行還免費贈你一枚萬能黃金籌碼喔！",
    highlight: "#guide-reserved",
    glowColor: "#9b59b6",
  },

  // ── 階段四：覲見至高領主 ────────────────────────────────────
  {
    phase: "階段四：貴族拜訪機制",
    speaker: "翠席兒",
    text: "當你在城裡把產業經營得有聲有色時，坐在議事堂的老爺們也會注意到你。看到最頂端的貴族們了嗎？只要你買下的卡片永久產量達到他們的要求，他們就會自動拜訪你並送來 3 分威望！",
    highlight: ".nobles-section",
    glowColor: "#3498db",
  },

  // ── 階段五：首席輔助官技能 ──────────────────────────────────
  {
    phase: "階段五：首席輔助官",
    speaker: "翠席兒",
    text: "最後（挺胸），可別忘了站在你眼前的我！看見右上方的「📖 遊戲教學」按鈕旁，在正式對局中，右側會出現你的首席輔助官面板。在故事模式中，每擊敗一個大人物就能收服他們並借用他們的專屬特技！",
    highlight: "#guide-assistant-container",
    glowColor: "#00d2ff",
  },
  {
    phase: "階段五：首席輔助官",
    speaker: "翠席兒",
    text: "善用輔助官的力量，讓我們一起去撕碎那些高傲 AI 的劇本，奪下璀璨至尊的王座吧！準備好了嗎？點擊下方按鈕，我們的傳奇商戰正式開局！",
    highlight: "#btn-welcome-confirm",
    glowColor: "#d4af37",
  },
];

// ── 翠席兒立繪 URL（可替換為正式美術）──────────────────────
const CHAR_IMG_URL = "https://i.ibb.co/GQ2Yh0yH/image.png";

// ── 教學系統狀態 ─────────────────────────────────────────────
let tutorialState = {
  active: false,
  stepIndex: 0,
  prevHighlight: null,
  typewriterTimer: null,
  fullText: "",
  displayedChars: 0,
  isTyping: false,
};

// ── 工具：高亮目標元素 ────────────────────────────────────────
function highlightElement(selector, color) {
  // 清除前一個高亮
  if (tutorialState.prevHighlight) {
    const prev = document.querySelector(tutorialState.prevHighlight);
    if (prev) {
      prev.style.outline = "";
      prev.style.outlineOffset = "";
      prev.style.boxShadow = prev._origBoxShadow || "";
      prev.style.zIndex = prev._origZIndex || "";
      delete prev._origBoxShadow;
      delete prev._origZIndex;
    }
  }

  tutorialState.prevHighlight = selector;

  if (!selector) return;

  const el = document.querySelector(selector);
  if (!el) return;

  // 儲存原始樣式
  el._origBoxShadow = el.style.boxShadow;
  el._origZIndex = el.style.zIndex;

  // 套用高亮
  const glow = color || "#d4af37";
  el.style.outline = `2px solid ${glow}`;
  el.style.outlineOffset = "3px";
  el.style.boxShadow = `0 0 0 4px ${glow}33, 0 0 20px ${glow}66`;
  el.style.zIndex = "10000000";

  // 平滑滾動至元素（行動裝置友善）
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── 清除所有高亮 ─────────────────────────────────────────────
function clearAllHighlights() {
  if (tutorialState.prevHighlight) {
    const el = document.querySelector(tutorialState.prevHighlight);
    if (el) {
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.boxShadow = el._origBoxShadow || "";
      el.style.zIndex = el._origZIndex || "";
      delete el._origBoxShadow;
      delete el._origZIndex;
    }
  }
  tutorialState.prevHighlight = null;
}

// ── 打字機效果 ────────────────────────────────────────────────
function startTypewriter(text) {
  clearTimeout(tutorialState.typewriterTimer);
  tutorialState.fullText = text;
  tutorialState.displayedChars = 0;
  tutorialState.isTyping = true;

  const textEl = document.getElementById("tut-dialogue-text");
  if (!textEl) return;
  textEl.textContent = "";

  function tick() {
    if (!tutorialState.active) return;
    if (tutorialState.displayedChars < tutorialState.fullText.length) {
      tutorialState.displayedChars++;
      textEl.textContent = tutorialState.fullText.slice(
        0,
        tutorialState.displayedChars
      );
      tutorialState.typewriterTimer = setTimeout(tick, 28);
    } else {
      tutorialState.isTyping = false;
    }
  }
  tick();
}

// ── 快速完成打字 ─────────────────────────────────────────────
function skipTypewriter() {
  clearTimeout(tutorialState.typewriterTimer);
  tutorialState.isTyping = false;
  tutorialState.displayedChars = tutorialState.fullText.length;
  const textEl = document.getElementById("tut-dialogue-text");
  if (textEl) textEl.textContent = tutorialState.fullText;
}

// ── 渲染當前步驟 ─────────────────────────────────────────────
function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialState.stepIndex];
  if (!step) return;

  // 更新標題（章節標籤）
  const phaseEl = document.getElementById("tut-phase-label");
  if (phaseEl) phaseEl.textContent = step.phase;

  // 更新說話人名牌
  const nameEl = document.getElementById("tut-name-tag");
  if (nameEl) nameEl.textContent = step.speaker;

  // 啟動打字機
  startTypewriter(step.text);

  // 高亮元素
  highlightElement(step.highlight, step.glowColor);

  // 更新進度點
  updateDots();

  // 更新按鈕文字
  const btn = document.getElementById("tut-next-btn");
  if (btn) {
    const isLast = tutorialState.stepIndex === TUTORIAL_STEPS.length - 1;
    btn.textContent = isLast ? "🎉 開始對局！" : "下一步 ▶";
  }

  // 立繪角色入場抖動
  const charEl = document.getElementById("tut-char-img");
  if (charEl) {
    charEl.style.animation = "none";
    void charEl.offsetWidth; // reflow
    charEl.style.animation = "tutCharPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards";
  }
}

// ── 進度點更新 ────────────────────────────────────────────────
function updateDots() {
  const dotsEl = document.getElementById("tut-dots");
  if (!dotsEl) return;
  dotsEl.innerHTML = TUTORIAL_STEPS.map((_, i) => {
    const active = i === tutorialState.stepIndex;
    const done = i < tutorialState.stepIndex;
    return `<span style="
      display:inline-block; width:${active ? 18 : 7}px; height:7px;
      border-radius:4px; transition: all 0.3s ease;
      background:${active ? "#d4af37" : done ? "#6a5a2e" : "#3a3028"};
    "></span>`;
  }).join("");
}

// ── 下一步 ────────────────────────────────────────────────────
window.tutorialNext = function () {
  if (!tutorialState.active) return;

  // 如果打字機還在執行，先跳完本句
  if (tutorialState.isTyping) {
    skipTypewriter();
    return;
  }

  // 最後一步：關閉教學
  if (tutorialState.stepIndex >= TUTORIAL_STEPS.length - 1) {
    closeTutorial();
    return;
  }

  tutorialState.stepIndex++;
  renderTutorialStep();
};

// ── 跳過教學 ─────────────────────────────────────────────────
window.skipTutorial = function () {
  closeTutorial();
};

// ── 關閉教學 ─────────────────────────────────────────────────
function closeTutorial() {
  tutorialState.active = false;
  clearTimeout(tutorialState.typewriterTimer);
  clearAllHighlights();

  const overlay = document.getElementById("tut-overlay");
  if (overlay) {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 400);
  }

  // 關閉歡迎 modal（如果仍開著）
  const welcomeModal = document.getElementById("welcome-back-modal");
  if (welcomeModal) welcomeModal.classList.remove("show");

  // 如果 tutorial-start-modal 也開著，一併關閉
  const startModal = document.getElementById("tutorial-start-modal");
  if (startModal) startModal.classList.remove("show");
}

// ── 開啟教學 ─────────────────────────────────────────────────
window.startTutorial = function () {
  tutorialState.active = true;
  tutorialState.stepIndex = 0;
  tutorialState.prevHighlight = null;

  const overlay = document.getElementById("tut-overlay");
  if (!overlay) {
    buildTutorialDOM();
  }

  const ov = document.getElementById("tut-overlay");
  if (ov) {
    ov.style.display = "flex";
    // 強制 reflow 觸發過渡動畫
    void ov.offsetWidth;
    ov.style.opacity = "1";
    ov.style.pointerEvents = "auto";
  }

  renderTutorialStep();
};

// ── 建立教學 DOM ──────────────────────────────────────────────
function buildTutorialDOM() {
  // 注入 CSS
  if (!document.getElementById("tut-styles")) {
    const style = document.createElement("style");
    style.id = "tut-styles";
    style.textContent = `
      #tut-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000010;
        display: none;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease;
        /* 半透明遮罩，讓遊戲背景透出來 */
        background: linear-gradient(
          to top,
          rgba(8, 5, 4, 0.92) 0%,
          rgba(8, 5, 4, 0.40) 55%,
          rgba(8, 5, 4, 0.15) 100%
        );
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        padding-bottom: 24px;
        font-family: 'Microsoft JhengHei', 'Heiti TC', 'Inter', sans-serif;
      }

      /* 角色立繪 */
      #tut-char-wrapper {
        position: absolute;
        bottom: 220px;
        left: 50%;
        transform: translateX(-50%);
        width: 280px;
        max-width: 38vw;
        pointer-events: none;
        filter: drop-shadow(0 8px 32px rgba(0,0,0,0.85));
      }
      #tut-char-img {
        width: 100%;
        object-fit: contain;
        display: block;
      }

      @keyframes tutCharPop {
        0%   { transform: translateY(12px) scale(0.96); opacity:0.7; }
        60%  { transform: translateY(-4px) scale(1.02); opacity:1; }
        100% { transform: translateY(0)    scale(1);    opacity:1; }
      }

      /* 章節標籤（右上角） */
      #tut-phase-label {
        position: absolute;
        top: 20px;
        right: 20px;
        font-family: 'Cinzel', serif;
        font-size: 0.75rem;
        font-weight: 700;
        color: #d4af37;
        background: rgba(0,0,0,0.65);
        border: 1px solid rgba(212,175,55,0.35);
        border-radius: 4px;
        padding: 4px 10px;
        letter-spacing: 0.06em;
      }

      /* 跳過按鈕（左上角） */
      #tut-skip-btn {
        position: absolute;
        top: 18px;
        left: 18px;
        background: rgba(0,0,0,0.55);
        border: 1px solid rgba(212,175,55,0.3);
        color: #968a7f;
        border-radius: 4px;
        padding: 4px 12px;
        font-size: 0.72rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      #tut-skip-btn:hover {
        color: #ffe099;
        border-color: #d4af37;
        background: rgba(212,175,55,0.12);
      }

      /* 對話框 */
      #tut-box {
        position: relative;
        width: 88%;
        max-width: 640px;
        background: rgba(5, 8, 12, 0.97);
        border: 2px solid #d4af37;
        box-shadow: 0 0 30px rgba(212,175,55,0.25), 0 16px 40px rgba(0,0,0,0.9);
        border-radius: 12px;
        padding: 22px 24px 18px;
        cursor: pointer;
        user-select: none;
        animation: tutBoxSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
      }
      @keyframes tutBoxSlideUp {
        from { opacity:0; transform: translateY(20px); }
        to   { opacity:1; transform: translateY(0); }
      }

      /* 名牌 */
      #tut-name-tag {
        position: absolute;
        top: -34px;
        left: 24px;
        background: linear-gradient(135deg, #d4af37, #ffe099, #aa7c11);
        color: #000;
        padding: 6px 22px;
        font-weight: 900;
        border-radius: 6px 6px 0 0;
        font-size: 1.05rem;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.4);
        font-family: 'Cinzel', serif;
        letter-spacing: 0.05em;
      }

      /* 對話文字 */
      #tut-dialogue-text {
        font-size: 1.05rem;
        line-height: 1.7;
        color: #f1f2f6;
        letter-spacing: 0.5px;
        min-height: 3.5em;
      }

      /* 游標閃爍 */
      #tut-dialogue-text::after {
        content: "▌";
        color: #d4af37;
        animation: tutCursor 0.7s step-end infinite;
      }

      @keyframes tutCursor {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }

      /* 底部列 */
      #tut-bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 14px;
      }

      /* 進度點 */
      #tut-dots {
        display: flex;
        gap: 5px;
        align-items: center;
      }

      /* 下一步按鈕 */
      #tut-next-btn {
        background: linear-gradient(135deg, #d4af37, #aa7c11);
        border: none;
        color: #000;
        padding: 8px 22px;
        font-size: 0.88rem;
        font-weight: 900;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Cinzel', serif;
        letter-spacing: 0.04em;
        box-shadow: 0 3px 12px rgba(212,175,55,0.45);
        transition: filter 0.15s, transform 0.1s;
      }
      #tut-next-btn:hover {
        filter: brightness(1.15);
        transform: translateY(-1px);
      }
      #tut-next-btn:active {
        transform: translateY(1px);
      }

      /* 點擊提示 */
      #tut-click-hint {
        font-size: 0.75rem;
        color: rgba(212,175,55,0.6);
        animation: tutHintPulse 1.2s ease-in-out infinite alternate;
      }
      @keyframes tutHintPulse {
        from { opacity:0.4; }
        to   { opacity:1; }
      }

      /* 高亮閃爍環 */
      @keyframes tutRingPulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(212,175,55,0.2), 0 0 20px rgba(212,175,55,0.4); }
        50%       { box-shadow: 0 0 0 7px rgba(212,175,55,0.1), 0 0 35px rgba(212,175,55,0.7); }
      }

      /* 行動裝置調整 */
      @media (max-width: 430px) {
        #tut-char-wrapper {
          width: 160px;
          bottom: 200px;
          left: 16px;
          transform: none;
        }
        #tut-box { padding: 16px 14px 14px; }
        #tut-dialogue-text { font-size: 0.88rem; }
        #tut-name-tag { font-size: 0.85rem; top: -28px; left: 14px; padding: 4px 14px; }
        #tut-next-btn { padding: 7px 16px; font-size: 0.78rem; }
        #tut-phase-label { font-size: 0.6rem; top: 14px; right: 14px; }
      }
    `;
    document.head.appendChild(style);
  }

  // 建立 DOM
  const overlay = document.createElement("div");
  overlay.id = "tut-overlay";
  overlay.innerHTML = `
    <!-- 跳過按鈕 -->
    <button id="tut-skip-btn" onclick="skipTutorial()">✕ 跳過教學</button>

    <!-- 章節標籤 -->
    <div id="tut-phase-label">階段一</div>

    <!-- 立繪 -->
    <div id="tut-char-wrapper">
      <img id="tut-char-img" src="${CHAR_IMG_URL}" alt="翠席兒">
    </div>

    <!-- 對話框 -->
    <div id="tut-box" onclick="tutorialNext()">
      <div id="tut-name-tag">翠席兒</div>
      <div id="tut-dialogue-text"></div>
      <div id="tut-bottom-row">
        <div id="tut-dots"></div>
        <div id="tut-click-hint">點擊對話框或按「下一步」繼續</div>
        <button id="tut-next-btn" onclick="event.stopPropagation(); tutorialNext();">下一步 ▶</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// ── 對外掛鉤：讓現有的 startFloatingTutorial() 呼叫新教學 ──
window.startFloatingTutorial = function () {
  // 關閉可能開著的 modal
  document.getElementById("tutorial-start-modal")?.classList.remove("show");
  document.getElementById("welcome-back-modal")?.classList.remove("show");

  // 若 DOM 尚未建立就先建立
  if (!document.getElementById("tut-overlay")) {
    buildTutorialDOM();
  }
  window.startTutorial();
};

// ── 同時保留原 floating tutorial 相容介面（以防 game.js 直接呼叫） ──
window.nextFloatingStep = function () {
  window.tutorialNext();
};
