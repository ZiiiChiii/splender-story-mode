// core/storyMode.js
import { CoreState } from './state.js';
import { ASSISTANTS_DATABASE } from './assistantData.js';
import { STORY_MISSIONS } from './missions/levelsData.js';

export const StoryMode = {
  loadStoryProgress() {
    const saved = localStorage.getItem('splendor_story_progress_2026');
    const s = CoreState.get().storyProgress;
    if (saved) {
      try {
        const data = JSON.parse(saved);
        s.maxUnlockedLevel = data.maxUnlockedLevel || 1;
        s.unlockedAssistantIds = data.unlockedAssistantIds || ['ast1'];
        s.clearedLevels = Array.isArray(data.clearedLevels) ? data.clearedLevels : [];
        // 🔓 規則矯正(含舊存檔):解鎖上限 = 已通關最高關 + 1(挑戰成功才解鎖下一關)
        const maxCleared = s.clearedLevels.length ? Math.max(...s.clearedLevels) : 0;
        s.maxUnlockedLevel = Math.max(1, Math.min(s.maxUnlockedLevel, Math.min(25, maxCleared + 1)));
      } catch (e) {
        s.maxUnlockedLevel = 1;
        s.unlockedAssistantIds = ['ast1'];
        s.clearedLevels = [];
      }
    } else {
      s.maxUnlockedLevel = 1;
      s.unlockedAssistantIds = ['ast1'];
      s.clearedLevels = [];
    }
  },

  saveStoryProgress(completedLvlId) {
    const s = CoreState.get().storyProgress;

    // 📖 通關紀錄:一律寫入 clearedLevels(地圖劇情事件、佈告欄進度都依賴它);
    //    寶石庫獎勵另外判斷 TacticsVault 是否就緒,兩者解耦避免漏記
    if (!Array.isArray(s.clearedLevels)) s.clearedLevels = [];
    const firstClear = !s.clearedLevels.includes(completedLvlId);
    if (firstClear) s.clearedLevels.push(completedLvlId);

    // \u2694\ufe0f 戰線聯動:主線通關 → 發放共享寶石庫獎勵(供戰棋次線鍛造使用)
    //    首次通關:對應色 ×2(章末關再加贈黑曜石 ×1);🔁 重複刷關:對應色 ×1(可反覆農寶石)
    const colorCycle = ['r', 'g', 'k', 'w', 'u'];   // 對應 ast1~5 的色系循環
    let gems = null;
    if (window.TacticsVault) {
      const c = colorCycle[(completedLvlId - 1) % 5];
      if (firstClear) {
        gems = { [c]: 2 };
        if (completedLvlId % 5 === 0) gems.k = (gems.k || 0) + 1;  // 章末加贈黑曜石
      } else {
        gems = { [c]: 1 };
      }
      window.TacticsVault.grant(gems);
    }
    this._lastGemReward = gems;

    // 於勝利視窗補充寶石入庫說明(saveStoryProgress 在視窗文字設定之後被呼叫)
    if (gems) {
      const bodyEl = document.getElementById('modal-body-txt');
      const GEM_NAMES = { r: '紅寶石', u: '藍寶石', g: '翡翠', w: '白鑽', k: '黑曜石' };
      if (bodyEl) {
        bodyEl.textContent += `\n💎 ${firstClear ? '首次通關' : '重複通關'}寶石入庫:` +
          Object.entries(gems).map(([k, n]) => `${GEM_NAMES[k]} ×${n}`).join('、');
      }
    }
    
    // 🔓 通關解鎖:僅開放「下一關」(挑戰成功才解鎖;跨線劇情閘門另由 levelGate 把關)
    const targetUnlock = completedLvlId + 1;
    if (targetUnlock > s.maxUnlockedLevel) {
      s.maxUnlockedLevel = Math.min(25, targetUnlock);
    }
    
    // 通關獎勵：解鎖「本關」對應的輔助官（rewardAssistantId = ast{關卡編號}），
    // 並同步解鎖已開放關卡的隨行輔助官，讓玩家能自由挑選重打
    const mission = STORY_MISSIONS[completedLvlId - 1];
    const rewardId = mission?.rewardAssistantId || `ast${completedLvlId}`;
    if (!s.unlockedAssistantIds.includes(rewardId)) {
      s.unlockedAssistantIds.push(rewardId);
    }
    
    localStorage.setItem('splendor_story_progress_2026', JSON.stringify({
      maxUnlockedLevel: s.maxUnlockedLevel,
      unlockedAssistantIds: s.unlockedAssistantIds,
      clearedLevels: s.clearedLevels || []
    }));

    if (document.getElementById('story-map-modal')?.classList.contains('show')) {
      this.openStoryMapModal();
    }
  },

  /* ══════════ 🔗 雙線劇情閘門(與戰線 tacticsMode 對接) ══════════
     主線在同步點需先打贏對應戰線戰役,劇情才銜接得上:
     m4←戰1、m7←戰2、m15←戰3、m16←戰4、m17←戰5、m18←戰6、m19←戰7、m20←戰8、m21←戰9、m22←戰10 */
  MAIN_TX_GATES: { 4: 1, 7: 2, 15: 3, 16: 4, 17: 5, 18: 6, 19: 7, 20: 8, 21: 9, 22: 10 },
  _txClearedList() {
    try {
      const d = JSON.parse(localStorage.getItem('splendor_tactics_2026') || '{}');
      return Array.isArray(d.cleared) ? d.cleared : [];
    } catch (e) { return []; }
  },
  levelGate(id) {
    const needTx = this.MAIN_TX_GATES[id] || 0;
    const ok = !needTx || this._txClearedList().includes(needTx);
    return { ok, needTx };
  },
  /* 🔒 劇情鎖對話:說明為何本關尚未開放(需先打贏戰線第 X 戰);onDone 供對話後銜接動線 */
  playLevelLockStory(id, onDone) {
    if (!window.StoryDialog) { if (onDone) onDone(); return; }
    const gate = this.levelGate(id);
    const chName = (window.TacticsMode && window.TacticsMode.chapters && window.TacticsMode.chapters[gate.needTx - 1])
      ? `「${window.TacticsMode.chapters[gate.needTx - 1].name}」` : '';
    const por = (who) => (window.TacticsMode && window.TacticsMode.portraitOf) ? window.TacticsMode.portraitOf(who, 'ally') : {};
    window.StoryDialog.play({
      headline: `📜 商談延期・第 ${id} 關`,
      subline: '劇情尚未銜接',
      script: [
        { who: '', side: 'n', text: '談判桌尚未擺開,一封火漆封緘的前線急報先一步壓在了案上。' },
        Object.assign({ who: '赫克特', side: 'ally', text: `商路被掐在敵人手裡,這一關的委託人不會上桌。指揮官——先出城打贏戰線第 ${gate.needTx} 戰${chName},把路打通!`, mood: 'shout' }, por('赫克特')),
        Object.assign({ who: '你', side: 'ally', text: '……收拾行囊。刀劍開路,再回來用交易收尾。' }, por('你')),
      ],
      canSkip: false,
      onDone: onDone || null
    });
  },

  /* 🎯 依 winCondition 型別產生人話版過關條件(選關詳情框用) */
  describeWinCondition(m) {
    const w = m.winCondition || {};
    const gemNames = { r: '紅寶石', u: '藍寶石', g: '翡翠', w: '白鑽', k: '黑曜石' };
    const sc = w.targetScore ? `達成 ${w.targetScore} 分` : '';
    switch (w.type) {
      case 'score_only': return sc;
      case 'score_and_token_limit': return `${sc},且${gemNames[w.limitTokenColor] || w.limitTokenColor}籌碼全程不超過 ${w.maxTokenAllowed} 顆`;
      case 'score_and_reserve_buy': return `${sc},且以保留卡牌收購 ${w.minReservedBuys} 張以上`;
      case 'score_and_color_balance': return `${sc},且五色產業各收 ${w.minCardsPerColor} 張以上`;
      case 'score_and_max_bag_limit': return `${sc},且隨身籌碼全程不超過 ${w.maxBagSizeEver} 顆`;
      case 'score_and_exclusive_colors': return `${sc},且名下只允許 ${(w.allowedColors || []).map(c => gemNames[c] || c).join('、')} 產業`;
      case 'score_and_gold_reserve': return `${sc},且結算時手握 ${w.requiredGoldOnHand} 枚以上黃金`;
      case 'beat_ai': return `先${sc || '達標'}擊敗對手 AI`;
      case 'exact_score': return `結算分數「剛好」${w.targetScore} 分(不可超過)`;
      case 'score_and_free_buys': return `${sc},且免費(零籌碼)收購 ${w.minFreeBuysRequired} 張以上`;
      case 'nobles_count_only': return `招攬 ${w.targetNoblesCount} 位貴族拜訪(不看分數)`;
      case 'score_and_combo_trigger': return `${sc},且最後一回合同時觸發卡片得分與貴族拜訪`;
      case 'high_score_and_tier3_count': return `${sc},且收購 ${w.requiredTier3CardsWithPoints4} 張 4 分以上頂級物業`;
      case 'score_and_perfect_colors': return `${sc},且五色永久產量各達 ${w.requiredMinBonusAllColors} 以上`;
      case 'master_final_challenge': return `達成 ${w.targetScore} 分,並獲得 ${w.targetNoblesCount} 位貴族見證`;
      default: return sc || '特定條件(詳見劇情對話)';
    }
  },

  openStoryMapModal(tab, picked = false) {
    this.loadStoryProgress();
    const state = CoreState.get();
    const maxUnlocked = state.storyProgress.maxUnlockedLevel;
    // 次線戰役只在「出城(城鎮門口→世界地圖)」進行;交易殿堂僅顯示主線。
    // 若外部仍以 'tactics' 呼叫,導向世界地圖而非在此開次線頁。
    if (tab === 'tactics') {
      const modalEl = document.getElementById('story-map-modal');
      if (modalEl) modalEl.classList.remove('show');
      if (window.TownMode && window.TownMode.openWorldMap) { window.TownMode.openWorldMap(); return; }
    }
    this._activeTab = 'main';

    let modal = document.getElementById('story-map-modal');
    if (!modal) return;

    // 📋 精簡選關列:只保留關卡名稱;條件與獎勵於點選後在上方詳情框顯示
    // 🔗 劇情閘門:進度已到但戰線未跟上的關卡顯示 ⚔️🔒,點擊播放劇情鎖對話
    let levelsHtml = STORY_MISSIONS.map(cfg => {
      const isUnlocked = cfg.id <= maxUnlocked;
      const gate = this.levelGate(cfg.id);
      const txLocked = isUnlocked && !gate.ok;
      const isCurrent = cfg.id === state.storyProgress.currentLevel;
      const isCleared = (state.storyProgress.clearedLevels || []).includes(cfg.id);

      return `
        <button class="story-scroll-row ${isCurrent ? 'is-current' : ''}" ${isUnlocked ? '' : 'disabled'}
          style="opacity:${isUnlocked ? (txLocked ? 0.75 : 1) : 0.4}; pointer-events:${isUnlocked ? 'auto' : 'none'};${txLocked ? ' border-color:rgba(224,87,91,0.5);' : ''}"
          onclick="window.selectStoryLevel(${cfg.id}, true)">
          <div class="ss-badge">${isCleared ? '✅' : (txLocked ? '⚔️🔒' : (isUnlocked ? '第 ' + cfg.id + ' 關' : '🔒'))}</div>
          <div class="ss-body">
            <div class="ss-name">${cfg.name} ${isCurrent ? '🎯' : ''}${txLocked ? ` <span style="font-size:0.55rem; color:#E0999B;">需先打贏戰線第 ${gate.needTx} 戰</span>` : ''}</div>
          </div>
          <div class="ss-arrow">${isUnlocked ? '›' : ''}</div>
        </button>`;
    }).join('');

    const currentMission = STORY_MISSIONS[state.storyProgress.currentLevel - 1] || STORY_MISSIONS[0];
    const curAst = ASSISTANTS_DATABASE[currentMission.rewardAssistantId];
    const curTurn = currentMission.setup.turnLimit >= 99 ? '不限回合' : `${currentMission.setup.turnLimit} 回合內`;
    const gemNames = { r: '紅寶石', u: '藍寶石', g: '翡翠', w: '白鑽', k: '黑曜石' };
    const curColor = gemNames[['r', 'g', 'k', 'w', 'u'][(currentMission.id - 1) % 5]];
    const isCurCleared = (state.storyProgress.clearedLevels || []).includes(currentMission.id);

    // 📋 詳情框:僅在「點選關卡後」顯示,且只含通關條件與獎勵(劇情文字一律不出現於選關介面)
    const detailHtml = picked ? `
        <div style="background:rgba(0,0,0,0.4); padding:10px; border-radius:4px; border:1px solid rgba(212,175,55,0.25); text-align:left; margin-bottom:8px; flex-shrink:0;">
          <div style="font-size:0.75rem; font-weight:800; color:#d4af37; margin-bottom:4px;">第 ${currentMission.id} 關 ${currentMission.name}${isCurCleared ? '　✅ 已通關' : ''}</div>
          <div style="font-size:0.66rem; color:#ffe099; line-height:1.7;">
            🎯 過關條件:${this.describeWinCondition(currentMission)}<br>
            ⏳ 時限:${curTurn}<br>
            🎁 首次通關:解鎖「${curAst ? curAst.name : '—'}」+ ${curColor} ×2${currentMission.id % 5 === 0 ? ' + 黑曜石 ×1' : ''}<br>
            🔁 重複通關:${curColor} ×1(可反覆刷關累積寶石庫)
          </div>
        </div>` : `
        <div style="background:rgba(0,0,0,0.25); padding:10px; border-radius:4px; border:1px dashed rgba(212,175,55,0.2); text-align:center; margin-bottom:8px; flex-shrink:0; font-size:0.68rem; color:var(--text-muted);">
          👆 點選下方章節,查看過關條件與獎勵
        </div>`;

    modal.innerHTML = `
      <div class="modal" style="max-width:520px; max-height:calc(var(--stage-h, 716px) - 40px); display:flex; flex-direction:column; overflow:hidden; padding:16px;">
        <h2 class="modal-title">📜 商道戰役・主線章節</h2>
        <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:6px;">點選章節查看詳情與挑戰。次線「戰線戰役」請由城鎮的「城鎮門口」出城前往。</p>
        ${detailHtml}

        <div class="story-scroll-list">
          ${levelsHtml}
        </div>

        <div style="display:flex; gap:6px; flex-shrink:0; margin-top:8px;">
          <button class="btn-primary" style="flex:1; padding:8px;" onclick="window.startSelectedStoryLevel()">開啟選定章節戰役</button>
          <button class="btn-replay" style="flex:1; margin:0; padding:8px; background:#3a2e22; border:1px solid #d4af37;" onclick="window.closeStoryMapBackToTown()">關閉</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  }
};

window.selectStoryLevel = function(lvl, isFromModalClick = false) {
  if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
  
  if (!isFromModalClick && !document.getElementById('story-map-modal')?.classList.contains('show')) {
    return;
  }

  // 🔒 劇情閘門:戰線未跟上 → 播劇情鎖對話,不選定該關
  if (!StoryMode.levelGate(lvl).ok) { StoryMode.playLevelLockStory(lvl); return; }

  CoreState.get().storyProgress.currentLevel = lvl;
  CoreState.get().settings.selectedAssistant = `ast${lvl}`; 
  StoryMode.openStoryMapModal(undefined, true);  // 點選後才展開詳情
  if (typeof window.render === 'function') window.render(); 
};

window.startSelectedStoryLevel = function() {
  if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
  // 🔒 保險:當前選定關被劇情閘門鎖住時,改播鎖定對話
  const gLvl = CoreState.get().storyProgress?.currentLevel || 1;
  if (!StoryMode.levelGate(gLvl).ok) { StoryMode.playLevelLockStory(gLvl); return; }
  document.getElementById('story-map-modal').classList.remove('show');
  const modal = document.getElementById('game-options-modal');
  if (modal) modal.classList.remove('show');
  // 進入桌局:城鎮小地圖收起,回城鎮改由桌局結束的「返回城鎮」鈕負責
  if (window.TownMode) { window.TownMode._resumeAfterModal = false; window.TownMode.exit(); }

  const state = CoreState.get();
  state.mode = 'storyMode';

  const currentLvl = state.storyProgress?.currentLevel || 1;

  if (window.storyModule && window.storyModule.loadStage) {
    window.storyModule.loadStage(currentLvl, () => {
      window.ActionDispatcher.dispatch('INIT_GAME');
    });
  } else {
    window.ActionDispatcher.dispatch('INIT_GAME');
  }
};

// 關閉故事地圖:若來自城鎮樞紐,關閉後返回城鎮小地圖
window.closeStoryMapBackToTown = function () {
  const modal = document.getElementById('story-map-modal');
  if (modal) modal.classList.remove('show');
  if (window.TownMode && window.TownMode._resumeAfterModal) {
    window.TownMode._resumeAfterModal = false;
    window.TownMode.enter();
  }
};    // \u2694\ufe0f 戰線聯動:主線通關 → 發放共享寶石庫獎勵(供戰棋次線鍛造使用)
    //    首次通關:對應色 ×2(章末關再加贈黑曜石 ×1);🔁 重複刷關:對應色 ×1(可反覆農寶石)
    const colorCycle = ['r', 'g', 'k', 'w', 'u'];   // 對應 ast1~5 的色系循環
    let gems = null;
    if (window.TacticsVault) {
      const c = colorCycle[(completedLvlId - 1) % 5];
      if (firstClear) {
        gems = { [c]: 2 };
        if (completedLvlId % 5 === 0) gems.k = (gems.k || 0) + 1;  // 章末加贈黑曜石
      } else {
        gems = { [c]: 1 };
      }
      window.TacticsVault.grant(gems);
    }
    this._lastGemReward = gems;

    // 於勝利視窗補充寶石入庫說明(saveStoryProgress 在視窗文字設定之後被呼叫)
    if (gems) {
      const bodyEl = document.getElementById('modal-body-txt');
      const GEM_NAMES = { r: '紅寶石', u: '藍寶石', g: '翡翠', w: '白鑽', k: '黑曜石' };
      if (bodyEl) {
        bodyEl.textContent += `\n💎 ${firstClear ? '首次通關' : '重複通關'}寶石入庫:` +
          Object.entries(gems).map(([k, n]) => `${GEM_NAMES[k]} ×${n}`).join('、');
      }
    }
    
    // 通關後自動擴充進度解鎖下 2 關
    const targetUnlock = completedLvlId + 2;
    if (targetUnlock > s.maxUnlockedLevel) {
      s.maxUnlockedLevel = Math.min(25, targetUnlock);
    }
    
    // 通關獎勵：解鎖「本關」對應的輔助官（rewardAssistantId = ast{關卡編號}），
    // 並同步解鎖已開放關卡的隨行輔助官，讓玩家能自由挑選重打
    const mission = STORY_MISSIONS[completedLvlId - 1];
    const rewardId = mission?.rewardAssistantId || `ast${completedLvlId}`;
    if (!s.unlockedAssistantIds.includes(rewardId)) {
      s.unlockedAssistantIds.push(rewardId);
    }
    
    localStorage.setItem('splendor_story_progress_2026', JSON.stringify({
      maxUnlockedLevel: s.maxUnlockedLevel,
      unlockedAssistantIds: s.unlockedAssistantIds,
      clearedLevels: s.clearedLevels || []
    }));

    if (document.getElementById('story-map-modal')?.classList.contains('show')) {
      this.openStoryMapModal();
    }
  },

  /* ══════════ 🔗 雙線劇情閘門(與戰線 tacticsMode 對接) ══════════
     主線在同步點需先打贏對應戰線戰役,劇情才銜接得上:
     m4←戰1、m7←戰2、m15←戰3、m16←戰4、m17←戰5、m18←戰6、m19←戰7、m20←戰8、m21←戰9、m22←戰10 */
  MAIN_TX_GATES: { 4: 1, 7: 2, 15: 3, 16: 4, 17: 5, 18: 6, 19: 7, 20: 8, 21: 9, 22: 10 },
  _txClearedList() {
    try {
      const d = JSON.parse(localStorage.getItem('splendor_tactics_2026') || '{}');
      return Array.isArray(d.cleared) ? d.cleared : [];
    } catch (e) { return []; }
  },
  levelGate(id) {
    const needTx = this.MAIN_TX_GATES[id] || 0;
    const ok = !needTx || this._txClearedList().includes(needTx);
    return { ok, needTx };
  },
  /* 🔒 劇情鎖對話:說明為何本關尚未開放(需先打贏戰線第 X 戰) */
  playLevelLockStory(id) {
    if (!window.StoryDialog) return;
    const gate = this.levelGate(id);
    const chName = (window.TacticsMode && window.TacticsMode.chapters && window.TacticsMode.chapters[gate.needTx - 1])
      ? `「${window.TacticsMode.chapters[gate.needTx - 1].name}」` : '';
    const por = (who) => (window.TacticsMode && window.TacticsMode.portraitOf) ? window.TacticsMode.portraitOf(who, 'ally') : {};
    window.StoryDialog.play({
      headline: `📜 商談延期・第 ${id} 關`,
      subline: '劇情尚未銜接',
      script: [
        { who: '', side: 'n', text: '談判桌尚未擺開,一封火漆封緘的前線急報先一步壓在了案上。' },
        Object.assign({ who: '赫克特', side: 'ally', text: `商路被掐在敵人手裡,這一關的委託人不會上桌。指揮官——先出城打贏戰線第 ${gate.needTx} 戰${chName},把路打通!`, mood: 'shout' }, por('赫克特')),
        Object.assign({ who: '你', side: 'ally', text: '……收拾行囊。刀劍開路,再回來用交易收尾。' }, por('你')),
      ],
      canSkip: false
    });
  },

  /* 🎯 依 winCondition 型別產生人話版過關條件(選關詳情框用) */
  describeWinCondition(m) {
    const w = m.winCondition || {};
    const gemNames = { r: '紅寶石', u: '藍寶石', g: '翡翠', w: '白鑽', k: '黑曜石' };
    const sc = w.targetScore ? `達成 ${w.targetScore} 分` : '';
    switch (w.type) {
      case 'score_only': return sc;
      case 'score_and_token_limit': return `${sc},且${gemNames[w.limitTokenColor] || w.limitTokenColor}籌碼全程不超過 ${w.maxTokenAllowed} 顆`;
      case 'score_and_reserve_buy': return `${sc},且以保留卡牌收購 ${w.minReservedBuys} 張以上`;
      case 'score_and_color_balance': return `${sc},且五色產業各收 ${w.minCardsPerColor} 張以上`;
      case 'score_and_max_bag_limit': return `${sc},且隨身籌碼全程不超過 ${w.maxBagSizeEver} 顆`;
      case 'score_and_exclusive_colors': return `${sc},且名下只允許 ${(w.allowedColors || []).map(c => gemNames[c] || c).join('、')} 產業`;
      case 'score_and_gold_reserve': return `${sc},且結算時手握 ${w.requiredGoldOnHand} 枚以上黃金`;
      case 'beat_ai': return `先${sc || '達標'}擊敗對手 AI`;
      case 'exact_score': return `結算分數「剛好」${w.targetScore} 分(不可超過)`;
      case 'score_and_free_buys': return `${sc},且免費(零籌碼)收購 ${w.minFreeBuysRequired} 張以上`;
      case 'nobles_count_only': return `招攬 ${w.targetNoblesCount} 位貴族拜訪(不看分數)`;
      case 'score_and_combo_trigger': return `${sc},且最後一回合同時觸發卡片得分與貴族拜訪`;
      case 'high_score_and_tier3_count': return `${sc},且收購 ${w.requiredTier3CardsWithPoints4} 張 4 分以上頂級物業`;
      case 'score_and_perfect_colors': return `${sc},且五色永久產量各達 ${w.requiredMinBonusAllColors} 以上`;
      case 'master_final_challenge': return `達成 ${w.targetScore} 分,並獲得 ${w.targetNoblesCount} 位貴族見證`;
      default: return sc || '特定條件(詳見劇情對話)';
    }
  },

  openStoryMapModal(tab, picked = false) {
    this.loadStoryProgress();
    const state = CoreState.get();
    const maxUnlocked = state.storyProgress.maxUnlockedLevel;
    // 次線戰役只在「出城(城鎮門口→世界地圖)」進行;交易殿堂僅顯示主線。
    // 若外部仍以 'tactics' 呼叫,導向世界地圖而非在此開次線頁。
    if (tab === 'tactics') {
      const modalEl = document.getElementById('story-map-modal');
      if (modalEl) modalEl.classList.remove('show');
      if (window.TownMode && window.TownMode.openWorldMap) { window.TownMode.openWorldMap(); return; }
    }
    this._activeTab = 'main';

    let modal = document.getElementById('story-map-modal');
    if (!modal) return;

    // 📋 精簡選關列:只保留關卡名稱;條件與獎勵於點選後在上方詳情框顯示
    // 🔗 劇情閘門:進度已到但戰線未跟上的關卡顯示 ⚔️🔒,點擊播放劇情鎖對話
    let levelsHtml = STORY_MISSIONS.map(cfg => {
      const isUnlocked = cfg.id <= maxUnlocked;
      const gate = this.levelGate(cfg.id);
      const txLocked = isUnlocked && !gate.ok;
      const isCurrent = cfg.id === state.storyProgress.currentLevel;
      const isCleared = (state.storyProgress.clearedLevels || []).includes(cfg.id);

      return `
        <button class="story-scroll-row ${isCurrent ? 'is-current' : ''}" ${isUnlocked ? '' : 'disabled'}
          style="opacity:${isUnlocked ? (txLocked ? 0.75 : 1) : 0.4}; pointer-events:${isUnlocked ? 'auto' : 'none'};${txLocked ? ' border-color:rgba(224,87,91,0.5);' : ''}"
          onclick="window.selectStoryLevel(${cfg.id}, true)">
          <div class="ss-badge">${isCleared ? '✅' : (txLocked ? '⚔️🔒' : (isUnlocked ? '第 ' + cfg.id + ' 關' : '🔒'))}</div>
          <div class="ss-body">
            <div class="ss-name">${cfg.name} ${isCurrent ? '🎯' : ''}${txLocked ? ` <span style="font-size:0.55rem; color:#E0999B;">需先打贏戰線第 ${gate.needTx} 戰</span>` : ''}</div>
          </div>
          <div class="ss-arrow">${isUnlocked ? '›' : ''}</div>
        </button>`;
    }).join('');

    const currentMission = STORY_MISSIONS[state.storyProgress.currentLevel - 1] || STORY_MISSIONS[0];
    const curAst = ASSISTANTS_DATABASE[currentMission.rewardAssistantId];
    const curTurn = currentMission.setup.turnLimit >= 99 ? '不限回合' : `${currentMission.setup.turnLimit} 回合內`;
    const gemNames = { r: '紅寶石', u: '藍寶石', g: '翡翠', w: '白鑽', k: '黑曜石' };
    const curColor = gemNames[['r', 'g', 'k', 'w', 'u'][(currentMission.id - 1) % 5]];
    const isCurCleared = (state.storyProgress.clearedLevels || []).includes(currentMission.id);

    // 📋 詳情框:僅在「點選關卡後」顯示,且只含通關條件與獎勵(劇情文字一律不出現於選關介面)
    const detailHtml = picked ? `
        <div style="background:rgba(0,0,0,0.4); padding:10px; border-radius:4px; border:1px solid rgba(212,175,55,0.25); text-align:left; margin-bottom:8px; flex-shrink:0;">
          <div style="font-size:0.75rem; font-weight:800; color:#d4af37; margin-bottom:4px;">第 ${currentMission.id} 關 ${currentMission.name}${isCurCleared ? '　✅ 已通關' : ''}</div>
          <div style="font-size:0.66rem; color:#ffe099; line-height:1.7;">
            🎯 過關條件:${this.describeWinCondition(currentMission)}<br>
            ⏳ 時限:${curTurn}<br>
            🎁 首次通關:解鎖「${curAst ? curAst.name : '—'}」+ ${curColor} ×2${currentMission.id % 5 === 0 ? ' + 黑曜石 ×1' : ''}<br>
            🔁 重複通關:${curColor} ×1(可反覆刷關累積寶石庫)
          </div>
        </div>` : `
        <div style="background:rgba(0,0,0,0.25); padding:10px; border-radius:4px; border:1px dashed rgba(212,175,55,0.2); text-align:center; margin-bottom:8px; flex-shrink:0; font-size:0.68rem; color:var(--text-muted);">
          👆 點選下方章節,查看過關條件與獎勵
        </div>`;

    modal.innerHTML = `
      <div class="modal" style="max-width:520px; max-height:calc(var(--stage-h, 716px) - 40px); display:flex; flex-direction:column; overflow:hidden; padding:16px;">
        <h2 class="modal-title">📜 商道戰役・主線章節</h2>
        <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:6px;">點選章節查看詳情與挑戰。次線「戰線戰役」請由城鎮的「城鎮門口」出城前往。</p>
        ${detailHtml}

        <div class="story-scroll-list">
          ${levelsHtml}
        </div>

        <div style="display:flex; gap:6px; flex-shrink:0; margin-top:8px;">
          <button class="btn-primary" style="flex:1; padding:8px;" onclick="window.startSelectedStoryLevel()">開啟選定章節戰役</button>
          <button class="btn-replay" style="flex:1; margin:0; padding:8px; background:#3a2e22; border:1px solid #d4af37;" onclick="window.closeStoryMapBackToTown()">關閉</button>
        </div>
      </div>
    `;

    modal.classList.add('show');
  }
};

window.selectStoryLevel = function(lvl, isFromModalClick = false) {
  if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
  
  if (!isFromModalClick && !document.getElementById('story-map-modal')?.classList.contains('show')) {
    return;
  }

  // 🔒 劇情閘門:戰線未跟上 → 播劇情鎖對話,不選定該關
  if (!StoryMode.levelGate(lvl).ok) { StoryMode.playLevelLockStory(lvl); return; }

  CoreState.get().storyProgress.currentLevel = lvl;
  CoreState.get().settings.selectedAssistant = `ast${lvl}`; 
  StoryMode.openStoryMapModal(undefined, true);  // 點選後才展開詳情
  if (typeof window.render === 'function') window.render(); 
};

window.startSelectedStoryLevel = function() {
  if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
  // 🔒 保險:當前選定關被劇情閘門鎖住時,改播鎖定對話
  const gLvl = CoreState.get().storyProgress?.currentLevel || 1;
  if (!StoryMode.levelGate(gLvl).ok) { StoryMode.playLevelLockStory(gLvl); return; }
  document.getElementById('story-map-modal').classList.remove('show');
  const modal = document.getElementById('game-options-modal');
  if (modal) modal.classList.remove('show');
  // 進入桌局:城鎮小地圖收起,回城鎮改由桌局結束的「返回城鎮」鈕負責
  if (window.TownMode) { window.TownMode._resumeAfterModal = false; window.TownMode.exit(); }

  const state = CoreState.get();
  state.mode = 'storyMode';

  const currentLvl = state.storyProgress?.currentLevel || 1;

  if (window.storyModule && window.storyModule.loadStage) {
    window.storyModule.loadStage(currentLvl, () => {
      window.ActionDispatcher.dispatch('INIT_GAME');
    });
  } else {
    window.ActionDispatcher.dispatch('INIT_GAME');
  }
};

// 關閉故事地圖:若來自城鎮樞紐,關閉後返回城鎮小地圖
window.closeStoryMapBackToTown = function () {
  const modal = document.getElementById('story-map-modal');
  if (modal) modal.classList.remove('show');
  if (window.TownMode && window.TownMode._resumeAfterModal) {
    window.TownMode._resumeAfterModal = false;
    window.TownMode.enter();
  }
};
