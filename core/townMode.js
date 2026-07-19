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

/* 🧓 NPC 與互動道具(劇情第三敘事線的地圖元素) */
const NPCS = [
  { id: 'elder', name: '長老 艾德溫', x: 5, y: 9, hint: '與長老交談・接受指引' },
];
const PROPS = [
  { id: 'board', name: '任務佈告欄', x: 9, y: 5, hint: '查看進度與下一步指引' },
];
// NPC / 道具所在格不可走
NPCS.forEach(n => { if (MAP[n.y] && MAP[n.y][n.x] !== undefined) MAP[n.y][n.x] = 'B'; });
PROPS.forEach(p => { if (MAP[p.y] && MAP[p.y][p.x] !== undefined) MAP[p.y][p.x] = 'B'; });

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
  makeTile('G', ctx => { // 草地(帶穩定草叢/碎花)
    const g = ctx.createLinearGradient(0, 0, 0, TILE);
    g.addColorStop(0, '#548a47'); g.addColorStop(1, '#446e3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, TILE, TILE);
    // 用固定種子撒草叢,不會逐幀閃爍
    for (let i = 0; i < 14; i++) {
      const r1 = hash(i * 3 + 1, 7), r2 = hash(i * 5 + 2, 11), r3 = hash(i, 3);
      const gx = Math.floor(r1 * TILE), gy = Math.floor(r2 * TILE);
      if (r3 > 0.85) { ctx.fillStyle = '#c8d84a'; ctx.fillRect(gx, gy, 2, 2); } // 小花
      else { ctx.fillStyle = r3 > 0.5 ? '#5f9a50' : '#3d6633'; ctx.fillRect(gx, gy, 1, 2); ctx.fillRect(gx + 1, gy - 1, 1, 2); } // 草
    }
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
  const round = Math.round;
  if (b.kind === 'gate') {
    // 城門:石砌柱 + 拱楣 + 磚縫
    const stone = '#9a907c', stoneD = '#7c7362', stoneL = '#b4ab95';
    px(ctx, x + 2, y + h - 34, 12, 34, stone); px(ctx, x + w - 14, y + h - 34, 12, 34, stone);
    px(ctx, x + 2, y + h - 34, 12, 3, stoneL); px(ctx, x + w - 14, y + h - 34, 12, 3, stoneL);
    // 磚縫
    ctx.fillStyle = stoneD;
    for (let j = y + h - 30; j < y + h; j += 8) { px(ctx, x + 2, j, 12, 1, stoneD); px(ctx, x + w - 14, j, 12, 1, stoneD); }
    // 拱楣
    px(ctx, x, y + h - 40, w, 9, stone); px(ctx, x, y + h - 40, w, 3, stoneL); px(ctx, x, y + h - 32, w, 2, stoneD);
    // 門洞(漸層深)
    const g = ctx.createLinearGradient(0, y + h - 30, 0, y + h);
    g.addColorStop(0, '#3a2f22'); g.addColorStop(1, '#15100a');
    ctx.fillStyle = g; ctx.fillRect(round(x + 16), round(y + h - 30), round(w - 32), 30);
    ctx.fillStyle = '#ffe099'; ctx.font = 'bold 10px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('城 門', x + w / 2, y + h - 44);
    return;
  }
  const temple = b.kind === 'temple';
  // ── 牆身(磚紋 + 明暗) ──
  const wall = temple ? '#e0d6bc' : '#cba874';
  const wallD = temple ? '#c3b998' : '#b08a58';
  const wallL = temple ? '#efe8d4' : '#dcbd8c';
  const wy = y + 16, wh = h - 16;
  px(ctx, x + 3, wy, w - 6, wh, wall);
  px(ctx, x + 3, wy, w - 6, 2, wallL);            // 頂部高光
  px(ctx, x + 3, y + h - 8, w - 6, 8, wallD);      // 牆基陰影
  px(ctx, x + 3, wy, 2, wh, wallL); px(ctx, x + w - 5, wy, 2, wh, wallD); // 側面明暗
  // 磚縫(橫線 + 交錯豎線)
  ctx.fillStyle = 'rgba(90,72,45,.22)';
  for (let j = wy + 6; j < y + h - 8; j += 7) ctx.fillRect(round(x + 4), round(j), w - 8, 1);
  // ── 屋頂(瓦片列) ──
  const roof = temple ? '#5f7196' : '#b0472f';
  const roofD = temple ? '#4a5878' : '#8c3421';
  const roofL = temple ? '#7387ac' : '#c85c40';
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.moveTo(x - 3, y + 20); ctx.lineTo(x + w / 2, y - 4); ctx.lineTo(x + w + 3, y + 20); ctx.closePath(); ctx.fill();
  // 右半暗面
  ctx.fillStyle = roofD;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y - 4); ctx.lineTo(x + w + 3, y + 20); ctx.lineTo(x + w / 2, y + 20); ctx.closePath(); ctx.fill();
  // 屋脊高光 + 瓦片橫紋
  ctx.strokeStyle = roofL; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 3, y + 20); ctx.lineTo(x + w / 2, y - 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
  for (let k = 1; k <= 3; k++) {
    const ry = y - 4 + (24 / 3.5) * k, span = (w / 2 + 3) * (k / 3.5);
    ctx.beginPath(); ctx.moveTo(x + w / 2 - span, ry); ctx.lineTo(x + w / 2 + span, ry); ctx.stroke();
  }
  px(ctx, x + w / 2 - 1, y - 4, 2, 24, 'rgba(0,0,0,.15)'); // 屋脊中線
  // ── 門(立體 + 階梯) ──
  const dw = 15, dh = 21, dx = x + w / 2 - dw / 2, dy = y + h - dh;
  px(ctx, dx - 2, dy, dw + 4, 2, '#3a2414');       // 門楣
  px(ctx, dx, dy, dw, dh, '#5a3a22');
  const dg = ctx.createLinearGradient(0, dy, 0, dy + dh);
  dg.addColorStop(0, '#4a2e18'); dg.addColorStop(1, '#2e1c0e');
  ctx.fillStyle = dg; ctx.fillRect(round(dx + 2), round(dy + 2), dw - 4, dh - 2);
  px(ctx, dx + dw / 2, dy + 3, 1, dh - 5, 'rgba(0,0,0,.35)'); // 對開門縫
  px(ctx, dx + dw - 5, dy + dh / 2, 2, 2, '#e8c860'); px(ctx, dx + 3, dy + dh / 2, 2, 2, '#e8c860'); // 門把
  px(ctx, x + w / 2 - dw / 2 - 3, y + h - 2, dw + 6, 2, temple ? '#c3b998' : '#a88a5a'); // 台階
  // ── 窗 / 柱 ──
  if (temple) {
    // 神殿柱(帶陰影,立體)
    for (let i = 0; i < 3; i++) {
      const cxp = x + 7 + i * ((w - 14) / 2.5);
      px(ctx, cxp, y + 18, 5, wh - 6, '#f2ecd8');
      px(ctx, cxp, y + 18, 1, wh - 6, '#ffffff'); px(ctx, cxp + 4, y + 18, 1, wh - 6, '#c8bfa2');
      px(ctx, cxp - 1, y + 17, 7, 2, '#e8dfc4'); // 柱頭
    }
  } else {
    // 商店窗(發光 + 十字窗櫺 + 遮陽篷)
    [[x + 7, y + 22], [x + w - 16, y + 22]].forEach(([wx, wy2]) => {
      px(ctx, wx - 1, wy2 - 1, 11, 11, '#5a3a22');
      const wg = ctx.createLinearGradient(0, wy2, 0, wy2 + 9);
      wg.addColorStop(0, '#bfe6f2'); wg.addColorStop(1, '#7ec0d8');
      ctx.fillStyle = wg; ctx.fillRect(round(wx), round(wy2), 9, 9);
      px(ctx, wx + 4, wy2, 1, 9, '#5a3a22'); px(ctx, wx, wy2 + 4, 9, 1, '#5a3a22'); // 窗櫺
      px(ctx, wx + 1, wy2 + 1, 3, 3, 'rgba(255,255,255,.6)'); // 反光
    });
    // 遮陽篷(紅白條)
    for (let s = 0; s < w - 6; s += 6) px(ctx, x + 3 + s, y + 16, 3, 4, s % 12 === 0 ? '#d84a3a' : '#f0ede4');
  }
}

function drawTree(ctx, gx, gy, ox, oy) {
  const x = gx * TILE - ox + TILE / 2, y = gy * TILE - oy;
  // 幹
  px(ctx, x - 3, y + TILE - 13, 6, 13, '#6b4a2b');
  px(ctx, x - 3, y + TILE - 13, 2, 13, '#7d5836'); px(ctx, x + 1, y + TILE - 13, 2, 13, '#523419');
  // 樹冠(三層,明暗立體)
  const blob = (cx, cy, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  blob(x, y + 12, 12, '#2c5e34');       // 底暗
  blob(x - 4, y + 9, 9, '#3d8248');     // 左亮
  blob(x + 5, y + 11, 8, '#347040');    // 右中
  blob(x - 2, y + 6, 6, '#4d9a56');     // 頂高光
  blob(x - 5, y + 5, 3, '#5cb066');     // 高光點
}

/* 主角行走圖(程式生成,4 方向 × 2 幀踏步) */
/* ── 主角行走圖:點陣手繪(16×20),4 方向 × 2 幀,離屏快取 ──
   字元→調色盤。'.'透明。設計:披風商人(金髮、藍袍、棕靴) */
const HERO_PAL = {
  s:'#F2C79B', S:'#D89A6B',      // 膚色 / 陰影
  e:'#2a2230',                    // 眼/輪廓
  h:'#E9C863', H:'#B8973E',      // 金髮 亮/暗
  c:'#3E6FB5', C:'#2E538C', l:'#6A93D0', // 藍袍 亮/暗/高光
  k:'#D9A441',                    // 金釦/腰帶
  b:'#6B4A2B', B:'#4A3018',      // 靴 亮/暗
  w:'#EDE9DC',                    // 白領
};
// 每方向兩幀(f0 站立/f1 邁步);左向由右向翻轉。每行固定 16 字元。
const HERO_SPR = {
  down: [
    ['................',
     '......hhhh......',
     '.....hHHHHh.....',
     '....hHHHHHHh....',
     '....hSSSSSSh....',
     '....SeSSSeS.....',
     '....SSSSSSS.....',
     '....wSSSSSw.....',
     '...lccccccl.....',
     '..CccccccccC....',
     '..CcckkkkccC....',
     '..CccccccccC....',
     '..CccccccccC....',
     '...CccccccC.....',
     '...SCccccCS.....',
     '....bb..bb......',
     '....bb..bb......',
     '....BB..BB......',
     '...BB....BB.....',
     '................'],
    ['................',
     '......hhhh......',
     '.....hHHHHh.....',
     '....hHHHHHHh....',
     '....hSSSSSSh....',
     '....SeSSSeS.....',
     '....SSSSSSS.....',
     '....wSSSSSw.....',
     '...lccccccl.....',
     '..CccccccccC....',
     '..CcckkkkccC....',
     '..CccccccccC....',
     '..CccccccccC....',
     '...CccccccC.....',
     '...SCccccCS.....',
     '.....bbbb.......',
     '....bb..bb......',
     '...BB....BB.....',
     '...BB....BB.....',
     '................'],
  ],
  up: [
    ['................',
     '......hhhh......',
     '.....hHHHHh.....',
     '....hHHHHHHh....',
     '....HHHHHHHH....',
     '....HHHHHHHH....',
     '....HHHHHHHH....',
     '....wHHHHHw.....',
     '...lccccccl.....',
     '..CccccccccC....',
     '..CccccccccC....',
     '..CccccccccC....',
     '..CccccccccC....',
     '...CccccccC.....',
     '...SCccccCS.....',
     '....bb..bb......',
     '....bb..bb......',
     '....BB..BB......',
     '...BB....BB.....',
     '................'],
    ['................',
     '......hhhh......',
     '.....hHHHHh.....',
     '....hHHHHHHh....',
     '....HHHHHHHH....',
     '....HHHHHHHH....',
     '....HHHHHHHH....',
     '....wHHHHHw.....',
     '...lccccccl.....',
     '..CccccccccC....',
     '..CccccccccC....',
     '..CccccccccC....',
     '..CccccccccC....',
     '...CccccccC.....',
     '...SCccccCS.....',
     '.....bbbb.......',
     '....bb..bb......',
     '...BB....BB.....',
     '...BB....BB.....',
     '................'],
  ],
  right: [
    ['................',
     '......hhhh......',
     '.....hHHHHh.....',
     '.....hHHHHHh....',
     '.....hSSSSSh....',
     '.....SSSeSS.....',
     '.....SSSSSS.....',
     '.....wSSSw......',
     '....lcccccl.....',
     '....Ccccccc.....',
     '....Ccckkcc.....',
     '....Ccccccc.....',
     '....Ccccccc.....',
     '.....CcccC......',
     '.....SCcCS......',
     '.....bb.bb......',
     '.....bb.bb......',
     '.....BB.BB......',
     '....BB...BB.....',
     '................'],
    ['................',
     '......hhhh......',
     '.....hHHHHh.....',
     '.....hHHHHHh....',
     '.....hSSSSSh....',
     '.....SSSeSS.....',
     '.....SSSSSS.....',
     '.....wSSSw......',
     '....lcccccl.....',
     '....Ccccccc.....',
     '....Ccckkcc.....',
     '....Ccccccc.....',
     '....Ccccccc.....',
     '.....CcccC......',
     '.....SCcCS......',
     '......bbb.......',
     '.....bb.bb......',
     '....BB...BB.....',
     '.....BB.BB......',
     '................'],
  ],
};
const HERO_CACHE = {};
function heroSprite(facing, frame) {
  const key = facing + frame;
  if (HERO_CACHE[key]) return HERO_CACHE[key];
  let rows, flip = false;
  if (facing === 'left') { rows = HERO_SPR.right[frame]; flip = true; }
  else rows = (HERO_SPR[facing] || HERO_SPR.down)[frame];
  const W0 = 16, H0 = 20;
  const c = document.createElement('canvas'); c.width = W0; c.height = H0;
  const ctx = c.getContext('2d');
  for (let y = 0; y < H0; y++) {
    const row = rows[y] || '';
    for (let x = 0; x < W0; x++) {
      const ch = row[x];
      if (!ch || ch === '.' || !HERO_PAL[ch]) continue;
      ctx.fillStyle = HERO_PAL[ch];
      ctx.fillRect(flip ? W0 - 1 - x : x, y, 1, 1);
    }
  }
  HERO_CACHE[key] = c;
  return c;
}
function drawHero(ctx, cx, cy, facing, frame) {
  // cx,cy = 角色腳底中心
  const scale = 2.0, W0 = 16, H0 = 20;
  const w = W0 * scale, h = H0 * scale;
  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,.30)';
  ctx.beginPath(); ctx.ellipse(cx, cy, 10, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  const spr = heroSprite(facing, frame & 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spr, Math.round(cx - w / 2), Math.round(cy - h + 3), Math.round(w), Math.round(h));
}

/* ── 🧓 長老艾德溫(16×20 點陣:灰髮、褐袍、木杖) ── */
const ELDER_PAL = {
  s:'#EFC9A0', S:'#CF9C72',           // 膚色 / 陰影
  e:'#2a2230',                         // 眼
  h:'#D8D4CA', H:'#A8A499',           // 灰髮/鬍 亮/暗
  c:'#8A6B43', C:'#6B4F30', l:'#A88854', // 褐袍 亮/暗/高光
  k:'#D9A441',                         // 腰帶釦
  b:'#4A3018',                         // 鞋
  t:'#7A5230', T:'#5C3D20',           // 木杖
};
const ELDER_SPR = [
  '................',
  '......hhhh......',
  '.....hHHHHh.....',
  '.....hssssh.....',
  '.....sesse....t.',
  '.....ssssss...t.',
  '....hHssHh....t.',
  '....hHHHHh....t.',
  '...lcccccl....t.',
  '..CcccccccC...t.',
  '..Ccckkccc....t.',
  '..CcccccccC...t.',
  '..CcccccccC...t.',
  '..CcccccccC...T.',
  '..CcccccccC...T.',
  '...ccccccc....T.',
  '...cc...cc....T.',
  '...bb...bb....T.',
  '................',
  '................',
];
let ELDER_CACHE = null;
function elderSprite() {
  if (ELDER_CACHE) return ELDER_CACHE;
  const W0 = 16, H0 = 20;
  const c = document.createElement('canvas'); c.width = W0; c.height = H0;
  const ctx = c.getContext('2d');
  ELDER_SPR.forEach((row, y) => { [...row].forEach((ch, x) => {
    if (ch === '.' || !ELDER_PAL[ch]) return;
    ctx.fillStyle = ELDER_PAL[ch]; ctx.fillRect(x, y, 1, 1);
  }); });
  ELDER_CACHE = c;
  return c;
}
function drawElder(ctx, gx, gy, ox, oy) {
  const cx = gx * TILE - ox + TILE / 2, cy = gy * TILE - oy + TILE - 2;
  const bob = Math.sin(performance.now() / 700) * 1.2; // 緩慢呼吸
  ctx.fillStyle = 'rgba(0,0,0,.30)';
  ctx.beginPath(); ctx.ellipse(cx, cy, 10, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  const scale = 2.0, w = 16 * scale, h = 20 * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(elderSprite(), Math.round(cx - w / 2), Math.round(cy - h + 3 + bob), Math.round(w), Math.round(h));
  // ❕ 有待播劇情/新指引時的提示
  if (window.StoryEvents && window.StoryEvents.hasPending()) {
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    ctx.fillStyle = `rgba(255,224,153,${pulse})`;
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('❕', cx, cy - h - 2);
  }
}
/* ── 📋 任務佈告欄(木板 + 貼紙) ── */
function drawBoard(ctx, gx, gy, ox, oy) {
  const x = gx * TILE - ox, y = gy * TILE - oy;
  px(ctx, x + 6, y + 14, 4, 18, '#6B4A2B'); px(ctx, x + 22, y + 14, 4, 18, '#6B4A2B'); // 柱
  px(ctx, x + 2, y + 2, 28, 16, '#7A5230');                                            // 板框
  px(ctx, x + 4, y + 4, 24, 12, '#C9B58C');                                            // 板面
  px(ctx, x + 6, y + 6, 8, 4, '#EFE8D4'); px(ctx, x + 16, y + 6, 9, 3, '#E8D9B0');     // 貼紙
  px(ctx, x + 6, y + 12, 12, 2, '#B09A6E');
  px(ctx, x + 18, y + 11, 3, 3, '#D9534F');                                            // 紅蠟章
}

/* 供劇情引擎使用的像素立繪(dataURL,pixel 模式放大) */
let HERO_PORTRAIT = null, ELDER_PORTRAIT = null;

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
    // 📖 地圖劇情事件:進城時依進度自動演出(序幕甦醒、階段轉場等,單次不重播)
    if (window.StoryEvents) { try { window.StoryEvents.onTownEnter(); } catch (e) {} }
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
    NPCS.forEach(n => drawables.push({ y: (n.y + 1) * TILE, fn: () => drawElder(ctx, n.x, n.y, ox, oy) }));
    PROPS.forEach(p => drawables.push({ y: (p.y + 1) * TILE, fn: () => drawBoard(ctx, p.x, p.y, ox, oy) }));
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
    // NPC 名牌(較小)
    NPCS.forEach(n => {
      const nx = (n.x + 0.5) * TILE - ox, ny = n.y * TILE - oy - 30;
      ctx.font = 'bold 9px "Microsoft JhengHei",sans-serif'; ctx.textAlign = 'center';
      const tw = ctx.measureText(n.name).width + 10;
      ctx.fillStyle = 'rgba(8,10,14,.75)'; ctx.fillRect(nx - tw / 2, ny - 11, tw, 13);
      ctx.fillStyle = '#c8d0d8'; ctx.fillText(n.name, nx, ny - 2);
    });
    ctx.restore();
  },

  nearBuilding() {
    for (const b of BUILDINGS) {
      const [dx, dy] = b.door;
      const dist = Math.hypot(this.px - (dx + 0.5), this.py - (dy + 0.5));
      if (dist <= 1.15) return b;
    }
    // NPC 與互動道具:站到旁邊即可互動
    for (const n of NPCS.concat(PROPS)) {
      const dist = Math.hypot(this.px - (n.x + 0.5), this.py - (n.y + 0.5));
      if (dist <= 1.15) return n;
    }
    return null;
  },

  /* 📖 供劇情引擎取用的像素立繪 */
  heroPortraitURL() {
    if (!HERO_PORTRAIT) { try { HERO_PORTRAIT = heroSprite('down', 0).toDataURL(); } catch (e) { return ''; } }
    return HERO_PORTRAIT;
  },
  elderPortraitURL() {
    if (!ELDER_PORTRAIT) { try { ELDER_PORTRAIT = elderSprite().toDataURL(); } catch (e) { return ''; } }
    return ELDER_PORTRAIT;
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
    else if (near.id === 'elder') { if (window.StoryEvents) window.StoryEvents.talkToElder(); }
    else if (near.id === 'board') { if (window.StoryEvents) window.StoryEvents.openBoard(); }
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
