// core/townMode.js — 🏘️ 故事模式 RPG 樞紐小地圖
// 切入故事模式 → 城鎮小地圖(方向鍵/WASD 走動)
//   交易殿堂 → 主線桌遊任務(StoryMode 商道戰役)
//   城鎮門口 → 世界大地圖 → 戰棋任務節點(TacticsMode)
//   商店      → 寶石交易 + 購買戰棋部隊技能/強化

/* 城鎮地圖(每格 = 一個 tile;#=牆/裝飾不可走,.=可走)
   建築以 3x2 佔位,門口 D 為觸發格 */
const TOWN = {
  W: 15, H: 11,
  // 由 rows 定義地形:'#'牆 '.'地面 'T'樹 '~'水 'R'路
  rows: [
    '###############',
    '#....T...T....#',
    '#..[HALL]..T..#',
    '#..[HALL]..[S]#',
    '#....d.....[S]#',
    '#RRRRRRRRRRdRR#',
    '#....R........#',
    '#.T..R...T..T.#',
    '#....R........#',
    '#....G........#',
    '###############',
  ],
  // 建築定義:占位標記 → { name, door[x,y], action }
};

// 因為 rows 用簡寫排版易錯,改用程式化佈置(座標直接指定)
const TOWN_MAP = (() => {
  const W = 15, H = 11;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  // 外牆
  for (let x = 0; x < W; x++) { g[0][x] = '#'; g[H - 1][x] = '#'; }
  for (let y = 0; y < H; y++) { g[y][0] = '#'; g[y][W - 1] = '#'; }
  // 主幹道(直向)
  for (let y = 1; y < H - 1; y++) g[y][5] = 'R';
  // 橫向道路
  for (let x = 1; x < W - 1; x++) g[5][x] = 'R';
  // 裝飾樹(不可走)
  [[2, 1], [8, 1], [12, 7], [2, 7], [11, 8], [3, 9], [12, 2]].forEach(([x, y]) => g[y][x] = 'T');
  // 建築占位(B=建築牆體不可走)
  const place = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) g[y][x] = 'B'; };
  place(2, 2, 4, 2);    // 交易殿堂(左上)
  place(10, 2, 3, 2);   // 商店(右上)
  place(8, 7, 3, 2);    // (裝飾用倉庫,可省)—改為留空
  // 清掉裝飾倉庫,保持乾淨
  for (let y = 7; y < 9; y++) for (let x = 8; x < 11; x++) g[y][x] = '.';
  return { W, H, g };
})();

const BUILDINGS = [
  { id: 'hall',  name: '寶石交易殿堂', icon: '🏛️', bx: 2,  by: 2, bw: 4, bh: 2, door: [3, 4],  hint: '進行桌遊任務・商道戰役' },
  { id: 'shop',  name: '商店',        icon: '🏪', bx: 10, by: 2, bw: 3, bh: 2, door: [11, 4], hint: '寶石交易 & 購買部隊技能' },
  { id: 'gate',  name: '城鎮門口',    icon: '🚪', bx: 4,  by: 9, bw: 1, bh: 1, door: [5, 9],  hint: '前往世界地圖・戰線戰役' },
];

