/**
 * 遊戲頂部資訊列
 * NOTE: 顯示計時器和分數，計時器低於 60 秒時會變色警告
 */
import React from 'react';

interface GameHeaderProps {
  timeRemaining: number;
  score: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onShowRules: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  timeRemaining,
  score,
  isPaused,
  onTogglePause,
  onShowRules,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const totalSeconds = minutes * 60 + seconds;
  const isLow = timeRemaining <= 60;
  const isCritical = timeRemaining <= 15;
  const scoreProgress = Math.max(0, Math.min(100, (score / 50000) * 100));
  const stars = [
    { threshold: 5000, className: 'star-1' },
    { threshold: 20000, className: 'star-2' },
    { threshold: 50000, className: 'star-3' },
  ];

  return (
    <div className="game-header">
      <div className="hud-left">
        <button className="hud-icon-btn" aria-label={isPaused ? '繼續' : '暫停'} onClick={onTogglePause}>
          {isPaused ? '▶' : <span className="pause-glyph" aria-hidden="true" />}
        </button>
        <button className="hud-icon-btn info" aria-label="遊戲規則" onClick={onShowRules}>!</button>
      </div>
      <div className={`timer ${isLow ? 'low' : ''} ${isCritical ? 'critical' : ''}`}>
        <span className="timer-icon">⏱</span>
        <span className="timer-value">{totalSeconds}</span>
      </div>
      <div className="star-progress" aria-hidden="true">
        <div className="progress-track">
          <span className="progress-fill" style={{ width: `${scoreProgress}%` }} />
        </div>
        {stars.map((star) => (
          <span
            key={star.threshold}
            className={`star ${star.className} ${score >= star.threshold ? 'lit' : ''}`}
          >
            {score >= star.threshold ? '★' : '☆'}
          </span>
        ))}
      </div>
      <div className="score-display">
        <span className="score-label">分數</span>
        <span className="score-value">{score.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default GameHeader;
