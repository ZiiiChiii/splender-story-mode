/* town.css — 🏘️ 故事模式 RPG 城鎮樞紐(全部鎖在 #town-layer / .town-modal) */

#town-layer{
  --tn-ink:#141A22; --tn-grass:#3E6B47; --tn-grass2:#457550; --tn-road:#8B7355; --tn-road2:#9C8264;
  --tn-wall:#2A323C; --tn-bld:#6B5642; --tn-bld2:#7C6650; --tn-roof:#8E4A3C; --tn-gold:#D9A441;
  --tn-text:#EAE4D6; --tn-dim:#93A0A8;
  position:absolute; inset:0; z-index:99985; display:none; flex-direction:column;
  background:radial-gradient(600px 400px at 50% 30%, #24343A 0%, var(--tn-ink) 75%);
  color:var(--tn-text); font-family:'Microsoft JhengHei','Heiti TC',sans-serif; overflow:hidden; user-select:none;
}
#town-layer.town-active{ display:flex; }
#town-layer *{ box-sizing:border-box; }

#town-layer .town-top{
  display:flex; align-items:center; justify-content:space-between; padding:8px 12px;
  border-bottom:1px solid rgba(212,175,55,.25); flex-shrink:0;
}
#town-layer .town-title{ font-weight:800; color:#ffe099; letter-spacing:.1em; font-size:0.82rem; }
#town-layer .town-vault{ font-size:0.68rem; color:var(--tn-text); margin-left:auto; }
#town-layer .town-opt{
  margin-left:8px; padding:4px 10px; font-size:0.62rem; border:1px solid var(--tn-gold);
  background:linear-gradient(180deg,#2A2618,#1F1D14); color:var(--tn-gold); border-radius:5px; cursor:pointer;
}
#town-layer .town-opt:active{ transform:scale(.95); }
#town-layer .tx-gem{
  display:inline-block; width:11px; height:11px; vertical-align:-1px; margin-right:2px;
  clip-path:polygon(50% 0,100% 36%,79% 100%,21% 100%,0 36%);
  background:linear-gradient(155deg, rgba(255,255,255,.85) 0%, var(--g) 28%, color-mix(in srgb,var(--g) 55%,#000) 100%);
}

#town-layer .town-viewport{
  flex:1; position:relative; min-height:0; overflow:hidden;
  background:#2c3e2f;
  display:flex; align-items:stretch; justify-content:stretch;
}
#town-layer #town-canvas{
  display:block; width:100%; height:100%;
  image-rendering:pixelated; image-rendering:crisp-edges;
  touch-action:none;
}

/* 提示列 */
#town-layer .town-hint{
  flex-shrink:0; text-align:center; padding:7px 12px; font-size:0.66rem; min-height:30px;
  border-top:1px solid rgba(212,175,55,.18);
}
#town-layer .town-hint b{ color:#ffe099; }
#town-layer .town-hint .town-dim{ color:var(--tn-dim); }
#town-layer .town-hint .town-press{ color:var(--tn-gold); font-weight:800; margin-left:4px; }

/* 方向鈕(手機友善) */
#town-layer .town-dpad{
  flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:5px; padding:6px 0 14px;
}
#town-layer .town-dpad-mid{ display:flex; gap:5px; align-items:center; }
#town-layer .town-dpad button{
  width:52px; height:44px; font-size:1rem; border:1px solid #3a4650; background:#1E2731; color:var(--tn-text);
  border-radius:7px; cursor:pointer; transition:.1s;
  touch-action:none; user-select:none; -webkit-user-select:none; -webkit-tap-highlight-color:transparent;
}
#town-layer .town-dpad button:active{ background:#2b3742; transform:scale(.94); }
#town-layer .town-dpad .town-act{
  width:78px; font-size:0.72rem; font-weight:800; border-color:#5a4a2a; color:var(--tn-dim);
}
#town-layer .town-dpad .town-act.ready{ border-color:var(--tn-gold); color:var(--tn-gold); background:linear-gradient(180deg,#2A2618,#1F1D14); animation:townReady 1s ease-in-out infinite; }
@keyframes townReady{ 0%,100%{box-shadow:0 0 0 rgba(217,164,65,0)} 50%{box-shadow:0 0 12px rgba(217,164,65,.5)} }

