// core/onlineMode.js
// ═══════════════════════════════════════════════════════════════
// 🌐 好友對戰:2~4 人同房即時線上對戰(房主權威・星狀連線)
//
// 架構:
//   - PeerJS(WebRTC DataChannel)+ 官方免費牽線伺服器,免自架後端
//   - 星狀拓撲:房主為中心,最多收容 3 位好友(含房主共 4 人)
//   - 房主權威「席位制」:正典狀態 = { turn, curSeat, bank, nobles, decks, board, seats[] }
//     每位玩家的行動送交房主合併 → 輪轉至下一席 → 廣播全員
//   - 本地引擎沿用雙席位(player/ai):
//       player = 我的席位(引擎在我的回合直接操作它)
//       ai     = 「正在行動的那位對手」(顯示用;輪到我時顯示下一位)
//     所有對手的完整戰況另以「席位列」浮條顯示
//
// 房間流程:房主建房取得 5 碼房號 → 好友輸入加入(進等待大廳)
//           → 滿 2~4 人房主按「開始對戰」發牌
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const ROOM_PREFIX = 'splendor2026-';
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const MAX_PLAYERS = 4;
  const TARGET_SCORE = 15;
  const TURN_LIMIT = 28;

  const emptySeat = (name) => ({
    name: name || '無名氏',
    tokens: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 0 },
    bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 },
    reserved: [], score: 0, pointCards: 0, noblePoints: 0,
    connected: true,
  });

  const Online = {
    peer: null,
    role: null,            // 'host' | 'guest'
    active: false,         // 對局進行中
    roomCode: '',
    mySeat: 0,             // 我的席位索引(host 固定 0)
    myName: '無名氏',

    // 房主專用
    conns: [],             // 客端連線(索引即 席位-1)
    canon: null,           // 正典狀態(僅房主持有)
    lobbyNames: [],        // 大廳玩家名單 [host, g1, g2, g3]

    // 客端專用
    hostConn: null,

    // 顯示快取(客端也需要知道所有席位,由 sync 帶來)
    seatsView: [],         // 最近一次同步的席位陣列(全員)
    curSeatView: 0,

    isActive() { return this.active; },

    _genCode(n) {
      let s = '';
      for (let i = 0; i < n; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      return s;
    },

    /* ══════════════ 建房(房主) ══════════════ */
    createRoom() {
      const code = this._genCode(5);
      this._setStatus('⏳ 正在向雲端註冊房間…');
      this._teardown(false);
      this.peer = new Peer(ROOM_PREFIX + code, { debug: 1 });

      this.peer.on('open', () => {
        this.roomCode = code;
        this.role = 'host';
        this.mySeat = 0;
        this.myName = this._myName();
        this.lobbyNames = [this.myName];
        this._renderLobby();
      });

      this.peer.on('connection', (conn) => {
        if (this.active || this.conns.length >= MAX_PLAYERS - 1) {
          try { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); }); } catch (e) {}
          return;
        }
        this.conns.push(conn);
        const seatIdx = this.conns.length; // 1..3
        this._wireGuestConn(conn, seatIdx);
      });

      this.peer.on('error', (err) => this._peerError(err));
    },

    /* 房主:接好一條客端連線 */
    _wireGuestConn(conn, seatIdx) {
      conn.on('open', () => {
        conn.send({ t: 'hello-host', seat: seatIdx });
      });
      conn.on('data', (msg) => {
        if (!msg || typeof msg !== 'object') return;
        switch (msg.t) {
          case 'hello': {
            const nm = String(msg.name || '無名氏').slice(0, 12);
            this.lobbyNames[seatIdx] = nm;
            this._renderLobby();
            this._broadcastLobby();
            break;
          }
          case 'move':  this._hostReceiveMove(seatIdx, msg); break;
          case 'chat':  this._relayChat(seatIdx, msg.m); break;
          case 'rematch':
            if (!this.active) break;
            this._toast('⚔️ ' + (this.lobbyNames[seatIdx] || '對手') + ' 想再戰!');
            this.requestRematch();
            break;
        }
      });
      const drop = () => this._hostGuestDropped(conn, seatIdx);
      conn.on('close', drop);
      conn.on('error', drop);
    },

    _hostGuestDropped(conn, seatIdx) {
      const i = this.conns.indexOf(conn);
      if (i >= 0) this.conns[i] = null; // 保留索引對位,標記空缺
      if (!this.active) {
        // 大廳期:直接移出名單並壓縮
        this.conns = this.conns.filter(Boolean);
        this.lobbyNames = [this.myName, ...this.conns.map((c, k) => this.lobbyNames[k + 1] || '好友')];
        this._renderLobby();
        this._broadcastLobby();
        return;
      }
      // 對局中:標記席位斷線;若正輪到該席 → 跳到下一有效席
      if (this.canon && this.canon.seats[seatIdx]) {
        this.canon.seats[seatIdx].connected = false;
        this._toast('⚠️ ' + this.canon.seats[seatIdx].name + ' 已離線,其回合將被跳過');
        const alive = this.canon.seats.filter(s => s.connected).length;
        if (alive <= 1) { this._hostEndMatch('opponents-left'); return; }
        if (this.canon.curSeat === seatIdx) this._hostAdvanceSeat();
        this._hostBroadcastSync(false);
        this._applyCanonLocally();
      }
    },

    /* ══════════════ 入房(客端) ══════════════ */
    joinRoom() {
      const input = document.getElementById('online-join-code');
      const code = (input?.value || '').trim().toUpperCase();
      if (code.length !== 5) { this._setStatus('⚠️ 請輸入好友提供的 5 碼房號'); return; }

      this._setStatus('⏳ 正在連線至房間 ' + code + ' …');
      this._teardown(false);
      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        const conn = this.peer.connect(ROOM_PREFIX + code, { reliable: true });
        this.hostConn = conn;
        conn.on('open', () => {
          this.role = 'guest';
          this.roomCode = code;
          this.myName = this._myName();
          conn.send({ t: 'hello', name: this.myName });
          this._setStatus('🤝 已連上房主!等待其他玩家與房主開局…');
        });
        conn.on('data', (msg) => this._guestReceive(msg));
        const drop = () => this._guestDisconnected();
        conn.on('close', drop);
        conn.on('error', drop);
      });

      this.peer.on('error', (err) => this._peerError(err));
    },

    _guestReceive(msg) {
      if (!msg || typeof msg !== 'object') return;
      switch (msg.t) {
        case 'hello-host':
          this.mySeat = msg.seat | 0;
          break;
        case 'full':
          this._setStatus('⚠️ 房間人數已滿(上限 4 人)或已開局,無法加入');
          break;
        case 'lobby':
          this._setStatus(
            '🛋️ 已在房間等待中(你是 ' + this._seatLabel(this.mySeat) + ')<br>' +
            '目前玩家:' + (msg.names || []).map((n, i) => this._seatLabel(i) + ' ' + n).join('、') +
            '<br>等待房主按下開始…');
          break;
        case 'init':
        case 'restart':
          document.getElementById('win-modal')?.classList.remove('show');
          this.mySeat = msg.seat | 0;
          this._enterMatchLocal(msg.c);
          if (msg.t === 'restart') this._toast('⚔️ 新的一局開始!');
          break;
        case 'sync':
          if (msg.end) this.active = false;
          this._applySync(msg.c);
          if (msg.end) setTimeout(() => this._showRanking(msg.c), 140);
          break;
        case 'chat':
          this._showChatBubble(String(msg.m || '').slice(0, 24), 'opp', String(msg.from || '對手').slice(0, 12));
          break;
      }
    },

    _guestDisconnected() {
      if (!this.active && !this.hostConn) return;
      this.hostConn = null;
      if (this.active) {
        this._toast('⚠️ 與房主的連線已中斷,對戰結束。可由選單重新配對');
        this.active = false;
        const st = window.CoreState.get();
        if (st.onlineMatch) st.onlineMatch.active = false;
        this._unmountChatUI(); this._unmountSeatsBar();
      }
      this._destroyPeer();
    },

    /* ══════════════ 大廳 ══════════════ */
    _renderLobby() {
      const n = this.lobbyNames.length;
      const rows = this.lobbyNames.map((nm, i) =>
        `<div style="display:flex; justify-content:space-between; padding:3px 6px; background:rgba(0,0,0,.25); border-radius:3px; margin-bottom:3px;">
          <span>${this._seatLabel(i)} ${i === 0 ? '👑' : ''} ${nm}</span><span style="color:#2ecc71;">已就位</span></div>`).join('');
      const empty = Array.from({ length: MAX_PLAYERS - n }, () =>
        `<div style="padding:3px 6px; color:#8a8a8a; border:1px dashed #555; border-radius:3px; margin-bottom:3px;">等待玩家加入…</div>`).join('');
      this._setStatus(
        `✅ 房間已建立!房號:<div style="font-size:1.5rem; letter-spacing:6px; color:#ffcc00; font-weight:900; margin:6px 0;">${this.roomCode}</div>` +
        `<div style="text-align:left; font-size:0.66rem; margin-bottom:6px;">${rows}${empty}</div>` +
        `<button class="btn-primary" style="width:100%; padding:8px; ${n >= 2 ? '' : 'opacity:.45; pointer-events:none;'}" ` +
        `onclick="window.playUniformSfx && playUniformSfx(); window.OnlineMode.hostStartMatch()">⚔️ 開始對戰(${n}/${MAX_PLAYERS} 人)</button>` +
        (n < 2 ? `<div style="font-size:0.6rem; color:#c7bfb5; margin-top:4px;">至少需 2 人才能開局;好友加入後即可開始</div>` : '')
      );
    },

    _broadcastLobby() {
      const names = this.lobbyNames;
      this.conns.forEach(c => { if (c && c.open) { try { c.send({ t: 'lobby', names }); } catch (e) {} } });
    },

    _seatLabel(i) { return ['🔵P1', '🔴P2', '🟢P3', '🟡P4'][i] || ('P' + (i + 1)); },

    /* ══════════════ 房主開局:建正典 → 廣播 ══════════════ */
    hostStartMatch() {
      if (this.role !== 'host') return;
      const n = this.lobbyNames.length;
      if (n < 2) { this._toast('至少需 2 人才能開局'); return; }

      // 以本地引擎發牌(牌庫/牌桌/貴族),再抽出共用區組正典
      const state = window.CoreState.get();
      state.mode = 'vsAI';
      state.aiEnabled = false;
      state.settings.selectedAssistant = null;
      state.onlineMatch = { active: true, role: 'host', multi: true };
      this.active = true;
      window.ActionDispatcher.dispatch('INIT_GAME');

      // 人數化銀行:2 人維持預設,3 人每色 +1,4 人每色 +2(黃金不變)
      const extra = Math.max(0, n - 2);
      ['w', 'u', 'g', 'r', 'k'].forEach(k => { state.bank[k] += extra; });

      this.canon = {
        turn: 1, curSeat: 0,
        bank: state.bank, nobles: state.nobles, decks: state.decks, board: state.board,
        seats: this.lobbyNames.map(nm => emptySeat(nm)),
      };
      // 席位分派通知 + 初始正典
      this.conns.forEach((c, i) => {
        if (c && c.open) { try { c.send({ t: 'init', seat: i + 1, c: this._packCanon() }); } catch (e) {} }
      });
      this._enterMatchLocal(this._packCanon());
      this._closeModal();
      this._toast('🌐 對戰開始!你是 P1 先手,請行動');
    },

    _packCanon() { return JSON.parse(JSON.stringify(this.canon)); },

    /* ══════════════ 正典 → 本地雙席映射 ══════════════ */
    _displaySeatIdx(c) {
      // ai 席顯示:輪到別人 → 顯示行動者;輪到我 → 顯示下一位存活對手
      if (c.curSeat !== this.mySeat) return c.curSeat;
      const n = c.seats.length;
      for (let k = 1; k < n; k++) {
        const idx = (this.mySeat + k) % n;
        if (c.seats[idx].connected) return idx;
      }
      return (this.mySeat + 1) % n;
    },

    _applySync(c) {
      this.seatsView = c.seats;
      this.curSeatView = c.curSeat;
      const state = window.CoreState.get();
      state.turn = c.turn;
      state.bank = c.bank;
      state.nobles = c.nobles;
      state.decks = c.decks;
      state.board = c.board;
      state.player = c.seats[this.mySeat];
      const dspIdx = this._displaySeatIdx(c);
      state.ai = c.seats[dspIdx];
      if (state.ai.noblePoints === undefined) state.ai.noblePoints = 0;
      if (state.player.pointCards === undefined) state.player.pointCards = 0;
      state.currentTurnOwner = (c.curSeat === this.mySeat) ? 'player' : 'ai';
      if (!state.settings.aiOpponent) state.settings.aiOpponent = { id: 'online', img: 'https://i.ibb.co/39L2xNMT/1.png', difficulty: 'online' };
      state.settings.aiOpponent.name = this._seatLabel(dspIdx) + ' ' + (c.seats[dspIdx].name || '對手');
      if (typeof window.render === 'function') window.render();
      this._renderSeatsBar();
      if (c.curSeat === this.mySeat && this.active) this._toast('🫵 輪到你了!');
    },

    _enterMatchLocal(c) {
      const state = window.CoreState.get();
      state.mode = 'vsAI';
      state.aiEnabled = false;
      state.settings.selectedAssistant = null;
      state.settings.aiOpponent = { id: 'online', name: '對手', img: 'https://i.ibb.co/39L2xNMT/1.png', difficulty: 'online' };
      state.onlineMatch = { active: true, role: this.role, multi: true };
      this.active = true;
      this._applySync(c);
      this._closeModal();
      this._mountChatUI();
      this._mountSeatsBar();
    },

    /* ══════════════ 行動廣播(action.js 掛鉤點,簽名不變) ══════════════ */
    broadcastState(kind) {
      if (!this.active) return;
      if (kind === 'restart') { return; } // 多人版重開統一走 requestRematch
      const state = window.CoreState.get();
      const move = {
        seat: this.mySeat,
        bank: state.bank, nobles: state.nobles, decks: state.decks, board: state.board,
        me: state.player,
        end: (kind === 'end'),
      };
      if (this.role === 'host') {
        this._hostReceiveMove(0, { t: 'move', ...move });
      } else if (this.hostConn && this.hostConn.open) {
        try { this.hostConn.send({ t: 'move', ...move }); } catch (e) { console.warn('🌐 傳送失敗', e); }
      }
    },

    /* ══════════════ 房主:收行動 → 合併 → 輪轉 → 廣播 ══════════════ */
    _hostReceiveMove(seatIdx, msg) {
      const c = this.canon;
      if (!c || !this.active) return;
      if (msg.seat !== c.curSeat || seatIdx !== c.curSeat) {
        console.warn('🌐 非行動席位的行動被忽略', msg.seat, c.curSeat);
        return;
      }
      // 合併共用區 + 行動者席位
      c.bank = msg.bank; c.nobles = msg.nobles; c.decks = msg.decks; c.board = msg.board;
      const keep = c.seats[seatIdx].connected;
      c.seats[seatIdx] = { ...emptySeat(), ...msg.me, name: c.seats[seatIdx].name, connected: keep };

      // 終局判定(行動者達標 / 回合上限)
      const hitScore = c.seats.some(s => (s.score | 0) >= TARGET_SCORE);
      const nextInfo = this._peekNextSeat();
      const wrapped = nextInfo.wrapped;
      const hitTurns = wrapped && (c.turn + 1) > TURN_LIMIT;
      if (msg.end || hitScore || hitTurns) { this._hostEndMatch('score'); return; }

      this._hostAdvanceSeat();
      this._hostBroadcastSync(false);
      this._applyCanonLocally();
    },

    _peekNextSeat() {
      const c = this.canon, n = c.seats.length;
      for (let k = 1; k <= n; k++) {
        const idx = (c.curSeat + k) % n;
        if (c.seats[idx].connected) return { idx, wrapped: idx <= c.curSeat };
      }
      return { idx: c.curSeat, wrapped: true };
    },

    _hostAdvanceSeat() {
      const { idx, wrapped } = this._peekNextSeat();
      this.canon.curSeat = idx;
      if (wrapped) this.canon.turn++;
    },

    _hostBroadcastSync(isEnd) {
      const pack = this._packCanon();
      this.conns.forEach(cn => {
        if (cn && cn.open) { try { cn.send({ t: 'sync', c: pack, end: !!isEnd }); } catch (e) {} }
      });
    },

    _applyCanonLocally() { this._applySync(this._packCanon()); },

    _hostEndMatch(reason) {
      this._hostBroadcastSync(true);
      this.active = false; // 防止套用同步時誤報「輪到你了」
      this._applyCanonLocally();
      // 延後覆寫:讓 action.js 的雙人結算視窗先開,再以多人排名蓋過
      const pack = this._packCanon();
      setTimeout(() => this._showRanking(pack), 140);
    },

    /* ══════════════ 終局排名(取代雙人勝負視窗) ══════════════ */
    _showRanking(c) {
      this.active = false;
      const st = window.CoreState.get();
      if (st.onlineMatch) st.onlineMatch.active = false;

      const ranked = c.seats.map((s, i) => ({ ...s, seat: i }))
        .sort((a, b) => (b.score - a.score) || (a.seat - b.seat));
      const medal = ['🥇', '🥈', '🥉', '4️⃣'];
      const meRank = ranked.findIndex(r => r.seat === this.mySeat);
      const rows = ranked.map((r, i) =>
        `<div style="display:flex; justify-content:space-between; padding:5px 8px; border-radius:4px; margin-bottom:4px;
          background:${r.seat === this.mySeat ? 'rgba(255,204,0,.14)' : 'rgba(0,0,0,.25)'};
          border:1px solid ${r.seat === this.mySeat ? '#ffcc00' : 'rgba(255,255,255,.08)'};">
          <span>${medal[i]} ${this._seatLabel(r.seat)} ${r.name}${r.connected ? '' : '(離線)'}</span>
          <span style="font-weight:800; color:#ffe099;">${r.score} 分</span>
        </div>`).join('');

      let modal = document.getElementById('win-modal');
      if (!modal) return;
      const box = modal.querySelector('.modal');
      if (box) {
        box.innerHTML = `
          <div style="font-size:2rem;">${meRank === 0 ? '🏆' : '⚔️'}</div>
          <h2 class="modal-title">${meRank === 0 ? '你獲得了勝利!' : '對戰結束'}</h2>
          <p style="font-size:0.68rem; color:var(--text-muted); margin-bottom:8px;">最終排名(${c.seats.length} 人房・第 ${c.turn} 回合)</p>
          <div style="text-align:left; font-size:0.72rem; margin-bottom:10px;">${rows}</div>
          <button class="btn-primary" style="width:100%; padding:8px; margin-bottom:6px;"
            onclick="window.playUniformSfx && playUniformSfx(); window.OnlineMode.requestRematch()">⚔️ 再戰一場(同房)</button>
          <button class="btn-replay" style="width:100%; margin:0; padding:8px;"
            onclick="window.playUniformSfx && playUniformSfx(); window.OnlineMode.rematchNewPeer()">🚪 離開房間</button>`;
      }
      modal.classList.add('show');
    },

    /* ══════════════ 再戰 / 離開 ══════════════ */
    requestRematch() {
      document.getElementById('win-modal')?.classList.remove('show');
      if (this.role === 'host') {
        if (!this.canon) return;
        // 保留同席位與名單,重新發牌
        const names = this.canon.seats.map(s => s.name);
        this.lobbyNames = names;
        // 移除已離線席位?保留名單但僅存活者參戰:簡化 → 離線者移出
        const aliveIdx = this.canon.seats.map((s, i) => s.connected ? i : -1).filter(i => i >= 0);
        if (aliveIdx.length < 2) { this._toast('⚠️ 在線人數不足 2 人,請重新配對'); return; }
        this.lobbyNames = aliveIdx.map(i => names[i]);
        // conns 重新對位(去除斷線)
        this.conns = this.conns.filter(Boolean);
        this.active = true;
        const state = window.CoreState.get();
        state.onlineMatch = { active: true, role: 'host', multi: true };
        window.ActionDispatcher.dispatch('INIT_GAME');
        const extra = Math.max(0, this.lobbyNames.length - 2);
        ['w', 'u', 'g', 'r', 'k'].forEach(k => { state.bank[k] += extra; });
        this.canon = {
          turn: 1, curSeat: 0,
          bank: state.bank, nobles: state.nobles, decks: state.decks, board: state.board,
          seats: this.lobbyNames.map(nm => emptySeat(nm)),
        };
        this.conns.forEach((cn, i) => {
          if (cn && cn.open) { try { cn.send({ t: 'restart', seat: i + 1, c: this._packCanon() }); } catch (e) {} }
        });
        this._enterMatchLocal(this._packCanon());
        this._toast('⚔️ 新的一局開始!');
      } else {
        if (!this.hostConn || !this.hostConn.open) { this._toast('⚠️ 與房主連線已中斷,請改用「離開房間」重新配對'); return; }
        try { this.hostConn.send({ t: 'rematch' }); } catch (e) {}
        this._toast('⚔️ 已向房主發出再戰邀請,等待開局…');
      }
    },

    rematchNewPeer() {
      this.leaveMatch();
      this.openModal();
    },

    leaveMatch() {
      this.active = false;
      this._unmountChatUI(); this._unmountSeatsBar();
      const st = window.CoreState.get();
      if (st.onlineMatch) st.onlineMatch.active = false;
      this._teardown(true);
    },

    _teardown(closeAll) {
      this.conns.forEach(c => { if (c) { try { c.close(); } catch (e) {} } });
      this.conns = [];
      if (this.hostConn) { try { this.hostConn.close(); } catch (e) {} this.hostConn = null; }
      this.canon = null; this.lobbyNames = [];
      this._destroyPeer();
    },

    _destroyPeer() {
      if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
    },

    _peerError(err) {
      const map = {
        'unavailable-id': '⚠️ 房號撞號了(機率極低),請重新建立房間',
        'peer-unavailable': '⚠️ 找不到這個房號的房間,請確認好友的房號是否正確、房間是否仍開著',
        'network': '⚠️ 無法連上牽線伺服器,請檢查網路後重試'
      };
      this._setStatus(map[err.type] || ('⚠️ 連線錯誤:' + err.type));
    },

    _myName() {
      const input = document.getElementById('online-my-name');
      return String(input?.value || '').trim().slice(0, 12) || '無名氏';
    },

    /* ══════════════ 席位列(全員戰況浮條) ══════════════ */
    _mountSeatsBar() {
      this._injectCss();
      if (document.getElementById('online-seats-bar')) return;
      const bar = document.createElement('div');
      bar.id = 'online-seats-bar';
      (document.getElementById('stage') || document.body).appendChild(bar);
      this._renderSeatsBar();
    },
    _unmountSeatsBar() { document.getElementById('online-seats-bar')?.remove(); },
    _renderSeatsBar() {
      const bar = document.getElementById('online-seats-bar');
      if (!bar || !this.seatsView.length) return;
      // 兩人房資訊原版面已足夠,浮條僅在 3 人以上顯示
      if (this.seatsView.length <= 2) { bar.style.display = 'none'; return; }
      bar.style.display = 'flex';
      bar.innerHTML = this.seatsView.map((s, i) => {
        const tokenN = Object.values(s.tokens || {}).reduce((a, b) => a + (b | 0), 0);
        const bonusN = Object.values(s.bonus || {}).reduce((a, b) => a + (b | 0), 0);
        const cur = i === this.curSeatView;
        return `<div class="osb-seat ${cur ? 'cur' : ''} ${i === this.mySeat ? 'me' : ''} ${s.connected ? '' : 'off'}">
          <div class="osb-name">${this._seatLabel(i)} ${s.name}${i === this.mySeat ? '(你)' : ''}${s.connected ? '' : '·離線'}</div>
          <div class="osb-meta">🏆${s.score} 💎${tokenN} 🃏${bonusN}${cur ? ' ⏳' : ''}</div>
        </div>`;
      }).join('');
    },

    _injectCss() {
      if (document.getElementById('online-multi-css')) return;
      const st = document.createElement('style');
      st.id = 'online-multi-css';
      st.textContent = `
#online-seats-bar{ position:absolute; top:4px; left:50%; transform:translateX(-50%); z-index:1500;
  display:flex; gap:4px; padding:3px 5px; background:rgba(8,10,14,.82); border:1px solid rgba(212,175,55,.35);
  border-radius:7px; max-width:calc(var(--stage-w,430px) - 12px); }
#online-seats-bar .osb-seat{ padding:2px 7px; border-radius:5px; border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04); min-width:74px; text-align:center; }
#online-seats-bar .osb-seat.cur{ border-color:#ffcc00; background:rgba(255,204,0,.12); }
#online-seats-bar .osb-seat.me{ box-shadow:inset 0 0 0 1px rgba(111,168,232,.5); }
#online-seats-bar .osb-seat.off{ opacity:.4; }
#online-seats-bar .osb-name{ font-size:0.5rem; color:#ffe099; font-weight:800; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; max-width:96px; }
#online-seats-bar .osb-meta{ font-size:0.52rem; color:#fff; }`;
      document.head.appendChild(st);
    },

    /* ══════════════ 配對視窗 ══════════════ */
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
          <h2 class="modal-title">🌐 好友對戰(2~4 人同房)</h2>
          <p style="font-size:0.68rem; color:var(--text-muted); margin-bottom:10px; line-height:1.5;">
            透過點對點連線與好友即時對戰,一個房間最多 <b style="color:#ffe099">4 人</b>(含房主)。<br>
            一人建立房間取得 5 碼房號,其他人輸入房號加入,房主按下開始即發牌。
          </p>

          <div style="text-align:left; margin-bottom:10px;">
            <label style="font-size:0.62rem; color:#ffe099;">你的暱稱(會顯示給所有玩家)</label>
            <input id="online-my-name" class="online-input" maxlength="12" placeholder="無名氏">
          </div>

          <button class="btn-primary" style="width:100%; padding:9px; margin-bottom:12px;"
            onclick="playUniformSfx(); window.OnlineMode.createRoom()">🏠 建立房間(當房主・P1 先手)</button>

          <div style="margin-bottom:12px;">
            <label style="font-size:0.62rem; color:#ffe099; display:block; text-align:left; margin-bottom:5px;">輸入好友的 5 碼房號</label>
            <div id="online-code-boxes" onclick="document.getElementById('online-join-code').focus()">
              <span class="online-code-box" id="online-cb-0"></span>
              <span class="online-code-box" id="online-cb-1"></span>
              <span class="online-code-box" id="online-cb-2"></span>
              <span class="online-code-box" id="online-cb-3"></span>
              <span class="online-code-box" id="online-cb-4"></span>
              <input id="online-join-code" maxlength="5" autocomplete="off"
                autocapitalize="characters" spellcheck="false" inputmode="text">
            </div>
            <button class="btn-primary online-join-btn"
              onclick="playUniformSfx(); window.OnlineMode.joinRoom()">🚪 加入房間</button>
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
      this._bindCodeBoxes();
    },

    _bindCodeBoxes() {
      const input = document.getElementById('online-join-code');
      if (!input) return;
      const sync = () => {
        let v = input.value.toUpperCase().replace(/[^A-Z2-9]/g, '')
          .replace(/[ILO01]/g, '').slice(0, 5);
        input.value = v;
        for (let i = 0; i < 5; i++) {
          const box = document.getElementById('online-cb-' + i);
          if (!box) return;
          box.textContent = v[i] || '';
          box.classList.toggle('filled', !!v[i]);
          box.classList.toggle('current', i === v.length);
        }
      };
      input.addEventListener('input', sync);
      input.addEventListener('focus', sync);
      input.addEventListener('blur', () => {
        for (let i = 0; i < 5; i++) document.getElementById('online-cb-' + i)?.classList.remove('current');
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.joinRoom(); }
      });
      sync();
    },

    cancelAndClose() {
      if (!this.active) this._teardown(true);
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

    /* ══════════════ 💬 快捷語句(房主中繼廣播) ══════════════ */
    CHAT_PHRASES: ['👍 厲害的一手!', '😱 好險…', '🤔 讓我想想', '⏰ 快點啦~', '🤝 打得漂亮', '⚔️ 再來一場!'],
    _lastChatAt: 0,

    _mountChatUI() {
      if (document.getElementById('online-chat-bar')) return;
      const bar = document.createElement('div');
      bar.id = 'online-chat-bar';
      bar.innerHTML = `
        <button id="online-chat-toggle" title="發送快捷語句"
          onclick="window.OnlineMode._toggleChatPanel()">💬</button>
        <div id="online-chat-panel">
          ${this.CHAT_PHRASES.map((p, i) =>
            `<button class="online-chat-phrase" onclick="window.OnlineMode.sendChat(${i})">${p}</button>`
          ).join('')}
        </div>`;
      (document.getElementById('stage') || document.body).appendChild(bar);
    },

    _unmountChatUI() {
      document.getElementById('online-chat-bar')?.remove();
      document.getElementById('online-chat-bubble')?.remove();
    },

    _toggleChatPanel() {
      if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
      document.getElementById('online-chat-panel')?.classList.toggle('open');
    },

    sendChat(idx) {
      const now = Date.now();
      if (now - this._lastChatAt < 2000) { this._toast('💬 訊息發送太頻繁,稍等一下'); return; }
      const phrase = this.CHAT_PHRASES[idx];
      if (!phrase) return;
      this._lastChatAt = now;
      if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
      if (this.role === 'host') {
        this._relayChat(0, phrase); // 房主自己講話 → 直接中繼給全員
      } else if (this.hostConn && this.hostConn.open) {
        try { this.hostConn.send({ t: 'chat', m: phrase }); } catch (e) {}
        this._showChatBubble(phrase, 'me', '你');
      }
      document.getElementById('online-chat-panel')?.classList.remove('open');
    },

    /* 房主:把 seatIdx 的話廣播給其他人並自己顯示 */
    _relayChat(seatIdx, text) {
      const nm = (this.canon?.seats?.[seatIdx]?.name) || this.lobbyNames[seatIdx] || '對手';
      const msg = String(text || '').slice(0, 24);
      this.conns.forEach((c, i) => {
        if (!c || !c.open) return;
        if (i + 1 === seatIdx) return; // 不回音給發話者
        try { c.send({ t: 'chat', m: msg, from: nm }); } catch (e) {}
      });
      this._showChatBubble(msg, seatIdx === this.mySeat ? 'me' : 'opp', seatIdx === this.mySeat ? '你' : nm);
    },

    _showChatBubble(text, who, name) {
      document.getElementById('online-chat-bubble')?.remove();
      const b = document.createElement('div');
      b.id = 'online-chat-bubble';
      b.className = who === 'me' ? 'from-me' : 'from-opp';
      b.textContent = (name || (who === 'me' ? '你' : '對手')) + ':' + text;
      (document.getElementById('stage') || document.body).appendChild(b);
      setTimeout(() => { b.classList.add('fade'); }, 2600);
      setTimeout(() => { b.remove(); }, 3200);
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
      alert('線上對戰元件載入失敗,請確認網路後重新整理頁面');
      return;
    }
    Online.openModal();
  };

  // ══════════════════════════════════════════════
  // 重開新局守門:線上對戰中只有房主能重開(統一走 requestRematch)
  // ══════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    const patchRestart = () => {
      const original = window.restartGame;
      if (typeof original !== 'function') { setTimeout(patchRestart, 300); return; }
      window.restartGame = function () {
        const st = window.CoreState?.get?.();
        if (st?.onlineMatch?.active) {
          if (Online.role !== 'host') {
            Online._toast('🌐 線上對戰中,僅房主可重開新局');
            return;
          }
          Online.requestRematch();
          return;
        }
        original();
      };
    };
    patchRestart();
  });
})();
