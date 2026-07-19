// core/townMode.js — 🏘️ 故事模式 RPG 樞紐(canvas 像素風・絲滑連續移動)
//   交易殿堂 → 主線桌遊任務(StoryMode 商道戰役)
//   城鎮門口 → 世界大地圖 → 戰棋任務節點(TacticsMode)
//   商店      → 寶石交易 + 購買戰棋部隊技能/強化

const TILE = 32;          // 每格像素(邏輯座標)
const W = 15, H = 12;     // 地圖格數

/* 地形碼:G草 R石板路 P廣場磚 W水 . 內部代號 */
const MAP = (() => {
  const g = Array.from({ length: H }, () => Array(W).fill('G'));
  // 外圈柵欄(F 不可走)
  for (let x = 0; x < W; x++) { g[0][x] = 'F'; g[H - 1][x] = 'F'; }
  for (let y = 0; y < H; y++) { g[y][0] = 'F'; g[y][W - 1] = 'F'; }
  // 中央十字石板路
  for (let y = 1; y < H - 1; y++) g[y][7] = 'R';
  for (let x = 1; x < W - 1; x++) g[6][x] = 'R';
  // 廣場(路口周邊鋪磚)
  for (let y = 5; y <= 7; y++) for (let x = 6; x <= 8; x++) if (g[y][x] === 'G') g[y][x] = 'P';
  // 水池(裝飾,不可走)
  g[9][2] = 'W'; g[9][3] = 'W'; g[10][2] = 'W'; g[10][3] = 'W';
  return g;
})();

/* 建築:bx,by 左上格;bw,bh 佔格;door 觸發格(通常在建築正下方) */
const BUILDINGS = [
  { id: 'hall', name: '寶石交易殿堂', kind: 'temple', bx: 2,  by: 2, bw: 3, bh: 3, door: [3, 5],  hint: '進行桌遊任務・商道戰役' },
  { id: 'shop', name: '商店',        kind: 'shop',   bx: 10, by: 2, bw: 3, bh: 3, door: [11, 5], hint: '寶石交易 & 購買部隊技能' },
  { id: 'gate', name: '城鎮門口',    kind: 'gate',   bx: 6,  by: 10, bw: 3, bh: 1, door: [7, 9],  hint: '前往世界地圖・戰線戰役' },
];
// 標記建築佔位為不可走(門口除外)
BUILDINGS.forEach(b => {
  for (let y = b.by; y < b.by + b.bh; y++) for (let x = b.bx; x < b.bx + b.bw; x++)
    if (MAP[y] && MAP[y][x] !== undefined) MAP[y][x] = 'B';
});
// 樹木(裝飾,不可走)
const TREES = [[2, 1], [12, 1], [1, 4], [13, 8], [2, 8], [12, 4], [4, 8], [10, 8]];
TREES.forEach(([x, y]) => { if (MAP[y] && MAP[y][x] === 'G') MAP[y][x] = 'T'; });

