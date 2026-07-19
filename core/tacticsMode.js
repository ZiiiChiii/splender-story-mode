// core/tacticsMode.js — ⚔️ 戰線戰役(戰棋次線模式)
// 與主線「商道戰役」共享世界觀:主線在大會堂經商斡旋,次線由軍事系夥伴在前線作戰。
// 共享資產:寶石庫(localStorage),雙向解鎖:戰棋首勝可解鎖對應輔助官。

/* ══════════════ 共享寶石庫(與主線桌遊互通) ══════════════ */
const VAULT_KEY = 'splendor_gem_vault_2026';
const TX_SAVE_KEY = 'splendor_tactics_2026';
const STORY_SAVE_KEY = 'splendor_story_progress_2026';
const GEM_KEYS = ['r', 'u', 'g', 'w', 'k'];
const GEM_INFO = {
  r: { name: '紅寶石', color: '#E0575B' },
  u: { name: '藍寶石', color: '#5B8DEF' },
  g: { name: '翡翠',   color: '#4FBF8B' },
  w: { name: '白鑽',   color: '#EDE9DC' },
  k: { name: '黑曜石', color: '#9B7BD8' },
};

export const TacticsVault = {
  read() {
    try {
      const d = JSON.parse(localStorage.getItem(VAULT_KEY) || '{}');
      const v = {};
      GEM_KEYS.forEach(k => v[k] = Math.max(0, d[k] | 0));
      return v;
    } catch (e) { return { r: 0, u: 0, g: 0, w: 0, k: 0 }; }
  },
  write(v) { try { localStorage.setItem(VAULT_KEY, JSON.stringify(v)); } catch (e) {} },
  grant(gems) {
    const v = this.read();
    for (const k in gems) if (GEM_KEYS.includes(k)) v[k] += gems[k];
    this.write(v);
    return v;
  },
  spend(cost) {
    const v = this.read();
    for (const k in cost) if ((v[k] | 0) < cost[k]) return false;
    for (const k in cost) v[k] -= cost[k];
    this.write(v);
    return true;
  },
  iconHtml(k, extra) {
    return `<span class="tx-gem" style="--g:${GEM_INFO[k].color}"></span>${extra != null ? extra : ''}`;
  },
  lineHtml(v) {
    v = v || this.read();
    return GEM_KEYS.map(k => this.iconHtml(k, v[k])).join(' ');
  }
};
if (typeof window !== 'undefined') window.TacticsVault = TacticsVault;

/* ══════════════ 戰棋進度存檔 ══════════════ */
const TxSave = {
  data: null,
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(TX_SAVE_KEY) || '{}');
      this.data = {
        cleared: Array.isArray(d.cleared) ? d.cleared : [],
        forge: d.forge || {},
        potions: Math.min(3, d.potions | 0),
        skills: d.skills || {},   // { unitId: [skillId,...] } 商店購得的額外技能
      };
    } catch (e) { this.data = { cleared: [], forge: {}, potions: 0, skills: {} }; }
    return this.data;
  },
  save() { try { localStorage.setItem(TX_SAVE_KEY, JSON.stringify(this.data)); } catch (e) {} },
  isCleared(id) { return this.load().cleared.includes(id); },
  markCleared(id) { this.load(); if (!this.data.cleared.includes(id)) this.data.cleared.push(id); this.save(); },
  maxUnlockedChapter() { return this.load().cleared.length + 1; },
  forgeCount(unitId, forgeId) { this.load(); return ((this.data.forge[unitId] || {})[forgeId]) | 0; },
  addForge(unitId, forgeId) {
    this.load();
    if (!this.data.forge[unitId]) this.data.forge[unitId] = {};
    this.data.forge[unitId][forgeId] = (this.data.forge[unitId][forgeId] | 0) + 1;
    this.save();
  },
  hasSkill(unitId, skillId) { this.load(); return (this.data.skills[unitId] || []).includes(skillId); },
  addSkill(unitId, skillId) {
    this.load();
    if (!this.data.skills[unitId]) this.data.skills[unitId] = [];
    if (!this.data.skills[unitId].includes(skillId)) this.data.skills[unitId].push(skillId);
    this.save();
  }
};

/* 讀主線進度(劇情回聲判斷 + 輔助官解鎖同步) */
function readStoryProgress() {
  try {
    const d = JSON.parse(localStorage.getItem(STORY_SAVE_KEY) || '{}');
    return {
      maxUnlockedLevel: d.maxUnlockedLevel || 1,
      unlockedAssistantIds: Array.isArray(d.unlockedAssistantIds) ? d.unlockedAssistantIds : ['ast1'],
    };
  } catch (e) { return { maxUnlockedLevel: 1, unlockedAssistantIds: ['ast1'] }; }
}
function unlockAssistant(astId) {
  const sp = readStoryProgress();
  if (sp.unlockedAssistantIds.includes(astId)) return false;
  sp.unlockedAssistantIds.push(astId);
  try { localStorage.setItem(STORY_SAVE_KEY, JSON.stringify(sp)); } catch (e) {}
  // 同步至執行中的 CoreState(主遊戲人才庫即時可見)
  const cs = (typeof window !== 'undefined') && window.CoreState;
  if (cs) {
    const ids = cs.get().storyProgress.unlockedAssistantIds;
    if (!ids.includes(astId)) ids.push(astId);
  }
  return true;
}

/* ══════════════ 像素精靈圖(16x18,面向右;敵方水平翻轉) ══════════════ */
const SPRITES = {
  joan: { pal: { h:'#E9D98A', H:'#C0AB55', S:'#EFC69B', s:'#D19A6B', e:'#28242E', T:'#D8DEE8', t:'#AAB4C4', B:'#6B4A2B', D:'#57493F', b:'#7A5230', W:'#E8ECF2', w:'#AAB4C4', G:'#D9A441' },
    rows: ['................','..hh............','.hhhhhhh........','.Hhhhhhhh.......','.Hh.SSSSh.......','.H..SeSeS.......','....sSSSs....W..','.....SSs....Ww..','...TTTTTT..Ww...','..TTTTTTTTWw....','..sTtTTTTSG.....','..S.TTTTTS......','....BBBBB.......','....DDDDD.......','....DD.DD.......','....DD.DD.......','...bbb..bb......','................'] },
  hector: { pal: { m:'#9AA5B4', M:'#6C7684', S:'#EFC69B', e:'#28242E', s:'#D19A6B', c:'#5C7266', C:'#42544A', E:'#8C97A6', F:'#3D6CB0', f:'#2C4E82', B:'#4A3826', D:'#57493F', b:'#6B4A2B', G:'#D9A441' },
    rows: ['................','...mmmmm........','..mmmmmmm.......','..mMmmmMm.......','..m.SSSS........','....SeSeS..EEE..','....sSSs..EFFFE.','...ccccc..EFGFE.','..ccccccc.EFFFE.','..cCcccCc.EFfFE.','.scccccccsEFfFE.','..ccccccc.EFFFE.','..cCcccCc..EEE..','...BBBBB........','...DD.DD........','...DD.DD........','..bbb..bbb......','................'] },
  luna: { pal: { p:'#4FBF8B', P:'#357F5D', h:'#E9D98A', S:'#F2CDA4', e:'#28242E', s:'#D8A87C', R:'#3F7E6A', r:'#2C5A4B', G:'#D9A441', O:'#9B7BD8', o:'#6E51A8', I:'#8A6B43' },
    rows: ['................','.......pp.......','......pppp......','.....pppppp.....','....pppppppp....','...pPpppppPp....','....hSSSSh...OO.','....SSeSeS...oO.','.....SSSS...I...','....RRRRRR.I....','...RRRRRRRSI....','..sRrRRRrRI.....','...RRRRRRRI.....','...RRGRRRR......','...RRRRRRRR.....','..RRRRRRRRR.....','..RrRRRRRrR.....','................'] },
  raven: { pal: { r:'#7A8494', i:'#565E6C', I:'#3C424E', S:'#E3B489', e:'#28242E', s:'#C08A5E', a:'#4A505C', A:'#343944', D:'#3B3F49', b:'#2E323B', P:'#8A6B43', p:'#D8DEE8' },
    rows: ['......r.........','......r......p..','...iiiii.....p..','..iiiiiii....P..','..iIiiiIi....P..','..i.SSSS.....P..','....SeSeS....P..','....sSSs.....P..','...aaaaa.....P..','..aaaaaaa...SP..','..aAaaaAaaSSP...','.saaaaaaas..P...','..aaaaaaa...P...','..aAaaaAa.......','...DDDDD........','...DD.DD........','..bbb..bbb......','................'] },
  ravenx: { pal: { o:'#4E5A48', O:'#37402F', S:'#E3B489', e:'#28242E', s:'#C08A5E', a:'#5A5346', A:'#403B31', D:'#3B3F49', b:'#2E323B', X:'#8A6B43', x:'#5E4930', T:'#C9CFD8' },
    rows: ['................','....ooooo.......','...ooooooo......','..oooooooo......','..oOoSSSOo......','..oo.SeSeS......','..o..sSSs.......','...aaaaa........','..aaaaaaa..T....','..aAaaaAa.XT....','.saaaaaaaXXXX...','..aaaaaaaSXT....','..aAaaaAa..T....','...DDDDD........','...DD.DD........','...DD.DD........','..bbb..bbb......','................'] },
  ravenm: { pal: { k:'#4A3B6E', K:'#332950', S:'#DCC1D8', e:'#7BE0D8', s:'#B99AB4', R:'#5A4788', r:'#413266', O:'#9B7BD8', o:'#6E51A8', I:'#6B5A8C', G:'#C74A9C' },
    rows: ['................','....kkkkk.......','...kkkkkkk......','..kkkkkkkk......','..kKk.SSKk...O..','..kk.SeSe...oO..','..k...SS....I...','...RRRRRR..I....','..RRRRRRRR.I....','..RrRRRRrRSI....','.sRRRRRRRRI.....','..RRRGRRRI......','..RRRRRRRR......','..RRRRRRRRR.....','.RRRRRRRRRR.....','.RrRRRRRRrR.....','................','................'] },
  ravenc: { pal: { r:'#C0392B', R:'#8E2A20', i:'#8C94A4', I:'#5E6674', S:'#E3B489', e:'#28242E', s:'#C08A5E', a:'#525866', A:'#3A3F4A', G:'#D9A441', D:'#3B3F49', b:'#2E323B', W:'#E8ECF2', w:'#AAB4C4' },
    rows: ['....GG..........','...iiiii........','..iiiiiii....W..','..iIiGiIi....Ww.','..i.SSSS.....Ww.','..R.SeSeS....Ww.','.RR.sSSs.....Ww.','.RRaaaaaa...Ww..','.RRaGaaGaa..Ww..','.RRaaaaaaaaSG...','.RRaAaaaAaS.....','.RRsaaaaaas.....','.RR.aaaaaa......','.R..aGaaGa......','....DDDDDD......','....DD..DD......','...bbb..bbb.....','................'] },
};
const SPRITE_CACHE = {};
function spriteURL(key, flip) {
  const id = key + (flip ? '_f' : '');
  if (SPRITE_CACHE[id]) return SPRITE_CACHE[id];
  try {
    const sp = SPRITES[key];
    const cv = document.createElement('canvas');
    if (!cv.getContext) return '';
    cv.width = 16; cv.height = 18;
    const ctx = cv.getContext('2d');
    sp.rows.forEach((row, y) => { [...row].forEach((c, x) => {
      if (c === '.') return;
      ctx.fillStyle = sp.pal[c];
      ctx.fillRect(flip ? 15 - x : x, y, 1, 1);
    }); });
    const url = cv.toDataURL();
    SPRITE_CACHE[id] = url;
    return url;
  } catch (e) { return ''; }
}

