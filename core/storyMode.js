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
      } catch (e) {
        s.maxUnlockedLevel = 1;
        s.unlockedAssistantIds = ['ast1'];
      }
    } else {
      s.maxUnlockedLevel = 1;
      s.unlockedAssistantIds = ['ast1'];
    }
  },

  saveStoryProgress(completedLvlId) {
    const s = CoreState.get().storyProgress;
    
    // 通關後自動擴充進度解鎖下 2 關
    const targetUnlock = completedLvlId + 2;
    if (targetUnlock > s.maxUnlockedLevel) {
      s.maxUnlockedLevel = Math.min(25, targetUnlock);
    }
    
    const nextAstId1 = `ast${completedLvlId + 1}`;
    const nextAstId2 = `ast${completedLvlId + 2}`;
    if (completedLvlId + 1 <= 25 && !s.unlockedAssistantIds.includes(nextAstId1)) {
      s.unlockedAssistantIds.push(nextAstId1);
    }
    if (completedLvlId + 2 <= 25 && !s.unlockedAssistantIds.includes(nextAstId2)) {
      s.unlockedAssistantIds.push(nextAstId2);
    }
    
    localStorage.setItem('splendor_story_progress_2026', JSON.stringify({
      maxUnlockedLevel: s.maxUnlockedLevel,
      unlockedAssistantIds: s.unlockedAssistantIds
    }));

    if (document.getElementById('story-map-modal')?.classList.contains('show')) {
      this.openStoryMapModal();
    }
  },

  openStoryMapModal() {
    this.loadStoryProgress();
    const state = CoreState.get();
    const maxUnlocked = state.storyProgress.maxUnlockedLevel;

    let modal = document.getElementById('story-map-modal');
    if (!modal) return;

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
          onclick="window.selectStoryLevel(${cfg.id})">
          <div style="font-weight:800; color:#ffe099; font-size:0.7rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; width:100%;">第 ${cfg.id} 關 ${cfg.name} ${isCurrent ? '🎯' : ''}</div>
          <div style="font-size:0.58rem; color:#fff;">${scoreDisplay}分 / ${turnDisplay}回</div>
          <div style="font-size:0.52rem; color:#2ecc71; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; width:100%;">🎁 獲取: ${astCfg ? astCfg.name.split(' ')[1] : ''}</div>
        </button>
      `;
    }).join('');

    const currentMission = STORY_MISSIONS[state.storyProgress.currentLevel - 1] || STORY_MISSIONS[0];

    modal.innerHTML = `
      <div class="modal" style="max-width:520px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; padding:16px;">
        <h2 class="modal-title">📜 皇家故事模式戰役</h2>
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

window.selectStoryLevel = function(lvl) {
  if (typeof window.playUniformSfx === 'function') window.playUniformSfx();
  
  // 核心安全鎖：只有當故事關卡選擇地圖彈窗在螢幕上顯示時，才接受並處理此點選事件
  if (!document.getElementById('story-map-modal')?.classList.contains('show')) {
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
