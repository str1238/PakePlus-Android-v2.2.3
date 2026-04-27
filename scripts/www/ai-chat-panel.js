/**
 * AI Chat Panel Module
 * 可复用的 AI 搜问弹窗模块
 * 
 * 使用方法:
 *   <script src="ai-chat-panel.js"></script>
 *   <script>
 *     AIPanel.init({ subject: 'math' });  // 初始化，可选
 *     AIPanel.show();                      // 显示弹窗
 *     AIPanel.hide();                      // 隐藏弹窗
 *     AIPanel.setSubject('chinese');       // 切换学科
 *   </script>
 */

(function(global) {
  'use strict';

  // ==================== CSS 样式 ====================
  const CSS = `
/* AI 聊天弹窗样式 */
@keyframes aiPanelIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes aiPanelSlideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }
@keyframes subtleBob { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

.ai-chat-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: #fff;
  display: none; flex-direction: column;
  animation: aiPanelIn 0.2s ease;
}
.ai-chat-overlay.show { display: flex; }

.ai-chat-panel {
  width: 100%; height: 100dvh;
  background: #fff;
  display: flex; flex-direction: column;
  overflow: hidden;
  position: relative;
}

.ai-chat-top {
  display: flex; flex-direction: column;
  align-items: center;
  padding: 24px 36px 16px;
  background: #fff;
  flex-shrink: 0;
  position: relative; z-index: 2;
}

.ai-top-right-btns {
  position: absolute; right: 16px; top: 16px;
  display: flex; gap: 8px;
}
.ai-top-btn {
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.8);
  color: #888;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; padding: 0;
}
.ai-top-btn svg { width: 16px; height: 16px; }
.ai-top-btn:hover { background: #fff; color: #007aff; border-color: rgba(0,122,255,0.25); }
.ai-top-btn:active { transform: scale(0.9); }
.ai-top-btn.active { background: rgba(0,122,255,0.08); color: #007aff; border-color: rgba(0,122,255,0.3); }

.ai-chat-hero-avatar {
  width: 88px; height: 88px;
  cursor: pointer;
  animation: subtleBob 2.8s ease-in-out infinite;
  position: relative;
  transition: transform 0.2s;
}
.ai-chat-hero-avatar:hover { transform: scale(1.06) translateX(-2px); }
.ai-chat-hero-avatar:active { transform: scale(0.96); }
.ai-chat-hero-avatar img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  border-radius: 4px;
  filter: drop-shadow(0 4px 12px rgba(0,122,255,0.18));
}
.ai-hero-avatar-hint {
  position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
  font-size: 10px; color: #007aff;
  white-space: nowrap; opacity: 0;
  transition: opacity 0.2s; pointer-events: none;
}
.ai-chat-hero-avatar:hover .ai-hero-avatar-hint { opacity: 1; }

.ai-chat-greeting-line {
  margin-top: 14px;
  font-size: 15px; color: #333;
  text-align: center; line-height: 1.6;
  animation: aiPanelSlideUp 0.35s ease;
}
.ai-chat-greeting-line .greeting-name { font-weight: 700; color: #1a1a2e; }
.ai-chat-greeting-line .greeting-sub { display: block; font-size: 13px; color: #999; margin-top: 3px; }

.ai-chat-middle {
  flex: 1; overflow-y: auto;
  padding: 12px 36px 16px;
  display: flex; flex-direction: column; gap: 6px;
  max-width: 680px; margin: 0 auto;
  width: 100%; box-sizing: border-box;
}
.ai-chat-middle::-webkit-scrollbar { width: 3px; }
.ai-chat-middle::-webkit-scrollbar-track { background: transparent; }
.ai-chat-middle::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }

.ai-chat-recommends { margin-top: 12px; animation: aiPanelSlideUp 0.35s ease 0.08s both; }
.ai-recommend-title {
  font-size: 10px; font-weight: 600;
  color: rgba(0,0,0,0.3);
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 10px;
  display: flex; align-items: center; gap: 6px;
}
.ai-recommend-title::before { content: ''; display: inline-block; width: 12px; height: 1px; background: rgba(0,0,0,0.2); }
.ai-recommend-list { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px; }
.ai-recommend-item {
  background: rgba(0,122,255,0.05);
  border: 1px solid rgba(0,122,255,0.14);
  border-radius: 20px;
  padding: 7px 13px;
  font-size: 13px; line-height: 1.4;
  color: #555; cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap; flex-shrink: 0;
}
.ai-recommend-item:hover { background: rgba(0,122,255,0.1); border-color: rgba(0,122,255,0.35); color: #007aff; }
.ai-recommend-item:active { background: rgba(0,122,255,0.15); }

.ai-messages-area { display: flex; flex-direction: column; gap: 4px; }

.ai-msg-user { display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 18px; }
.ai-msg-user .ai-msg-row { display: flex; justify-content: flex-end; align-items: flex-start; gap: 8px; }
.ai-msg-user .ai-msg-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
  border: 1.5px solid rgba(0,122,255,0.25);
}
.ai-msg-user .ai-msg-avatar img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; background: #f0f4ff; }
.ai-msg-user .ai-msg-bubble {
  max-width: 72%;
  background: linear-gradient(135deg, #007aff, #5856d6);
  color: #fff;
  border-radius: 18px 4px 18px 18px;
  padding: 10px 15px;
  font-size: 15px; line-height: 1.7;
  box-shadow: 0 2px 10px rgba(0,122,255,0.2);
}
.ai-msg-user .ai-msg-time { font-size: 10px; color: #bbb; margin-top: 4px; padding-right: 4px; align-self: flex-end; }

.ai-msg-ai { display: flex; justify-content: flex-start; align-items: flex-start; gap: 8px; margin-bottom: 18px; }
.ai-msg-ai .ai-msg-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
  border: 1.5px solid rgba(0,122,255,0.2);
}
.ai-msg-ai .ai-msg-avatar img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; background: #f0f4ff; }
.ai-msg-ai .ai-msg-bubble {
  max-width: 72%;
  background: #fff;
  color: #333;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 4px 18px 18px 18px;
  padding: 10px 15px;
  font-size: 15px; line-height: 1.7;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}
.ai-msg-text { white-space: pre-wrap; }

.ai-msg-avatar-block { display: flex; flex-direction: column; align-items: center; gap: 3px; flex-shrink: 0; }
.ai-msg-avatar-name { font-size: 10px; color: #999; white-space: nowrap; text-align: center; line-height: 1; }

.ai-typing-dots { display: inline-flex; align-items: center; gap: 5px; padding: 4px 0; }
.ai-typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #bbb; animation: typingDot 1.3s infinite; }
.ai-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.ai-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

.ai-chat-bottom {
  padding: 16px 20px 20px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  background: #fff;
  flex-shrink: 0;
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
}

.ai-voice-mode { display: flex; align-items: center; gap: 12px; }
.ai-mode-toggle-btn {
  width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 0; flex-shrink: 0;
}
.ai-mode-toggle-btn svg { width: 20px; height: 20px; color: #666; }
.ai-mode-toggle-btn:hover { background: #fff; border-color: rgba(0,122,255,0.25); }
.ai-mode-toggle-btn:hover svg { color: #007aff; }
.ai-mode-toggle-btn:active { transform: scale(0.9); }

.ai-voice-pill {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 0 28px; height: 52px;
  border-radius: 26px; border: none;
  background: linear-gradient(135deg, #007aff, #5856d6);
  color: #fff; font-size: 15px; font-weight: 600;
  letter-spacing: 0.5px; cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 18px rgba(0,122,255,0.3);
  user-select: none; -webkit-user-select: none;
  min-width: 160px;
}
.ai-voice-pill svg { width: 20px; height: 20px; flex-shrink: 0; }
.ai-voice-pill:active { transform: scale(0.96); box-shadow: 0 2px 10px rgba(0,122,255,0.25); }
.ai-voice-pill.recording {
  background: linear-gradient(135deg, #ff3b30, #ff6b6b);
  box-shadow: 0 4px 20px rgba(255,59,48,0.4);
  animation: pillRecordPulse 1s ease-in-out infinite;
}
@keyframes pillRecordPulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(255,59,48,0.4), 0 0 0 0 rgba(255,59,48,0.15); }
  50% { box-shadow: 0 4px 20px rgba(255,59,48,0.5), 0 0 0 10px rgba(255,59,48,0.08); }
}

.ai-text-mode { width: 100%; max-width: 680px; display: flex; align-items: center; gap: 10px; }
.ai-text-kbd-toggle {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.08); background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; padding: 0;
}
.ai-text-kbd-toggle svg { width: 18px; height: 18px; color: #888; }
.ai-text-kbd-toggle:hover { color: #007aff; border-color: rgba(0,122,255,0.25); }
.ai-text-input-wrap {
  flex: 1; min-width: 0; display: flex; align-items: center;
  background: #fff; border: 1px solid rgba(0,0,0,0.1);
  border-radius: 22px; padding: 0 6px 0 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.ai-text-input-wrap:focus-within { border-color: rgba(0,122,255,0.4); box-shadow: 0 0 0 3px rgba(0,122,255,0.08); }
.ai-text-input {
  flex: 1; min-width: 0; background: transparent; border: none; outline: none;
  color: #1a1a2e; font-size: 15px;
  padding: 12px 8px; caret-color: #007aff;
}
.ai-text-input::placeholder { color: #bbb; }
.ai-send-btn {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #007aff, #5856d6);
  border: none; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0,122,255,0.25);
}
.ai-send-btn svg { width: 16px; height: 16px; color: #fff; }
.ai-send-btn:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(0,122,255,0.35); }
.ai-send-btn:active { transform: scale(0.92); }

/* 历史对话 */
.ai-chat-history {
  flex: 1; overflow-y: auto;
  padding: 16px 36px;
  max-width: 680px; margin: 0 auto; width: 100%; box-sizing: border-box;
}
.ai-chat-history::-webkit-scrollbar { width: 3px; }
.ai-chat-history::-webkit-scrollbar-track { background: transparent; }
.ai-chat-history::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
.ai-history-list { display: flex; flex-direction: column; gap: 8px; }
.ai-history-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px; cursor: pointer;
  transition: all 0.2s;
}
.ai-history-item:hover { background: rgba(0,122,255,0.03); border-color: rgba(0,122,255,0.12); }
.ai-history-item:active { background: rgba(0,122,255,0.06); }
.ai-history-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; overflow: hidden; }
.ai-history-avatar img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: #f0f4ff; }
.ai-history-left { flex: 1; min-width: 0; }
.ai-history-title {
  font-size: 14px; font-weight: 500; color: #1a1a2e;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ai-history-preview { font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.ai-history-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.ai-history-time { font-size: 11px; color: #bbb; }
.ai-history-delete {
  width: 28px; height: 28px; border-radius: 50%;
  background: transparent; border: none; color: #ccc; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
.ai-history-delete:hover { background: rgba(255,59,48,0.08); color: #ff3b30; }
.ai-history-delete svg { width: 14px; height: 14px; }

/* 头像选择浮层 */
.ai-avatar-picker-overlay {
  position: fixed; inset: 0; z-index: 1000000;
  background: rgba(240,244,255,0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: none; align-items: flex-end; justify-content: center;
  animation: aiPanelIn 0.2s ease;
}
.ai-avatar-picker-overlay.show { display: flex; }
.ai-avatar-picker-sheet {
  width: 100%; max-width: 680px;
  background: #fff;
  border-radius: 24px 24px 0 0;
  border: 1px solid rgba(0,0,0,0.08);
  border-bottom: none;
  padding: 20px 20px 32px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 32px);
  box-shadow: 0 -4px 40px rgba(0,0,0,0.1);
}
.ai-picker-handle { width: 40px; height: 4px; border-radius: 2px; background: rgba(0,0,0,0.12); margin: 0 auto 20px; }
.ai-picker-title { font-size: 18px; font-weight: 700; color: #1a1a2e; text-align: center; margin-bottom: 20px; }
.ai-picker-confirm-btn {
  width: 100%; margin-top: 16px; padding: 14px;
  background: linear-gradient(135deg, #007aff, #5856d6);
  color: #fff; border: none; border-radius: 14px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  letter-spacing: 0.5px; transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0,122,255,0.25);
}
.ai-picker-confirm-btn:hover { box-shadow: 0 6px 24px rgba(0,122,255,0.35); transform: translateY(-1px); }
.ai-picker-confirm-btn:active { opacity: 0.85; transform: none; }
.ai-picker-section { margin-bottom: 20px; }
.ai-picker-section-title {
  font-size: 11px; font-weight: 600; color: rgba(0,0,0,0.35);
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 6px;
}
.ai-picker-section-title::before { content: ''; display: inline-block; width: 14px; height: 1px; background: rgba(0,0,0,0.2); }
.ai-avatar-row { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
.ai-avatar-row::-webkit-scrollbar { display: none; }
.ai-avatar-item { display: flex; flex-direction: column; align-items: center; gap: 7px; cursor: pointer; flex-shrink: 0; transition: transform 0.15s; }
.ai-avatar-item:active { transform: scale(0.95); }
.ai-avatar-img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid transparent; transition: border-color 0.2s, box-shadow 0.2s; background: #f0f4ff; }
.ai-avatar-item.selected .ai-avatar-img { border-color: #007aff; box-shadow: 0 0 0 3px rgba(0,122,255,0.2); }
.ai-avatar-name { font-size: 11px; color: #999; text-align: center; max-width: 56px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.ai-avatar-item.selected .ai-avatar-name { color: #007aff; font-weight: 600; }

/* AI人物信息卡片 */
.ai-info-card { background: rgba(0,122,255,0.04); border: 1px solid rgba(0,122,255,0.12); border-radius: 16px; padding: 16px; display: flex; animation: fadeIn 0.3s ease; }
.ai-info-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(0,122,255,0.25); margin-right: 14px; background: #f0f4ff; }
.ai-info-content { flex: 1; min-width: 0; }
.ai-info-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.ai-info-name { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.ai-info-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: rgba(0,122,255,0.1); color: #007aff; }
.ai-info-title { font-size: 12px; color: #999; margin-bottom: 6px; }
.ai-info-desc { font-size: 13px; color: #666; line-height: 1.5; margin-bottom: 8px; }
.ai-info-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ai-info-tag { font-size: 10px; font-weight: 500; padding: 3px 8px; border-radius: 8px; background: rgba(88,86,214,0.1); color: #5856d6; }
`;

  // ==================== HTML 模板 ====================
  const HTML = `
<div class="ai-chat-overlay" id="aiChatPanel">
  <div class="ai-chat-panel">
    <!-- 顶部：大头像 + 开场语 + 右侧按钮 -->
    <div class="ai-chat-top">
      <div class="ai-top-right-btns">
        <button class="ai-top-btn" id="aiTabHistory" title="历史对话">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
        </button>
        <button class="ai-top-btn" id="aiTabNew" title="新建对话">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button class="ai-top-btn" id="aiCloseBtn" title="收起">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
      </div>
      <div class="ai-chat-hero-avatar" id="aiHeroAvatar">
        <img id="aiChatHeroAvatar" src="https://api.dicebear.com/7.x/avataaars/svg?seed=maxwell" alt="AI">
        <div class="ai-hero-avatar-hint">点击切换</div>
      </div>
      <div class="ai-chat-greeting-line">
        <span class="greeting-name" id="aiGreetingName">你好，我是麦克斯韦</span>
        <span class="greeting-sub" id="aiGreetingSub">有什么问题尽管问我，也可以搜点东西~</span>
      </div>
    </div>

    <!-- 中间：对话区 -->
    <div class="ai-chat-middle" id="aiChatMiddle">
      <div id="aiWelcomeSection">
        <div class="ai-chat-recommends">
          <div class="ai-recommend-title">试试这样问我</div>
          <div class="ai-recommend-list" id="aiRecommendList"></div>
        </div>
      </div>
      <div class="ai-messages-area" id="aiMessagesArea"></div>
    </div>

    <!-- 历史对话列表 -->
    <div class="ai-chat-history" id="aiChatHistory" style="display:none;">
      <div class="ai-history-list" id="aiHistoryList"></div>
    </div>

    <!-- 底部：输入区 -->
    <div class="ai-chat-bottom">
      <div class="ai-voice-mode" id="aiVoiceMode">
        <button class="ai-mode-toggle-btn" id="aiKbdToggle" title="切换文字输入">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="ai-voice-pill" id="aiVoicePill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
          <span id="aiVoiceLabel">按住说话</span>
        </button>
      </div>
      <div class="ai-text-mode" id="aiTextMode" style="display:none;">
        <button class="ai-text-kbd-toggle" id="aiVoiceToggle" title="切换语音">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
        </button>
        <div class="ai-text-input-wrap">
          <input class="ai-text-input" id="aiTextInput" type="text" placeholder="向AI助教提问...">
          <button class="ai-send-btn" id="aiSendBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- AI 头像切换浮层 -->
<div class="ai-avatar-picker-overlay" id="aiAvatarPicker">
  <div class="ai-avatar-picker-sheet">
    <div class="ai-picker-handle"></div>
    <div class="ai-picker-title">选择AI助教</div>
    <div class="ai-picker-section">
      <div class="ai-picker-section-title" id="pickerMastersTitle">数学大师</div>
      <div class="ai-avatar-row" id="pickerMastersRow"></div>
    </div>
    <div class="ai-picker-section">
      <div class="ai-picker-section-title">我的老师</div>
      <div class="ai-avatar-row" id="pickerTeachersRow"></div>
    </div>
    <div class="ai-info-card" id="pickerInfoCard" style="margin-top:12px">
      <img class="ai-info-avatar" id="pickerInfoAvatar" src="" alt="">
      <div class="ai-info-content">
        <div class="ai-info-header">
          <span class="ai-info-name" id="pickerInfoName"></span>
          <span class="ai-info-badge" id="pickerInfoBadge"></span>
        </div>
        <div class="ai-info-title" id="pickerInfoTitle"></div>
        <div class="ai-info-desc" id="pickerInfoDesc"></div>
        <div class="ai-info-tags" id="pickerInfoTags"></div>
      </div>
    </div>
    <button class="ai-picker-confirm-btn" id="pickerConfirmBtn">确定切换</button>
  </div>
</div>
`;

  // ==================== AI 人物数据 ====================
  const AI_AVATARS = {
    math: {
      masters: [
        { id: 'maxwell', name: '麦克斯韦', badge: '物理宗师', title: '电磁学奠基人', desc: '统一的电磁场理论，光是电磁波的各种天才预言家，为你解读物理世界的奥秘。', tags: ['电磁学', '热力学', '统计物理'], bgColor: '1a1a2e', avatarStyle: 'avataaars' },
        { id: 'euler', name: '欧拉', badge: '数学王子', title: '史上最多产数学家', desc: '如果不是我，你根本学不会微积分。函数符号f(x)都是我发明的。', tags: ['微积分', '数论', '图论'], bgColor: '0d1b2a', avatarStyle: 'personas' },
        { id: 'gauss', name: '高斯', badge: '数学王子', title: '近代数学奠基人', desc: '等差数列求和、正十七边形、最小二乘法……都是我的', tags: ['数论', '几何', '统计'], bgColor: '1b263b', avatarStyle: 'avataaars' },
        { id: 'fourier', name: '傅里叶', badge: '分析大师', title: '傅里叶变换发明者', desc: '把任意周期函数分解成三角函数之和，我的变换在信号处理中无处不在。', tags: ['傅里叶变换', '热传导', '信号处理'], bgColor: '2d3a4a', avatarStyle: 'personas' }
      ],
      teachers: [
        { id: 'teacher_zhang', name: '张老师', badge: '数学', title: '华师一附中', desc: '专注初中数学教学15年，擅长培养数学思维和解题技巧。', tags: ['中考数学', '思维训练', '解题技巧'], bgColor: '0a4a28', avatarStyle: 'avataaars' },
        { id: 'teacher_li', name: '李老师', badge: '数学', title: '武汉外校', desc: '奥数竞赛教练，多次带领学生获得省一等奖。', tags: ['奥数', '竞赛', '拔尖培养'], bgColor: '1a4a2e', avatarStyle: 'personas' }
      ]
    },
    chinese: {
      masters: [
        { id: 'luxun', name: '鲁迅', badge: '文学巨匠', title: '现代文学奠基人', desc: '横眉冷对千夫指，俯首甘为孺子牛。带你读懂现代文学的深刻内涵。', tags: ['现代文学', '杂文', '小说'], bgColor: '2c1810', avatarStyle: 'avataaars' },
        { id: 'sushi', name: '苏轼', badge: '文豪', title: '唐宋八大家之一', desc: '大江东去，浪淘尽，千古风流人物。诗词歌赋，样样精通。', tags: ['宋词', '散文', '书法'], bgColor: '3d2914', avatarStyle: 'personas' }
      ],
      teachers: [
        { id: 'teacher_wang', name: '王老师', badge: '语文', title: '华师一附中', desc: '省级语文骨干教师，擅长阅读理解和作文指导。', tags: ['阅读理解', '作文', '文言文'], bgColor: '4a3728', avatarStyle: 'avataaars' }
      ]
    },
    english: {
      masters: [
        { id: 'shakespeare', name: 'Shakespeare', badge: 'Playwright', title: 'The Bard of Avon', desc: 'To be, or not to be, that is the question. Let me guide you through the beauty of English literature.', tags: ['Literature', 'Poetry', 'Drama'], bgColor: '1a1a3e', avatarStyle: 'avataaars' }
      ],
      teachers: [
        { id: 'teacher_chen', name: '陈老师', badge: '英语', title: '武汉外校', desc: '英语专业八级，擅长口语和写作教学。', tags: ['口语', '写作', '阅读'], bgColor: '0d2a4a', avatarStyle: 'personas' }
      ]
    }
  };

  const SUBJECT_NAMES = { math: '数学', chinese: '语文', english: '英语' };

  const RECOMMENDS = {
    math: [
      '二次函数图像开口方向怎么判断？',
      '勾股定理的证明方法有哪些？',
      '一元二次方程怎么快速求根？',
      '三角函数诱导公式怎么记？',
      '平行四边形的性质与判定'
    ],
    chinese: [
      '《背影》表达了怎样的父子情感？',
      '如何赏析"明月几时有"的艺术手法？',
      '文言文实词"之"的用法有哪些？',
      '记叙文的六要素是什么？',
      '比喻和拟人的区别是什么？'
    ],
    english: [
      '现在完成时和一般过去时怎么区分？',
      '如何快速记忆英语单词？',
      '阅读理解有哪些答题技巧？',
      '英语作文开头结尾怎么写更出彩？',
      '定语从句和状语从句怎么区分？'
    ]
  };

  const MOCK_REPLIES = {
    '二次函数图像开口方向怎么判断': '二次函数 y=ax²+bx+c 的图像开口方向由系数 a 决定：\n\n• 当 a > 0 时，开口向上↑，顶点在最下方\n• 当 a < 0 时，开口向下↓，顶点在最上方\n\n记忆口诀：**a正上，a负下**。',
    '勾股定理的证明方法有哪些': '勾股定理：a² + b² = c²\n\n经典证明方法：\n\n1️⃣ **面积法**：用四个全等直角三角形拼成大正方形\n\n2️⃣ **赵爽弦图**：中国数学家赵爽用出入相补原理证明\n\n3️⃣ **向量法**：利用向量点积的性质证明',
    '一元二次方程怎么快速求根': '一元二次方程 ax²+bx+c=0 的求根公式：\n\n**x = (-b ± √(b²-4ac)) / 2a**\n\n快速判断：\n• Δ = b²-4ac > 0 → 两个不等实根\n• Δ = 0 → 两个相等实根\n• Δ < 0 → 无实根'
  };

  // ==================== 模块状态 ====================
  let currentSubject = 'math';
  let selectedAvatar = null;
  let selectedAvatarData = null;
  let isTyping = false;
  let historyVisible = false;
  let aiHistoryData = [];
  let typingCounter = 0;
  let initialized = false;

  // ==================== 工具函数 ====================
  function formatTime(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return h + ':' + m;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getAvatarUrl(avatarId, style, bgColor) {
    const s = style || 'avataaars';
    const bg = bgColor || 'f0f4ff';
    return `https://api.dicebear.com/7.x/${s}/svg?seed=${avatarId}&backgroundColor=${bg}`;
  }

  function findAvatarById(id) {
    const data = AI_AVATARS[currentSubject];
    if (!data) return null;
    for (const m of data.masters) { if (m.id === id) return m; }
    for (const t of data.teachers) { if (t.id === id) return t; }
    return null;
  }

  // ==================== 渲染函数 ====================
  function syncAIChatHeader() {
    if (!selectedAvatarData) return;
    const avatarUrl = getAvatarUrl(selectedAvatarData.id, selectedAvatarData.avatarStyle, selectedAvatarData.bgColor);
    const heroEl = document.getElementById('aiChatHeroAvatar');
    if (heroEl) heroEl.src = avatarUrl;
    document.getElementById('aiGreetingName').textContent = selectedAvatarData.name;
  }

  function renderAIChatContent() {
    if (!selectedAvatarData) return;
    const subject = SUBJECT_NAMES[currentSubject] || '学科';
    document.getElementById('aiGreetingSub').textContent = '精通' + subject + '各个领域，有什么问题尽管问我~';

    const recList = RECOMMENDS[currentSubject] || RECOMMENDS.math;
    const recEl = document.getElementById('aiRecommendList');
    recEl.innerHTML = '';
    recList.forEach(q => {
      const item = document.createElement('div');
      item.className = 'ai-recommend-item';
      item.textContent = q;
      item.onclick = function() { askRecommend(this); };
      recEl.appendChild(item);
    });
  }

  function getUserAvatar() {
    return '<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=student123&backgroundColor=b6e3f4" width="30" height="30" style="border-radius:50%;object-fit:cover;background:#f0f4ff;" alt="">';
  }

  function getAIAvatar() {
    if (!selectedAvatarData) return '<div class="ai-msg-avatar"></div>';
    const url = getAvatarUrl(selectedAvatarData.id, selectedAvatarData.avatarStyle, selectedAvatarData.bgColor);
    const name = selectedAvatarData.name;
    return `<div class="ai-msg-avatar-block"><img src="${url}" alt="" style="border-radius:0;width:30px;height:30px;object-fit:cover;background:#f0f4ff;border:none;"><span class="ai-msg-avatar-name">${name}</span></div>`;
  }

  function appendUserMessage(text) {
    const area = document.getElementById('aiMessagesArea');
    const time = formatTime(new Date());
    const div = document.createElement('div');
    div.className = 'ai-msg-user';
    div.innerHTML = `<div class="ai-msg-row"><div class="ai-msg-bubble"><div class="ai-msg-text">${escapeHtml(text)}</div></div><div class="ai-msg-avatar">${getUserAvatar()}</div></div><div class="ai-msg-time">${time}</div>`;
    area.appendChild(div);
    const middle = document.getElementById('aiChatMiddle');
    middle.scrollTop = middle.scrollHeight;
  }

  function appendAIMessage(text) {
    const area = document.getElementById('aiMessagesArea');
    const div = document.createElement('div');
    div.className = 'ai-msg-ai';
    div.innerHTML = `<div class="ai-msg-avatar">${getAIAvatar()}</div><div class="ai-msg-bubble"><div class="ai-msg-text">${escapeHtml(text)}</div></div>`;
    area.appendChild(div);
  }

  function showTypingIndicator() {
    const area = document.getElementById('aiMessagesArea');
    const id = ++typingCounter;
    const div = document.createElement('div');
    div.className = 'ai-msg-ai';
    div.id = `aiTyping-${id}`;
    div.innerHTML = `<div class="ai-msg-avatar">${getAIAvatar()}</div><div class="ai-typing-dots"><span></span><span></span><span></span></div>`;
    area.appendChild(div);
    const middle = document.getElementById('aiChatMiddle');
    middle.scrollTop = middle.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(`aiTyping-${id}`);
    if (el) el.remove();
  }

  function getMockReply(question) {
    for (const key in MOCK_REPLIES) {
      if (question.indexOf(key) !== -1) return MOCK_REPLIES[key];
    }
    const avatarName = selectedAvatarData ? selectedAvatarData.name : 'AI助手';
    return `${avatarName}收到你的问题啦！\n\n关于「${question}」这个问题，让我来为你详细解答：\n\n（这里将接入真实AI接口，返回专业答案~）\n\n你还有其他问题吗？我随时为你服务！`;
  }

  function askRecommend(el) {
    if (isTyping) return;
    const question = el.textContent;
    isTyping = true;
    const area = document.getElementById('aiMessagesArea');
    area.style.display = 'flex';
    appendUserMessage(question);
    const typingId = showTypingIndicator();
    setTimeout(function() {
      removeTypingIndicator(typingId);
      appendAIMessage(getMockReply(question));
      isTyping = false;
      const middle = document.getElementById('aiChatMiddle');
      middle.scrollTop = middle.scrollHeight;
    }, 1500 + Math.random() * 1000);
  }

  function sendAIMessage() {
    if (isTyping) return;
    const input = document.getElementById('aiTextInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    isTyping = true;
    const area = document.getElementById('aiMessagesArea');
    area.style.display = 'flex';
    appendUserMessage(text);
    const typingId = showTypingIndicator();
    setTimeout(function() {
      removeTypingIndicator(typingId);
      appendAIMessage(getMockReply(text));
      isTyping = false;
      const middle = document.getElementById('aiChatMiddle');
      middle.scrollTop = middle.scrollHeight;
    }, 1500 + Math.random() * 1000);
  }

  // ==================== 头像选择器 ====================
  function showAIAvatarPicker() {
    renderPickerAvatars();
    document.getElementById('aiAvatarPicker').classList.add('show');
  }

  function hideAIAvatarPicker() {
    document.getElementById('aiAvatarPicker').classList.remove('show');
  }

  function renderPickerAvatars() {
    const data = AI_AVATARS[currentSubject];
    if (!data) return;
    document.getElementById('pickerMastersTitle').textContent = (SUBJECT_NAMES[currentSubject] || '数学') + '大师';

    const mastersRow = document.getElementById('pickerMastersRow');
    mastersRow.innerHTML = '';
    data.masters.forEach(m => {
      const div = document.createElement('div');
      div.className = 'ai-avatar-item' + (selectedAvatar === m.id ? ' selected' : '');
      div.dataset.id = m.id;
      const avatarUrl = getAvatarUrl(m.id, m.avatarStyle, m.bgColor);
      div.innerHTML = `<img class="ai-avatar-img" src="${avatarUrl}" alt="${m.name}"><span class="ai-avatar-name">${m.name}</span>`;
      div.onclick = function() { selectPickerAvatar(this); };
      mastersRow.appendChild(div);
    });

    const teachersRow = document.getElementById('pickerTeachersRow');
    teachersRow.innerHTML = '';
    data.teachers.forEach(t => {
      const div = document.createElement('div');
      div.className = 'ai-avatar-item' + (selectedAvatar === t.id ? ' selected' : '');
      div.dataset.id = t.id;
      const avatarUrl = getAvatarUrl(t.id, t.avatarStyle, t.bgColor);
      div.innerHTML = `<img class="ai-avatar-img" src="${avatarUrl}" alt="${t.name}"><span class="ai-avatar-name">${t.name}</span>`;
      div.onclick = function() { selectPickerAvatar(this); };
      teachersRow.appendChild(div);
    });

    updatePickerInfoCard(selectedAvatarData);
  }

  function selectPickerAvatar(el) {
    document.querySelectorAll('#pickerMastersRow .ai-avatar-item, #pickerTeachersRow .ai-avatar-item').forEach(item => item.classList.remove('selected'));
    el.classList.add('selected');
    const id = el.dataset.id;
    selectedAvatar = id;
    selectedAvatarData = findAvatarById(id);
    updatePickerInfoCard(selectedAvatarData);
    syncAIChatHeader();
    renderAIChatContent();
  }

  function updatePickerInfoCard(data) {
    const card = document.getElementById('pickerInfoCard');
    if (!data) { card.style.display = 'none'; return; }
    card.style.display = 'flex';
    document.getElementById('pickerInfoAvatar').src = getAvatarUrl(data.id, data.avatarStyle, data.bgColor);
    document.getElementById('pickerInfoName').textContent = data.name;
    document.getElementById('pickerInfoBadge').textContent = data.badge;
    document.getElementById('pickerInfoTitle').textContent = data.title;
    document.getElementById('pickerInfoDesc').textContent = data.desc;
    const tagsEl = document.getElementById('pickerInfoTags');
    tagsEl.innerHTML = '';
    data.tags.forEach(tag => {
      const t = document.createElement('span');
      t.className = 'ai-info-tag';
      t.textContent = tag;
      tagsEl.appendChild(t);
    });
  }

  // ==================== 历史对话 ====================
  function renderAIHistoryList() {
    const container = document.getElementById('aiHistoryList');
    container.innerHTML = '';
    aiHistoryData.forEach(item => {
      const avatarUrl = getAvatarUrl(item.avatar, 'personas', '1a1a2e');
      const div = document.createElement('div');
      div.className = 'ai-history-item';
      div.innerHTML = `<div class="ai-history-avatar"><img src="${avatarUrl}" alt=""></div>` +
        `<div class="ai-history-left"><div class="ai-history-title">${item.title}</div><div class="ai-history-time">${item.name}</div></div>` +
        `<div class="ai-history-right"><div class="ai-history-time">${item.time}</div>` +
        `<button class="ai-history-delete" data-id="${item.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg></button></div>`;
      container.appendChild(div);
    });
  }

  function saveToHistory() {
    const msgs = document.getElementById('aiMessagesArea').children;
    if (msgs.length === 0) return;
    let firstUser = null;
    for (const msg of msgs) {
      if (msg.className === 'ai-msg-user') {
        const t = msg.querySelector('.ai-msg-text');
        if (t) { firstUser = t.textContent; break; }
      }
    }
    if (!firstUser) return;
    const avatar = selectedAvatarData ? selectedAvatarData.id : 'maxwell';
    const name = selectedAvatarData ? selectedAvatarData.name : 'AI助手';
    const now = new Date();
    const timeStr = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    aiHistoryData.unshift({
      id: Date.now(),
      avatar: avatar,
      name: name,
      title: firstUser.length > 20 ? firstUser.substring(0, 20) + '…' : firstUser,
      time: timeStr
    });
  }

  // ==================== 模式切换 ====================
  function switchToTextMode() {
    document.getElementById('aiVoiceMode').style.display = 'none';
    document.getElementById('aiTextMode').style.display = 'flex';
    setTimeout(() => document.getElementById('aiTextInput').focus(), 100);
  }

  function switchToVoiceMode() {
    document.getElementById('aiTextMode').style.display = 'none';
    document.getElementById('aiVoiceMode').style.display = 'flex';
  }

  // ==================== 初始化 ====================
  function injectStyles() {
    if (document.getElementById('ai-chat-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-chat-panel-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function injectHTML() {
    if (document.getElementById('aiChatPanel')) return;
    const container = document.createElement('div');
    container.id = 'ai-chat-panel-container';
    container.innerHTML = HTML;
    document.body.appendChild(container);
  }

  function bindEvents() {
    // 关闭按钮
    document.getElementById('aiCloseBtn').onclick = hidePanel;

    // 头像点击
    document.getElementById('aiHeroAvatar').onclick = showAIAvatarPicker;

    // 历史按钮
    document.getElementById('aiTabHistory').onclick = function() {
      historyVisible = !historyVisible;
      if (historyVisible) {
        this.classList.add('active');
        document.getElementById('aiChatMiddle').style.display = 'none';
        document.getElementById('aiChatHistory').style.display = 'block';
        renderAIHistoryList();
      } else {
        this.classList.remove('active');
        document.getElementById('aiChatMiddle').style.display = 'flex';
        document.getElementById('aiChatHistory').style.display = 'none';
      }
    };

    // 新建对话
    document.getElementById('aiTabNew').onclick = function() {
      historyVisible = false;
      document.getElementById('aiTabHistory').classList.remove('active');
      saveToHistory();
      document.getElementById('aiChatHistory').style.display = 'none';
      document.getElementById('aiChatMiddle').style.display = 'flex';
      document.getElementById('aiMessagesArea').innerHTML = '';
      document.getElementById('aiMessagesArea').style.display = 'none';
      document.getElementById('aiWelcomeSection').style.display = 'block';
    };

    // 模式切换
    document.getElementById('aiKbdToggle').onclick = switchToTextMode;
    document.getElementById('aiVoiceToggle').onclick = switchToVoiceMode;

    // 发送消息
    document.getElementById('aiSendBtn').onclick = sendAIMessage;
    document.getElementById('aiTextInput').onkeydown = function(e) { if (e.key === 'Enter') sendAIMessage(); };

    // 语音按钮
    const voicePill = document.getElementById('aiVoicePill');
    voicePill.onmousedown = voicePill.ontouchstart = function() {
      this.classList.add('recording');
      document.getElementById('aiVoiceLabel').textContent = '松开结束';
    };
    voicePill.onmouseup = voicePill.ontouchend = function() {
      this.classList.remove('recording');
      document.getElementById('aiVoiceLabel').textContent = '按住说话';
    };

    // 头像选择器遮罩关闭
    document.getElementById('aiAvatarPicker').onclick = function(e) {
      if (e.target === this) hideAIAvatarPicker();
    };
    document.getElementById('pickerConfirmBtn').onclick = hideAIAvatarPicker;

    // 历史删除按钮委托
    document.getElementById('aiHistoryList').onclick = function(e) {
      const btn = e.target.closest('.ai-history-delete');
      if (btn) {
        e.stopPropagation();
        const id = btn.dataset.id;
        aiHistoryData = aiHistoryData.filter(item => item.id != id);
        renderAIHistoryList();
      }
    };
  }

  // ==================== 公开 API ====================
  function init(options) {
    if (initialized) return;
    options = options || {};
    currentSubject = options.subject || 'math';

    injectStyles();
    injectHTML();
    bindEvents();

    // 设置默认头像
    const data = AI_AVATARS[currentSubject];
    if (data && data.masters.length > 0) {
      selectedAvatar = data.masters[0].id;
      selectedAvatarData = data.masters[0];
    }

    initialized = true;
  }

  function showPanel() {
    if (!initialized) init();
    syncAIChatHeader();
    renderAIChatContent();
    document.getElementById('aiChatPanel').classList.add('show');
  }

  function hidePanel() {
    document.getElementById('aiChatPanel').classList.remove('show');
  }

  function setSubject(subject) {
    if (!AI_AVATARS[subject]) subject = 'math';
    currentSubject = subject;
    const data = AI_AVATARS[subject];
    if (data && data.masters.length > 0) {
      selectedAvatar = data.masters[0].id;
      selectedAvatarData = data.masters[0];
    }
    if (initialized) {
      syncAIChatHeader();
      renderAIChatContent();
    }
  }

  function setAvatar(avatarId) {
    const avatar = findAvatarById(avatarId);
    if (avatar) {
      selectedAvatar = avatarId;
      selectedAvatarData = avatar;
      if (initialized) {
        syncAIChatHeader();
        renderAIChatContent();
      }
    }
  }

  function getCurrentAvatar() {
    return selectedAvatarData;
  }

  // 暴露全局 API
  global.AIPanel = {
    init: init,
    show: showPanel,
    hide: hidePanel,
    setSubject: setSubject,
    setAvatar: setAvatar,
    getCurrentAvatar: getCurrentAvatar
  };

})(typeof window !== 'undefined' ? window : this);