/* ══════════════ 技能・部隊・敵軍 ══════════════ */
const SKILLS = {
  gale:   { name: '聖光疾斬', mp: 4, rng: [1, 1], target: 'enemy', kind: 'dmg', mult: 1.6, desc: '對相鄰敵人造成 1.6 倍傷害' },
  pierce: { name: '信念突刺', mp: 5, rng: [1, 2], target: 'enemy', kind: 'dmg', mult: 1.1, ignoreDef: true, desc: '射程 2,無視防禦' },
  bash:   { name: '鐵血盾擊', mp: 4, rng: [1, 1], target: 'enemy', kind: 'dmg', mult: 0.8, stun: 1, desc: '0.8 倍傷害並暈眩 1 回合' },
  bolt:   { name: '星隕晶彈', mp: 5, rng: [2, 3], target: 'tile', kind: 'aoe', mult: 1.2, desc: '十字範圍星術傷害(射程 2–3)' },
  heal:   { name: '星光治癒', mp: 4, rng: [0, 2], target: 'ally', kind: 'heal', amount: 11, desc: '回復我方 11 點生命' },
  // ── 以下為商店可購入的進階技能 ──
  smite:  { name: '審判連斬', mp: 6, rng: [1, 1], target: 'enemy', kind: 'dmg', mult: 2.2, desc: '對相鄰敵人 2.2 倍重擊' },
  bulwark:{ name: '不動壁壘', mp: 5, rng: [1, 1], target: 'enemy', kind: 'dmg', mult: 1.2, stun: 2, desc: '1.2 倍傷害並暈眩 2 回合' },
  nova:   { name: '流星風暴', mp: 8, rng: [2, 4], target: 'tile', kind: 'aoe', mult: 1.6, desc: '大範圍星術(射程 2–4,1.6 倍)' },
  bless:  { name: '聖域庇護', mp: 6, rng: [0, 2], target: 'ally', kind: 'heal', amount: 20, desc: '回復我方 20 點生命' },
};
// 商店販售的技能:購入後永久加入該部隊技能列(以寶石庫支付)
const SKILL_SHOP = [
  { unit: 'joan',   skill: 'smite',   cost: { r: 3, k: 1 } },
  { unit: 'hector', skill: 'bulwark', cost: { u: 3, k: 1 } },
  { unit: 'luna',   skill: 'nova',    cost: { k: 2, r: 2 } },
  { unit: 'luna',   skill: 'bless',   cost: { g: 3, w: 1 } },
];
const FORGE = [
  { id: 'atk', name: '磨刃',     stat: 'atk',   amt: 2, cost: { r: 2 }, max: 3, desc: '攻擊 +2' },
  { id: 'def', name: '鑲甲',     stat: 'def',   amt: 2, cost: { u: 2 }, max: 3, desc: '防禦 +2' },
  { id: 'hp',  name: '血玉刻紋', stat: 'maxHp', amt: 6, cost: { g: 2 }, max: 3, desc: '生命上限 +6' },
  { id: 'mov', name: '迅風紋',   stat: 'mov',   amt: 1, cost: { w: 2 }, max: 1, desc: '移動 +1' },
  { id: 'mp',  name: '引晶迴路', stat: 'maxMp', amt: 4, cost: { k: 1 }, max: 2, desc: '晶力上限 +4' },
];
const POTION_COST = { g: 1 }, POTION_HEAL = 12, POTION_MAX = 3;

const PARTY_BASE = [
  { id: 'joan',   name: '貞德',   cls: '聖女・前線劍士', sprite: 'joan',   lead: true,
    maxHp: 26, atk: 8, def: 3, mov: 5, rng: [1, 1], maxMp: 10, skills: ['gale', 'pierce'] },
  { id: 'hector', name: '赫克特', cls: '鐵血騎士・重盾', sprite: 'hector',
    maxHp: 34, atk: 6, def: 6, mov: 3, rng: [1, 1], maxMp: 8,  skills: ['bash'] },
  { id: 'luna',   name: '露娜',   cls: '皇家占星師・晶術', sprite: 'luna',
    maxHp: 19, atk: 7, def: 2, mov: 4, rng: [1, 2], maxMp: 14, skills: ['bolt', 'heal'] },
];
const ENEMY_TYPES = {
  raven:  { name: '灰鴉傭兵',   sprite: 'raven',  hp: 20, atk: 7,  def: 2, mov: 4, rng: [1, 1] },
  ravenx: { name: '灰鴉弩手',   sprite: 'ravenx', hp: 16, atk: 7,  def: 1, mov: 4, rng: [1, 2] },
  ravenm: { name: '灰鴉咒術師', sprite: 'ravenm', hp: 16, atk: 9,  def: 1, mov: 3, rng: [1, 2] },
  ravenc: { name: '傭兵首領・灰鴉', sprite: 'ravenc', hp: 34, atk: 10, def: 4, mov: 4, rng: [1, 1] },
};

/* ══════════════ 三場戰役(次線劇情,鉤住主線) ══════════════
   劇情回聲:req.mainLv → 主線解鎖進度達標才顯示;req.clearedCh → 戰棋前章已通關才顯示 */
