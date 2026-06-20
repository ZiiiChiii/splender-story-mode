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
    
    // 通關解鎖下一關
    if (completedLvlId >= s.maxUnlockedLevel && s.maxUnlockedLevel < 25) {
      s.maxUnlockedLevel = completedLvlId + 1;
    }
    
    const nextAstId = `ast${completedLvlId + 1}`;
    if (completedLvlId < 25 && !s.unlockedAssistantIds.includes(nextAstId)) {
      s.unlockedAssistantIds.push(nextAstId);
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
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'story-map-modal';
      document.body.appendChild(modal);
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
          style="text-align:left; padding:6px; display:flex; flex-direction:column; justify-content:space-between; opacity:${isUnlocked ? 1 : 0.25}; border-color:${isCurrent ? '#ffcc00' : '#4a3a30'};" 
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
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">點選下方格卡可重複挑戰同一關，或推進新章節</p>
        
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
  CoreState.get().storyProgress.currentLevel = lvl;
  StoryMode.openStoryMapModal();
};

window.startSelectedStoryLevel = function() {
  document.getElementById('story-map-modal').classList.remove('show');
  const modal = document.getElementById('game-options-modal');
  if (modal) modal.classList.remove('show');
  
  window.ActionDispatcher.dispatch('SWITCH_MODE', { mode: 'storyMode' });
};