const WORLD_NODES = [
  { chIdx: 0, name: '紅岩礦坑', icon: '⛏️', x: 22, y: 38, desc: '灰鴉傭兵佔據的黑曜石礦道' },
  { chIdx: 1, name: '橡木鎮糧倉', icon: '🌾', x: 54, y: 26, desc: '深夜遭夜襲的糧倉' },
  { chIdx: 2, name: '邊境森林', icon: '🌲', x: 78, y: 58, desc: '灰鴉主力與首領的阻擊戰' },
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sfx = () => { if (window.playUniformSfx) window.playUniformSfx(); };

/* ══════════ 像素素材(離屏 canvas 快取,RPGmaker 風) ══════════ */
const TEX = {};
function px(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function makeTile(key, draw) {
  if (TEX[key]) return TEX[key];
  const c = document.createElement('canvas'); c.width = TILE; c.height = TILE;
  const ctx = c.getContext('2d'); draw(ctx);
  TEX[key] = c; return c;
}
// 以座標為種子的偽隨機(讓草地紋理穩定不閃爍)
function hash(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }

function buildTextures() {
  makeTile('G', ctx => { // 草地
    px(ctx, 0, 0, TILE, TILE, '#4a7a3f');
    px(ctx, 0, 0, TILE, TILE, '#4a7a3f');
    const g = ctx.createLinearGradient(0, 0, 0, TILE);
    g.addColorStop(0, '#548a47'); g.addColorStop(1, '#446e3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, TILE, TILE);
  });
  makeTile('R', ctx => { // 石板路
    px(ctx, 0, 0, TILE, TILE, '#9a8c6f');
    for (let i = 0; i < TILE; i += 8) for (let j = 0; j < TILE; j += 8) {
      px(ctx, i + 1, j + 1, 6, 6, (i + j) % 16 === 0 ? '#a89a7c' : '#8f8266');
    }
    ctx.strokeStyle = 'rgba(60,50,35,.35)'; ctx.lineWidth = 1;
    for (let i = 0; i <= TILE; i += 8) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, TILE); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(TILE, i); ctx.stroke(); }
  });
  makeTile('P', ctx => { // 廣場磚(米色)
    px(ctx, 0, 0, TILE, TILE, '#c8b68c');
    ctx.strokeStyle = 'rgba(120,100,70,.4)'; ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, TILE - 4, TILE - 4);
    px(ctx, TILE / 2 - 1, 2, 2, TILE - 4, 'rgba(120,100,70,.25)');
  });
  makeTile('W', ctx => { // 水
    const g = ctx.createLinearGradient(0, 0, 0, TILE);
    g.addColorStop(0, '#3d7fb5'); g.addColorStop(1, '#2f6698');
    ctx.fillStyle = g; ctx.fillRect(0, 0, TILE, TILE);
    px(ctx, 4, 8, 10, 2, 'rgba(255,255,255,.35)');
    px(ctx, 16, 18, 8, 2, 'rgba(255,255,255,.25)');
  });
  makeTile('F', ctx => { // 柵欄外圈(草+木欄)
    TEX['G'] && ctx.drawImage(TEX['G'], 0, 0);
    px(ctx, 0, 10, TILE, 4, '#6b4a2b');
    px(ctx, 4, 4, 4, TILE - 6, '#7a5230'); px(ctx, TILE - 8, 4, 4, TILE - 6, '#7a5230');
  });
}

/* 建築繪製(直接畫到主 ctx,座標為像素) */
function drawBuilding(ctx, b, ox, oy) {
  const x = b.bx * TILE - ox, y = b.by * TILE - oy, w = b.bw * TILE, h = b.bh * TILE;
  if (b.kind === 'gate') {
    // 城門:兩根石柱 + 橫楣
    px(ctx, x, y + h - 22, 10, 22, '#8a7f6a'); px(ctx, x + w - 10, y + h - 22, 10, 22, '#8a7f6a');
    px(ctx, x, y + h - 26, w, 8, '#6d6353');
    px(ctx, x + 14, y + h - 20, w - 28, 20, '#2a2018'); // 門洞
    ctx.fillStyle = '#ffe099'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('城 門', x + w / 2, y + h - 30);
    return;
  }
  // 屋身
  const wall = b.kind === 'temple' ? '#d8cdb0' : '#c9a06a';
  const wallD = b.kind === 'temple' ? '#bcb094' : '#b08a58';
  px(ctx, x + 3, y + 14, w - 6, h - 14, wall);
  px(ctx, x + 3, y + h - 10, w - 6, 10, wallD); // 牆基陰影
  // 屋頂(三角)
  const roof = b.kind === 'temple' ? '#5a6b8a' : '#a6402f';
  const roofD = b.kind === 'temple' ? '#48566f' : '#872f22';
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.moveTo(x - 2, y + 18); ctx.lineTo(x + w / 2, y - 2); ctx.lineTo(x + w + 2, y + 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = roofD;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y - 2); ctx.lineTo(x + w + 2, y + 18); ctx.lineTo(x + w / 2, y + 18); ctx.closePath(); ctx.fill();
  // 門
  const dw = 14, dh = 20, dx = x + w / 2 - dw / 2, dy = y + h - dh;
  px(ctx, dx, dy, dw, dh, '#5a3a22'); px(ctx, dx + 2, dy + 2, dw - 4, dh - 3, '#3a2414');
  px(ctx, dx + dw - 5, dy + dh / 2 - 1, 2, 2, '#e0c060'); // 門把
  // 窗
  if (b.kind === 'temple') { // 神殿柱子
    for (let i = 0; i < 4; i++) px(ctx, x + 6 + i * ((w - 12) / 3.3), y + 16, 4, h - 26, 'rgba(255,255,255,.5)');
  } else { // 商店招牌窗
    px(ctx, x + 8, y + 20, 8, 8, '#7ec8e0'); px(ctx, x + w - 16, y + 20, 8, 8, '#7ec8e0');
  }
}

function drawTree(ctx, gx, gy, ox, oy) {
  const x = gx * TILE - ox, y = gy * TILE - oy;
  px(ctx, x + TILE / 2 - 3, y + TILE - 12, 6, 12, '#6b4a2b'); // 幹
  ctx.fillStyle = '#2f6b3a';
  ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2 - 2, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3d8248';
  ctx.beginPath(); ctx.arc(x + TILE / 2 - 4, y + TILE / 2 - 5, 8, 0, Math.PI * 2); ctx.fill();
}

