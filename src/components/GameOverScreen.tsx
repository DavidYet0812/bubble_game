/**
 * 遊戲結束畫面
 * NOTE: 區分不同的遊戲結束原因，顯示最終分數和統計
 */
import React from 'react';

interface GameOverScreenProps {
  score: number;
  timeRemaining: number;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, timeRemaining, onRestart }) => {
  const isTimeUp = timeRemaining <= 0;

  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <div className="game-over-icon">{isTimeUp ? '⏰' : '😵'}</div>
        <h2 className="game-over-title">
          {isTimeUp ? '時間到！' : '整理區已滿！'}
        </h2>
        <p className="game-over-desc">
          {isTimeUp
            ? '辛苦了！來看看你的成績吧'
            : '臨時整理區溢出，遊戲結束'}
        </p>
        <div className="game-over-score">
          <span className="game-over-score-label">最終分數</span>
          <span className="game-over-score-value">{score.toLocaleString()}</span>
        </div>
        <button className="game-over-btn" onClick={onRestart}>
          再玩一次
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
