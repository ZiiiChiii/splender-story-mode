// core/storyDialog.js — 📖 共用劇情展示引擎(視覺小說格式)
// 桌遊模式(主線商道戰役)與戰棋模式(次線戰線戰役)統一使用此引擎:
//   角色立繪 + 金框對話盒 + 保留背景空間 + 打字機 + 情緒動畫
//
// 世界觀敘事定位:
//   地圖世界是本體 → 主角以「寶石交易手腕」取得資源(桌遊) → 以資源鍛造夥伴對抗敵人(戰棋)
//   兩線劇情共用同一個「劇場」,玩家在哪一線都會看到一致的演出格式。
//
// API:
//   StoryDialog.play({
//     headline : '章節大標(常駐左上)',
//     subline  : '小標/呼應說明(選填)',
//     goal     : '🏆 目標:…(選填,獨立橫幅、絕不與對話重疊)',
//     script   : [ { who, side:'ally'|'foe'|'n', text, img, pixel, mood } , ... ],
//     onDone   : fn,        // 劇情播畢/跳過時呼叫
//     canSkip  : true       // 是否顯示「跳過」
//   })
//   StoryDialog.advance()   // 手動推進(等同點擊)
//   StoryDialog.close()     // 強制關閉(不觸發 onDone)
//
// mood(情緒)驅動簡單動畫;未指定時依標點自動推斷:
//   angry   : 憤怒 — 文字放大、名牌泛紅脈動、對話盒震動、立繪前傾突進
//   shout   : 激昂 — 文字略放大、驚嘆號字元彈跳強調
//   whisper : 低語 — 文字縮小轉暗、打字速度放慢
//   sad     : 哀傷 — 冷色調、緩速
//   happy   : 欣喜 — 名牌金光、字元輕快彈入
//   normal  : 一般

