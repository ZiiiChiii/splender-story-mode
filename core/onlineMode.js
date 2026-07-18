// core/onlineMode.js
// ═══════════════════════════════════════════════════════════════
// 🌐 好友對戰：玩家 vs 玩家 即時線上對戰
//
// 技術選型（最簡單但穩定）：
//   - PeerJS（WebRTC DataChannel）＋ PeerJS 官方免費雲端牽線伺服器
//     → 不需自架任何後端，靜態網頁即可直連，一支 CDN 腳本搞定
//   - 「回合制全狀態同步」：行動方每回合結束把完整棋局 JSON 傳給對方
//     → 回合制遊戲天生單寫者、無競態；全量同步天生無增量誤差、無失步
//   - 完全重用 vsAI 版面：對手佔用本地的 ai 席位（AI 思考停用），
//     傳輸時把 player/ai 互換視角，雙方都以「我是玩家」的畫面遊玩
//
// 房間流程：房主建立房間取得 5 碼房號 → 好友輸入房號加入 → 房主發牌開局
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const ROOM_PREFIX = 'splendor2026-';
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去除易混淆字元

  const Online = {
    peer: null,
    conn: null,
    role: null,          // 'host' | 'guest'
    active: false,
    roomCode: '',
    oppName: '神秘對手',

    // ──────────────────────────────────────────────
    // 對外：是否在線上對戰中（action.js 以 state.onlineMatch 判斷，
    // 這裡同步維護，雙保險）
    // ──────────────────────────────────────────────
    isActive() { return this.active; },

    _genCode(n) {
      let s = '';
      for (let i = 0; i < n; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      return s;
    },

    // ══════════════════════════════════════════════
    // 視角互換：我方的 player ↔ 對方收到後的 ai
    // ══════════════════════════════════════════════
    _swapPerspective(state) {
      const s = JSON.parse(JSON.stringify({
        turn: state.turn,
        currentTurnOwner: state.currentTurnOwner,
        bank: state.bank,
        nobles: state.nobles,
        decks: state.decks,
        board: state.board,
        player: state.player,
        ai: state.ai
      }));
      const tmp = s.player;
      s.player = s.ai;
      s.ai = tmp;
      // 席位形狀補齊（player 需 pointCards、ai 需 noblePoints）
      if (s.player.pointCards === undefined) s.player.pointCards = 0;
      if (s.ai.noblePoints === undefined) s.ai.noblePoints = 0;
      s.currentTurnOwner = (s.currentTurnOwner === 'player') ? 'ai' : 'player';
      return s;
    },

    _applyRemote(synced) {
      const state = window.CoreState.get();
      state.turn = synced.turn;
      state.currentTurnOwner = synced.currentTurnOwner;
      state.bank = synced.bank;
      state.nobles = synced.nobles;
      state.decks = synced.decks;
      state.board = synced.board;
      state.player = synced.player;
      state.ai = synced.ai;
      // 本地環境設定（音效、模式旗標、onlineMatch）一律保留不動
    },

    // ══════════════════════════════════════════════
    // 廣播：由 action.js 的回合終結流程呼叫
    // kind: 'turn'（換手） | 'end'（終局） | 'init'（開局發牌）
    // ══════════════════════════════════════════════
    broadcastState(kind) {
      if (!this.active || !this.conn || !this.conn.open) return;
      try {
        this.conn.send({ t: kind, s: this._swapPerspective(window.CoreState.get()) });
      } catch (e) {
        console.warn('🌐 傳送失敗', e);
      }
    },

    // ══════════════════════════════════════════════
    // 建立房間（房主）
    // ══════════════════════════════════════════════
    createRoom() {
      const code = this._genCode(5);
      this._setStatus('⏳ 正在向雲端註冊房間…');
      this._destroyPeer();
      this.peer = new Peer(ROOM_PREFIX + code, { debug: 1 });

      this.peer.on('open', () => {
        this.roomCode = code;
        this.role = 'host';
        this._setStatus(
          `✅ 房間已建立！<br>` +
          `<div style="font-size:1.6rem; letter-spacing:6px; color:#ffcc00; font-weight:900; margin:8px 0;">${code}</div>` +
          `把上面的 5 碼房號告訴好友，等待加入中…`
        );
      });

      this.peer.on('connection', (conn) => {
        if (this.conn) { conn.close(); return; } // 房間只容 2 人
        this.conn = conn;
        this._wireConnection();
        conn.on('open', () => {
          conn.send({ t: 'hello', name: this._myName() });
          this._setStatus('🤝 好友已加入！正在發牌開局…');
          setTimeout(() => this._hostStartMatch(), 400);
        });
      });

      this.peer.on('error', (err) => this._peerError(err));
    },

    // ══════════════════════════════════════════════
    // 加入房間（客方）
    // ══════════════════════════════════════════════
    joinRoom() {
      const input = document.getElementById('online-join-code');
      const code = (input?.value || '').trim().toUpperCase();
      if (code.length !== 5) { this._setStatus('⚠️ 請輸入好友提供的 5 碼房號'); return; }

      this._setStatus('⏳ 正在連線至房間 ' + code + ' …');
      this._destroyPeer();
      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        const conn = this.peer.connect(ROOM_PREFIX + code, { reliable: true });
        this.conn = conn;
        this._wireConnection();
        conn.on('open', () => {
          this.role = 'guest';
          this.roomCode = code;
          conn.send({ t: 'hello', name: this._myName() });
          this._setStatus('🤝 已連上房主！等待房主發牌…');
        });
      });

      this.peer.on('error', (err) => this._peerError(err));
    },

    // ══════════════════════════════════════════════
    // 房主開局：本地發牌 → 全狀態傳給客方
    // ══════════════════════════════════════════════
    _hostStartMatch() {
      const state = window.CoreState.get();
      state.mode = 'vsAI'; // 完全重用 vsAI 版面與勝負判定（15 分 / 28 回合）
      state.aiEnabled = false;
      state.settings.selectedAssistant = null; // 線上對戰不允許輔助官，確保公平
      state.settings.aiOpponent = { id: 'online', name: this.oppName, img: 'https://i.ibb.co/39L2xNMT/1.png', difficulty: 'online' };
      state.onlineMatch = { active: true, role: 'host' };
      this.active = true;

      window.ActionDispatcher.dispatch('INIT_GAME'); // 洗牌、發牌
      // 房主先手；把初始棋局同步給客方
      this.broadcastState('init');
      this._closeModal();
      this._toast('🌐 線上對戰開始！你是先手，請行動');
    },

    _guestReceiveInit(synced) {
      const state = window.CoreState.get();
      state.mode = 'vsAI';
      state.aiEnabled = false;
      state.settings.selectedAssistant = null;
      state.settings.aiOpponent = { id: 'online', name: this.oppName, img: 'https://i.ibb.co/39L2xNMT/1.png', difficulty: 'online' };
      state.onlineMatch = { active: true, role: 'guest' };
      this.active = true;

      this._applyRemote(synced); // 房主視角互換後：客方看到 owner='ai'（等待房主）
      this._closeModal();
      if (typeof window.render === 'function') window.render();
      this._toast('🌐 線上對戰開始！等待房主先行動…');
    },

    // ══════════════════════════════════════════════
    // 收包處理
    // ══════════════════════════════════════════════
    _wireConnection() {
      const conn = this.conn;

      conn.on('data', (msg) => {
        if (!msg || typeof msg !== 'object') return;
        switch (msg.t) {
          case 'hello':
            this.oppName = String(msg.name || '神秘對手').slice(0, 12);
            { const st = window.CoreState.get();
              if (st.settings.aiOpponent) st.settings.aiOpponent.name = this.oppName; }
            break;

          case 'init':
            this._guestReceiveInit(msg.s);
            break;

          case 'turn':
            this._applyRemote(msg.s); // 套用後 owner 已翻轉為 'player' → 輪到我
            if (typeof window.render === 'function') window.render();
            this._toast('🫵 輪到你了！');
            break;

          case 'end':
            this._applyRemote(msg.s);
            if (typeof window.render === 'function') window.render();
            // 對方回合終結觸發了終局 → 本地同步跑一次結算流程顯示勝負視窗
            {
              const st = window.CoreState.get();
              window.ActionDispatcher._showEndModal(st, st.ai.score);
            }
            break;

          case 'restart':
            // 房主重開新局 → 客方收到全新棋局
            this._guestReceiveInit(msg.s);
            this._toast('🔄 房主已重開新局！');
            break;
        }
      });

      conn.on('close', () => this._onDisconnect());
      conn.on('error', () => this._onDisconnect());
    },

    _onDisconnect() {
      if (!this.active && !this.conn) return;
      this.conn = null;
      if (this.active) {
        this._toast('⚠️ 對手已離線，對戰中斷。可由選單重新配對');
        this.active = false;
        const st = window.CoreState.get();
        if (st.onlineMatch) st.onlineMatch.active = false;
      }
      this._destroyPeer();
    },

    leaveMatch() {
      this.active = false;
      const st = window.CoreState.get();
      if (st.onlineMatch) st.onlineMatch.active = false;
      if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
      this._destroyPeer();
    },

    _destroyPeer() {
      if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
    },

    _peerError(err) {
      const map = {
        'unavailable-id': '⚠️ 房號撞號了（機率極低），請重新建立房間',
        'peer-unavailable': '⚠️ 找不到這個房號的房間，請確認好友的房號是否正確、房間是否仍開著',
        'network': '⚠️ 無法連上牽線伺服器，請檢查網路後重試'
      };
      this._setStatus(map[err.type] || ('⚠️ 連線錯誤：' + err.type));
    },

    _myName() {
      const input = document.getElementById('online-my-name');
      return String(input?.value || '').trim().slice(0, 12) || '無名氏';
    },

    // ══════════════════════════════════════════════
    // UI：配對視窗（沿用遊戲既有 modal 樣式體系）
    // ══════════════════════════════════════════════
    openModal() {
      let overlay = document.getElementById('online-modal');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'online-modal';
        (document.getElementById('stage') || document.body).appendChild(overlay);
      }
      overlay.innerHTML = `
        <div class="modal" style="max-width:400px; padding:18px;">
          <h2 class="modal-title">🌐 好友對戰（即時線上）</h2>
          <p style="font-size:0.68rem; color:var(--text-muted); margin-bottom:10px; line-height:1.5;">
            透過點對點連線與好友即時對戰。<br>一人建立房間取得 5 碼房號，另一人輸入房號加入。
          </p>

          <div style="text-align:left; margin-bottom:10px;">
            <label style="font-size:0.62rem; color:#ffe099;">你的暱稱（會顯示給對手）</label>
            <input id="online-my-name" class="online-input" maxlength="12" placeholder="無名氏">
          </div>

          <button class="btn-primary" style="width:100%; padding:9px; margin-bottom:12px;"
            onclick="playUniformSfx(); window.OnlineMode.createRoom()">🏠 建立房間（當房主・先手）</button>

          <div style="display:flex; gap:6px; align-items:stretch; margin-bottom:12px;">
            <input id="online-join-code" class="online-input" maxlength="5" placeholder="輸入 5 碼房號"
              style="flex:1; text-transform:uppercase; letter-spacing:4px; text-align:center;">
            <button class="btn-primary" style="padding:0 14px;"
              onclick="playUniformSfx(); window.OnlineMode.joinRoom()">🚪 加入</button>
          </div>

          <div id="online-status" style="min-height:44px; font-size:0.7rem; color:#fff; line-height:1.5;
            background:rgba(0,0,0,0.35); border:1px dashed rgba(212,175,55,0.3); border-radius:4px; padding:8px;">
            尚未連線
          </div>

          <button class="btn-replay" style="width:100%; margin-top:12px; padding:8px;"
            onclick="playUniformSfx(); window.OnlineMode.cancelAndClose()">關閉</button>
        </div>
      `;
      overlay.classList.add('show');
    },

    cancelAndClose() {
      // 尚未開局就關窗 → 順手拆房；已在對戰中則只收起視窗
      if (!this.active) this._destroyPeer();
      this._closeModal();
    },

    _closeModal() {
      document.getElementById('online-modal')?.classList.remove('show');
      document.getElementById('game-options-modal')?.classList.remove('show');
    },

    _setStatus(html) {
      const el = document.getElementById('online-status');
      if (el) el.innerHTML = html;
    },

    _toast(msg) {
      const el = document.getElementById('error-msg');
      if (el) {
        el.textContent = msg;
        setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
      }
    }
  };

  window.OnlineMode = Online;
  window.openOnlineModal = function () {
    if (typeof Peer === 'undefined') {
      alert('線上對戰元件載入失敗，請確認網路後重新整理頁面');
      return;
    }
    Online.openModal();
  };

  // ══════════════════════════════════════════════
  // 重開新局守門：線上對戰中只有房主能重開（重開後同步發牌給客方）
  // ══════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    const patchRestart = () => {
      const original = window.restartGame;
      if (typeof original !== 'function') { setTimeout(patchRestart, 300); return; }
      window.restartGame = function () {
        const st = window.CoreState?.get?.();
        if (st?.onlineMatch?.active) {
          if (Online.role !== 'host') {
            Online._toast('🌐 線上對戰中，僅房主可重開新局');
            return;
          }
          document.getElementById('win-modal')?.classList.remove('show');
          window.ActionDispatcher.dispatch('INIT_GAME');
          Online.broadcastState('restart');
          return;
        }
        original();
      };
    };
    patchRestart();
  });
})();