const TX_CHAPTERS = [
  {
    id: 1, name: '紅岩礦道的攻防', par: 8, rewardAst: 'ast3', astName: '鐵血騎士 赫克特',
    firstGems: { r: 2, u: 1 },
    intro: '主線呼應:第 3 關「鐵血的訂單」— 黑曜石封鎖的真相',
    storyBefore: [
      { who: '', side: 'n', text: '微光村後山,紅岩礦道深處。商會口中「被封鎖」的黑曜石礦,實情是——被武裝傭兵佔了。' },
      { who: '赫克特', side: 'ally', text: '灰鴉傭兵團。拿人錢財替人守礦,守的還是別人的礦。守備隊人手不足,只能請妳們出手了。' },
      { who: '赫克特', side: 'ally', text: '你就是傑洛米那老頭看好的商人朋友介紹來的?哼,商人的朋友……希望妳的劍比算盤利。', req: { mainLv: 3 } },
      { who: '貞德', side: 'ally', text: '礦工們斷了生計,信仰不能當飯吃。清出一條路吧,騎士閣下——費用照算,戰利品歸我們。' },
      { who: '露娜', side: 'ally', text: '星象顯示今日「破軍臨東」……簡單說,適合打架!礦道裡的寶石,打完通通搬回寶石庫~' },
      { who: '灰鴉傭兵', side: 'foe', text: '站住!這條礦道被「客戶」包下了。識相的滾回去,不識相的——躺著回去。' },
    ],
    storyAfter: [
      { who: '赫克特', side: 'ally', text: '礦道清出來了。這下鐵匠鋪的黑曜石訂單有著落了……欠妳們一次,我的盾隨時為妳們而舉。' },
      { who: '露娜', side: 'ally', text: '奇怪,傭兵團的委託書上蓋的是……首都商會的火漆印?一群商人僱傭兵佔礦?' },
      { who: '貞德', side: 'ally', text: '收好那份委託書。總有一天,會用得上的。' },
    ],
    map: {
      rows: ['.......', '.M...F.', '.......', '..F.C..', '.......', '.F...M.', '.......'],
      chests: [{ x: 4, y: 3, gem: 'g' }],
      playerSpawns: [[0, 2], [0, 3], [0, 4]],
      enemies: [
        { type: 'raven',  x: 4, y: 1, drop: 'r' },
        { type: 'raven',  x: 5, y: 4, drop: 'r' },
        { type: 'ravenx', x: 5, y: 2, drop: 'u' },
        { type: 'raven',  x: 4, y: 5, drop: 'k' },
      ],
    },
  },
  {
    id: 2, name: '橡木鎮糧倉夜襲', par: 9, rewardAst: 'ast6', astName: '帝國雄獅 亞瑟',
    firstGems: { u: 2, w: 2 },
    intro: '主線呼應:第 6 關「雄獅的胃口」— 燒錢的軍隊在燒什麼',
    storyBefore: [
      { who: '', side: 'n', text: '橡木鎮,深夜。警鐘劃破夜空——灰鴉傭兵團的黑影正朝糧倉逼近。' },
      { who: '亞瑟', side: 'ally', text: '「我的軍隊每天都在燒錢」——現在你們知道錢燒去哪了吧?就是為了防這群夜裡來的老鼠!' },
      { who: '亞瑟', side: 'ally', text: '哦?你就是那個在我晚宴上限時拿下成績的商人的護衛隊?有點意思,讓本子爵看看你們的身手。', req: { mainLv: 6 } },
      { who: '赫克特', side: 'ally', text: '又是灰鴉。紅岩礦道那筆帳還沒跟他們算清,正好——連本帶利。', req: { clearedCh: 1 } },
      { who: '露娜', side: 'ally', text: '糧倉後方有補給箱,戰鬥中順路開一開。呃我是說,為了戰略物資,不是貪財!' },
      { who: '灰鴉弩手', side: 'foe', text: '燒了糧倉,橡木鎮的商路就斷了。「客戶」出的價,夠弟兄們吃三年!' },
    ],
    storyAfter: [
      { who: '亞瑟', side: 'ally', text: '漂亮!雄獅的地盤豈容鼠輩撒野。你們的部隊,本子爵記下了——帝國雄獅與你們同行。' },
      { who: '貞德', side: 'ally', text: '又是「客戶」。礦道、糧倉……有人在系統性地掐斷這一帶的商脈。' },
      { who: '露娜', side: 'ally', text: '星盤指向邊境森林。下一步,他們會對商隊的林道下手——萊戈拉斯大人恐怕撐不了太久。' },
    ],
    map: {
      rows: ['........', '.F..MM..', '........', '.M....C.', '........', '.F..MM..', '........'],
      chests: [{ x: 6, y: 3, gem: 'w' }],
      playerSpawns: [[0, 2], [0, 3], [0, 4]],
      enemies: [
        { type: 'raven',  x: 4, y: 2, drop: 'r' },
        { type: 'raven',  x: 5, y: 6, drop: 'u' },
        { type: 'ravenx', x: 6, y: 1, drop: 'w' },
        { type: 'ravenx', x: 6, y: 5, drop: 'u' },
        { type: 'ravenm', x: 7, y: 4, drop: 'k' },
      ],
    },
  },
  {
    id: 3, name: '邊境森林阻擊戰', par: 10, rewardAst: 'ast14', astName: '精靈遊俠 萊戈拉斯',
    firstGems: { k: 2, w: 1, r: 1 },
    intro: '主線呼應:第 14 關「遊俠的森林限速」— 戒嚴令背後的那場敵襲',
    storyBefore: [
      { who: '', side: 'n', text: '邊境森林。萊戈拉斯封鎖林道、只留 16 回合給商人的那道戒嚴令——起因就是眼前這場敵襲。' },
      { who: '萊戈拉斯', side: 'ally', text: '灰鴉傭兵團的主力到了,連首領都親自壓陣。人類,我的箭守林道北口,南面的缺口……交給你們。' },
      { who: '萊戈拉斯', side: 'ally', text: '你們的商人朋友在戒嚴中還能準時交付軍需,是個信人。為了他,我允許你們踏入精靈的林地。', req: { mainLv: 14 } },
      { who: '赫克特', side: 'ally', text: '礦道、糧倉、林道——三筆帳,今天一次算。灰鴉,你的翅膀到此為止了。', req: { clearedCh: 2 } },
      { who: '傭兵首領・灰鴉', side: 'foe', text: '喲,一路追到這來了?可惜,這單的價碼高到你們無法想像——首都的大人物,要這片森林燒起來。' },
      { who: '貞德', side: 'ally', text: '首都的大人物……很好,又一條線索。先打贏這仗,再去會會那位「大人物」。' },
    ],
    storyAfter: [
      { who: '傭兵首領・灰鴉', side: 'foe', text: '咳……記住,僱我們的火漆印上有一把「影刃」……你們動不了那位大人的……' },
      { who: '萊戈拉斯', side: 'ally', text: '森林守住了。戒嚴令即刻解除——那位商人的貨,可以走了。人類,精靈的迅捷與你們同在。' },
      { who: '露娜', side: 'ally', text: '影刃……首都……星象在警告我們,真正的商戰才正要開始。(次線劇情將隨主線第四章持續展開)' },
      { who: '', side: 'n', text: '—— 戰線戰役・第一部 完 ——' },
    ],
    map: {
      rows: ['........', '.F.MM.F.', '........', '..F..C..', '........', '..C..F..', '........', '.F.MM.F.'],
      chests: [{ x: 5, y: 3, gem: 'k' }, { x: 2, y: 5, gem: 'g' }],
      playerSpawns: [[0, 3], [0, 4], [1, 5]],
      enemies: [
        { type: 'raven',  x: 5, y: 2, drop: 'r' },
        { type: 'raven',  x: 4, y: 6, drop: 'r' },
        { type: 'ravenx', x: 6, y: 2, drop: 'w' },
        { type: 'ravenx', x: 6, y: 6, drop: 'u' },
        { type: 'ravenm', x: 7, y: 4, drop: 'k' },
        { type: 'ravenc', x: 7, y: 3, drop: ['r', 'k'] },
      ],
    },
  },
];

/* ══════════════ 戰棋主控 ══════════════ */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sfx = () => { if (typeof window !== 'undefined' && window.playUniformSfx) window.playUniformSfx(); };