/* ── 世界地圖 / 商店 共用彈窗 ── */
.town-modal{
  position:absolute; inset:0; z-index:99992; display:none; align-items:center; justify-content:center;
  background:rgba(0,0,0,.72); padding:14px;
}
.town-modal.show{ display:flex; }
.town-modal .town-world, .town-modal .town-shop{
  width:100%; max-width:440px; max-height:calc(var(--stage-h,716px) - 40px);
  background:#161C24; border:1px solid rgba(212,175,55,.3); border-radius:8px;
  display:flex; flex-direction:column; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,.6);
  font-family:'Microsoft JhengHei',sans-serif; color:#EAE4D6;
}
.town-modal .town-world-head{
  display:flex; align-items:center; justify-content:space-between; padding:11px 14px;
  border-bottom:1px solid rgba(212,175,55,.2); font-weight:800; color:#ffe099; font-size:0.82rem; flex-shrink:0;
}
.town-modal .town-x{ background:none; border:1px solid #444; color:#ccc; border-radius:4px; cursor:pointer; padding:2px 9px; font-size:0.8rem; }
.town-modal .town-x:hover{ border-color:var(--tn-gold,#D9A441); color:var(--tn-gold,#D9A441); }

/* 世界地圖 */
.town-modal .town-world-map{
  position:relative; flex:1; min-height:300px; margin:10px; border-radius:6px; overflow:hidden;
  background:
    radial-gradient(300px 200px at 30% 30%, #3E6B47 0%, transparent 60%),
    radial-gradient(260px 200px at 75% 65%, #4A6B5A 0%, transparent 60%),
    linear-gradient(160deg, #2C4A3A, #223540);
  border:1px solid #31405A;
}
.town-modal .town-world-legend{
  position:absolute; top:8px; left:8px; right:8px; font-size:0.56rem; color:#c7d0d8;
  background:rgba(0,0,0,.4); padding:4px 8px; border-radius:4px; z-index:2;
}
.town-modal .town-node{
  position:absolute; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:2px;
  background:none; border:none; cursor:pointer; z-index:3;
}
.town-modal .town-node-ico{
  font-size:1.7rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,.7)); transition:transform .15s;
  background:rgba(10,14,18,.55); border-radius:50%; padding:3px;
}
.town-modal .town-node:hover:not(.locked) .town-node-ico{ transform:scale(1.18); }
.town-modal .town-node-name{
  font-size:0.58rem; font-weight:800; color:#fff; background:rgba(10,14,18,.85);
  border:1px solid var(--tn-gold,#D9A441); border-radius:4px; padding:1px 7px; white-space:nowrap;
}
.town-modal .town-node.locked{ cursor:default; }
.town-modal .town-node.locked .town-node-ico{ filter:grayscale(1) brightness(.5); }
.town-modal .town-node.locked .town-node-name{ border-color:#555; color:#999; }
.town-modal .town-world-foot, .town-modal .town-shop .town-world-foot{
  padding:9px 14px; border-top:1px solid rgba(212,175,55,.2); font-size:0.66rem; flex-shrink:0;
}

/* 商店 */
.town-modal .town-shop-body{ flex:1; overflow-y:auto; padding:6px 12px 10px; }
.town-modal .tx-row{
  display:flex; align-items:center; gap:6px; padding:6px 8px; border:1px solid #31405A;
  background:#1A212E; margin-bottom:5px; font-size:0.64rem; border-radius:3px;
}
.town-modal .tx-row .grow{ flex:1; min-width:0; }
.town-modal .tx-row .price{ color:#93A0A8; font-size:0.58rem; white-space:nowrap; }
.town-modal .tx-row button{
  padding:3px 10px; font-size:0.6rem; flex-shrink:0; border:1px solid #31405A; background:#212A3A;
  color:#EAE4D6; border-radius:3px; cursor:pointer;
}
.town-modal .tx-row button:hover:not(:disabled){ border-color:var(--tn-gold,#D9A441); color:var(--tn-gold,#D9A441); }
.town-modal .tx-row button:disabled{ opacity:.35; cursor:default; }
.town-modal .tx-tag{ font-size:0.56rem; color:#93A0A8; letter-spacing:.05em; }
.town-modal .diff-opt-btn{ cursor:pointer; }

@media (prefers-reduced-motion:reduce){
  #town-layer .town-hero-body, #town-layer .town-door, #town-layer .town-act{ animation:none!important; }
}const TREES = [[2, 1], [12, 1], [1, 4], [13, 8], [2, 8], [12, 4], [4, 8], [10, 8]];
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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    // 視口以 CSS 決定;canvas 內部依 dpr 放大保持銳利
    const rect = vp.getBoundingClientRect();
    const cssW = Math.max(280, rect.width || 414), cssH = Math.max(280, rect.height || 460);
    this.viewW = cssW; this.viewH = cssH;
    this.canvas.style.width = cssW + 'px'; this.canvas.style.height = cssH + 'px';
    this.canvas.width = Math.round(cssW * dpr); this.canvas.height = Math.round(cssH * dpr);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
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
    this.update(dt);
    this.draw();
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
if (typeof window !== 'undefined') window.TownMode = TownMode;  // 橫向道路
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
