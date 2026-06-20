// game.js 中需要修改的 loadCoreModules 函式部分

async function loadCoreModules() {
  const stateMod = await import('./core/state.js');
  const engineMod = await import('./core/gameEngine.js');
  const singleMod = await import('./core/singleMode.js');
  const aiMod = await import('./core/aiMode.js');
  const actionMod = await import('./core/action.js');
  const storyMod = await import('./core/storyMode.js');
  const assistantMod = await import('./core/assistantData.js');
  const levelsMod = await import('./core/levels.js'); // 新增明確導入

  CoreState = stateMod.CoreState;
  GameEngine = engineMod.GameEngine;
  SingleMode = singleMod.SingleMode;
  AiMode = aiMod.AiMode;
  ActionDispatcher = actionMod.ActionDispatcher;

  window.ActionDispatcher = ActionDispatcher;
  window.SingleMode = SingleMode;
  window.STORY_MISSIONS = levelsMod.STORY_MISSIONS; // 掛載至 window 全域暫存

  storyMod.StoryMode.loadStoryProgress();
  assistantMod.AssistantManager.renderActiveAssistantUI();
}