/* 主角行走圖(程式生成,4 方向 × 2 幀踏步) */
const HERO = { pal: { s:'#F2C79B', S:'#D89A6B', e:'#2a2230', h:'#5a3a22', H:'#4a2e1a', c:'#4a7ac0', C:'#3a5f9c', p:'#c8b68c', b:'#3a2e22', k:'#2a2018' } };
function drawHero(ctx, cx, cy, facing, frame) {
  // cx,cy = 螢幕像素(角色腳底中心);畫一個 ~18x24 的像素小人
  const S = 1.4; // 放大倍率
  const p = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx + dx * S), Math.round(cy + dy * S), Math.ceil(w * S), Math.ceil(h * S)); };
  const step = frame ? 1 : 0;
  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(cx, cy, 9 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
  const P = HERO.pal;
  // 腿(踏步左右交替)
  const legY = -6;
  if (facing === 'left' || facing === 'right') {
    p(-3, legY, 3, 6, P.b); p(0, legY + (step ? -1 : 0), 3, 6, P.k);
  } else {
    p(-4, legY + (step ? 0 : -1), 3, 6, P.b); p(1, legY + (step ? -1 : 0), 3, 6, P.k);
  }
  // 身體(斗篷/衣)
  p(-5, -16, 10, 11, P.c); p(-5, -16, 10, 3, P.C);
  // 手
  if (facing === 'left') p(-6, -14, 2, 6, P.S);
  else if (facing === 'right') p(4, -14, 2, 6, P.S);
  else { p(-6, -14, 2, 6, P.S); p(4, -14, 2, 6, P.S); }
  // 頭
  p(-4, -24, 8, 8, P.s); p(-4, -24, 8, 2, P.S);
  // 頭髮
  p(-5, -25, 10, 3, P.h); p(-5, -25, 2, 6, P.H); p(3, -25, 2, 6, P.H);
  // 臉(依朝向)
  if (facing === 'down') { p(-2, -20, 2, 2, P.e); p(1, -20, 2, 2, P.e); }
  else if (facing === 'left') { p(-3, -20, 2, 2, P.e); }
  else if (facing === 'right') { p(2, -20, 2, 2, P.e); }
  // up 不畫眼(背面)
}