export const TacticsMode = {
  layer: null, chapter: null, B: null,

  ensureLayer() {
    if (this.layer) return this.layer;
    let el = document.getElementById('tactics-layer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tactics-layer';
      (document.getElementById('stage') || document.body).appendChild(el);
    }
    this.layer = el;
    return el;
  },

  open(chIdx) {
    const ch = TX_CHAPTERS[chIdx];
    if (!ch) return;
    this.chapter = ch;
    this.ensureLayer().classList.add('tx-active');
    this.showStory(this.filterScript(ch.storyBefore), () => this.showPrep());
  },

  close() {
    this.B = null;
    if (this.layer) { this.layer.classList.remove('tx-active'); this.layer.innerHTML = ''; }
  },

  /* 劇情回聲過濾:依主線進度與戰棋通關狀態決定顯示哪些台詞 */
  filterScript(script) {
    const sp = readStoryProgress();
    return script.filter(line => {
      if (!line.req) return true;
      if (line.req.mainLv && sp.maxUnlockedLevel < line.req.mainLv) return false;
      if (line.req.clearedCh && !TxSave.isCleared(line.req.clearedCh)) return false;
      return true;
    });
  },

  /* ── 劇情畫面 ── */
  showStory(script, done) {
    const ch = this.chapter;
    let i = 0;
    this.ensureLayer().innerHTML = `
      <div class="tx-story">
        <div class="tx-scene">⚔️ 戰線戰役 第 ${ch.id} 戰:${esc(ch.name)}<br><span class="tx-tag">${esc(ch.intro)}</span></div>
        <button class="tx-skip" id="tx-skip">跳過 ≫</button>
        <div class="tx-dlg" id="tx-dlg">
          <div class="tx-dlg-name" id="tx-dlg-name"></div>
          <div class="tx-dlg-text" id="tx-dlg-text"></div>
          <div class="tx-dlg-hint">▼ 點擊繼續</div>
        </div>
      </div>`;
    const nameEl = document.getElementById('tx-dlg-name'), textEl = document.getElementById('tx-dlg-text');
    const render = () => {
      const line = script[i];
      nameEl.className = 'tx-dlg-name side-' + line.side;
      nameEl.textContent = line.who || '旁白';
      textEl.textContent = line.text;
      textEl.style.cssText = line.who ? '' : 'color:#b8c0cc;text-align:center;padding-top:10px;';
    };
    document.getElementById('tx-dlg').onclick = () => { sfx(); i++; if (i >= script.length) done(); else render(); };
    document.getElementById('tx-skip').onclick = (e) => { e.stopPropagation(); sfx(); done(); };
    render();
  },

  /* ── 出擊整備(共享寶石庫鍛造) ── */
  buildParty() {
    return PARTY_BASE.map(b => {
      const u = { ...b, rng: [...b.rng], skills: [...b.skills] };
      FORGE.forEach(f => { u[f.stat] += f.amt * TxSave.forgeCount(b.id, f.id); });
      // 併入商店購得的技能
      (TxSave.load().skills[b.id] || []).forEach(sid => { if (!u.skills.includes(sid)) u.skills.push(sid); });
      return u;
    });
  },

  showPrep() {
    const ch = this.chapter;
    const layer = this.ensureLayer();
    layer.innerHTML = `
      <div class="tx-prep">
        <div class="tx-prep-head">
          <h2>⚒️ 出擊整備・${esc(ch.name)}</h2>
          <div class="note">寶石庫與主線商道戰役共通:主線通關、戰場拾獲都會存入這裡;在此以寶石為部隊「刻紋」永久強化。</div>
          <div style="margin-top:5px;font-size:0.68rem;">💎 寶石庫:<span id="tx-vault-line"></span>　🧪 藥水 ×<span id="tx-pot-n"></span></div>
        </div>
        <div class="tx-prep-body" id="tx-prep-body"></div>
        <div class="tx-prep-foot">
          <button id="tx-back">← 返回大會堂</button>
          <button class="tx-primary" id="tx-deploy">⚔ 出 擊</button>
        </div>
      </div>`;
    const refresh = () => {
      document.getElementById('tx-vault-line').innerHTML = TacticsVault.lineHtml();
      document.getElementById('tx-pot-n').textContent = TxSave.load().potions;
      const v = TacticsVault.read();
      const costStr = cost => Object.entries(cost).map(([k, n]) => TacticsVault.iconHtml(k, '×' + n)).join(' ');
      const canPay = cost => Object.entries(cost).every(([k, n]) => v[k] >= n);
      document.getElementById('tx-prep-body').innerHTML = `
        <h3>晶紋鍛造(永久強化)</h3>
        ${this.buildParty().map(u => `
          <div class="tx-funit">${esc(u.name)}・${esc(u.cls)}</div>
          <div style="margin-bottom:4px;">
            <span class="tx-chip">HP ${u.maxHp}</span><span class="tx-chip">MP ${u.maxMp}</span>
            <span class="tx-chip">攻 ${u.atk}</span><span class="tx-chip">防 ${u.def}</span>
            <span class="tx-chip">移 ${u.mov}</span>
            <span class="tx-chip">技:${u.skills.map(s => esc(SKILLS[s].name)).join('、')}</span>
          </div>
          ${FORGE.map(f => {
            const n = TxSave.forgeCount(u.id, f.id);
            const full = n >= f.max;
            return `<div class="tx-row">
              <span class="grow">${esc(f.name)} <span style="color:var(--tx-dim);font-size:0.55rem;">${esc(f.desc)}(${n}/${f.max})</span></span>
              <span class="price">${costStr(f.cost)}</span>
              <button data-forge="${u.id}:${f.id}" ${(!full && canPay(f.cost)) ? '' : 'disabled'}>${full ? '已滿' : '刻紋'}</button>
            </div>`;
          }).join('')}`).join('')}
        <h3>補給</h3>
        <div class="tx-row">
          <span class="grow">治療藥水(戰鬥中回復 ${POTION_HEAL} HP,持有上限 ${POTION_MAX})</span>
          <span class="price">${costStr(POTION_COST)}</span>
          <button id="tx-buy-pot" ${(TxSave.load().potions < POTION_MAX && canPay(POTION_COST)) ? '' : 'disabled'}>兌換</button>
        </div>
        <p class="tx-tag" style="margin-top:8px;line-height:1.7;">提示:寶石不夠?回主線商道戰役通關可獲得寶石;本戰場擊敗傭兵與開啟寶箱 ❖ 也會直接入庫。</p>`;
      layer.querySelectorAll('[data-forge]').forEach(b => b.onclick = () => {
        const [uid, fid] = b.dataset.forge.split(':');
        const f = FORGE.find(x => x.id === fid);
        if (TxSave.forgeCount(uid, fid) >= f.max) return;
        if (!TacticsVault.spend(f.cost)) return;
        TxSave.addForge(uid, fid); sfx(); refresh();
      });
      const bp = document.getElementById('tx-buy-pot');
      if (bp) bp.onclick = () => {
        if (TxSave.load().potions >= POTION_MAX) return;
        if (!TacticsVault.spend(POTION_COST)) return;
        TxSave.data.potions++; TxSave.save(); sfx(); refresh();
      };
    };
    document.getElementById('tx-back').onclick = () => { sfx(); this.returnFromBattle(); };
    document.getElementById('tx-deploy').onclick = () => { sfx(); this.startBattle(); };
    refresh();
  },

  /* ══════════════ 戰鬥核心 ══════════════ */
  startBattle() {
    const ch = this.chapter;
    const rows = ch.map.rows.map(r => r.split(''));
    ch.map.chests.forEach(c => rows[c.y][c.x] = 'C');
    const B = this.B = {
      ch, rows, W: rows[0].length, H: rows.length,
      chests: ch.map.chests.map(c => ({ ...c, opened: false })),
      units: [], turn: 1, phase: 'ally', busy: false, ended: false,
      sel: null, mode: 'idle', moveSet: null, targetSet: null, pendingSkill: null, prevPos: null,
      loot: { r: 0, u: 0, g: 0, w: 0, k: 0 }, logs: [],
      potions: TxSave.load().potions,
    };
    this.buildParty().forEach((p, i) => {
      const [x, y] = ch.map.playerSpawns[i];
      B.units.push({ side: 'ally', name: p.name, sprite: p.sprite, x, y,
        hp: p.maxHp, mp: p.maxMp, maxHp: p.maxHp, maxMp: p.maxMp,
        atk: p.atk, def: p.def, mov: p.mov, rng: p.rng,
        skills: p.skills, lead: !!p.lead, acted: false, stun: 0, alive: true });
    });
    ch.map.enemies.forEach(e => {
      const t = ENEMY_TYPES[e.type];
      B.units.push({ side: 'foe', name: t.name, sprite: t.sprite, x: e.x, y: e.y,
        hp: t.hp, maxHp: t.hp, atk: t.atk, def: t.def, mov: t.mov, rng: t.rng,
        drop: e.drop, acted: false, stun: 0, alive: true });
    });
    this.buildBattleUI();
    this.log(`第 ${ch.id} 戰:${ch.name} 開戰`, 'sys');
    this.log(`我方回合 ${B.turn}`, 'ally');
    this.renderBoard(); this.renderInfo();
  },

  TERRAIN: { '.': { name: '平原', cost: 1, defB: 0 }, F: { name: '林地', cost: 2, defB: 1 }, M: { name: '山岳', cost: Infinity, defB: 0 }, C: { name: '寶箱', cost: 1, defB: 0 } },
  terrainAt(x, y) { const B = this.B; return (x < 0 || y < 0 || x >= B.W || y >= B.H) ? 'M' : B.rows[y][x]; },
  unitAt(x, y) { return this.B.units.find(u => u.alive && u.x === x && u.y === y); },
  manh(a, b, x, y) { return Math.abs(a - x) + Math.abs(b - y); },

  log(msg, cls) {
    const B = this.B; if (!B) return;
    B.logs.push({ msg, cls: cls || '' });
    const el = document.getElementById('tx-log');
    if (el) { el.innerHTML = B.logs.slice(-30).map(l => `<div class="l-${l.cls}">${esc(l.msg)}</div>`).join(''); el.scrollTop = el.scrollHeight; }
  },

  calcMoveSet(u) {
    const B = this.B, dist = new Map(), key = (x, y) => x + ',' + y;
    dist.set(key(u.x, u.y), 0);
    const pq = [[0, u.x, u.y]];
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, x, y] = pq.shift();
      if (d > (dist.get(key(x, y)) ?? Infinity)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        const c = this.TERRAIN[this.terrainAt(nx, ny)].cost;
        if (c === Infinity) continue;
        const occ = this.unitAt(nx, ny);
        if (occ && occ.side !== u.side) continue;
        const nd = d + c;
        if (nd > u.mov) continue;
        if (nd < (dist.get(key(nx, ny)) ?? Infinity)) { dist.set(key(nx, ny), nd); pq.push([nd, nx, ny]); }
      }
    }
    const set = new Set();
    for (const k of dist.keys()) {
      const [x, y] = k.split(',').map(Number);
      const occ = this.unitAt(x, y);
      if (!occ || occ === u) set.add(k);
    }
    return set;
  },
  tilesInRange(x, y, rng) {
    const B = this.B, out = [];
    for (let ty = 0; ty < B.H; ty++) for (let tx = 0; tx < B.W; tx++) {
      const d = this.manh(x, y, tx, ty);
      if (d >= rng[0] && d <= rng[1]) out.push([tx, ty]);
    }
    return out;
  },

  dealDamage(att, def, mult, ignoreDef) {
    const terr = this.TERRAIN[this.terrainAt(def.x, def.y)];
    const defense = ignoreDef ? 0 : def.def + terr.defB;
    const dmg = Math.max(1, Math.round(att.atk * mult - defense));
    def.hp = Math.max(0, def.hp - dmg);
    this.log(`${att.name} → ${def.name} 造成 ${dmg} 傷害`, att.side);
    const killed = def.hp <= 0;
    if (killed) { this.fxGhost(def); this.killUnit(def); }
    this.renderBoard();
    this.floatText(def.x, def.y, '-' + dmg, def.side === 'foe' ? '#FFD98C' : '#FF8A8A');
    if (!killed) this.fxHurt(def.x, def.y);
    this.fxShake(killed);
    return dmg;
  },
  killUnit(u) {
    const B = this.B;
    u.alive = false;
    this.log(`${u.name} 倒下`, u.side === 'foe' ? 'sys' : 'foe');
    if (u.side === 'foe') {
      const drops = Array.isArray(u.drop) ? u.drop : (u.drop ? [u.drop] : []);
      drops.forEach(g => {
        B.loot[g]++;
        TacticsVault.grant({ [g]: 1 });   // 掉落即時入共享寶石庫
        this.floatText(u.x, u.y, '獲得' + GEM_INFO[g].name, GEM_INFO[g].color);
        this.log(`拾獲 ${GEM_INFO[g].name}(已入寶石庫)`, 'sys');
      });
    }
    this.checkBattleEnd();
  },

  /* ── 戰鬥 UI(直式) ── */
  buildBattleUI() {
    const B = this.B;
    this.ensureLayer().innerHTML = `
      <div class="tx-top">
        <span class="tx-ch">⚔ 第${B.ch.id}戰・${esc(B.ch.name)}</span>
        <span class="tx-tag">回合 <span id="tx-turn">${B.turn}</span></span>
        <span class="tx-phase p-ally" id="tx-phase">我方行動</span>
        <span class="tx-bag" id="tx-bag"></span>
        <button class="tx-exit" id="tx-exit">✕ 撤退</button>
      </div>
      <div class="tx-board-wrap"><div class="tx-board-anchor">
        <div class="tx-board" id="tx-board"></div><div id="tx-fx"></div>
      </div></div>
      <div class="tx-bottom">
        <div class="tx-bp" id="tx-info"></div>
        <div class="tx-bp">
          <div id="tx-menu"></div>
          <h4 style="margin-top:4px;">戰況記錄</h4>
          <div class="tx-log" id="tx-log"></div>
          <button class="tx-endturn" id="tx-endturn">結束我方回合 ⏭</button>
        </div>
      </div>`;
    const board = document.getElementById('tx-board');
    board.style.gridTemplateColumns = `repeat(${B.W}, var(--cell,48px))`;
    const wrap = this.layer.querySelector('.tx-board-wrap') || {};
    const availW = (wrap.clientWidth || 420) - 18, availH = (wrap.clientHeight || 440) - 18;
    const cell = Math.max(38, Math.min(56, Math.floor(availW / B.W) - 2, Math.floor(availH / B.H) - 2));
    board.style.setProperty('--cell', cell + 'px');
    for (let y = 0; y < B.H; y++) for (let x = 0; x < B.W; x++) {
      const d = document.createElement('div');
      d.className = 'tx-cell t-' + (B.rows[y][x] === '.' ? 'P' : B.rows[y][x]);
      d.dataset.x = x; d.dataset.y = y;
      d.onclick = () => this.onCellClick(x, y);
      board.appendChild(d);
    }
    document.getElementById('tx-endturn').onclick = () => { if (B.phase === 'ally' && !B.busy) this.endAllyPhase(); };
    document.getElementById('tx-exit').onclick = () => {
      if (confirm('撤退將放棄本場戰鬥(已入庫的拾獲保留),確定?')) { this.returnFromBattle(); }
    };
  },

  renderBoard() {
    const B = this.B; if (!B) return;
    const bag = document.getElementById('tx-bag');
    if (bag) bag.innerHTML = TacticsVault.lineHtml() + ` <span style="color:var(--tx-dim)">🧪×${B.potions}</span>`;
    const tEl = document.getElementById('tx-turn'); if (tEl) tEl.textContent = B.turn;
    const pill = document.getElementById('tx-phase');
    if (pill) { pill.className = 'tx-phase ' + (B.phase === 'ally' ? 'p-ally' : 'p-foe'); pill.textContent = B.phase === 'ally' ? '我方行動' : '灰鴉團行動'; }
    this.layer.querySelectorAll('.tx-cell').forEach(c => {
      const x = +c.dataset.x, y = +c.dataset.y, k = x + ',' + y;
      c.className = 'tx-cell t-' + (B.rows[y][x] === '.' ? 'P' : B.rows[y][x]);
      if (B.mode === 'move' && B.moveSet && B.moveSet.has(k)) c.classList.add('hl-move');
      if (B.mode === 'target' && B.targetSet && B.targetSet.has(k))
        c.classList.add((B.pendingSkill && (B.pendingSkill.kind === 'heal' || B.pendingSkill.kind === 'item')) ? 'hl-heal' : 'hl-atk');
      if (B.sel && B.sel.x === x && B.sel.y === y) c.classList.add('hl-sel');
      c.querySelectorAll('.tx-piece,.tx-hpbar').forEach(e => e.remove());
      const u = this.unitAt(x, y);
      if (u) {
        const p = document.createElement('div');
        p.className = `tx-piece ${u.side}${u.acted && u.side === 'ally' && B.phase === 'ally' ? ' acted' : ''}${u.stun > 0 ? ' stunned' : ''}`;
        const im = document.createElement('img');
        im.className = 'tx-spr'; im.draggable = false;
        im.src = spriteURL(u.sprite, u.side === 'foe');
        p.appendChild(im);
        c.appendChild(p);
        const hb = document.createElement('div');
        hb.className = 'tx-hpbar';
        const pct = Math.round(u.hp / u.maxHp * 100);
        hb.innerHTML = `<i class="${pct <= 35 ? 'low' : ''}" style="width:${pct}%"></i>`;
        c.appendChild(hb);
      }
    });
  },

  renderInfo(unit) {
    const B = this.B, sp = document.getElementById('tx-info');
    if (!sp) return;
    const u = unit || (B && B.sel);
    if (!u) {
      sp.innerHTML = `<h4>單位情報</h4><div style="font-size:0.58rem;color:var(--tx-dim);line-height:1.7;">點選單位查看。點選我方未行動單位以移動。<br>♣ 林地:移動費2/防+1 ▲ 山岳:不可通行<br>❖ 寶箱:停留其上即開啟入庫</div>`;
      return;
    }
    const terr = this.TERRAIN[this.terrainAt(u.x, u.y)];
    sp.innerHTML = `<h4>單位情報</h4>
      <div class="tx-uname" style="color:${u.side === 'ally' ? 'var(--tx-ally)' : 'var(--tx-foe)'}">${esc(u.name)}</div>
      <div class="tx-ucls">${u.side === 'ally' ? '我方' : '灰鴉傭兵團'}${u.stun > 0 ? '・暈眩中' : ''}・${terr.name}${terr.defB ? `(防+${terr.defB})` : ''}</div>
      <div class="tx-ustats">
        <span><b>HP</b>${u.hp}/${u.maxHp}</span>${u.side === 'ally' ? `<span><b>MP</b>${u.mp}/${u.maxMp}</span>` : '<span></span>'}
        <span><b>攻</b>${u.atk}</span><span><b>防</b>${u.def}</span>
        <span><b>移</b>${u.mov}</span><span><b>射程</b>${u.rng[0]}–${u.rng[1]}</span>
      </div>`;
  },

  /* ── 特效系統 ── */
  fxRoot() { return document.getElementById('tx-fx'); },
  cellPos(x, y) {
    const L = this.fxRoot(), c = this.layer && this.layer.querySelector(`.tx-cell[data-x="${x}"][data-y="${y}"]`);
    if (!L || !c || !c.getBoundingClientRect || !L.getBoundingClientRect) return null;
    const a = c.getBoundingClientRect(), b = L.getBoundingClientRect();
    // 舞台可能被 transform:scale 縮放:換算回設計座標
    const scale = b.width && L.offsetWidth ? (b.width / L.offsetWidth) : 1;
    return { x: (a.left - b.left + a.width / 2) / (scale || 1), y: (a.top - b.top + a.height / 2) / (scale || 1), w: a.width / (scale || 1) };
  },
  spawnFx(cls, x, y, life, setup) {
    const L = this.fxRoot(); if (!L) return null;
    const d = document.createElement('div');
    d.className = 'tx-fx ' + cls;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    if (setup) setup(d);
    L.appendChild(d);
    if (life) setTimeout(() => d.remove(), life);
    return d;
  },
  floatText(x, y, text, color) {
    const p = this.cellPos(x, y); if (!p) return;
    const isNum = /^[-+]/.test(text);
    this.spawnFx('tx-fx-dmg', p.x, p.y - 5, 900, d => {
      d.textContent = text; d.style.color = color;
      if (!isNum) d.style.fontSize = '0.62rem';
    });
  },
  pieceAt(x, y) { return this.layer && this.layer.querySelector(`.tx-cell[data-x="${x}"][data-y="${y}"] .tx-piece`); },
  fxShake(big) {
    const b = document.getElementById('tx-board');
    if (!b || !b.classList || !b.classList.remove) return;
    const cls = big ? 'shake-big' : 'shake';
    b.classList.remove('shake', 'shake-big');
    void b.offsetWidth;
    b.classList.add(cls);
    setTimeout(() => b.classList.remove(cls), big ? 520 : 320);
  },
  fxSparks(x, y, color, n) {
    const p = this.cellPos(x, y); if (!p) return;
    for (let i = 0; i < n; i++) {
      const d = this.spawnFx('tx-fx-spark', p.x, p.y, 480, e => { e.style.background = color; });
      if (!d) continue;
      const ang = Math.random() * Math.PI * 2, r = 12 + Math.random() * 20;
      requestAnimationFrame(() => {
        d.style.transform = `translate(calc(-50% + ${Math.cos(ang) * r}px), calc(-50% + ${Math.sin(ang) * r}px))`;
        d.style.opacity = '0';
      });
    }
  },
  fxSlash(x, y) {
    const p = this.cellPos(x, y); if (!p) return;
    this.spawnFx('tx-fx-slash', p.x, p.y, 320, d => d.style.setProperty('--rot', '-38deg'));
    setTimeout(() => this.spawnFx('tx-fx-slash', p.x, p.y, 320, d => d.style.setProperty('--rot', '30deg')), 70);
    this.fxSparks(x, y, '#FFE9A8', 5);
  },
  fxRing(x, y, color) {
    const p = this.cellPos(x, y); if (!p) return;
    this.spawnFx('tx-fx-ring', p.x, p.y, 480, d => { if (color) d.style.borderColor = color; });
  },
  fxHurt(x, y) {
    const pc = this.pieceAt(x, y);
    if (pc && pc.classList) { pc.classList.add('hurt'); setTimeout(() => pc.classList && pc.classList.remove('hurt'), 360); }
  },
  fxGhost(u) {
    const p = this.cellPos(u.x, u.y); if (!p) return;
    this.spawnFx('tx-fx-ghost', p.x, p.y, 620, d => {
      const im = document.createElement('img');
      im.src = spriteURL(u.sprite, u.side === 'foe');
      im.style.width = (p.w * .86) + 'px';
      d.appendChild(im);
    });
    this.fxSparks(u.x, u.y, u.side === 'foe' ? '#F0A18C' : '#9CC4F2', 9);
  },
  fxProjectile(x0, y0, x1, y1, cb) {
    const a = this.cellPos(x0, y0), b = this.cellPos(x1, y1);
    if (!a || !b) { cb(); return; }
    const d = this.spawnFx('tx-fx-ball', a.x, a.y, 0);
    if (!d) { cb(); return; }
    requestAnimationFrame(() => {
      d.style.transition = 'left .3s cubic-bezier(.4,.1,.7,1), top .3s cubic-bezier(.4,.1,.7,1)';
      d.style.left = b.x + 'px'; d.style.top = b.y + 'px';
    });
    setTimeout(() => { d.remove(); cb(); }, 320);
  },
  fxScreenFlash(color) {
    const L = this.fxRoot(); if (!L) return;
    const d = document.createElement('div');
    d.className = 'tx-fx tx-fx-flash'; d.style.background = color;
    L.appendChild(d);
    setTimeout(() => d.remove(), 340);
  },
  fxBanner(text, color) {
    const L = this.fxRoot(); if (!L) return;
    const d = document.createElement('div');
    d.className = 'tx-fx tx-fx-banner'; d.textContent = text; d.style.color = color;
    L.appendChild(d);
    setTimeout(() => d.remove(), 1050);
  },
  fxHeal(x, y) {
    const p = this.cellPos(x, y); if (!p) return;
    this.fxRing(x, y, '#7FE0B0');
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const d = this.spawnFx('tx-fx-spark', p.x + (Math.random() * 22 - 11), p.y + 9, 540, e => {
          e.style.background = '#7FE0B0'; e.style.width = '8px'; e.style.height = '8px';
          e.style.clipPath = 'polygon(40% 0,60% 0,60% 40%,100% 40%,100% 60%,60% 60%,60% 100%,40% 100%,40% 60%,0 60%,0 40%,40% 40%)';
        });
        if (d) requestAnimationFrame(() => { d.style.transform = 'translate(-50%,-260%)'; d.style.opacity = '0'; });
      }, i * 90);
    }
  },
  strike(att, def, mult, ignoreDef, after) {
    const pc = this.pieceAt(att.x, att.y);
    const pa = this.cellPos(att.x, att.y), pd = this.cellPos(def.x, def.y);
    if (pc && pc.classList && pa && pd) {
      pc.style.setProperty('--lx', ((pd.x - pa.x) * .42) + 'px');
      pc.style.setProperty('--ly', ((pd.y - pa.y) * .42) + 'px');
      pc.classList.add('lunge');
    }
    setTimeout(() => {
      this.fxSlash(def.x, def.y);
      this.dealDamage(att, def, mult, ignoreDef);
      setTimeout(after, 340);
    }, 150);
  },

  /* ── 玩家操作 ── */
  onCellClick(x, y) {
    const B = this.B;
    if (!B || B.busy || B.phase !== 'ally') return;
    const clicked = this.unitAt(x, y);
    if (B.mode === 'idle') {
      if (!clicked) { B.sel = null; this.renderInfo(); this.renderBoard(); return; }
      B.sel = clicked; this.renderInfo();
      if (clicked.side === 'ally' && !clicked.acted && clicked.stun <= 0) {
        B.mode = 'move'; B.moveSet = this.calcMoveSet(clicked);
      }
      this.renderBoard(); return;
    }
    if (B.mode === 'move') {
      const k = x + ',' + y;
      if (B.moveSet.has(k)) {
        B.prevPos = [B.sel.x, B.sel.y];
        B.sel.x = x; B.sel.y = y;
        B.mode = 'menu'; B.moveSet = null;
        this.openChestIfAny(B.sel);
        this.renderBoard(); this.renderInfo(); this.showActionMenu();
      } else if (clicked && clicked !== B.sel) {
        B.mode = 'idle'; B.moveSet = null; this.onCellClick(x, y);
      } else { B.mode = 'idle'; B.sel = null; B.moveSet = null; this.renderBoard(); this.renderInfo(); }
      return;
    }
    if (B.mode === 'target') {
      const k = x + ',' + y;
      if (B.targetSet.has(k)) this.executeAction(x, y);
      else this.cancelToMenu();
    }
  },
  openChestIfAny(u) {
    const B = this.B;
    if (u.side !== 'ally') return;
    const c = B.chests.find(c => !c.opened && c.x === u.x && c.y === u.y);
    if (c) {
      c.opened = true; B.rows[c.y][c.x] = '.';
      B.loot[c.gem]++;
      TacticsVault.grant({ [c.gem]: 1 });
      this.floatText(c.x, c.y, '寶箱:' + GEM_INFO[c.gem].name, GEM_INFO[c.gem].color);
      this.log(`${u.name} 開啟寶箱,${GEM_INFO[c.gem].name} 入庫`, 'sys');
    }
  },
  showActionMenu() {
    const B = this.B, u = B.sel, m = document.getElementById('tx-menu');
    const foesInRng = this.tilesInRange(u.x, u.y, u.rng).some(([tx, ty]) => { const t = this.unitAt(tx, ty); return t && t.side === 'foe'; });
    m.innerHTML = `<h4>行動・${esc(u.name)}</h4><div class="tx-menu">
      <button data-act="attack" ${foesInRng ? '' : 'disabled'}>攻擊<span class="mp">射程${u.rng[0]}–${u.rng[1]}</span></button>
      ${u.skills.map(sid => { const s = SKILLS[sid];
        return `<button data-skill="${sid}" ${u.mp < s.mp ? 'disabled' : ''} title="${esc(s.desc)}">${esc(s.name)}<span class="mp">MP${s.mp}</span></button>`; }).join('')}
      <button data-act="potion" ${B.potions > 0 ? '' : 'disabled'}>治療藥水<span class="mp">×${B.potions}</span></button>
      <button data-act="wait">待機</button>
      <button data-act="cancel" style="color:var(--tx-dim)">取消(退回原位)</button>
    </div>`;
    m.querySelectorAll('button').forEach(b => b.onclick = () => {
      if (b.disabled) return;
      sfx();
      const act = b.dataset.act, sid = b.dataset.skill;
      if (act === 'wait') return this.finishAction();
      if (act === 'cancel') {
        u.x = B.prevPos[0]; u.y = B.prevPos[1];
        B.mode = 'idle'; B.sel = null; m.innerHTML = ''; this.renderBoard(); this.renderInfo(); return;
      }
      if (act === 'attack') return this.enterTargeting({ kind: 'attack', rng: u.rng });
      if (act === 'potion') return this.enterTargeting({ kind: 'item', rng: [0, 1] });
      if (sid) { const s = SKILLS[sid];
        return this.enterTargeting({ kind: s.kind === 'heal' ? 'heal' : (s.kind === 'aoe' ? 'aoe' : 'skill'), skill: s, rng: s.rng }); }
    });
  },
  enterTargeting(spec) {
    const B = this.B, u = B.sel;
    B.pendingSkill = spec;
    B.targetSet = new Set();
    for (const [tx, ty] of this.tilesInRange(u.x, u.y, spec.rng)) {
      const t = this.unitAt(tx, ty);
      if (spec.kind === 'attack' || spec.kind === 'skill') { if (t && t.side === 'foe') B.targetSet.add(tx + ',' + ty); }
      else if (spec.kind === 'heal' || spec.kind === 'item') { if (t && t.side === 'ally') B.targetSet.add(tx + ',' + ty); }
      else if (spec.kind === 'aoe') { if (this.terrainAt(tx, ty) !== 'M') B.targetSet.add(tx + ',' + ty); }
    }
    if (B.targetSet.size === 0) { B.pendingSkill = null; return; }
    B.mode = 'target';
    document.getElementById('tx-menu').innerHTML = '<h4>選擇目標(點空格取消)</h4>';
    this.renderBoard();
  },
  cancelToMenu() {
    const B = this.B;
    B.mode = 'menu'; B.targetSet = null; B.pendingSkill = null;
    this.renderBoard(); this.showActionMenu();
  },

  executeAction(x, y) {
    const B = this.B, u = B.sel, spec = B.pendingSkill;
    const target = this.unitAt(x, y);
    B.busy = true; B.mode = 'anim'; B.targetSet = null;
    this.renderBoard();
    const done = () => { B.busy = false; this.finishAction(); };
    if (spec.kind === 'attack') {
      this.strike(u, target, 1.0, false, done);
    } else if (spec.kind === 'item') {
      B.potions--; TxSave.load(); TxSave.data.potions = B.potions; TxSave.save();
      const amt = Math.min(POTION_HEAL, target.maxHp - target.hp);
      target.hp += amt;
      this.log(`${target.name} 使用藥水回復 ${amt}`, 'ally');
      this.renderBoard(); this.fxHeal(x, y); this.floatText(x, y, '+' + amt, '#7FE0B0');
      setTimeout(done, 460);
    } else if (spec.kind === 'heal') {
      u.mp -= spec.skill.mp;
      const amt = Math.min(spec.skill.amount, target.maxHp - target.hp);
      target.hp += amt;
      this.log(`${u.name} 施放 ${spec.skill.name},${target.name} 回復 ${amt}`, 'ally');
      this.renderBoard(); this.fxHeal(x, y); this.floatText(x, y, '+' + amt, '#7FE0B0');
      setTimeout(done, 460);
    } else if (spec.kind === 'skill') {
      u.mp -= spec.skill.mp;
      this.log(`${u.name} 施放 ${spec.skill.name}!`, 'ally');
      this.strike(u, target, spec.skill.mult, !!spec.skill.ignoreDef, () => {
        if (spec.skill.stun && target.alive) {
          target.stun = spec.skill.stun + 1;
          this.log(`${target.name} 陷入暈眩`, 'sys');
          this.floatText(target.x, target.y, '暈眩!', '#D9A441');
          this.renderBoard();
        }
        done();
      });
    } else if (spec.kind === 'aoe') {
      u.mp -= spec.skill.mp;
      this.log(`${u.name} 施放 ${spec.skill.name}!`, 'ally');
      this.fxProjectile(u.x, u.y, x, y, () => {
        this.fxScreenFlash('rgba(255,140,70,.3)');
        this.fxRing(x, y, '#FF9040');
        this.fxSparks(x, y, '#FFB070', 11);
        this.fxShake(true);
        const area = [[x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        let hit = 0;
        for (const [ax, ay] of area) {
          const t = this.unitAt(ax, ay);
          if (t && t.side === 'foe') { this.dealDamage(u, t, spec.skill.mult, false); hit++; }
        }
        if (!hit) { this.log('星隕落空,無人命中', 'sys'); this.renderBoard(); }
        setTimeout(done, 420);
      });
    }
  },
  finishAction() {
    const B = this.B, u = B.sel;
    if (u) u.acted = true;
    B.mode = 'idle'; B.sel = null; B.targetSet = null; B.pendingSkill = null; B.prevPos = null;
    const m = document.getElementById('tx-menu'); if (m) m.innerHTML = '';
    this.renderBoard(); this.renderInfo();
    if (this.checkBattleEnd()) return;
    if (B.units.filter(v => v.side === 'ally' && v.alive && v.stun <= 0).every(v => v.acted)) this.endAllyPhase();
  },

  /* ── 敵方 AI ── */
  endAllyPhase() {
    const B = this.B;
    B.busy = true; B.phase = 'foe'; B.mode = 'idle'; B.sel = null;
    const m = document.getElementById('tx-menu'); if (m) m.innerHTML = '';
    this.log(`灰鴉團回合 ${B.turn}`, 'foe');
    this.fxBanner('灰鴉團行動', 'var(--tx-foe)');
    this.renderBoard();
    const foes = B.units.filter(u => u.side === 'foe' && u.alive);
    let i = 0;
    const step = () => {
      if (this.checkBattleEnd()) return;
      if (i >= foes.length) return this.endFoePhase();
      const e = foes[i++];
      if (!e.alive) return step();
      if (e.stun > 0) { e.stun--; this.log(`${e.name} 暈眩中,無法行動`, 'sys'); this.renderBoard(); return setTimeout(step, 420); }
      this.actEnemy(e, () => { if (this.checkBattleEnd()) return; setTimeout(step, 200); });
    };
    setTimeout(step, 700);
  },
  actEnemy(e, done) {
    const B = this.B;
    const players = B.units.filter(u => u.side === 'ally' && u.alive);
    if (!players.length) { done(); return; }
    const moveSet = this.calcMoveSet(e);
    moveSet.add(e.x + ',' + e.y);
    let best = null;
    for (const k of moveSet) {
      const [mx, my] = k.split(',').map(Number);
      for (const p of players) {
        const d = this.manh(mx, my, p.x, p.y);
        if (d >= e.rng[0] && d <= e.rng[1]) {
          const terr = this.TERRAIN[this.terrainAt(p.x, p.y)];
          const dmg = Math.max(1, Math.round(e.atk - (p.def + terr.defB)));
          const kill = dmg >= p.hp ? 1 : 0;
          const score = kill * 1000 + dmg * 10 - p.hp * 0.1;
          if (!best || score > best.score) best = { mx, my, p, score };
        }
      }
    }
    if (best) {
      const moved = (e.x !== best.mx || e.y !== best.my);
      e.x = best.mx; e.y = best.my;
      if (moved) this.renderBoard();
      setTimeout(() => this.strike(e, best.p, 1.0, false, done), moved ? 220 : 60);
      return;
    }
    let near = players[0], nd = Infinity;
    for (const p of players) { const d = this.manh(e.x, e.y, p.x, p.y); if (d < nd) { nd = d; near = p; } }
    let mv = null, md = nd;
    for (const k of moveSet) {
      const [mx, my] = k.split(',').map(Number);
      const d = this.manh(mx, my, near.x, near.y);
      if (d < md) { md = d; mv = [mx, my]; }
    }
    if (mv) { e.x = mv[0]; e.y = mv[1]; this.log(`${e.name} 逼近`, 'foe'); this.renderBoard(); }
    setTimeout(done, 280);
  },
  endFoePhase() {
    const B = this.B;
    B.turn++;
    B.phase = 'ally'; B.busy = false;
    B.units.forEach(u => {
      if (u.side === 'ally' && u.alive) {
        u.acted = false;
        if (u.stun > 0) { u.stun--; if (u.stun > 0) u.acted = true; }
        u.mp = Math.min(u.maxMp, u.mp + 1);
      }
    });
    this.log(`我方回合 ${B.turn}`, 'ally');
    this.fxBanner('我方回合', 'var(--tx-ally)');
    this.renderBoard(); this.renderInfo();
  },

  /* ── 勝敗與結算(首勝解鎖輔助官+寶石) ── */
  checkBattleEnd() {
    const B = this.B; if (!B) return true;
    if (B.ended) return true;
    const foesLeft = B.units.some(u => u.side === 'foe' && u.alive);
    const lead = B.units.find(u => u.lead);
    const allyLeft = B.units.some(u => u.side === 'ally' && u.alive);
    if (!foesLeft) { B.ended = true; B.busy = true; setTimeout(() => this.showResult(true), 650); return true; }
    if (!lead.alive || !allyLeft) { B.ended = true; B.busy = true; setTimeout(() => this.showResult(false), 650); return true; }
    return false;
  },
  showResult(win) {
    const B = this.B, ch = B.ch;
    const firstClear = win && !TxSave.isCleared(ch.id);
    let astUnlockedNow = false;
    if (win) {
      if (firstClear) {
        TxSave.markCleared(ch.id);
        TacticsVault.grant(ch.firstGems);
        astUnlockedNow = unlockAssistant(ch.rewardAst);
      }
    }
    const lootRows = GEM_KEYS.filter(k => B.loot[k] > 0)
      .map(k => `<div class="r2"><span>${TacticsVault.iconHtml(k)}${GEM_INFO[k].name}(戰場拾獲)</span><span>×${B.loot[k]}</span></div>`).join('');
    const firstRows = firstClear
      ? GEM_KEYS.filter(k => ch.firstGems[k]).map(k => `<div class="r2"><span>${TacticsVault.iconHtml(k)}${GEM_INFO[k].name}(首勝獎勵)</span><span>×${ch.firstGems[k]}</span></div>`).join('')
        + `<div class="r2"><span style="color:#2ecc71">🤝 ${astUnlockedNow ? '解鎖輔助官' : '輔助官(已持有)'}</span><span style="color:#2ecc71">${esc(ch.astName)}</span></div>`
      : (win ? `<div class="r2"><span class="tx-tag">已通關戰役:僅保留戰場拾獲</span><span></span></div>` : '');
    const nextExists = win && TX_CHAPTERS[ch.id]; // ch.id 即下一章 index
    this.ensureLayer().innerHTML = `
      <div class="tx-result">
        <h2 class="${win ? 'win' : 'lose'}">${win ? '戰 線 捷 報' : '戰 線 失 守'}</h2>
        <div class="tx-rlist">
          ${win ? (lootRows || '<div class="r2"><span class="tx-tag">未拾獲寶石</span><span></span></div>') + firstRows
                : '<div class="r2"><span>貞德倒下了。撤回大會堂重整旗鼓吧——已入庫的拾獲不會遺失。</span></div>'}
          <div class="r2"><span><b>寶石庫現況</b></span><span>${TacticsVault.lineHtml()}</span></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
          ${win ? '' : '<button class="tx-primary" id="tx-retry">🔄 重整再戰</button>'}
          ${nextExists ? '<button class="tx-primary" id="tx-next">⚔ 下一戰</button>' : ''}
          <button id="tx-map">返回戰役地圖</button>
        </div>
      </div>`;
    const bind = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = () => { sfx(); fn(); }; };
    bind('tx-retry', () => this.showPrep());
    bind('tx-next', () => this.open(ch.id));
    bind('tx-map', () => { this.returnFromBattle(); });
    if (win) {
      const after = this.filterScript(ch.storyAfter);
      if (after.length) {
        const resultHtml = this.layer.innerHTML;
        this.showStory(after, () => { this.ensureLayer().innerHTML = resultHtml;
          bind('tx-retry', () => this.showPrep());
          bind('tx-next', () => this.open(ch.id));
          bind('tx-map', () => { this.returnFromBattle(); });
        });
      }
    }
  },

  /* ── 戰役地圖頁籤資料(供 storyMode 使用) ── */
  chapterListHtml() {
    const maxCh = TxSave.maxUnlockedChapter();
    return TX_CHAPTERS.map((ch, idx) => {
      const unlocked = ch.id <= maxCh;
      const cleared = TxSave.isCleared(ch.id);
      return `
        <button class="diff-opt-btn" ${unlocked ? '' : 'disabled'}
          style="text-align:left; padding:8px; display:flex; flex-direction:column; gap:3px;
                 opacity:${unlocked ? 1 : 0.25}; pointer-events:${unlocked ? 'auto' : 'none'};
                 border-color:${cleared ? '#2ecc71' : '#4a3a30'};"
          onclick="window.playUniformSfx && window.playUniformSfx(); window.TacticsMode.openFromMap(${idx})">
          <div style="font-weight:800; color:#ffe099; font-size:0.72rem;">第 ${ch.id} 戰 ${ch.name} ${cleared ? '✅' : ''}</div>
          <div style="font-size:0.55rem; color:#b8c0cc;">${ch.intro}</div>
          <div style="font-size:0.55rem; color:#2ecc71;">🎁 首勝:解鎖「${ch.astName}」+ 寶石獎勵</div>
        </button>`;
    }).join('');
  },
  openFromMap(idx) {
    const modal = document.getElementById('story-map-modal');
    if (modal) modal.classList.remove('show');
    this._returnTo = 'storymap';
    this.open(idx);
  },

  /* ── 城鎮樞紐接口 ── */
  isChapterCleared(id) { return TxSave.isCleared(id); },
  maxUnlockedChapter() { return TxSave.maxUnlockedChapter(); },
  openFromTown(idx) {
    this._returnTo = 'town';
    if (window.TownMode) window.TownMode.exit();  // 收起城鎮小地圖
    this.open(idx);
  },
  // 戰棋結束/返回:依來源決定回城鎮或回舊戰役地圖
  returnFromBattle() {
    this.close();
    if (this._returnTo === 'town' && window.TownMode) {
      window.TownMode.enter();
    } else if (window.StoryMode) {
      window.StoryMode.openStoryMapModal('tactics');
    }
  },

  /* 🏪 商店:寶石交易 + 部隊技能購買(從城鎮商店開啟) */
  openShop() {
    this._returnTo = 'town';
    let modal = document.getElementById('tx-shop-modal');
    const host = (window.TownMode && window.TownMode.ensureLayer)
      ? window.TownMode.ensureLayer() : (document.getElementById('stage') || document.body);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tx-shop-modal'; modal.className = 'town-modal';
      host.appendChild(modal);
    }
    this._shopTab = this._shopTab || 'skill';
    this.renderShop(modal);
    modal.classList.add('show');
  },
  renderShop(modal) {
    modal = modal || document.getElementById('tx-shop-modal');
    if (!modal) return;
    const v = TacticsVault.read();
    const costStr = cost => Object.entries(cost).map(([k, n]) => TacticsVault.iconHtml(k, '×' + n)).join(' ');
    const canPay = cost => Object.entries(cost).every(([k, n]) => (v[k] | 0) >= n);
    const tab = this._shopTab;

    // 技能區
    const nameOf = { joan: '貞德', hector: '赫克特', luna: '露娜' };
    const skillHtml = SKILL_SHOP.map((it, i) => {
      const s = SKILLS[it.skill];
      const owned = TxSave.hasSkill(it.unit, it.skill);
      return `<div class="tx-row">
        <span class="grow"><b style="color:var(--tx-ally)">${nameOf[it.unit]}</b>・${esc(s.name)}
          <span style="color:var(--tx-dim);font-size:0.55rem;">${esc(s.desc)}(MP${s.mp})</span></span>
        <span class="price">${costStr(it.cost)}</span>
        <button data-buy-skill="${i}" ${owned ? 'disabled' : (canPay(it.cost) ? '' : 'disabled')}>${owned ? '已學會' : '學習'}</button>
      </div>`;
    }).join('');

    // 寶石交易區(以匯率互換:任 3 顆同色 → 1 顆他色;簡單防呆)
    const gemName = { r: '紅', u: '藍', g: '綠', w: '白', k: '黑' };
    const tradeHtml = ['r', 'u', 'g', 'w', 'k'].map(from => `
      <div class="tx-row">
        <span class="grow">${TacticsVault.iconHtml(from)}${gemName[from]}寶石 ×3　→　換取:</span>
        <span style="display:flex;gap:3px;flex-wrap:wrap;">
          ${['r', 'u', 'g', 'w', 'k'].filter(t => t !== from).map(to =>
            `<button data-trade="${from}:${to}" ${(v[from] | 0) >= 3 ? '' : 'disabled'} style="padding:2px 6px;font-size:0.56rem;">${gemName[to]}</button>`
          ).join('')}
        </span>
      </div>`).join('');

    modal.innerHTML = `
      <div class="town-shop">
        <div class="town-world-head">
          <span>🏪 商店</span>
          <button class="town-x" onclick="document.getElementById('tx-shop-modal').classList.remove('show')">✕</button>
        </div>
        <div style="display:flex;gap:6px;padding:8px 10px 0;">
          <button class="diff-opt-btn ${tab === 'skill' ? 'active' : ''}" style="flex:1;${tab === 'skill' ? 'border-color:#ffcc00;' : ''}" onclick="window.TacticsMode._shopTab='skill';window.TacticsMode.renderShop()">⚔️ 部隊技能</button>
          <button class="diff-opt-btn ${tab === 'trade' ? 'active' : ''}" style="flex:1;${tab === 'trade' ? 'border-color:#ffcc00;' : ''}" onclick="window.TacticsMode._shopTab='trade';window.TacticsMode.renderShop()">💱 寶石交易</button>
        </div>
        <div class="town-shop-body">
          ${tab === 'skill'
            ? `<p class="tx-tag" style="margin:6px 0;">以寶石庫學習永久技能,學會後在戰場行動選單即可施放。</p>${skillHtml}`
            : `<p class="tx-tag" style="margin:6px 0;">同色 3 顆兌換任一他色 1 顆,調配鍛造與學技所需的顏色。</p>${tradeHtml}`}
        </div>
        <div class="town-world-foot">💎 寶石庫:<span id="tx-shop-vault">${TacticsVault.lineHtml()}</span></div>
      </div>`;

    modal.querySelectorAll('[data-buy-skill]').forEach(b => b.onclick = () => {
      const it = SKILL_SHOP[+b.dataset.buySkill];
      if (TxSave.hasSkill(it.unit, it.skill)) return;
      if (!TacticsVault.spend(it.cost)) return;
      TxSave.addSkill(it.unit, it.skill); sfx(); this.renderShop();
      if (window.TownMode) window.TownMode.updateVault();
    });
    modal.querySelectorAll('[data-trade]').forEach(b => b.onclick = () => {
      const [from, to] = b.dataset.trade.split(':');
      if ((TacticsVault.read()[from] | 0) < 3) return;
      if (!TacticsVault.spend({ [from]: 3 })) return;
      TacticsVault.grant({ [to]: 1 }); sfx(); this.renderShop();
      if (window.TownMode) window.TownMode.updateVault();
    });
  },
};
if (typeof window !== 'undefined') window.TacticsMode = TacticsMode;
