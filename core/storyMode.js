// core/storyMode.js
import { CoreState } from './state.js';
import { ASSISTANTS_DATABASE } from './assistantData.js';

export const STORY_LEVELS_CONFIG = Array.from({ length: 25 }, (_, i) => {
  const lvlNum = i + 1;
  let targetScore = 15;
  let maxTurns = 28 - Math.floor(lvlNum / 4);
  if (maxTurns < 14) maxTurns = 14;

  let desc = `戰役第 ${lvlNum} 關：請在限制的 ${maxTurns} 回合內，達到 ${targetScore} 分威望以獲得新貴族能力的追隨與效忠。`;

  // 設立 25 個關卡的不同客製化條件
  if (lvlNum === 1) { targetScore = 10; maxTurns = 28; desc = "初入商界：在 28 回合內累積 10 分威望，建立您的第一條紅色商道。"; }
  if (lvlNum === 5) { targetScore = 15; maxTurns = 24; desc = "行會考核：行會加嚴了時限，必須在 24 回合內達到 15 分威望。"; }
  if (lvlNum === 10) { targetScore = 16; maxTurns = 22; desc = "領主雄心：挑戰在 22 回合內達到 16 分威望。"; }
  if (lvlNum === 15) { targetScore = 18; maxTurns = 22; desc = "商會風暴：難度升級，在 22 回合內達到高難度的 18 分威望。"; }
  if (lvlNum === 20) { targetScore = 15; maxTurns = 16; desc = "極速擴張：極限思維，必須在 16 回合內迅速奪取 15 分威望。"; }
  if (lvlNum === 25) { targetScore = 22; maxTurns = 20; desc = "至尊登基：終極戰役！在 20 回合內奪取震撼商界的 22 分威望。"; }

  return {
    level: lvlNum,
    targetScore: targetScore,
    maxTurns: maxTurns,
    rewardAssistantId: `ast${lvlNum}`, // 關卡與輔助官ID精準綁定
    description: desc
  };
});

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

  saveStoryProgress(completedLvl) {
    const s = CoreState.get().storyProgress;
    if (completedLvl >= s.maxUnlockedLevel && s.maxUnlockedLevel < 25) {
      s.maxUnlockedLevel = completedLvl + 1;
    }
    const nextAstId = `ast${completedLvl + 1}`;
    if (completedLvl < 25 && !s.unlockedAssistantIds.includes(nextAstId)) {
      s.unlockedAssistantIds.push(nextAstId);
    }
    localStorage.setItem('splendor_story_progress_2026', JSON.stringify({
      maxUnlockedLevel: s.maxUnlockedLevel,
      unlockedAssistantIds: s.unlockedAssistantIds
    }));
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

    let levelsHtml = STORY_LEVELS_CONFIG.map(cfg => {
      const isUnlocked = cfg.level <= maxUnlocked;
      const isCurrent = cfg.level === state.storyProgress.currentLevel;
      const activeClass = isCurrent ? 'active' : '';
      const disabledAttr = isUnlocked ? '' : 'disabled';
      const astCfg = ASSISTANTS_DATABASE[cfg.rewardAssistantId];

      return `
        <button class="diff-opt-btn ${activeClass}" ${disabledAttr} style="text-align:left; padding:6px; display:flex; flex-direction:column; justify-content:space-between; opacity:${isUnlocked ? 1 : 0.25}; border-color:${isCurrent ? '#ffcc00' : '#4a3a30'};" onclick="window.selectStoryLevel(${cfg.level})">
          <div style="font-weight:800; color:#ffe099; font-size:0.7rem;">第 ${cfg.level} 關 ${isCurrent ? '🎯' : ''}</div>
          <div style="font-size:0.58rem; color:#fff;">${cfg.targetScore}分 / ${cfg.maxTurns}回</div>
          <div style="font-size:0.52rem; color:#2ecc71; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; width:100%;">🎁 獲取: ${astCfg ? astCfg.name : ''}</div>
        </button>
      `;
    }).join('');

    const currentCfg = STORY_LEVELS_CONFIG[state.storyProgress.currentLevel - 1] || STORY_LEVELS_CONFIG[0];

    modal.innerHTML = `
      <div class="modal" style="max-width:520px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; padding:16px;">
        <h2 class="modal-title">📜 皇家故事模式戰役</h2>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">攻克 25 大貿易商戰，收服傳奇輔助官名冊</p>
        
        <div style="background:rgba(0,0,0,0.4); padding:8px; border-radius:4px; border:1px solid rgba(212,175,55,0.25); text-align:left; margin-bottom:8px;">
          <div style="font-size:0.75rem; font-weight:800; color:#d4af37; margin-bottom:2px;">當前選定關卡目標：</div>
          <div style="font-size:0.7rem; color:#fff; line-height:1.4;">${currentCfg.description}</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px; overflow-y:auto; flex:1; padding-right:2px; margin-bottom:8px;">
          ${levelsHtml}
        </div>

        <div style="display:flex; gap:6px; flex-shrink:0;">
          <button class="btn-primary" style="flex:1; padding:8px;" onclick="window.startSelectedStoryLevel()">解鎖並開啟此戰役</button>
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