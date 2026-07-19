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

    // \u2694\ufe0f 戰線聯動:主線每關「首次」通關 → 發放共享寶石庫獎勵(供戰棋次線鍛造使用)
    if (firstClear && window.TacticsVault) {
      const colorCycle = ['r', 'g', 'k', 'w', 'u'];   // 對應 ast1~5 的色系循環
      const gems = { [colorCycle[(completedLvlId - 1) % 5]]: 2 };
      if (completedLvlId % 5 === 0) gems.k = (gems.k || 0) + 1;  // 章末加贈黑曜石
      window.TacticsVault.grant(gems);
      this._lastGemReward = gems;
    } else {
      this._lastGemReward = null;
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

  openStoryMapModal(tab) {
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

    let levelsHtml = STORY_MISSIONS.map(cfg => {
      const isUnlocked = cfg.id <= maxUnlocked;
      const isCurrent = cfg.id === state.storyProgress.currentLevel;
      const isCleared = (state.storyProgress.clearedLevels || []).includes(cfg.id);
      const astCfg = ASSISTANTS_DATABASE[cfg.rewardAssistantId];
      const turnDisplay = cfg.setup.turnLimit >= 99 ? '無限' : cfg.setup.turnLimit + ' 回';
      const scoreDisplay = cfg.winCondition.targetScore ? cfg.winCondition.targetScore + ' 分' : '特定條件';

      return `
        <button class="story-scroll-row ${isCurrent ? 'is-current' : ''}" ${isUnlocked ? '' : 'disabled'}
          style="opacity:${isUnlocked ? 1 : 0.4}; pointer-events:${isUnlocked ? 'auto' : 'none'};"
          onclick="window.selectStoryLevel(${cfg.id}, true)">
          <div class="ss-badge">${isCleared ? '✅' : (isUnlocked ? '第 ' + cfg.id + ' 關' : '🔒')}</div>
          <div class="ss-body">
            <div class="ss-name">${cfg.name} ${isCurrent ? '🎯' : ''}</div>
            <div class="ss-meta">🎯 ${scoreDisplay}　⏳ ${turnDisplay}　🎁 ${astCfg ? astCfg.name : '—'}</div>
          </div>
          <div class="ss-arrow">${isUnlocked ? '›' : ''}</div>
        </button>`;
    }).join('');

    const currentMission = STORY_MISSIONS[state.storyProgress.currentLevel - 1] || STORY_MISSIONS[0];

    modal.innerHTML = `
      <div class="modal" style="max-width:520px; max-height:calc(var(--stage-h, 716px) - 40px); display:flex; flex-direction:column; overflow:hidden; padding:16px;">
        <h2 class="modal-title">📜 商道戰役・主線章節</h2>
        <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:6px;">點選已解鎖章節挑戰或重打。次線「戰線戰役」請由城鎮的「城鎮門口」出城前往。</p>

        <div style="background:rgba(0,0,0,0.4); padding:10px; border-radius:4px; border:1px solid rgba(212,175,55,0.25); text-align:left; margin-bottom:8px; flex-shrink:0;">
          <div style="font-size:0.75rem; font-weight:800; color:#d4af37; margin-bottom:2px;">【${currentMission.speaker}】：</div>
          <div style="font-size:0.7rem; color:#fff; line-height:1.4; margin-bottom:4px;">"${currentMission.dialogue}"</div>
          <hr style="border:0; border-top:1px dashed rgba(212,175,55,0.2); margin:4px 0;">
          <div style="font-size:0.65rem; color:var(--text-muted);">${currentMission.story}</div>
        </div>

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

  CoreState.get().storyProgress.currentLevel = lvl;
  CoreState.get().settings.selectedAssistant = `ast${lvl}`; 
  StoryMode.openStoryMapModal();
  if (typeof window.render === 'function') window.render(); 
};

window.startSelectedStoryLevel = function() {
  if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
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