(function () {
  'use strict';

  const TYPE_SPEED = { angry: 20, shout: 26, normal: 34, happy: 30, sad: 46, whisper: 55 };

  // ── 依標點自動推斷情緒 ──
  function inferMood(text) {
    const t = String(text || '');
    const bangs = (t.match(/[！!]/g) || []).length;
    if (/(咳|嗚)?……\s*$/.test(t) && bangs === 0) return 'whisper';
    if (bangs >= 2) return 'angry';
    if (bangs === 1) return 'shout';
    if (/……/.test(t) && /[?？]\s*$/.test(t)) return 'sad';
    if (/[~〜♪]/.test(t)) return 'happy';
    return 'normal';
  }

  const reducedMotion = () =>
    (typeof matchMedia === 'function') && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sfx = () => { if (window.playUniformSfx) window.playUniformSfx(); };

  const StoryDialog = {
    _layer: null, _opts: null, _script: [], _i: 0,
    _typing: false, _timer: null, _lastPortraitKey: '',

    /* ── 建立(或取得)劇場圖層:掛在 #stage 內,與遊戲舞台同寬高 ── */
    ensureLayer() {
      if (this._layer && document.body.contains(this._layer)) return this._layer;
      const host = document.getElementById('stage') || document.body;
      let el = document.getElementById('story-dialog-layer');
      if (!el) {
        el = document.createElement('div');
        el.id = 'story-dialog-layer';
        if (host === document.body) el.classList.add('sd-fixed');
        host.appendChild(el);
      }
      el.innerHTML = `
        <div class="sd-head">
          <div class="sd-title" id="sd-title"></div>
          <div class="sd-sub" id="sd-sub"></div>
        </div>
        <button class="sd-skip" id="sd-skip" type="button">跳過 ≫</button>
        <div class="sd-scene">
          <div class="sd-portrait" id="sd-portrait"><img id="sd-portrait-img" alt="角色立繪" draggable="false"></div>
        </div>
        <div class="sd-goal" id="sd-goal"></div>
        <div class="sd-box" id="sd-box">
          <div class="sd-name" id="sd-name">???</div>
          <div class="sd-text" id="sd-text"></div>
          <div class="sd-hint">▼ 點擊繼續</div>
        </div>`;
      // 整層皆可點擊推進(跳過鈕除外)
      el.onclick = () => { this.advance(); };
      el.querySelector('#sd-skip').onclick = (e) => { e.stopPropagation(); sfx(); this._finish(); };
      this._layer = el;
      return el;
    },

    /* ── 播放一段劇本 ── */
    play(opts) {
      opts = opts || {};
      const script = (opts.script || []).filter(l => l && l.text);
      if (!script.length) { if (typeof opts.onDone === 'function') opts.onDone(); return; }

      this._opts = opts;
      this._script = script;
      this._i = 0;
      this._lastPortraitKey = '';

      const layer = this.ensureLayer();
      layer.querySelector('#sd-title').textContent = opts.headline || '';
      layer.querySelector('#sd-sub').textContent = opts.subline || '';
      layer.querySelector('#sd-sub').style.display = opts.subline ? '' : 'none';
      const goalEl = layer.querySelector('#sd-goal');
      goalEl.textContent = opts.goal || '';
      goalEl.style.display = opts.goal ? '' : 'none';
      layer.querySelector('#sd-skip').style.display = (opts.canSkip === false) ? 'none' : '';

      layer.classList.add('sd-active');
      this._renderLine();
    },

    /* ── 推進:打字中→立即補完;否則→下一句/收尾 ── */
    advance() {
      if (!this._layer || !this._layer.classList.contains('sd-active')) return;
      if (this._typing) { this._completeTyping(); return; }
      sfx();
      this._i++;
      if (this._i >= this._script.length) this._finish();
      else this._renderLine();
    },

    close() {
      clearInterval(this._timer); this._timer = null; this._typing = false;
      if (this._layer) this._layer.classList.remove('sd-active');
    },

    _finish() {
      const done = this._opts && this._opts.onDone;
      this.close();
      if (typeof done === 'function') done();
    },

    /* ── 渲染單句:名牌 / 立繪 / 情緒 / 打字機 ── */
    _renderLine() {
      const line = this._script[this._i];
      const layer = this._layer;
      const mood = line.mood || inferMood(line.text);
      const side = line.side || (line.who ? 'ally' : 'n');
      const isNarr = !line.who;

      // 名牌
      const nameEl = layer.querySelector('#sd-name');
      nameEl.textContent = line.who || '旁白';
      nameEl.className = 'sd-name side-' + side + ' mood-' + mood;

      // 對話盒情緒(憤怒 → 震動一次)
      const box = layer.querySelector('#sd-box');
      box.className = 'sd-box mood-' + mood + (isNarr ? ' is-narr' : '');
      if (mood === 'angry' && !reducedMotion()) {
        box.classList.remove('sd-shake'); void box.offsetWidth; box.classList.add('sd-shake');
      }

      // 立繪:旁白隱藏;同角色續說僅「開口彈跳」;換角色重播入場
      const pWrap = layer.querySelector('#sd-portrait');
      const pImg = layer.querySelector('#sd-portrait-img');
      if (isNarr || !line.img) {
        pWrap.className = 'sd-portrait sd-hidden';
        this._lastPortraitKey = '';
      } else {
        const key = line.img + '|' + side;
        pWrap.className = 'sd-portrait side-' + side + (line.pixel ? ' sd-pixel' : '') + ' mood-' + mood;
        if (key !== this._lastPortraitKey) {
          pImg.src = line.img;
          pWrap.classList.remove('sd-enter'); void pWrap.offsetWidth; pWrap.classList.add('sd-enter');
          this._lastPortraitKey = key;
        } else {
          pWrap.classList.remove('sd-talk'); void pWrap.offsetWidth; pWrap.classList.add('sd-talk');
        }
      }

      this._typeText(line.text, mood);
    },

    /* ── 打字機:逐字生成 <span>,驚嘆/問號字元加強彈跳 ── */
    _typeText(text, mood) {
      clearInterval(this._timer);
      const textEl = this._layer.querySelector('#sd-text');
      textEl.innerHTML = '';
      const chars = Array.from(String(text));
      const frag = [];
      for (const ch of chars) {
        const span = document.createElement('span');
        span.textContent = ch;
        span.className = 'sd-ch' + (/[！!？?——]/.test(ch) ? ' sd-em' : '');
        span.style.visibility = 'hidden';
        textEl.appendChild(span);
        frag.push(span);
      }

      // 減少動態偏好 → 直接整句顯示
      if (reducedMotion()) {
        frag.forEach(s => { s.style.visibility = ''; s.classList.add('sd-still'); });
        this._typing = false;
        return;
      }

      let idx = 0;
      this._typing = true;
      const speed = TYPE_SPEED[mood] || TYPE_SPEED.normal;
      this._timer = setInterval(() => {
        if (idx >= frag.length) {
          clearInterval(this._timer); this._timer = null; this._typing = false;
          return;
        }
        const s = frag[idx++];
        s.style.visibility = '';
        s.classList.add('sd-pop');
      }, speed);
    },

    _completeTyping() {
      clearInterval(this._timer); this._timer = null;
      const textEl = this._layer.querySelector('#sd-text');
      textEl.querySelectorAll('.sd-ch').forEach(s => {
        s.style.visibility = ''; s.classList.add('sd-still');
      });
      this._typing = false;
    }
  };

  window.StoryDialog = StoryDialog;
})();