export const TownMode = {
  layer: null, canvas: null, ctx: null,
  // 連續座標(格為單位,可含小數)
  px: 7, py: 8, facing: 'down', frame: 0, frameT: 0,
  active: false, near: null, keys: {}, raf: null, lastT: 0,
  keyHandler: null, keyUpHandler: null, _resumeAfterModal: false,
  cam: { x: 0, y: 0 }, viewW: 0, viewH: 0, dpr: 1,

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
    this.px = 7; this.py = 8; this.facing = 'down'; this.frame = 0; this.frameT = 0;
    this.keys = {};
    const el = this.ensureLayer();
    el.classList.add('town-active');
    el.innerHTML = `
      <div class="town-top">
        <span class="town-title">🏘️ 微光村</span>
        <span class="town-vault" id="town-vault"></span>
        <button class="town-opt" id="town-opt-btn">⚙️ 選項</button>
      </div>
      <div class="town-viewport" id="town-viewport">
        <canvas id="town-canvas"></canvas>
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
    buildTextures();
    this.setupCanvas();
    this.bindControls();
    this.updateVault();
    this.lastT = 0;
    this.loop = this.loop.bind(this);
    // 立即畫一幀,避免 rAF 首幀前的空白;並在下一輪重排後校正尺寸(flex 撐開後)
    try { this.draw(); } catch (e) { console.warn('[town] first draw', e); }
    setTimeout(() => { if (this.active) { this.setupCanvas(); try { this.draw(); } catch (e) {} } }, 60);
    this.raf = requestAnimationFrame(this.loop);
  },

  exit() {
    this.active = false;
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.keyUpHandler) window.removeEventListener('keyup', this.keyUpHandler);
    this.keyHandler = this.keyUpHandler = null; this.keys = {};
    if (this.layer) { this.layer.classList.remove('town-active'); this.layer.innerHTML = ''; }
  },

  setupCanvas() {
    this.canvas = document.getElementById('town-canvas');
    const vp = document.getElementById('town-viewport');
    if (!this.canvas || !vp) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    // 用 offsetWidth/Height(不受 #stage transform:scale 影響的邏輯像素);
    // 讀不到時回退到舞台變數或安全預設。
    let cssW = vp.offsetWidth, cssH = vp.offsetHeight;
    if (!cssW || !cssH) {
      const stage = document.getElementById('stage');
      cssW = cssW || (stage ? stage.offsetWidth : 0) || 430;
      cssH = cssH || 460;
    }
    cssW = Math.max(280, cssW); cssH = Math.max(280, cssH);
    this.viewW = cssW; this.viewH = cssH;
    this.canvas.style.width = cssW + 'px'; this.canvas.style.height = cssH + 'px';
    this.canvas.width = Math.round(cssW * dpr); this.canvas.height = Math.round(cssH * dpr);
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) this.ctx.imageSmoothingEnabled = false;
  },

  bindControls() {
    const codeMap = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    };
    this.keyHandler = (e) => {
      if (!this.active) return;
      if (codeMap[e.code]) { e.preventDefault(); this.keys[codeMap[e.code]] = true; }
      else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.interact(); }
    };
    this.keyUpHandler = (e) => { if (codeMap[e.code]) this.keys[codeMap[e.code]] = false; };
    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    // 方向鈕:按住持續走(pointer 事件)
    this.layer.querySelectorAll('.town-dpad button[data-dir]').forEach(b => {
      const d = b.dataset.dir;
      if (d === 'act') { b.onclick = () => this.interact(); return; }
      const down = (e) => { e.preventDefault(); this.keys[d] = true; };
      const up = (e) => { e.preventDefault(); this.keys[d] = false; };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
    });
    const optBtn = document.getElementById('town-opt-btn');
    if (optBtn) optBtn.onclick = () => {
      sfx(); this._resumeAfterModal = true;
      this.layer && this.layer.classList.remove('town-active');
      if (window.openGameOptionsModal) window.openGameOptionsModal();
    };
  },

  walkableTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return false;
    const t = MAP[ty][tx];
    return t === 'G' || t === 'R' || t === 'P';
  },
  // 以角色圓形足部判定(連續座標)
  canStand(cx, cy) {
    const r = 0.28;
    // 檢查腳下四角所在格
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      if (!this.walkableTile(Math.floor(cx + dx), Math.floor(cy + dy))) return false;
    }
    return true;
  },

  loop(t) {
    if (!this.active) return;
    if (!this.lastT) this.lastT = t;
    let dt = (t - this.lastT) / 1000; this.lastT = t;
    if (dt > 0.05) dt = 0.05; // 卡頓保護
    // 視口尺寸就緒偵測:若 canvas 尺寸與現視口不符(初次 flex 撐開後),重建
    const vp = document.getElementById('town-viewport');
    if (vp && (Math.abs((vp.offsetWidth || 0) - this.viewW) > 2 || Math.abs((vp.offsetHeight || 0) - this.viewH) > 2)) {
      if (vp.offsetWidth && vp.offsetHeight) this.setupCanvas();
    }
    try { this.update(dt); } catch (e) { /* 單幀更新錯誤不中斷 */ }
    try { this.draw(); } catch (e) { /* 單幀繪製錯誤不中斷 */ }
    this.raf = requestAnimationFrame(this.loop);
  },

  update(dt) {
    const SPEED = 4.6; // 格/秒
    let vx = 0, vy = 0;
    if (this.keys.up) vy -= 1;
    if (this.keys.down) vy += 1;
    if (this.keys.left) vx -= 1;
    if (this.keys.right) vx += 1;
    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      // 面向:以主要分量決定
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? 'left' : 'right';
      else this.facing = vy < 0 ? 'up' : 'down';
      // 正規化斜向速度
      const len = Math.hypot(vx, vy) || 1; vx /= len; vy /= len;
      const step = SPEED * dt;
      // 分軸移動 + 滑牆
      const nx = this.px + vx * step;
      if (this.canStand(nx, this.py)) this.px = nx;
      const ny = this.py + vy * step;
      if (this.canStand(this.px, ny)) this.py = ny;
      // 踏步動畫
      this.frameT += dt;
      if (this.frameT > 0.16) { this.frameT = 0; this.frame ^= 1; }
    } else {
      this.frame = 0; this.frameT = 0;
    }
    // 相機平滑跟隨
    const targetCamX = this.px * TILE - this.viewW / 2;
    const targetCamY = this.py * TILE - this.viewH / 2;
    const maxX = W * TILE - this.viewW, maxY = H * TILE - this.viewH;
    const clampX = Math.max(0, Math.min(maxX, targetCamX));
    const clampY = Math.max(0, Math.min(maxY, targetCamY));
    // lerp(地圖比視口小的軸則置中)
    const lerp = 0.18;
    this.cam.x += ((maxX <= 0 ? (W * TILE - this.viewW) / 2 : clampX) - this.cam.x) * lerp;
    this.cam.y += ((maxY <= 0 ? (H * TILE - this.viewH) / 2 : clampY) - this.cam.y) * lerp;
    // 互動提示更新(節流)
    this.refreshNear();
  },

  refreshNear() {
    const near = this.nearBuilding();
    if (near !== this.near) {
      this.near = near;
      const hintEl = document.getElementById('town-hint');
      const actBtn = document.getElementById('town-act-btn');
      if (near) {
        if (hintEl) hintEl.innerHTML = `<b>${esc(near.name)}</b>　${esc(near.hint)}　<span class="town-press">⏎ / 互動</span>`;
        if (actBtn) actBtn.classList.add('ready');
      } else {
        if (hintEl) hintEl.innerHTML = `<span class="town-dim">方向鍵 / WASD 走動,靠近建築門口 ◇ 互動</span>`;
        if (actBtn) actBtn.classList.remove('ready');
      }
    }
  },

  draw() {
    const ctx = this.ctx; if (!ctx) return;
    const dpr = this.dpr, ox = this.cam.x, oy = this.cam.y;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    // 只畫可見範圍的地磚
    const x0 = Math.max(0, Math.floor(ox / TILE)), x1 = Math.min(W - 1, Math.ceil((ox + this.viewW) / TILE));
    const y0 = Math.max(0, Math.floor(oy / TILE)), y1 = Math.min(H - 1, Math.ceil((oy + this.viewH) / TILE));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let code = MAP[y][x];
      // 建築/樹格底下鋪草
      const base = (code === 'B' || code === 'T') ? 'G' : (code === 'F' ? 'F' : code);
      const tex = TEX[base] || TEX['G'];
      if (tex) ctx.drawImage(tex, Math.round(x * TILE - ox), Math.round(y * TILE - oy));
    }
    // 門口光暈(在地面上)
    BUILDINGS.forEach(b => {
      const [dxg, dyg] = b.door;
      const gx = dxg * TILE - ox + TILE / 2, gy = dyg * TILE - oy + TILE / 2;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
      ctx.fillStyle = `rgba(217,164,65,${0.25 + pulse * 0.35})`;
      ctx.beginPath(); ctx.arc(gx, gy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe099'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('◇', gx, gy + 3);
    });
    // 深度排序:建築、樹、主角依 y 由上而下畫
    const drawables = [];
    BUILDINGS.forEach(b => drawables.push({ y: (b.by + b.bh) * TILE, fn: () => drawBuilding(ctx, b, ox, oy) }));
    TREES.forEach(([tx, ty]) => { if (MAP[ty][tx] === 'T') drawables.push({ y: (ty + 1) * TILE, fn: () => drawTree(ctx, tx, ty, ox, oy) }); });
    const heroSX = this.px * TILE - ox, heroSY = this.py * TILE - oy;
    drawables.push({ y: this.py * TILE, fn: () => drawHero(ctx, heroSX, heroSY, this.facing, this.frame) });
    drawables.sort((a, b) => a.y - b.y);
    drawables.forEach(d => d.fn());
    // 建築名牌(最上層)
    BUILDINGS.forEach(b => {
      const nx = (b.bx + b.bw / 2) * TILE - ox, ny = b.by * TILE - oy - 6;
      const label = b.name;
      ctx.font = 'bold 11px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center';
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = 'rgba(8,10,14,.82)';
      ctx.fillRect(nx - tw / 2, ny - 13, tw, 15);
      ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 1; ctx.strokeRect(nx - tw / 2, ny - 13, tw, 15);
      ctx.fillStyle = '#ffe099'; ctx.fillText(label, nx, ny - 2);
    });
    ctx.restore();
  },

  nearBuilding() {
    for (const b of BUILDINGS) {
      const [dx, dy] = b.door;
      const dist = Math.hypot(this.px - (dx + 0.5), this.py - (dy + 0.5));
      if (dist <= 1.15) return b;
    }
    return null;
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
          <div class="town-world-legend">選擇一處戰場前往。✅ 為已通關,🔒 需先通關前一戰。</div>
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
    if (window.TacticsMode) window.TacticsMode.openFromTown(chIdx);
  },

  /* 🏪 商店 → 寶石交易 + 部隊技能購買 */
  openShop() {
    if (window.TacticsMode && window.TacticsMode.openShop) window.TacticsMode.openShop();
  },
};
if (typeof window !== 'undefined') window.TownMode = TownMode;
