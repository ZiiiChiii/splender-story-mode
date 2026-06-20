// core/levels.js

export const STORY_MISSIONS = [
  // ─── 第一章：微光村的石匠 (1-5 關) ───
  {
    id: 1,
    name: "初入礦脈",
    speaker: "內政官 傑洛米",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "微光村的後山藏著廢棄的紅岩礦床。老內政官傑洛米提著油燈攔住你，不屑地看著你手中的劣質鑿子，要你證明基本的經商手段。",
    dialogue: "年輕人，這片紅岩礦不歡迎空有熱血的傻瓜。在 25 回合內拿到 15 分，我就承認你是個合格的學徒。",
    rewardAssistantId: "ast1", // 過關獎勵角色 ID
    setup: {
      mode: "singlePlayer",
      turnLimit: 25,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_only",
      targetScore: 15
    }
  },
  {
    id: 2,
    name: "稅率與翡翠",
    speaker: "財政卿 薇多莉亞",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "你帶著紅寶石敲開了鎮公所的大門。刻薄的財政卿薇多莉亞正為當季的綠寶石稅收發愁，她決定用高額的稅率刁難你這個外來者。",
    dialogue: "噢？聽說傑洛米看好你？但我的帳本只認實力。這局你的紅寶石籌碼被課了重稅，少用點紅寶石，拿到 15 分給我看！",
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
      maxTokenAllowed: 7 // 累積拿取/使用紅寶石籌碼必須少於 8 顆
    }
  },
  {
    id: 3,
    name: "鐵血的訂單",
    speaker: "鐵血騎士 赫克特",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "守備隊的赫克特騎士需要大量黑曜石來打造新兵的重甲。然而市場上的黑曜石被全面封鎖，你必須學會利用「保留契約」暗中囤積。",
    dialogue: "商會那群禿鷹把黑曜石的合約藏得死死的！小傢伙，用你的保密合約（保留卡牌）幫我截獲 3 張高級產業，軍隊少不了你的好處！",
    rewardAssistantId: "ast3",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_reserve_buy",
      targetScore: 15,
      minReservedBuys: 3 // 必須從保留區成功簽署收購至少 3 次
    }
  },
  {
    id: 4,
    name: "聖光的試煉",
    speaker: "聖騎士 羅蘭德",
    imgUrl: "https://i.ibb.co/QvHvZZWc/image.png",
    story: "地方教堂正要修繕白璧聖堂，聖騎士羅蘭德負責監督。他要求這批寶石必須色澤純淨，不允許任何投機取巧的黃金假人參雜其中。",
    dialogue: "光明不容虛假。聽聞你精通商道，但這一次，我不許你在交易中使用任何一枚投機的黃金籌碼。純靠實力來見我吧。",
    rewardAssistantId: "ast4",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 0 } // 強制黃金庫存為 0，禁止拿黃金
    },
    winCondition: {
      type: "score_only",
      targetScore: 15
    }
  },
  {
    id: 5,
    name: "王后的深藍生辰",
    speaker: "璀璨王后 桂妮薇兒",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "微光村迎來了微服出巡的桂妮薇兒王后。她聽聞了你的名聲，指名要見識一下五色俱全的「基礎寶石交響曲」，作為她的生辰賀禮。",
    dialogue: "絢麗的頂級物業固然耀眼，但真正的大師能把底層的基礎原石搭配得完美無瑕。孩子，讓我看看你的基本功。",
    rewardAssistantId: "ast5",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_color_balance",
      targetScore: 15,
      minCardsPerColor: 2 // 通關時 5 種顏色的卡片數量皆需 >= 2 張
    }
  },

  // ─── 第二章：橡木鎮的崛起商賈 (6-10 關) ───
  {
    id: 6,
    name: "雄獅的胃口",
    speaker: "帝國雄獅 亞瑟",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "橡木鎮的領主亞瑟子爵是一位野心勃勃的擴張主義者。他舉辦了一場商賈晚宴，限時讓所有人交出成績單，只有最快拿到分數的人才能留下。",
    dialogue: "我的軍隊每天都在燒錢，商會不需要慢吞吞的牛車！20 回合內拿不下 15 分的人，就給我滾出橡木鎮！",
    rewardAssistantId: "ast6",
    setup: {
      mode: "singlePlayer",
      turnLimit: 20, // 嚴格 20 回合限制
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_only",
      targetScore: 15
    }
  },
  {
    id: 7,
    name: "暗夜的密盟",
    speaker: "密盟密使 查理曼",
    imgUrl: "https://i.ibb.co/nNSjxvvd/image.png",
    story: "黑市的影子統治者查理曼在暗巷攔住了你。他看中了你的潛力，但也警告你，手上的財富太過招搖會引來殺身之禍，必須輕裝上陣。",
    dialogue: "小傢伙，聽說亞瑟給了你特權？但在黑市，胃口太大只會撐死。把你的隨身錢包縮小，拿滿 15 分給我看看。",
    rewardAssistantId: "ast7",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_max_bag_limit",
      targetScore: 15,
      maxBagSizeEver: 6 // 任何回合結束時，背包籌碼總數不得超過 6 顆
    }
  },
  {
    id: 8,
    name: "火山重工的訂單",
    speaker: "傳奇鐵匠 瓦肯",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "鎮上唯一的傳奇鐵匠瓦肯正在打造皇家聖器。他脾氣火爆，拒絕收購任何低階的碎石卡片，他只要最高階的物業投資。",
    dialogue: "別拿那些 Lv1 的破爛玩意來髒了我的鐵匠鋪！想跟我做生意，就純靠高級產業（Lv2/Lv3）把分數湊到 15 分！",
    rewardAssistantId: "ast8",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      bannedLevels: ["lv1"], // 核心邏輯直接禁用此層購買
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_only",
      targetScore: 15
    }
  },
  {
    id: 9,
    name: "雙色協奏曲",
    speaker: "大提琴家 塞巴斯蒂安",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "宮廷樂長塞巴斯蒂安來到鎮上尋找靈感。他認為經商就如同拉琴，講究雙音的和諧，他要求你的資產必須呈現完美的雙色極致。",
    dialogue: "雜亂的顏色是噪音。這局遊戲，我只要看到你發展黑與白（k 與 w）的產業，其餘顏色的卡片不准出現在你的名下。",
    rewardAssistantId: "ast9",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_exclusive_colors",
      targetScore: 15,
      allowedColors: ["w", "k"] // 只允許購買白色和黑色卡片，其餘顏色計 0 或禁止
    }
  },
  {
    id: 10,
    name: "沙漠商隊的門檻",
    speaker: "異域商賈 阿里",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "來自遙遠絲路的阿里帶著巨大的駱駝商隊駐紮在鎮外。他見過無數大風大浪，普通的財富根本打動不了他，只有金光閃閃的黃金能讓他多看一眼。",
    dialogue: "我的駱駝馱滿了香料與翡翠。年輕人，聽說你最近很風光？如果你能不靠那些花花綠綠的石頭，光靠黃金鋪路拿下 15 分，我就與你簽約。",
    rewardAssistantId: "ast10",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_gold_reserve",
      targetScore: 15,
      requiredGoldOnHand: 4 // 通關當下手上必須同時持有至少 4 枚黃金
    }
  },

  // ─── 第三章：巨石要塞的邊境商戰 (11-15 關) ───
  {
    id: 11,
    name: "占星師的金融風暴",
    speaker: "皇家占星師 露娜",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "巨石要塞遭遇了星象異變，引發了強烈的信用通膨。占星師露娜封鎖了銀行的實體籌碼，你必須學會「空手套白狼」的永續鏈。",
    dialogue: "星辰預示著匱乏。這一局，銀行的每種普通籌碼庫存都只有 2 顆！你必須依賴你以前累積的產業減免，才能活下去。",
    rewardAssistantId: "ast11",
    setup: {
      mode: "singlePlayer",
      turnLimit: 25,
      initBank: { w: 2, u: 2, g: 2, r: 2, k: 2, o: 5 } // 限制銀行初始普通籌碼為 2
    },
    winCondition: {
      type: "score_only",
      targetScore: 15
    }
  },
  {
    id: 12,
    name: "鍊金術的對決",
    speaker: "鍊金術師 帕拉塞爾斯",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "要塞裡的科學家帕拉塞爾斯不相信凡人的經商手段，他研發了一個能自動計算最優解的「鍊金傀儡 AI」。你必須在商戰中擊敗他的造物。",
    dialogue: "真理只存在於算式中。我的自動傀儡會搶走所有高價值的卡牌。來吧，在它將你吞噬之前，先拿到 15 分！",
    rewardAssistantId: "ast12",
    setup: {
      mode: "vsAI", // 雙人對決模式
      aiDifficulty: "normal",
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "beat_ai",
      targetScore: 15
    }
  },
  {
    id: 13,
    name: "地下領主的黃金稅",
    speaker: "地下領主 索林",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "矮人國王索林統治著要塞底部的金庫。他是一個不折不扣的守財奴，他宣布所有買卡的交易都必須支付昂貴的黃金手續費。",
    dialogue: "想在我的地盤買卡？沒問題！但每張卡你都必須額外支付黃金，除非你能展現驚人的精算，讓最終分數剛好完美符合我的幸運數字！",
    rewardAssistantId: "ast13",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "exact_score", // 完美控分
      targetScore: 15 // 超分即算輸
    }
  },
  {
    id: 14,
    name: "遊俠的森林限速",
    speaker: "精靈遊俠 萊戈拉斯",
    imgUrl: "https://i.ibb.co/QvHvZZWc/image.png",
    story: "邊境森林遭遇敵襲，精靈遊俠萊戈拉斯奉命戒嚴。他封鎖了林道，留給物資商人的時間轉瞬即逝，你必須發動一場閃電戰。",
    dialogue: "戰爭不等人，人類。我只給你 16 個回合的時間。如果 16 回合內你無法湊齊軍需（15分），我的箭不會留情。",
    rewardAssistantId: "ast14",
    setup: {
      mode: "singlePlayer",
      turnLimit: 16, // 速通極限限制
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_only",
      targetScore: 15
    }
  },
  {
    id: 15,
    name: "聖女的奇蹟信譽",
    speaker: "聖女 貞德",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "戰火逼近要塞，人心惶惶。聖女貞德在前線振臂高呼，她要求你展現大商賈的氣魄——不消耗任何一枚實體籌碼，光靠你之前累積的產業信用買下卡牌。",
    dialogue: "戰士們需要實體寶石當作重鑄武器的原料！商人，證明你的名譽吧，光靠你名下的實業減免，免費收購 3 張卡片給我看！",
    rewardAssistantId: "ast15",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_free_buys",
      targetScore: 15,
      minFreeBuysRequired: 3 // 整局必須有 3 次買卡完全沒花實體籌碼
    }
  },

  // ─── 第四章：翡翠首都的宮廷商戰 (16-20 關) ───
  {
    id: 16,
    name: "外交官的引薦信",
    speaker: "帝國外交官 麥特尼",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "想要進入皇家大會堂，必須拿到外交官麥特尼的引薦信。這位政客不看你的錢袋，他只看你名下吸引了多少位封建貴族的認可。",
    dialogue: "在首都，滿手銅臭是最下等的。想要我的引薦信？去招攬 3 位貴族老爺來為你的商號背書吧，分數我不在乎。",
    rewardAssistantId: "ast16",
    setup: {
      mode: "singlePlayer",
      turnLimit: 99,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "nobles_count_only", // 完全不看總分
      targetNoblesCount: 3
    }
  },
  {
    id: 17,
    name: "伯爵夫人的晚宴",
    speaker: "宮廷伯爵夫人 卡蜜拉",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "卡蜜拉夫人在她的奢華莊園舉辦了社交晚宴。她喜歡戲劇性的場面，要求前來競標的商賈必須在最後一刻端出令人震驚的龐大資產。",
    dialogue: "平淡的累積太無趣了。我要你在獲得最後勝利的那一回合，同時觸發卡片得分與貴族拜訪，那才是真正的璀璨藝術。",
    rewardAssistantId: "ast17",
    setup: {
      mode: "singlePlayer",
      turnLimit: 26,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_combo_trigger",
      targetScore: 15,
      requireNobleAndCardPointsSameTurn: true // 最後一回合必須卡片分與貴族分並存
    }
  },
  {
    id: 18,
    name: "黑市刺客的截胡",
    speaker: "影刃刺客 澤德",
    imgUrl: "https://i.ibb.co/nNSjxvvd/image.png",
    story: "首都商會的巨頭派出了黑市刺客澤德來暗殺你的商譽。澤德會派出一名「侵略型 AI」，瘋狂保留或搶走你下一手最想買的卡片。",
    dialogue: "你的每一步都在我的陰影凝視之下。聽說你擅長外交？很遺憾，這一局貴族們被我恐嚇了，你拿不到任何貴族分！",
    rewardAssistantId: "ast18",
    setup: {
      mode: "vsAI",
      aiDifficulty: "hard", // 侵略型高難度 AI
      disableNoblesForPlayer: true, // 核心邏輯中玩家無法獲得貴族
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "beat_ai",
      targetScore: 15
    }
  },
  {
    id: 19,
    name: "新大陸的黃金潮",
    speaker: "大航海家 麥哲倫",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "大航海家麥哲倫帶著海外殖民地的巨額財富歸國，引發了新一輪的壟斷潮。市場風向大變，所有低階 Lv1 卡片全部被海外物資沖垮。",
    dialogue: "海洋帶來的财富超乎想像！小打小鬧的時代結束了，這局遊戲沒有 Lv1 卡片，且你必須拿下 3 張價值 4 分以上的頂級物業！",
    rewardAssistantId: "ast19",
    setup: {
      mode: "singlePlayer",
      turnLimit: 28,
      bannedLevels: ["lv1"], // 再次全面封鎖基礎卡
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "high_score_and_tier3_count",
      targetScore: 20, // 目標分提高至 20
      requiredTier3CardsWithPoints4: 3 // 必須擁有 3 張 >= 4 分的卡牌
    }
  },
  {
    id: 20,
    name: "大文豪的末日劇本",
    speaker: "大文豪 莎士比亞",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "莎士比亞正在撰寫一部名為《資本崩盤》的悲劇。為了尋找靈感，他對你的商號施加了「命運詛咒」，每過數個回合，你的實體財富就會憑空蒸發。",
    dialogue: "悲劇才是永恆。商人，在每 5 回合就會隨機被國庫充公 2 枚籌碼的絕境下，寫出你逆流而上的傳奇史詩吧！",
    rewardAssistantId: "ast20",
    setup: {
      mode: "singlePlayer",
      turnLimit: 20,
      tokenTaxInterval: 5, // 每 5 回合扣除 2 顆籌碼的環境毒素設定
      tokenTaxAmount: 2,
      initPlayerScore: 2 // 玩家起點自帶 2 分
    },
    winCondition: {
      type: "score_only",
      targetScore: 15
    }
  },

  // ─── 第五章：皇家大會堂的璀璨至尊 (21-25 關) ───
  {
    id: 21,
    name: "跨越階級的代價",
    speaker: "聖殿騎士團長 休",
    imgUrl: "https://i.ibb.co/zHGC8vsm/image.png",
    story: "掌控帝國經濟命脈的聖殿騎士團長休擋在你的最終王座前。他用鐵腕政策實施了全面禁運，你無法再從銀行獲得任何普通籌碼。",
    dialogue: "聖殿金庫接管了市場！這一局，銀行不提供任何普通籌碼，你只能靠開局自帶的資金與保留卡牌獲得的黃金來運轉！",
    rewardAssistantId: "ast21",
    setup: {
      mode: "singlePlayer",
      turnLimit: 25,
      initBank: { w: 0, u: 0, g: 0, r: 0, k: 0, o: 5 } // 徹底鎖死普通籌碼庫存
    },
    winCondition: {
      type: "score_only",
      targetScore: 18 // 目標分提高至 18
    }
  },
  {
    id: 22,
    name: "先知的絕地殘局",
    speaker: "預言者 卡珊德拉",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "先知卡珊德拉看穿了未來的命運。她擺下了一個你已經陷入破產邊緣、對手卻已經全面領先的「命運殘局」，考驗你是否有扭轉乾坤的器量。",
    dialogue: "命運已定，你已步入絕地。電腦 AI 開局便擁有 8 分與 4 張高階產業。逆風翻盤吧，撕碎這注定的悲劇！",
    rewardAssistantId: "ast22",
    setup: {
      mode: "vsAI",
      aiDifficulty: "expert", // 神級精算 AI 殘局
      initAiScore: 8,       // AI 開局直接 8 分
      initAiTier2Bonus: 4,  // AI 開局直接自帶 4 張 Lv2 卡片資產
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "beat_ai",
      targetScore: 15
    }
  },
  {
    id: 23,
    name: "大魔導師的五色矩陣",
    speaker: "大魔導師 梅林",
    imgUrl: "https://i.ibb.co/hzw3Vfm/image.png",
    story: "帝國大賢者梅林在大會堂的中央布下了元素結界。他要求真正的璀璨大師不允許有任何一門學科偏科，必須達到五色均衡的極致。",
    dialogue: "寶石即是元素。水火風雷土，偏廢任何一端都稱不上至尊。通關之時，我要看到你名下五種顏色的永久產量全部跨越界限！",
    rewardAssistantId: "ast23",
    setup: {
      mode: "singlePlayer",
      turnLimit: 27,
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "score_and_perfect_colors",
      targetScore: 20, // 必須拿到 20 分
      requiredMinBonusAllColors: 3 // 且所有顏色 Bonus 必須全開到 3 以上
    }
  },
  {
    id: 24,
    name: "至高女皇的鐵腕對決",
    speaker: "至高女皇 凱薩琳",
    imgUrl: "https://i.ibb.co/nNSjxvvd/image.png",
    story: "北方的至高女皇凱薩琳親臨大會堂。她不相信言辭，只崇尚絕對的統治力。她將親自下場，用毫無失誤的神級 AI 算法與你進行終極對決。",
    dialogue: "朕的帝國建立在鐵與血之上。面對朕親自操控的神級精算 AI，展現你這輩子最完美、不容許出錯的任何一個回合吧！",
    rewardAssistantId: "ast24",
    setup: {
      mode: "vsAI",
      aiDifficulty: "master", // 終極最高難度神級 AI
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "beat_ai",
      targetScore: 15
    }
  },
  {
    id: 25,
    name: "皇家大會堂的終極加冕",
    speaker: "璀璨至尊 大師",
    imgUrl: "https://i.ibb.co/GQ2Yh0yH/image.png",
    story: "大會堂的鐘聲響起，全體 24 位你曾擊敗並收服的夥伴列隊兩旁。王座之上，上一任璀璨至尊大師正靜靜地看著你，等待著你完成這場前無古人的 25 分傳奇加冕。",
    dialogue: "從小村莊的石匠，到要塞的奇蹟，再到首都的商戰風雲。你已經集結了所有人才。來吧，超越我，成為新的璀璨至尊！",
    rewardAssistantId: "ast25",
    setup: {
      mode: "singlePlayer",
      turnLimit: 25, // 限制 25 回合
      initBank: { w: 5, u: 5, g: 5, r: 5, k: 5, o: 5 }
    },
    winCondition: {
      type: "master_final_challenge",
      targetScore: 25,       // 挑戰終極極限 25 分
      targetNoblesCount: 2  // 並且必須至少吸引 2 個貴族
    }
  }
];