/* 世界大地圖節點(對應戰棋 TX_CHAPTERS 索引) */
const WORLD_NODES = [
  { chIdx: 0, name: '紅岩礦坑', icon: '⛏️', x: 22, y: 38, desc: '灰鴉傭兵佔據的黑曜石礦道' },
  { chIdx: 1, name: '橡木鎮糧倉', icon: '🌾', x: 54, y: 26, desc: '深夜遭夜襲的糧倉' },
  { chIdx: 2, name: '邊境森林', icon: '🌲', x: 78, y: 58, desc: '灰鴉主力與首領的阻擊戰' },
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sfx = () => { if (window.playUniformSfx) window.playUniformSfx(); };

export const TownMode = {
  layer: null, px: 5, py: 7, facing: 'up', keyHandler: null, active: false, near: null,

  ensureLayer() {
    if (this.layer) return this.layer;
    let el = document.getElementById('town-layer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'town-layer';
      (document.getElementById('stage') || document.body).appendChild(el);
    }
    this.layer = el;
    return el;
  },

  enter() {
    this.active = true;
    this.px = 5; this.py = 7; this.facing = 'up';
    const el = this.ensureLayer();
    el.classList.add('town-active');
    el.innerHTML = `
      <div class="town-top">
        <span class="town-title">🏘️ 微光村・故事樞紐</span>
        <span class="town-vault" id="town-vault"></span>
        <button class="town-opt" id="town-opt-btn">⚙️ 遊戲選項</button>
      </div>
      <div class="town-viewport" id="town-viewport">
        <div class="town-grid" id="town-grid"></div>
      </div>
      <div class="town-hint" id="town-hint"></div>
      <div class="town-dpad">
        <button data-dir="up">▲</button>
        <div class="town-dpad-mid">
          <button data-dir="left">◀</button>
          <button class="town-act" id="town-act-btn" data-dir="act">互動</button>
          <button data-dir="right">▶</button>
        </div>
        <button data-dir="down">▼</button>
      </div>`;
    this.buildGrid();
    this.bindControls();
    this.updateVault();
    this.render();
  },

  exit() {
    this.active = false;
    if (this.keyHandler) { window.removeEventListener('keydown', this.keyHandler); this.keyHandler = null; }
    if (this.layer) { this.layer.classList.remove('town-active'); this.layer.innerHTML = ''; }
  },

  buildGrid() {
    const { W, H, g } = TOWN_MAP;
    const grid = document.getElementById('town-grid');
    grid.style.gridTemplateColumns = `repeat(${W}, var(--tcell,30px))`;
    let html = '';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = g[y][x];
      let cls = 'town-cell';
      if (t === '#') cls += ' t-wall';
      else if (t === 'R') cls += ' t-road';
      else if (t === 'T') cls += ' t-tree';
      else if (t === 'B') cls += ' t-bld';
      html += `<div class="${cls}" data-x="${x}" data-y="${y}"></div>`;
    }
    grid.innerHTML = html;
    // 建築招牌(覆蓋在建築中央上方)
    BUILDINGS.forEach(b => {
      const sign = document.createElement('div');
      sign.className = 'town-sign';
      sign.style.left = (b.bx + b.bw / 2) + 'em';
      sign.innerHTML = `<span class="town-sign-ico">${b.icon}</span><span class="town-sign-txt">${esc(b.name)}</span>`;
      // 用 CSS 變數定位(以 cell 為單位)
      sign.style.setProperty('--sx', (b.bx + b.bw / 2));
      sign.style.setProperty('--sy', b.by);
      grid.appendChild(sign);
      // 門口光暈
      const door = document.createElement('div');
      door.className = 'town-door';
      door.style.setProperty('--dx', b.door[0]);
      door.style.setProperty('--dy', b.door[1]);
      door.textContent = '◇';
      grid.appendChild(door);
    });
    // 主角
    const hero = document.createElement('div');
    hero.className = 'town-hero'; hero.id = 'town-hero';
    hero.innerHTML = '<div class="town-hero-body">🧝</div>';
    grid.appendChild(hero);
  },

  bindControls() {
    this.keyHandler = (e) => {
      if (!this.active) return;
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
      if (map[e.key]) { e.preventDefault(); this.move(map[e.key]); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.interact(); }
    };
    window.addEventListener('keydown', this.keyHandler);
    this.layer.querySelectorAll('.town-dpad button').forEach(b => {
      b.onclick = () => { const d = b.dataset.dir; if (d === 'act') this.interact(); else this.move(d); };
    });
    // ⚙️ 遊戲選項:收城鎮圖層並開既有選項(可切回其他模式;僅關閉則回城鎮)
    const optBtn = document.getElementById('town-opt-btn');
    if (optBtn) optBtn.onclick = () => {
      sfx();
      this._resumeAfterModal = true;
      this.layer && this.layer.classList.remove('town-active');
      if (window.openGameOptionsModal) window.openGameOptionsModal();
    };
  },

  walkable(x, y) {
    const { W, H, g } = TOWN_MAP;
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const t = g[y][x];
    return t !== '#' && t !== 'B' && t !== 'T';
  },

  move(dir) {
    if (!this.active) return;
    this.facing = dir;
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const nx = this.px + d[0], ny = this.py + d[1];
    if (this.walkable(nx, ny)) { this.px = nx; this.py = ny; sfx(); }
    this.render();
  },

  // 站在門口(或門口相鄰)即可互動
  nearBuilding() {
    for (const b of BUILDINGS) {
      const [dx, dy] = b.door;
      if (Math.abs(this.px - dx) + Math.abs(this.py - dy) <= 1) return b;
    }
    return null;
  },

  render() {
    const hero = document.getElementById('town-hero');
    if (hero) {
      hero.style.setProperty('--hx', this.px);
      hero.style.setProperty('--hy', this.py);
      hero.className = 'town-hero face-' + this.facing;
    }
    const near = this.nearBuilding();
    this.near = near;
    const hintEl = document.getElementById('town-hint');
    const actBtn = document.getElementById('town-act-btn');
    if (near) {
      if (hintEl) hintEl.innerHTML = `<b>${near.icon} ${esc(near.name)}</b>　${esc(near.hint)}　<span class="town-press">按 ⏎ / 互動</span>`;
      if (actBtn) actBtn.classList.add('ready');
    } else {
      if (hintEl) hintEl.innerHTML = `<span class="town-dim">用方向鍵 / WASD 走動,靠近建築門口 ◇ 互動</span>`;
      if (actBtn) actBtn.classList.remove('ready');
    }
  },

  updateVault() {
    const el = document.getElementById('town-vault');
    if (el && window.TacticsVault) el.innerHTML = '💎 ' + window.TacticsVault.lineHtml();
  },

  interact() {
    const near = this.nearBuilding();
    if (!near) return;
    sfx();
    if (near.id === 'hall') this.openHall();
    else if (near.id === 'gate') this.openWorldMap();
    else if (near.id === 'shop') this.openShop();
  },

  /* 🏛️ 交易殿堂 → 桌遊主線任務(先收城鎮圖層,避免蓋住彈窗) */
  openHall() {
    this._resumeAfterModal = true;
    this.layer && this.layer.classList.remove('town-active');
    if (window.StoryMode) window.StoryMode.openStoryMapModal('main');
  },

  /* 🚪 城鎮門口 → 世界大地圖(戰棋節點選單) */
  openWorldMap() {
    const maxCh = (window.TacticsMode && window.TacticsMode.maxUnlockedChapter)
      ? window.TacticsMode.maxUnlockedChapter() : 1;
    let modal = document.getElementById('town-world-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'town-world-modal'; modal.className = 'town-modal';
      this.ensureLayer().appendChild(modal);
    }
    const nodesHtml = WORLD_NODES.map(n => {
      const cleared = window.TacticsMode && window.TacticsMode.isChapterCleared && window.TacticsMode.isChapterCleared(n.chIdx + 1);
      const unlocked = (n.chIdx + 1) <= maxCh;
      return `<button class="town-node ${unlocked ? '' : 'locked'}" style="left:${n.x}%; top:${n.y}%;"
        ${unlocked ? '' : 'disabled'} onclick="window.TownMode.gotoBattle(${n.chIdx})">
        <span class="town-node-ico">${cleared ? '✅' : n.icon}</span>
        <span class="town-node-name">${esc(n.name)}${unlocked ? '' : ' 🔒'}</span>
      </button>`;
    }).join('');
    modal.innerHTML = `
      <div class="town-world">
        <div class="town-world-head">
          <span>🗺️ 世界地圖・戰線戰役</span>
          <button class="town-x" onclick="document.getElementById('town-world-modal').classList.remove('show')">✕</button>
        </div>
        <div class="town-world-map">
          <div class="town-world-legend">選擇一處戰場前往。點亮 ✅ 為已通關,🔒 需先通關前一戰。</div>
          ${nodesHtml}
        </div>
        <div class="town-world-foot">💎 寶石庫:<span id="town-world-vault">${window.TacticsVault ? window.TacticsVault.lineHtml() : ''}</span></div>
      </div>`;
    modal.classList.add('show');
  },
  gotoBattle(chIdx) {
    sfx();
    const modal = document.getElementById('town-world-modal');
    if (modal) modal.classList.remove('show');
    // 進戰棋前先淡出城鎮(戰棋結束會呼叫 TownMode.enter 回來)
    if (window.TacticsMode) window.TacticsMode.openFromTown(chIdx);
  },

  /* 🏪 商店 → 寶石交易 + 部隊技能購買 */
  openShop() {
    if (window.TacticsMode && window.TacticsMode.openShop) window.TacticsMode.openShop();
  },
};
if (typeof window !== 'undefined') window.TownMode = TownMode;
