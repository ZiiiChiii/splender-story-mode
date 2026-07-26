// core/aiReaction.js
// ═══════════════════════════════════════════════════════════════
// 🎭 帝國爭霸・全螢幕角色表情演出(Cut-in)
//
// 設計原則:
//   - 純演出、不阻擋玩法:動畫期間玩家仍可操作,約 2 秒自動收場
//   - 三位對手各有專屬台詞與情緒(翠席兒親切/米斗好戰/狄菲克傲慢)
//   - 有優先序與冷卻:避免每回合都跳,情緒重要度高者可插隊
//   - 終局(勝/敗)演出結束後才顯示結算視窗,沿用貴族動畫的 defer 模式
//
// 觸發條件(依優先序):
//   panic     AI 落後 3 分以上且玩家逼近勝利(≥12 分) — 每局一次
//   angry     玩家本回合反超 AI
//   shock     玩家單回合得 4 分以上(高階卡/貴族連擊)
//   taunt     AI 收購 3 分以上卡片,或 AI 反超玩家
//   confident AI 首次達 12 分 — 每局一次
//   victory / defeat  終局
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const LAYER_ID = 'ai-reaction-layer';
  const SFX_IMPACT = 'https://assets.mixkit.co/active_storage/sfx/2160/2160-preview.mp3';
  const DURATION = 2100;      // 整段演出長度(ms)
  const COOLDOWN_TURNS = 2;   // 一般情緒之間的最小間隔回合

  /* 情緒調色與標籤 */
  const EMO = {
    taunt:     { name: '得意', face: '😏', c: '#E7B24C', c2: '#8A5E14' },
    shock:     { name: '驚愕', face: '😲', c: '#7BE0D8', c2: '#1E6E68' },
    angry:     { name: '慍怒', face: '😠', c: '#E0575B', c2: '#7A1F22' },
    panic:     { name: '慌張', face: '😰', c: '#9B7BD8', c2: '#4A3768' },
    confident: { name: '自信', face: '😌', c: '#4FA3E0', c2: '#1E4E74' },
    victory:   { name: '勝利', face: '👑', c: '#F4D98C', c2: '#8A5E14' },
    defeat:    { name: '落敗', face: '😔', c: '#8FA0B4', c2: '#33404F' },
  };

  /* 情緒優先序(數字大者可插隊、可打斷冷卻) */
  const PRIORITY = { victory: 100, defeat: 100, panic: 60, shock: 45, angry: 40, taunt: 30, confident: 25 };

  /* 各對手專屬台詞 */
  const LINES = {
    tracy: {  // 翠席兒・簡單:親切、鼓勵型
      taunt:     ['這張卡我收下囉～謝謝你！', '嘿嘿，這張正好是我想要的！'],
      shock:     ['哇！你好厲害呀！', '欸——你怎麼買得起那張？'],
      angry:     ['唔…我也要加油了！', '不可以只有你一直贏喔！'],
      panic:     ['等、等一下！我還沒準備好呀！', '呀…你快要贏了！'],
      confident: ['嘿嘿，我今天手氣不錯喔！', '我也慢慢追上來了呢～'],
      victory:   ['呀呼！我贏了～下次再一起玩吧！'],
      defeat:    ['你好強呀！我學到很多囉～'],
    },
    midou: {  // 米斗・普通:好戰、嘴上不服輸
      taunt:     ['這張，我先拿走了！', '慢一步，就什麼都沒了。'],
      shock:     ['什麼？！你哪來的錢？', '喂，那張不是留給我的嗎！'],
      angry:     ['別得意得太早啊你！', '哼，領先一下就翹鼻子？'],
      panic:     ['不會吧…我要輸了？！', '糟糕、糟糕、糟糕！'],
      confident: ['勝利的天秤，開始傾斜了。', '看見了嗎？這叫節奏。'],
      victory:   ['哈！這就是實力的差距！'],
      defeat:    ['可惡…下一局我不會再讓了！'],
    },
    defik: {  // 狄菲克・困難:傲慢的策略家
      taunt:     ['早在三步之前，這張卡就是我的了。', '你的猶豫，就是我的利潤。'],
      shock:     ['有趣…你竟然算到了這一步。', '這一手，不在我的預期裡。'],
      angry:     ['僭越了。你不該領先我。', '把位置還回來，商人。'],
      panic:     ['不可能…我的算式怎麼會…', '變數太多了…重新推演！'],
      confident: ['棋盤已定，剩下的只是收割。', '產能滾動起來了。你追不上。'],
      victory:   ['這就是策略的重量。記住這份差距。'],
      defeat:    ['……我的計算，出現了變數。精彩。'],
    },
    _default: {
      taunt:     ['這張卡，我要了。'],
      shock:     ['什麼？！'],
      angry:     ['別太囂張。'],
      panic:     ['怎麼會這樣…'],
      confident: ['優勢在我。'],
      victory:   ['我贏了。'],
      defeat:    ['你贏了…'],
    },
  };

  function pickLine(oppId, emo) {
    const set = LINES[oppId] || LINES._default;
    const arr = set[emo] || LINES._default[emo] || ['……'];
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function reduceMotion() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }
  function playImpact() {
    try {
      if (typeof Audio === 'undefined') return;
      if (window.CoreState && window.CoreState.get().settings.isSfxMuted) return;
      const a = new Audio(SFX_IMPACT);
      a.volume = 0.5;
      a.play().catch(() => {});
    } catch (e) {}
  }

  const AiReaction = {
    _timer: null,
    _endShown: false,     // 本局終局演出是否已播
    _lastTurn: -1,        // 用於偵測新局(回合數回退)
    _lastFireTurn: -99,   // 上次演出的回合
    _once: {},            // 每局限一次的情緒旗標

    /* 新局重置(由 evaluateTurn 自動偵測,也可外部呼叫) */
    reset() {
      this._endShown = false;
      this._lastFireTurn = -99;
      this._once = {};
      this.close();
    },

    /* 目前是否適用:僅帝國爭霸(vsAI)且非線上對戰 */
    _enabled(state) {
      if (!state || state.mode !== 'vsAI') return false;
      if (state.onlineMatch && state.onlineMatch.active) return false;   // 線上對手是真人,不套用 AI 表情
      return !!state.ai;
    },

    _oppInfo(state) {
      const o = (state.settings && state.settings.aiOpponent) || {};
      return { id: o.id || '_default', name: o.name || '對手', img: o.img || '' };
    },

    /* ══════════ 回合結算後評估要不要演出 ══════════ */
    evaluateTurn(actor, before, meta, aiEffectiveScore) {
      try {
        const state = window.CoreState && window.CoreState.get();
        if (!this._enabled(state)) return;

        const turn = state.turn | 0;
        if (turn < this._lastTurn) this.reset();   // 回合回退 → 新的一局
        this._lastTurn = turn;

        const p = state.player.score | 0;
        const a = (aiEffectiveScore != null ? aiEffectiveScore : state.ai.score) | 0;
        const bp = (before && before.p) | 0;
        const ba = (before && before.a) | 0;

        // 終局交給 deferEnd 處理,回合演出讓位
        if (p >= 15 || a >= 15) return;

        let emo = null;
        if (a + 3 <= p && p >= 12 && !this._once.panic) {
          emo = 'panic';
        } else if (actor === 'player' && (p - bp) >= 4) {
          // 大額得分(高階卡/貴族連擊)比單純反超更醒目,優先演驚愕
          emo = 'shock';
        } else if (actor === 'player' && bp <= ba && p > a) {
          emo = 'angry';
        } else if (actor === 'ai' && ((a - ba) >= 3 || (ba <= bp && a > p))) {
          emo = 'taunt';
        } else if (a >= 12 && !this._once.confident) {
          emo = 'confident';
        }
        if (!emo) return;

        // 冷卻:低優先序情緒需間隔;高優先序(panic)可插隊
        const prio = PRIORITY[emo] || 0;
        if (prio < PRIORITY.panic && (turn - this._lastFireTurn) < COOLDOWN_TURNS) return;

        if (emo === 'panic' || emo === 'confident') this._once[emo] = true;
        this._lastFireTurn = turn;
        this.play(emo);
      } catch (e) { /* 演出失敗不影響對局 */ }
    },

    /* ══════════ 終局演出:播完才顯示結算視窗 ══════════
       回傳 true 表示「已接手、稍後會回呼」,呼叫端應立即 return */
    deferEnd(state, aiEffectiveScore, resume) {
      try {
        if (!this._enabled(state)) return false;
        if (this._endShown) return false;
        this._endShown = true;

        const p = state.player.score | 0;
        const a = (aiEffectiveScore != null ? aiEffectiveScore : state.ai.score) | 0;
        // AI 贏 → 勝利宣言;玩家贏或平手/超時 → 落敗感嘆
        const emo = (a >= 15 && a > p) ? 'victory' : 'defeat';
        this.play(emo, resume);
        return true;
      } catch (e) {
        this._endShown = true;
        return false;
      }
    },

    /* ══════════ 演出本體 ══════════ */
    play(emo, onDone) {
      const state = window.CoreState && window.CoreState.get();
      const info = this._oppInfo(state || {});
      const e = EMO[emo] || EMO.taunt;
      const line = pickLine(info.id, emo);
      const slim = reduceMotion();

      this.close();
      const layer = document.createElement('div');
      layer.id = LAYER_ID;
      layer.className = 'arx' + (slim ? ' arx-slim' : '');
      layer.style.setProperty('--c', e.c);
      layer.style.setProperty('--c2', e.c2);
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML =
        '<div class="arx-flash"></div>' +
        '<div class="arx-lines"></div>' +
        '<div class="arx-band"></div>' +
        '<div class="arx-band arx-band2"></div>' +
        '<div class="arx-portrait-wrap">' +
          '<div class="arx-glow"></div>' +
          (info.img ? '<img class="arx-portrait" src="' + esc(info.img) + '" alt="">' : '') +
        '</div>' +
        '<div class="arx-text">' +
          '<div class="arx-emo"><span class="arx-face">' + e.face + '</span>' +
            '<span class="arx-emo-name">' + esc(e.name) + '</span>' +
            '<span class="arx-who">' + esc(info.name) + '</span></div>' +
          '<div class="arx-line">' + esc(line) + '</div>' +
        '</div>' +
        '<div class="arx-sparks">' +
          '<i style="--sx:14%;--sy:26%;--sd:80ms"></i><i style="--sx:78%;--sy:18%;--sd:150ms"></i>' +
          '<i style="--sx:24%;--sy:74%;--sd:220ms"></i><i style="--sx:86%;--sy:66%;--sd:120ms"></i>' +
          '<i style="--sx:52%;--sy:12%;--sd:280ms"></i><i style="--sx:40%;--sy:88%;--sd:200ms"></i>' +
        '</div>';

      const host = document.getElementById('stage') || document.body;
      host.appendChild(layer);
      // 觸發動畫(下一幀加 class,確保初始狀態先套用)
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => layer.classList.add('arx-run'));
      } else { layer.classList.add('arx-run'); }
      playImpact();

      const life = slim ? 1200 : DURATION;
      this._timer = setTimeout(() => {
        this.close();
        if (typeof onDone === 'function') onDone();
      }, life);
    },

    close() {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      const old = document.getElementById(LAYER_ID);
      if (old) old.remove();
    },

    /* 測試/除錯:在主控台預覽任一情緒 → AiReaction.preview('taunt') */
    preview(emo) { this.play(emo in EMO ? emo : 'taunt'); },
  };

  if (typeof window !== 'undefined') window.AiReaction = AiReaction;
})();
