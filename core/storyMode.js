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

    // \u2694\ufe0f 戰線聯動:主線每關「首次」通關 → 發放共享寶石庫獎勵(供戰棋次線鍛造使用)
    if (!Array.isArray(s.clearedLevels)) s.clearedLevels = [];
    if (!s.clearedLevels.includes(completedLvlId) && window.TacticsVault) {
      s.clearedLevels.push(completedLvlId);
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
    this._activeTab = tab || this._activeTab || 'main';

    let modal = document.getElementById('story-map-modal');
    if (!modal) return;

    // \u2694\ufe0f 次線頁籤:戰線戰役(戰棋模式)
    if (this._activeTab === 'tactics') {
      const tx = window.TacticsMode;
      const vaultLine = window.TacticsVault ? window.TacticsVault.lineHtml() : '';
      modal.innerHTML = `
        <div class="modal" style="max-width:520px; max-height:calc(var(--stage-h, 716px) - 40px); display:flex; flex-direction:column; overflow:hidden; padding:16px;">
          <h2 class="modal-title">\u2694\ufe0f 戰線戰役(戰棋)</h2>
          <div style="display:flex; gap:6px; margin-bottom:8px;">
            <button class="diff-opt-btn" style="flex:1;" onclick="window.playUniformSfx && window.playUniformSfx(); window.StoryMode.openStoryMapModal('main')">\ud83d\udcdc 主線・商道戰役</button>
            <button class="diff-opt-btn active" style="flex:1; border-color:#ffcc00;">\u2694\ufe0f 次線・戰線戰役</button>
          </div>
          <div style="background:rgba(0,0,0,0.4); padding:9px 10px; border-radius:4px; border:1px solid rgba(212,175,55,0.25); text-align:left; margin-bottom:8px; font-size:0.66rem; color:#c7bfb5; line-height:1.55;">
            主線在大會堂經商,你的軍事夥伴(貞德、赫克特、露娜)則在前線與「灰鴉傭兵團」作戰。
            兩線共享 <b style="color:#ffe099">寶石庫</b>:主線首勝與戰場拾獲都會入庫,可在整備時為部隊永久刻紋強化。
            戰線首勝還能<b style="color:#2ecc71">直接解鎖對應輔助官</b>——不玩戰棋也不影響主線推進,兩線互為助力、互不卡關。
            <div style="margin-top:5px;">\ud83d\udc8e 寶石庫:${vaultLine || '(戰棋模組載入中…)'}</div>
          </div>
          <div style="display:grid; grid-template-columns:1fr; gap:6px; overflow-y:auto; flex:1; padding-right:2px; margin-bottom:8px;">
            ${tx ? tx.chapterListHtml() : '<p style="font-size:0.7rem;color:#e67e22;">戰棋模組尚未載入,請重新整理頁面。</p>'}
          </div>
          <button class="btn-replay" style="margin:0; padding:8px; background:#3a2e22; border:1px solid #d4af37;" onclick="window.playUniformSfx && window.playUniformSfx(); document.getElementById('story-map-modal').classList.remove('show')">關閉</button>
        </div>`;
      modal.classList.add('show');
      return;
    }

    let levelsHtml = STORY_MISSIONS.map(cfg => {
      const isUnlocked = cfg.id <= maxUnlocked;
      const isCurrent = cfg.id === state.storyProgress.currentLevel;
      const activeClass = isCurrent ? 'active' : '';
      const disabledAttr = isUnlocked ? '' : 'disabled';
      const astCfg = ASSISTANTS_DATABASE[cfg.rewardAssistantId];
      const turnDisplay = cfg.setup.turnLimit >= 99 ? '無限' : cfg.setup.turnLimit;
      const scoreDisplay = cfg.winCondition.targetScore || '特定';

      return `
        <button class="diff-opt-btn ${activeClass}" ${disabledAttr} 
          style="text-align:left; padding:6px; display:flex; flex-direction:column; justify-content:space-between; 
                 opacity:${isUnlocked ? 1 : 0.2}; pointer-events:${isUnlocked ? 'auto' : 'none'}; 
                 border-color:${isCurrent ? '#ffcc00' : '#4a3a30'}; background:${isCurrent ? '#2d2219' : 'rgba(0,0,0,0.2)'};" 
          onclick="window.selectStoryLevel(${cfg.id}, true)">
          <div style="font-weight:800; color:#ffe099; font-size:0.7rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; width:100%;">第 ${cfg.id} 關 ${cfg.name} ${isCurrent ? '🎯' : ''}</div>
          <div style="font-size:0.58rem; color:#fff;">${scoreDisplay}分 / ${turnDisplay}回</div>
          <div style="font-size:0.52rem; color:#2ecc71; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; width:100%;">🎁 獲取: ${astCfg ? astCfg.name.split(' ')[1] : ''}</div>
        </button>
      `;
    }).join('');

    const currentMission = STORY_MISSIONS[state.storyProgress.currentLevel - 1] || STORY_MISSIONS[0];

    modal.innerHTML = `
      <div class="modal" style="max-width:520px; max-height:calc(var(--stage-h, 716px) - 40px); display:flex; flex-direction:column; overflow:hidden; padding:16px;">
        <h2 class="modal-title">📜 皇家故事模式戰役</h2>
        <div style="display:flex; gap:6px; margin-bottom:8px;">
          <button class="diff-opt-btn active" style="flex:1; border-color:#ffcc00;">📜 主線・商道戰役</button>
          <button class="diff-opt-btn" style="flex:1;" onclick="window.playUniformSfx && window.playUniformSfx(); window.StoryMode.openStoryMapModal('tactics')">⚔️ 次線・戰線戰役</button>
        </div>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">可任意點選已解鎖的關卡進行重複挑戰，或點選下一關繼續推進</p>
        
        <div style="background:rgba(0,0,0,0.4); padding:10px; border-radius:4px; border:1px solid rgba(212,175,55,0.25); text-align:left; margin-bottom:8px;">
          <div style="font-size:0.75rem; font-weight:800; color:#d4af37; margin-bottom:2px;">【${currentMission.speaker}】：</div>
          <div style="font-size:0.7rem; color:#fff; line-height:1.4; margin-bottom:4px;">"${currentMission.dialogue}"</div>
          <hr style="border:0; border-top:1px dashed rgba(212,175,55,0.2); margin:4px 0;">
          <div style="font-size:0.65rem; color:var(--text-muted);">${currentMission.story}</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px; overflow-y:auto; flex:1; padding-right:2px; margin-bottom:8px;">
          ${levelsHtml}
        </div>

        <div style="display:flex; gap:6px; flex-shrink:0;">
          <button class="btn-primary" style="flex:1; padding:8px;" onclick="window.startSelectedStoryLevel()">開啟選定章節戰役</button>
          <button class="btn-replay" style="flex:1; margin:0; padding:8px; background:#3a2e22; border:1px solid #d4af37;" onclick="document.getElementById('story-map-modal').classList.remove('show')">關閉</button>
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
