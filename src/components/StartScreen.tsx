/**
 * 開始畫面元件
 * NOTE: 夢幻風格的歡迎畫面，帶有浮動泡泡背景動畫
 */
import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="start-screen">
      <div className="start-bubbles-bg">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`floating-bubble bubble-${i}`} />
        ))}
      </div>
      <div className="start-content">
        <div className="start-icon">🫧</div>
        <h1 className="start-title">泡泡情緒</h1>
        <p className="start-subtitle">收集散落的情緒泡泡</p>
        <div className="start-rules">
          <div className="rule-item">
            <span className="rule-icon">👆</span>
            <span>點擊未被遮擋的情緒泡泡來收集</span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">🎯</span>
            <span>匹配顏色收入目標，每組 3 個</span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">⏱</span>
            <span>360 秒無盡模式，完成目標加時 +5s</span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">⚠️</span>
            <span>臨時整理區滿了就結束！</span>
          </div>
        </div>
        <button className="start-btn" onClick={onStart}>
          開始遊戲
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
