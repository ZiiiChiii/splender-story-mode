// core/storyEvents.js — 🏘️ 地圖內劇情事件(故事模式第三敘事線)
// 三線敘事的「黏合劑」:
//   ① 地圖事件(本檔):序幕甦醒、階段轉場、長老指引、任務佈告欄
//   ② 交易殿堂 → 主線桌遊 25 關(levelsData)
//   ③ 城鎮門口 → 戰棋 3 戰(tacticsMode)
// 設計原則:所有地圖事件皆為「單次演出 + 永不阻擋玩法」——
//   事件只在進城時依進度播一段,錯過順序也不會卡關;
//   長老與佈告欄隨時提供「下一步建議」,但玩家永遠可以自由選擇兩條線任一邊推進。
// 依賴:window.StoryDialog(共用劇情引擎)。立繪取自 TownMode / TacticsMode(載入前有保底)。

(function () {
  'use strict';

  const FLAG_KEY = 'splendor_story_events_2026';
  const MAIN_KEY = 'splendor_story_progress_2026';
  const TX_KEY = 'splendor_tactics_2026';

  /* ── 進度讀取(直接讀存檔,不依賴模組載入順序) ── */
  function mainProg() {
    try {
      const d = JSON.parse(localStorage.getItem(MAIN_KEY) || '{}');
      return {
        maxUnlockedLevel: d.maxUnlockedLevel || 1,
        cleared: Array.isArray(d.clearedLevels) ? d.clearedLevels : []
      };
    } catch (e) { return { maxUnlockedLevel: 1, cleared: [] }; }
  }
  function txCleared() {
    try {
      const d = JSON.parse(localStorage.getItem(TX_KEY) || '{}');
      return Array.isArray(d.cleared) ? d.cleared : [];
    } catch (e) { return []; }
  }
  function flags() {
    try { return JSON.parse(localStorage.getItem(FLAG_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function markSeen(id) {
    const f = flags(); f[id] = true;
    try { localStorage.setItem(FLAG_KEY, JSON.stringify(f)); } catch (e) {}
  }

  /* ── 立繪來源(全部有保底,模組未載入時顯示純對話) ── */
  const P = {
    hero()  { return (window.TownMode && window.TownMode.heroPortraitURL)  ? { img: window.TownMode.heroPortraitURL(),  pixel: true } : {}; },
    elder() { return (window.TownMode && window.TownMode.elderPortraitURL) ? { img: window.TownMode.elderPortraitURL(), pixel: true } : {}; },
    cast(who, side) {
      return (window.TacticsMode && window.TacticsMode.portraitOf)
        ? window.TacticsMode.portraitOf(who, side || 'ally') : {};
    }
  };
  const heroLine  = (text, mood) => Object.assign({ who: '你', side: 'ally', text, mood }, P.hero());
  const elderLine = (text, mood) => Object.assign({ who: '長老 艾德溫', side: 'ally', text, mood }, P.elder());
  const castLine  = (who, side, text, mood) => Object.assign({ who, side, text, mood }, P.cast(who, side));
  const narr      = (text) => ({ who: '', side: 'n', text });

  /* ══════════ 地圖劇情事件(依序檢查,一次進城最多播一段) ══════════ */
  const EVENTS = [
    {
      id: 'intro',
      cond: () => true,
      headline: '序幕・陌生的甦醒',
      subline: '微光村・廣場水池邊',
      // 甦醒演出:主角被擺到水池邊(格中心,避開長老所在的阻擋格)
      place: { x: 5.5, y: 10.4 },
      script: () => [
        narr('冰涼的水氣拂過臉頰。你在一陣劇烈的頭暈中睜開眼——陌生的天空、陌生的村莊,而你想不起自己是誰、從哪裡來。'),
        narr('身邊的草地上,散落著幾顆五色的寶石碎屑。你下意識握住其中一顆——'),
        heroLine('唔……!這是……力量?寶石在……回應我?', 'shout'),
        narr('掌心傳來暖流,暈眩竟一掃而空。碎屑的光沒入你的皮膚,像認了主。'),
        elderLine('孩子,醒了?昨夜是我把你從水池邊挪開的——你倒下的地方,寶石碎屑排成了一個圈。老朽活了七十年,只在傳說裡聽過這種「寶石共鳴」。'),
        elderLine('這裡是微光村。別看名字亮,村子窮得很——後山的礦坑出了事,商路也斷了,能離開的人都離開了。'),
        elderLine('但你不一樣。有共鳴天賦的人,做交易是天生的好手。去廣場北邊的「寶石交易殿堂」找內政官傑洛米吧,先讓自己活下去——之後的事,之後再說。'),
        heroLine('……好。寶石交易殿堂,傑洛米。至少,先弄清楚我能做什麼。')
      ]
    },
    {
      id: 'mine_call',
      // 主線第 3 關(赫克特的黑曜石封鎖)通關後 → 揭露礦坑真相,引導出城(戰棋第 1 戰)
      cond: () => mainProg().cleared.includes(3) && !txCleared().includes(1),
      headline: '第一戰前夜・礦坑的真相',
      subline: '微光村・廣場',
      script: () => [
        narr('你替赫克特截下黑曜石產業的隔天清晨,守備隊長披甲佩盾,和長老一起在廣場上等你。'),
        castLine('赫克特', 'ally', '查清楚了。市面上根本不是「缺貨」——後山紅岩礦道被灰鴉傭兵團武裝佔據,黑曜石全被扣在裡面!'),
        elderLine('果然……礦坑,就是微光村貧窮的病根啊。礦一斷,鐵匠鋪熄火、商隊繞路,這村子才一年年枯下去。', 'sad'),
        castLine('赫克特', 'ally', '守備隊人手不足,正面強攻是送死。但你不同——聖女貞德與占星師露娜都願意聽你調度,加上我的盾,足以清出一條路!'),
        heroLine('這座村子收留了不知來歷的我。奪回礦坑,就當是我付的房租——赫克特,整隊吧!', 'shout'),
        elderLine('去「城鎮門口」出城,世界地圖上就能看到紅岩礦坑。用交易殿堂賺來的寶石,先去商店把裝備鍛一鍛——商人的仗,要打得比誰都精。')
      ]
    },
    {
      id: 'mine_won',
      cond: () => txCleared().includes(1),
      headline: '凱旋・重新運轉的礦車',
      subline: '微光村・廣場',
      script: () => [
        narr('礦道奪回的當天下午,第一台礦車就重新滾出了後山。村民圍在廣場上,好些人哭了。'),
        elderLine('聽,礦車的聲音……老朽多少年沒聽到了。孩子,微光村欠你一份天大的人情。', 'happy'),
        castLine('露娜', 'ally', '不過有件事很怪——傭兵團的委託書上,蓋的是首都商會的火漆印。一群「商人」,花大錢僱傭兵佔一座小村的礦?'),
        heroLine('封鎖市場的黑手、佔礦的「客戶」……這兩條線,八成是同一條。收好那份委託書,線索總有用上的一天。'),
        elderLine('嗯,首都的水深,急不得。眼下先把生意做大——交易殿堂裡,橡木鎮那邊的邀約已經到了。')
      ]
    },
    {
      id: 'granary_call',
      cond: () => mainProg().cleared.includes(6) && !txCleared().includes(2),
      headline: '警訊・橡木鎮的夜',
      subline: '微光村・廣場',
      script: () => [
        narr('入夜,一名騎快馬的信使衝進村口,馬背上插著橡木鎮的軍旗。'),
        castLine('赫克特', 'ally', '亞瑟子爵的急件——灰鴉傭兵團的黑影正朝橡木鎮糧倉集結,就在今夜!他點名要你帶隊馳援。'),
        heroLine('糧倉一燒,橡木鎮的商路就斷了……和礦坑是同一個手法。這群灰鴉,背後的「客戶」胃口不小。'),
        elderLine('商路是活水,斷一條,枯一片。孩子,從城鎮門口出發吧——橡木鎮的糧倉,拜託你了。')
      ]
    },
    {
      id: 'granary_won',
      cond: () => txCleared().includes(2),
      headline: '線索・被掐住的商脈',
      subline: '微光村・廣場',
      script: () => [
        narr('糧倉保住了。回村的路上,露娜攤開星盤,眉頭越皺越緊。'),
        castLine('貞德', 'ally', '礦道、糧倉……有人在「系統性」地掐斷這一帶的商脈。這不是劫掠,是戰略。'),
        castLine('露娜', 'ally', '星盤指向邊境森林。下一步,他們會對商隊必經的林道下手——而且是主力盡出。'),
        heroLine('那就繼續往前。生意做到哪,我們就守到哪——遲早,會在盡頭見到那位「客戶」本人。', 'shout')
      ]
    },
    {
      id: 'forest_call',
      cond: () => mainProg().cleared.includes(14) && !txCleared().includes(3),
      headline: '決戰前夕・燃燒的森林',
      subline: '微光村・廣場',
      script: () => [
        narr('邊境傳來戒嚴的消息——萊戈拉斯封鎖林道、只給商人 16 回合的那道命令,起因正是灰鴉主力壓境。'),
        castLine('赫克特', 'ally', '礦道、糧倉、林道——三筆帳,是時候一次算清了。這回連傭兵首領都親自壓陣!'),
        castLine('露娜', 'ally', '星象顯示「破軍臨西」……翻譯:是場硬仗,但贏面在我們。出發前記得去商店補裝,別省那幾顆寶石~', 'happy'),
        heroLine('打贏這仗,灰鴉的翅膀就折了。走,去城鎮門口——邊境森林,終局之戰!', 'angry')
      ]
    },
    {
      id: 'forest_won',
      cond: () => txCleared().includes(3),
      headline: '折翼・指向首都的影子',
      subline: '微光村・廣場',
      script: () => [
        narr('灰鴉傭兵團主力潰散,首領被擒。臨走前,他咳著血留下了最後一句話——「僱我們的火漆印上,有一把影刃」。'),
        castLine('貞德', 'ally', '影刃……首都……前線能做的,我們都做完了。剩下的戰場,不在森林,而在大會堂的談判桌上。'),
        heroLine('那正好是我的主場。夥伴們守住了刀劍的戰線,接下來——換我用交易,把那位「大人物」逼出陰影。', 'shout'),
        elderLine('去吧,孩子。首都的宮廷商戰步步殺機,但老朽相信:能與寶石共鳴的人,不會迷路。')
      ]
    },
    {
      id: 'arc2_call',
      // 第二部開幕:灰鴉篇打完 + 主線第 7 關(查理曼警告眼線)通關 → 黑市告急
      cond: () => txCleared().includes(3) && mainProg().cleared.includes(7) && !txCleared().includes(4),
      headline: '第二部・影盟篇 開幕',
      subline: '微光村・廣場',
      script: () => [
        narr('深夜,一隻信鴿撞進長老家的窗——腳環上綁著查理曼的暗號密信,字跡潦草得反常。'),
        elderLine('黑市之主親筆求援,這可是頭一遭……信上說:灰鴉的殘黨回來了,還帶著一批「影子一樣」的新同伴。'),
        castLine('露娜', 'ally', '影子……火漆印上的影刃!長老,那不是傭兵——恐怕是拿契約殺人的職業結社,終於自己走到檯面上了。'),
        heroLine('灰鴉只是爪子,現在露出來的才是獠牙。整隊——去城鎮門口出城,黑市暗巷,會一會這群「影子」。', 'shout')
      ]
    },
    {
      id: 'shade_debut',
      cond: () => txCleared().includes(4),
      headline: '情報・雙頭鷹與天秤',
      subline: '微光村・廣場',
      script: () => [
        narr('黑市巷戰翌日,查理曼的回禮送到:一枚拓印下來的火漆——雙頭鷹咬著天秤。'),
        castLine('貞德', 'ally', '「影盟」,拿契約殺人的結社;而這枚家徽,屬於首都商會的巨頭。礦坑到黑市,所有的線,都繫在同一隻手上。'),
        heroLine('那隻手很快就要縮回大會堂了。前線交給夥伴,談判桌交給我——兩條路,一起往首都逼近。'),
        elderLine('熔爐、要塞、首都……接下來每一站都是硬仗。孩子,佈告欄會幫你記著兩邊的進度,別衝過頭,也別忘了回村歇口氣。')
      ]
    },
    {
      id: 'hq_call',
      // 影盟主力覆滅(碼頭戰後) + 主線第 21 關(禁運)通關 → 直搗總壇
      cond: () => txCleared().includes(9) && mainProg().cleared.includes(21) && !txCleared().includes(10),
      headline: '決戰前夜・錢莊的暗門',
      subline: '微光村・廣場',
      script: () => [
        narr('禁運被你撐破的當晚,俘虜供出的位置得到了證實:首都地下的廢棄錢莊,就是影盟總壇。'),
        castLine('赫克特', 'ally', '巨頭在明處用禁運困你,影盟在暗處磨刀。拔掉總壇,他就只剩檯面上那一條路可走了。'),
        castLine('露娜', 'ally', '星象「將星壓垣」——一戰定音的格局。把鍛造和藥水補滿,統領寇克斯不是善茬。'),
        heroLine('九筆帳收到現在,就差這最後一筆。出發——影盟總壇,結案!', 'angry')
      ]
    },
    {
      id: 'hq_won',
      cond: () => txCleared().includes(10),
      headline: '影落・前線的凱歌',
      subline: '微光村・廣場',
      script: () => [
        narr('影盟覆滅的消息傳回微光村時,鐘樓的鐘被敲了整整十下——一戰一響。'),
        castLine('貞德', 'ally', '從紅岩礦坑到影盟總壇,十場戰役,前線的仗打完了。剩下的敵人,只會坐在談判桌對面。'),
        elderLine('刀劍能守住商路,但能讓商路活起來的,終究是交易。孩子,大會堂的最後幾張桌子,去把它們贏下來。', 'happy'),
        heroLine('夥伴們用十場勝仗把路鋪到了大會堂門口。最後一段——換我上桌。', 'shout')
      ]
    },
    {
      id: 'shadow_reveal',
      cond: () => mainProg().cleared.includes(18),
      headline: '真相・影刃折斷之後',
      subline: '微光村・廣場',
      script: () => [
        narr('你在首都擊敗了影刃刺客澤德的消息,連夜傳回微光村。廣場上,長老為你斟了一杯熱茶。'),
        elderLine('火漆印上的影刃,就是那個刺客;而他背後,是畏懼你崛起的首都商會巨頭們……礦坑、糧倉、森林,兜兜轉轉,原來根在首都。'),
        heroLine('他們用傭兵和刺客做生意,我用寶石和信譽。現在影刃斷了,巨頭們只剩最後一道門——皇家大會堂。'),
        elderLine('王座就在前方了,孩子。微光村永遠是你回得來的地方——去,把至尊的冠冕拿回來給大家看看!', 'shout')
      ]
    },
    {
      id: 'finale',
      cond: () => mainProg().cleared.includes(25),
      headline: '尾聲・璀璨至尊的故鄉',
      subline: '微光村・廣場',
      script: () => [
        narr('加冕禮的鐘聲傳遍王國。而新任璀璨至尊做的第一件事,是騎馬回到微光村——回到一切開始的水池邊。'),
        elderLine('哈哈,至尊陛下親臨,老朽該行什麼禮才好?……瞧,礦車在跑、商隊在排隊、鐵匠鋪的火沒熄過——這都是你帶回來的。', 'happy'),
        castLine('貞德', 'ally', '從水池邊的無名旅人,到皇家大會堂的至尊。這一路,是你的傳奇——也是我們所有人的。'),
        heroLine('不。傳奇的不是我,是願意把寶石交到一個陌生人手裡的你們。——微光村,以後就是至尊的直轄商都了,做好發財的準備吧!', 'happy'),
        narr('—— 商道戰役・主線 完 ——(交易殿堂與戰線仍可自由重返挑戰)')
      ]
    }
  ];

  /* ══════════ 對外介面 ══════════ */
  const StoryEvents = {
    /* 進城時檢查:播放第一個「條件成立且未看過」的事件(一次一段,不疊播) */
    onTownEnter() {
      if (!window.StoryDialog) return;
      const f = flags();
      for (const ev of EVENTS) {
        if (f[ev.id] || !ev.cond()) continue;
        // 甦醒事件:先把主角擺到指定位置(水池邊)
        if (ev.place && window.TownMode) {
          window.TownMode.px = ev.place.x; window.TownMode.py = ev.place.y;
          window.TownMode.facing = 'down';
        }
        // 略延遲,讓城鎮先畫出第一幀作為劇情背景
        setTimeout(() => {
          window.StoryDialog.play({
            headline: ev.headline, subline: ev.subline,
            script: ev.script(),
            onDone: () => markSeen(ev.id)
          });
        }, 260);
        return true;
      }
      return false;
    },

    /* 是否還有待播事件(供長老頭上「❕」提示;每秒快取一次,避免逐幀讀存檔) */
    _pendCache: { t: 0, v: false },
    hasPending() {
      const now = Date.now();
      if (now - this._pendCache.t > 1000) {
        const f = flags();
        this._pendCache = { t: now, v: EVENTS.some(ev => !f[ev.id] && ev.cond()) };
      }
      return this._pendCache.v;
    },

    /* 下一步建議(長老與佈告欄共用的導航邏輯,雙線皆通、永不卡關)
       每場戰線戰役都有「建議先通關的主線關卡」:主線進度到位且該戰未打 → 建議出城;
       否則建議繼續殿堂。戰線解鎖本身只依序(前一戰通關即開),提示僅是最舒適的節奏。 */
    _txPlan: [
      { ch: 1,  rec: 3,  name: '紅岩礦坑',   text: '灰鴉佔據了紅岩礦坑——率隊奪回微光村的命脈' },
      { ch: 2,  rec: 6,  name: '橡木鎮糧倉', text: '橡木鎮糧倉今夜將遭夜襲——出城馳援' },
      { ch: 3,  rec: 14, name: '邊境森林',   text: '灰鴉主力壓境邊境森林——與首領決一死戰' },
      { ch: 4,  rec: 7,  name: '黑市暗巷',   text: '查理曼的黑市遭影盟襲擊——清剿暗巷' },
      { ch: 5,  rec: 8,  name: '火山熔爐',   text: '影盟要熄滅瓦肯的熔爐——守住軍備命脈' },
      { ch: 6,  rec: 12, name: '傀儡工房',   text: '鍊金傀儡被咒印駭走——助帕拉塞爾斯奪回核心' },
      { ch: 7,  rec: 13, name: '地底金庫',   text: '重甲衛正在劫掠索林的金庫——地底攔截' },
      { ch: 8,  rec: 16, name: '首都下水道', text: '神秘貨箱正運進大會堂地基——潛入攔截' },
      { ch: 9,  rec: 19, name: '王港碼頭',   text: '影盟傾巢突襲麥哲倫船隊——暴雨夜護航' },
      { ch: 10, rec: 21, name: '影盟總壇',   text: '直搗廢棄錢莊地下的影盟總壇——終結影刃' },
    ],
    nextHint() {
      const m = mainProg(), t = txCleared();
      if (!m.cleared.includes(1)) return { where: 'hall', text: '前往「寶石交易殿堂」找內政官傑洛米,用一場交易證明你的本事(主線第 1 關)。' };
      // 找出第一場未通關的戰線戰役;若已解鎖且主線建議進度到位 → 建議出城
      for (const p of this._txPlan) {
        if (t.includes(p.ch)) continue;
        const unlocked = p.ch === 1 || t.includes(p.ch - 1);
        if (unlocked && m.cleared.includes(p.rec)) {
          return { where: 'gate', text: `${p.text}(從「城鎮門口」出城 → ${p.name},戰線第 ${p.ch} 戰)。` };
        }
        break; // 未解鎖或主線未到 → 回頭建議殿堂
      }
      if (!m.cleared.includes(25)) {
        // 找出已解鎖但未通關的最小主線關卡
        let next = 1;
        for (let i = 1; i <= 25; i++) { if (!m.cleared.includes(i)) { next = i; break; } }
        if (next > m.maxUnlockedLevel) next = m.maxUnlockedLevel;
        return { where: 'hall', text: `前往「寶石交易殿堂」繼續商道戰役(建議挑戰第 ${next} 關)。戰線與殿堂可自由穿插進行。` };
      }
      return { where: 'done', text: '主線與戰線皆已完成!交易殿堂與世界地圖仍可自由重返,鍛造你的至尊商道。' };
    },

    /* 與長老交談(可重複,依進度給指引 + 一句閒談) */
    talkToElder() {
      if (!window.StoryDialog) return;
      const hint = this.nextHint();
      const m = mainProg(), t = txCleared();
      const chat =
        t.includes(10) ? '影盟覆滅那晚的十響鐘聲,老朽一輩子忘不了。前線太平了,剩下的路,好好走。' :
        t.includes(4) ? '連職業刺客都被你們打退了……孩子,老朽現在只擔心巨頭狗急跳牆,凡事多帶夥伴。' :
        t.includes(3) ? '灰鴉折翼之後,商隊夜裡也敢趕路了。這都是你們打出來的太平。' :
        t.includes(1) ? '礦車又跑起來了。老朽每天光聽那聲音,就能多吃一碗飯。' :
        m.cleared.includes(1) ? '傑洛米那張嘴雖毒,心是熱的——他到處跟人誇你呢,別說是老朽說的。' :
        '寶石共鳴是天賦,更是責任。老朽相信,你會用它走出一條好路。';
      window.StoryDialog.play({
        headline: '長老 艾德溫',
        subline: '微光村・廣場',
        script: [ elderLine(chat), elderLine('【指引】' + hint.text) ],
        canSkip: false
      });
    },

    /* 任務佈告欄(可重複):進度總覽 + 下一步 */
    openBoard() {
      if (!window.StoryDialog) return;
      const m = mainProg(), t = txCleared();
      const mainDone = m.cleared.filter(x => x >= 1 && x <= 25).length;
      window.StoryDialog.play({
        headline: '📋 任務佈告欄',
        subline: '微光村・廣場',
        script: [
          narr(`【商道戰役・主線】已通關 ${mainDone} / 25 關,目前開放至第 ${Math.min(25, m.maxUnlockedLevel)} 關(寶石交易殿堂)。`),
          narr(`【戰線戰役・次線】已通關 ${t.length} / 10 戰(城鎮門口・世界地圖)。第一部・灰鴉篇(1-3)、第二部・影盟篇(4-10)。主線通關可獲寶石庫獎勵,供戰線鍛造與學技。`),
          narr('【下一步】' + this.nextHint().text)
        ],
        canSkip: false
      });
    },

    /* ══════════ 📖 旅人手記:劇情回顧(地圖道具,可重複開啟) ══════════
       列出「已完成」的三類劇情,點選即以劇情引擎完整重播:
       ・城鎮劇情事件(已看過的段落)
       ・主線章節(已通關關卡的旁白鋪陳+委託人對話)
       ・戰線戰役(已通關戰役的戰前+戰後完整劇本,含當時因進度未播的回聲台詞) */
    openRecap() {
      const flagsNow = flags(), m = mainProg(), t = txCleared();
      let modal = document.getElementById('story-recap-modal');
      if (modal) modal.remove();
      modal = document.createElement('div');
      modal.id = 'story-recap-modal';
      modal.style.cssText = 'position:absolute; inset:0; z-index:99990; display:flex; align-items:center; justify-content:center; background:rgba(8,10,14,0.72); backdrop-filter:blur(2px);';

      const row = (title, sub, onclick, idx) =>
        `<button data-recap="${idx}" style="display:flex; align-items:center; gap:8px; width:100%; text-align:left; padding:7px 10px; margin-bottom:4px; background:rgba(30,39,49,0.85); border:1px solid rgba(217,164,65,0.25); border-radius:6px; color:#EAE4D6; cursor:pointer; font-family:inherit;">
           <span style="flex:1; min-width:0;"><span style="display:block; font-size:0.72rem; font-weight:700; color:#F0D89A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</span>
           <span style="display:block; font-size:0.6rem; color:#9AA3AD;">${sub}</span></span><span style="color:#D9A441;">▶</span></button>`;
      const section = (t2) => `<div style="font-size:0.68rem; font-weight:800; color:#D9A441; margin:8px 0 5px; border-bottom:1px dashed rgba(217,164,65,0.3); padding-bottom:2px;">${t2}</div>`;

      // 蒐集可回顧項目(index → 重播函式)
      const plays = [];
      let listHtml = '';

      // 1) 城鎮劇情事件(依事件表順序,只列已看)
      const seenEvents = EVENTS.filter(ev => flagsNow[ev.id]);
      if (seenEvents.length) {
        listHtml += section(`🏘️ 城鎮劇情(${seenEvents.length} 段)`);
        seenEvents.forEach(ev => {
          listHtml += row(ev.headline, ev.subline || '微光村', null, plays.length);
          plays.push(() => window.StoryDialog.play({
            headline: ev.headline, subline: (ev.subline || '微光村') + '・回顧',
            script: ev.script(), canSkip: true, onDone: () => this.openRecap()
          }));
        });
      }

      // 2) 主線章節(已通關,依關卡序)
      const MS = window.STORY_MISSIONS || [];
      const clearedMain = m.cleared.filter(id => MS[id - 1]).sort((a, b) => a - b);
      if (clearedMain.length) {
        listHtml += section(`📜 商道戰役・主線(${clearedMain.length} / 25 關)`);
        clearedMain.forEach(id => {
          const ms = MS[id - 1];
          listHtml += row(`第 ${id} 關 ${ms.name}`, `委託人:${ms.speaker}`, null, plays.length);
          plays.push(() => window.StoryDialog.play({
            headline: `第 ${id} 關・${ms.name}`, subline: '寶石交易殿堂・回顧',
            script: [
              narr(ms.story),
              { who: ms.speaker, side: 'ally', img: ms.imgUrl, text: ms.dialogue }
            ],
            canSkip: true, onDone: () => this.openRecap()
          }));
        });
      }

      // 3) 戰線戰役(已通關,戰前+戰後完整劇本;回顧時不過濾回聲台詞)
      const CHS = (window.TacticsMode && window.TacticsMode.chapters) || [];
      const clearedTx = t.filter(id => CHS[id - 1]).sort((a, b) => a - b);
      if (clearedTx.length) {
        listHtml += section(`⚔️ 戰線戰役・次線(${clearedTx.length} / 10 戰)`);
        clearedTx.forEach(id => {
          const ch = CHS[id - 1];
          const dress = (line) => {
            if (!line.who || line.side === 'n') return { who: '', side: 'n', text: line.text };
            const p = (window.TacticsMode && window.TacticsMode.portraitOf)
              ? window.TacticsMode.portraitOf(line.who, line.side) : {};
            return Object.assign({ who: line.who, side: line.side, text: line.text, mood: line.mood }, p);
          };
          listHtml += row(`第 ${id} 戰 ${ch.name}`, ch.intro || '', null, plays.length);
          plays.push(() => window.StoryDialog.play({
            headline: `第 ${id} 戰・${ch.name}`, subline: '戰線戰役・回顧',
            script: [
              ...(ch.storyBefore || []).map(dress),
              narr('—— 戰鬥勝利之後 ——'),
              ...(ch.storyAfter || []).map(dress)
            ],
            canSkip: true, onDone: () => this.openRecap()
          }));
        });
      }

      if (!plays.length) {
        listHtml = `<div style="text-align:center; color:#9AA3AD; font-size:0.7rem; padding:18px 6px;">手記還是空白的。<br>完成劇情章節後,這裡會記下你走過的每一段路。</div>`;
      }

      modal.innerHTML = `
        <div style="width:min(440px, 92%); max-height:82%; display:flex; flex-direction:column; background:linear-gradient(180deg,#141A22,#0F141B); border:1px solid rgba(217,164,65,0.45); border-radius:10px; padding:14px; box-shadow:0 10px 40px rgba(0,0,0,0.6);">
          <div style="display:flex; align-items:center; margin-bottom:4px;">
            <div style="flex:1; font-size:0.9rem; font-weight:900; color:#F0D89A; letter-spacing:0.06em;">📖 旅人手記・劇情回顧</div>
            <button id="recap-close" style="background:none; border:1px solid rgba(217,164,65,0.4); color:#D9A441; border-radius:5px; padding:2px 10px; cursor:pointer; font-family:inherit; font-size:0.72rem;">關閉</button>
          </div>
          <div style="font-size:0.6rem; color:#9AA3AD; margin-bottom:6px;">點選任一段落,完整重溫劇情。</div>
          <div style="flex:1; overflow-y:auto; padding-right:2px;">${listHtml}</div>
        </div>`;

      // 掛到城鎮圖層(若在)或舞台,確保蓋在地圖上、又低於劇情引擎(z 99996)
      const host = document.getElementById('town-layer') || document.getElementById('stage') || document.body;
      host.appendChild(modal);
      modal.querySelector('#recap-close').onclick = () => modal.remove();
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
      modal.querySelectorAll('button[data-recap]').forEach(b => {
        b.onclick = () => {
          if (!window.StoryDialog) return;
          const fn = plays[+b.dataset.recap];
          modal.remove();
          if (fn) fn();
        };
      });
    }
  };

  window.StoryEvents = StoryEvents;
})();
