// core/missions/levelsData.js
// 📜 主線「商道戰役」劇本(重編版)
// 世界觀:你——一個在微光村水池邊醒來、能與寶石共鳴的無名旅人——
//   在「寶石交易殿堂」以交易手腕累積資源(桌遊主線),
//   再以資源鍛造夥伴、率隊出城迎戰灰鴉傭兵團(戰棋次線)。
// 貫穿全篇的暗線:封鎖市場、僱傭灰鴉的神秘「客戶」→ 火漆印上的「影刃」→ 第 18 關真相揭曉。
// ⚠️ 僅重寫 story / dialogue 文本;speaker、輔助官獎勵、setup、winCondition 全數維持原樣。

export const STORY_MISSIONS = [
  // ─── 第一章：微光村的石匠 (1-5 關) ───
  {
    id: 1,
    name: "初入礦脈",
    speaker: "內政官 傑洛米",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "依照長老艾德溫的指引，你推開了寶石交易殿堂的大門。水晶吊燈下，老內政官傑洛米放下油燈，上上下下打量著你這個身無分文、來歷不明的旅人。",
    dialogue: "沒看過你啊，小子。微光村窮得叮噹響，養不起不會做事的閒人。來，和我做一場交易——25 回合內拿下 15 分威望，讓我知道你的本事，也讓長老的眼光值回票價！",
    rewardAssistantId: "ast1",
    setup: {
      mode: "singlePlayer",
      turnLimit: 25,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "score_only", targetScore: 15 }
  },
  {
    id: 2,
    name: "稅率與翡翠",
    speaker: "財政卿 薇多莉亞",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "首戰告捷。你握著贏來的寶石，掌心竟微微發燙——它們像在回應你。消息傳進鎮公所，刻薄的財政卿薇多莉亞放下帳本，決定親自刁難這個崛起太快的外來者。",
    dialogue: "哼？傑洛米那老頭居然看好你？我的帳本只認實力。本季紅寶石被課了重稅——全程紅寶石籌碼不得超過 7 顆，照樣拿下 15 分給我看！",
    rewardAssistantId: "ast2",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_token_limit",
      targetScore: 15,
      limitTokenColor: "r",
      maxTokenAllowed: 7
    }
  },
  {
    id: 3,
    name: "鐵血的訂單",
    speaker: "鐵血騎士 赫克特",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "守備隊長赫克特為了新兵的重甲四處張羅黑曜石，市面上的貨源卻被人惡意封鎖得一乾二淨。他把最後的希望，押在你的「保密合約」上。",
    dialogue: "這封鎖絕不單純，背後一定有隻黑手！小子，用你的保留卡牌替我暗中截下 3 張產業，再湊足 15 分。事成之後，軍隊欠你的——連本帶利還！",
    rewardAssistantId: "ast3",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_reserve_buy",
      targetScore: 15,
      minReservedBuys: 3
    }
  },
  {
    id: 4,
    name: "聖光的試煉",
    speaker: "聖騎士 羅蘭德",
    imgUrl: "https://i.ibb.co/QvHvZZWc/image.png",
    story: "白璧聖堂修繕在即。監工的聖騎士羅蘭德聽聞你崛起得太快，懷疑其中摻了投機取巧的水分，決意親自檢驗你的成色。",
    dialogue: "光明不容虛假。這一局，皇家金庫不提供任何一枚黃金萬用籌碼——不靠僥倖，純憑實力拿下 15 分，我便承認你的心，和你手中的寶石一樣乾淨。",
    rewardAssistantId: "ast4",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 0 }
    },
    winCondition: { type: "score_only", targetScore: 15 }
  },
  {
    id: 5,
    name: "王后的深藍生辰",
    speaker: "璀璨王后 桂妮薇兒",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "微服出巡的桂妮薇兒王后在殿堂歇腳，恰好聽見鎮民對你的稱讚。她想看的不是一擲千金的豪賭，而是一個商人最紮實的基本功。",
    dialogue: "孩子，絢麗的頂級物業固然耀眼，但真正的大師，能讓五色原石各展其才。五種顏色的產業各收 2 張以上、達到 15 分——把這首「基礎寶石交響曲」，當作我的生辰賀禮吧。",
    rewardAssistantId: "ast5",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_color_balance",
      targetScore: 15,
      minCardsPerColor: 2
    }
  },

  // ─── 第二章：橡木鎮的崛起商賈 (6-10 關) ───
  {
    id: 6,
    name: "雄獅的胃口",
    speaker: "帝國雄獅 亞瑟",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "你的名聲越過山丘，傳進了橡木鎮。野心勃勃的亞瑟子爵舉辦了一場商賈晚宴——他的規矩很簡單：只留下手腳最快的人。",
    dialogue: "我的軍隊每天都在燒錢，慢吞吞的牛車給我滾出橡木鎮！20 回合、15 分——做得到，鎮上的商路任你走；做不到，現在就可以收拾行李了！",
    rewardAssistantId: "ast6",
    setup: {
      mode: "singlePlayer",
      turnLimit: 20,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "score_only", targetScore: 15 }
  },
  {
    id: 7,
    name: "暗夜的密盟",
    speaker: "密盟密使 查理曼",
    imgUrl: "https://i.ibb.co/nNSjxvvd/image.png",
    story: "深夜的暗巷裡，黑市之主查理曼攔住了你。他欣賞你的潛力，也給了你一句忠告：灰鴉的眼線遍布橡木鎮，招搖的錢袋，等於把匕首遞到敵人手上。",
    dialogue: "小傢伙，聽說亞瑟給了你特權？但在暗處走動，胃口太大只會撐死。全程隨身籌碼不得超過 6 顆，輕裝拿下 15 分——學會藏富，你才活得過這條街。",
    rewardAssistantId: "ast7",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_max_bag_limit",
      targetScore: 15,
      maxBagSizeEver: 6
    }
  },
  {
    id: 8,
    name: "火山重工的訂單",
    speaker: "傳奇鐵匠 瓦肯",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "傳奇鐵匠瓦肯正為皇家聖器熔鑄爐火，脾氣比爐膛還燙。低階的碎石卡片在他眼裡，連當燃料的資格都沒有。",
    dialogue: "別拿 Lv1 的破爛玩意來髒我的舖子！這一局，市面上只剩高級產業——純靠 Lv2、Lv3 湊足 15 分，我就替你的劍、你夥伴的甲，免費開一爐！",
    rewardAssistantId: "ast8",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      bannedLevels: ["lv1"],
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "score_only", targetScore: 15 }
  },
  {
    id: 9,
    name: "雙色協奏曲",
    speaker: "大提琴家 塞巴斯蒂安",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "宮廷樂長塞巴斯蒂安來到橡木鎮採風。他說，經商如奏樂：雜色即噪音，唯有極致的雙音，才配稱作藝術。",
    dialogue: "這一局，你名下只准出現黑與白（k 與 w）兩色產業，其餘顏色一張都不許收。用最純粹的雙色協奏拿下 15 分——讓我聽見寶石的和聲！",
    rewardAssistantId: "ast9",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_exclusive_colors",
      targetScore: 15,
      allowedColors: ["w", "k"]
    }
  },
  {
    id: 10,
    name: "沙漠商隊的門檻",
    speaker: "異域商賈 阿里",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "來自遙遠絲路的駱駝商隊在鎮外紮營。見過無數大風大浪的阿里，只相信一種語言——黃金。",
    dialogue: "花花綠綠的石頭打動不了我，年輕人。結算之時，手上還握著 4 枚以上的黃金、並拿下 15 分——做得到，我的駱駝與航路，從此為你敞開。",
    rewardAssistantId: "ast10",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_gold_reserve",
      targetScore: 15,
      requiredGoldOnHand: 4
    }
  },

  // ─── 第三章：巨石要塞的邊境商戰 (11-15 關) ───
  {
    id: 11,
    name: "占星師的金融風暴",
    speaker: "皇家占星師 露娜",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "你抵達邊境的巨石要塞。星象異變引發信用通膨，皇家占星師露娜果斷封鎖了銀行的實體籌碼——她似乎也想順便看看，傳聞中「能與寶石共鳴」的你，成色究竟如何。",
    dialogue: "星辰預示匱乏：每種普通籌碼的庫存都只剩 2 顆。用你累積的產業減免「空手套白狼」，拿下 15 分——讓我確認，星象沒有騙我。",
    rewardAssistantId: "ast11",
    setup: {
      mode: "singlePlayer",
      turnLimit: 25,
      initBank: { w: 2, u: 2, g: 2, r: 2, k: 2, o: 5 }
    },
    winCondition: { type: "score_only", targetScore: 15 }
  },
  {
    id: 12,
    name: "鍊金術的對決",
    speaker: "鍊金術師 帕拉塞爾斯",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "要塞的鍊金術師帕拉塞爾斯不信凡人的手腕，更不信什麼寶石共鳴。他造出一具自動精算的「鍊金傀儡」，要用冰冷的算式，碾碎你的直覺。",
    dialogue: "真理只存在於算式之中！我的傀儡會搶走每一張高價值的卡牌。來吧，在它將你吞噬之前，先拿到 15 分——證明血肉之軀，也配談交易！",
    rewardAssistantId: "ast12",
    setup: {
      mode: "vsAI",
      aiDifficulty: "normal",
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "beat_ai", targetScore: 15 }
  },
  {
    id: 13,
    name: "地下領主的黃金稅",
    speaker: "地下領主 索林",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "要塞地底的金庫王座上，矮人領主索林把玩著他的幸運數字。在他的地盤，「精準」比「富有」更值錢。",
    dialogue: "想在我的地盤發財？可以！但結算分數必須不多不少、剛剛好是 15 分——多一分都是對我幸運數字的侮辱，給我滾回去重來！",
    rewardAssistantId: "ast13",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "exact_score", targetScore: 15 }
  },
  {
    id: 14,
    name: "遊俠的森林限速",
    speaker: "精靈遊俠 萊戈拉斯",
    imgUrl: "https://i.ibb.co/QvHvZZWc/image.png",
    story: "邊境森林突遭敵襲——來的正是灰鴉傭兵團的主力。精靈遊俠萊戈拉斯下達戒嚴令封鎖林道，留給軍需商人的時間，轉瞬即逝。",
    dialogue: "戰爭不等人，人類。16 回合內湊齊軍需（15 分），否則林道對你永遠關閉。動作快——我的弦，已經拉滿了。",
    rewardAssistantId: "ast14",
    setup: {
      mode: "singlePlayer",
      turnLimit: 16,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "score_only", targetScore: 15 }
  },
  {
    id: 15,
    name: "聖女的奇蹟信譽",
    speaker: "聖女 貞德",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "戰火步步逼近要塞，人心惶惶。聖女貞德在前線振臂高呼——戰士需要每一顆實體寶石重鑄刀劍；而商人，是時候拿出「信譽」了。",
    dialogue: "把實體寶石全數留給前線！光靠你名下產業的減免，免費收購 3 張卡片、並達到 15 分——用你的信譽為我們撐起後方，這就是商人的聖戰！",
    rewardAssistantId: "ast15",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_free_buys",
      targetScore: 15,
      minFreeBuysRequired: 3
    }
  },

  // ─── 第四章：翡翠首都的宮廷商戰 (16-20 關) ───
  {
    id: 16,
    name: "外交官的引薦信",
    speaker: "帝國外交官 麥特尼",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "循著灰鴉背後「首都大人物」的線索，你來到翡翠首都。想進皇家大會堂必須先有引薦信，而外交官麥特尼不看錢袋——他只數你身後站著幾位貴族。",
    dialogue: "在首都，滿手銅臭是最下等的。去請 3 位貴族老爺為你的商號背書吧，分數我一個字都不在乎。辦到了，引薦信雙手奉上——順帶一句，大會堂裡的水，比你想的深。",
    rewardAssistantId: "ast16",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "nobles_count_only", targetNoblesCount: 3 }
  },
  {
    id: 17,
    name: "伯爵夫人的晚宴",
    speaker: "宮廷伯爵夫人 卡蜜拉",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "卡蜜拉伯爵夫人的晚宴是首都社交的頂點。她要的從來不是財富，而是戲劇性——最後一刻、同時綻放的雙重高潮。",
    dialogue: "平鋪直敘太無趣了。我要你在達成 15 分的那一回合，讓卡片得分與貴族拜訪同時觸發——那才叫真正璀璨的藝術！",
    rewardAssistantId: "ast17",
    setup: {
      mode: "singlePlayer",
      turnLimit: 26,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_combo_trigger",
      targetScore: 15,
      requireNobleAndCardPointsSameTurn: true
    }
  },
  {
    id: 18,
    name: "黑市刺客的截胡",
    speaker: "影刃刺客 澤德",
    imgUrl: "https://i.ibb.co/nNSjxvvd/image.png",
    story: "深夜，一柄淬毒短刃釘進你的房門——影刃刺客澤德的戰帖。你認得刃柄上的徽記：灰鴉委託書火漆印上的那把「影刃」。封鎖礦坑、夜襲糧倉、火燒森林的幕後「客戶」，終於親自出手了。",
    dialogue: "一路從微光村查到這裡，很能幹嘛。可惜，貴族們都被我「問候」過了，這一局你一分貴族分都拿不到——就讓你的商譽，連同那些線索，一起死在我的陰影裡！",
    rewardAssistantId: "ast18",
    setup: {
      mode: "vsAI",
      aiDifficulty: "hard",
      disableNoblesForPlayer: true,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "beat_ai", targetScore: 15 }
  },
  {
    id: 19,
    name: "新大陸的黃金潮",
    speaker: "大航海家 麥哲倫",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "你擊敗影刃的風聲未平，麥哲倫的船隊便滿載新大陸的財富返航，掀起新一輪壟斷狂潮。低階市場一夕崩盤，只剩巨鯨還游得動。",
    dialogue: "海洋帶來的財富超乎想像！小打小鬧的時代結束了——這局沒有 Lv1 卡片，拿下 20 分、外加 3 張 4 分以上的頂級物業，證明你配得上大航海的時代！",
    rewardAssistantId: "ast19",
    setup: {
      mode: "singlePlayer",
      turnLimit: 28,
      bannedLevels: ["lv1"],
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "high_score_and_tier3_count",
      targetScore: 20,
      requiredTier3CardsWithPoints4: 3
    }
  },
  {
    id: 20,
    name: "大文豪的末日劇本",
    speaker: "大文豪 莎士比亞",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "大文豪莎士比亞正在撰寫悲劇《資本崩盤》。為了取材，他把「命運詛咒」加在你的商號上——你的實體財富，將定期憑空蒸發。",
    dialogue: "悲劇才是永恆！每 5 回合，國庫就充公你 2 枚籌碼——這 2 分威望是我預付的稿費，拿去。在 20 回合內逆流而上達到 15 分，寫下你自己的史詩——或者，成為我筆下的素材！",
    rewardAssistantId: "ast20",
    setup: {
      mode: "singlePlayer",
      turnLimit: 20,
      tokenTaxInterval: 5,
      tokenTaxAmount: 2,
      initPlayerScore: 2
    },
    winCondition: { type: "score_only", targetScore: 15 }
  },

  // ─── 第五章：皇家大會堂的璀璨至尊 (21-25 關) ───
  {
    id: 21,
    name: "跨越階級的代價",
    speaker: "聖殿騎士團長 休",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "皇家大會堂近在眼前，聖殿騎士團長休卻落下了鐵閘。傳聞首都商會的巨頭們——「影刃」背後真正的客戶——畏懼你的崛起，慫恿他用全面禁運斬斷你的路。",
    dialogue: "聖殿金庫接管市場！這一局，銀行不再提供任何普通籌碼，你只能靠開局自帶的資金與保留卡牌換來的黃金運轉。拿下 18 分撐過禁運——王座前的最後一段路，我親自為你開。",
    rewardAssistantId: "ast21",
    setup: {
      mode: "singlePlayer",
      turnLimit: 25,
      initBank: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 5 }
    },
    winCondition: { type: "score_only", targetScore: 18 }
  },
  {
    id: 22,
    name: "先知的絕地殘局",
    speaker: "預言者 卡珊德拉",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "先知卡珊德拉攔在加冕之路上。她說她見過你的結局——一盤你早已輸掉的殘局，對手遙遙領先。她想知道，你敢不敢跟命運本身對賭。",
    dialogue: "命運已定：對手開局便握有 8 分與 4 張高階產業，你已步入絕地。逆風翻盤、擊敗它吧——撕碎這注定的悲劇，我就承認，連預言也會怕你。",
    rewardAssistantId: "ast22",
    setup: {
      mode: "vsAI",
      aiDifficulty: "expert",
      initAiScore: 8,
      initAiTier2Bonus: 4,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "beat_ai", targetScore: 15 }
  },
  {
    id: 23,
    name: "大魔導師的五色矩陣",
    speaker: "大魔導師 梅林",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "大魔導師梅林在大會堂中央布下元素結界。從你踏進首都的那天起，他就注意到你與寶石之間的共鳴——但至尊之位，不容任何一色偏廢。",
    dialogue: "寶石即元素。水火風雷土，偏廢一端者不配登頂。通關之時（20 分），你名下五色永久產量必須各達 3 以上——讓共鳴貫通五行，我便親手為你解開結界！",
    rewardAssistantId: "ast23",
    setup: {
      mode: "singlePlayer",
      turnLimit: 27,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_perfect_colors",
      targetScore: 20,
      requiredMinBonusAllColors: 3
    }
  },
  {
    id: 24,
    name: "至高女皇的鐵腕對決",
    speaker: "至高女皇 凱薩琳",
    imgUrl: "https://i.ibb.co/nNSjxvvd/image.png",
    story: "北方的至高女皇凱薩琳親臨大會堂。她不聽傳聞、不看奇蹟，只崇尚絕對的統治力——由她親手操控、毫無失誤的神級精算所體現。",
    dialogue: "朕的帝國建立在鐵與血之上。面對朕親自操控的神級 AI，展現你這輩子最完美、不容一絲差錯的每一個回合吧——贏了，朕便承認你有資格站上王座之前！",
    rewardAssistantId: "ast24",
    setup: {
      mode: "vsAI",
      aiDifficulty: "master",
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: { type: "beat_ai", targetScore: 15 }
  },
  {
    id: 25,
    name: "皇家大會堂的終極加冕",
    speaker: "璀璨至尊 大師",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "鐘聲響徹皇家大會堂。那個在微光村水池邊醒來、身無分文的旅人，如今站在王座之前；24 位曾與你交手、如今追隨你的夥伴列隊兩旁。王座之上，上一任璀璨至尊靜靜起身。",
    dialogue: "從陌生的甦醒，到礦坑、糧倉、森林與首都的風雲——你集結了所有人，也回答了寶石對你的呼喚。來吧：25 分威望、2 位貴族的見證——超越我，加冕為新的璀璨至尊！",
    rewardAssistantId: "ast25",
    setup: {
      mode: "singlePlayer",
      turnLimit: 25,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "master_final_challenge",
      targetScore: 25,
      targetNoblesCount: 2
    }
  }
];
