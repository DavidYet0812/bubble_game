/**
 * 遊戲頂部資訊列
 * NOTE: 顯示計時器和分數，計時器低於 60 秒時會變色警告
 */
import React from 'react';

interface GameHeaderProps {
  timeRemaining: number;
  score: number;
}

const GameHeader: React.FC<GameHeaderProps> = ({ timeRemaining, score }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isLow = timeRemaining <= 60;
  const isCritical = timeRemaining <= 15;

  return (
    <div className="game-header">
      <div className={`timer ${isLow ? 'low' : ''} ${isCritical ? 'critical' : ''}`}>
        <span className="timer-icon">⏱</span>
        <span className="timer-value">{timeStr}</span>
      </div>
      <div className="score-display">
        <span className="score-label">分數</span>
        <span className="score-value">{score.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default GameHeader;
