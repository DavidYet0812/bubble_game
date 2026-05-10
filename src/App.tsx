/**
 * 泡泡情緒收集遊戲 — 主應用元件
 * NOTE: 整合所有子元件，管理遊戲流程
 */
import React from 'react';
import { useGameState } from './hooks/use-game-state';
import StartScreen from './components/StartScreen';
import GameHeader from './components/GameHeader';
import CollectionTargets from './components/CollectionTargets';
import StagingArea from './components/StagingArea';
import GameBoard from './components/GameBoard';
import GameOverScreen from './components/GameOverScreen';
import './App.css';

const App: React.FC = () => {
  const { state, startGame, clickEmotion, shuffle } = useGameState();

  if (state.gameStatus === 'idle') {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <div className="app-container">
      {/* 背景裝飾 */}
      <div className="bg-decoration">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
      </div>

      {/* 遊戲主體 */}
      <div className="game-container">
        <GameHeader
          timeRemaining={state.timeRemaining}
          score={state.score}
        />

        <CollectionTargets targets={state.collectionTargets} />

        <StagingArea
          stagingArea={state.stagingArea}
          capacity={state.stagingCapacity}
        />

        <GameBoard
          tiles={state.tiles}
          onEmotionClick={clickEmotion}
        />

        {/* 底部工具列 */}
        <div className="game-footer">
          <button
            className={`shuffle-btn ${state.shufflesRemaining <= 0 ? 'disabled' : ''}`}
            onClick={shuffle}
            disabled={state.shufflesRemaining <= 0}
          >
            <span className="shuffle-icon">🔀</span>
            <span className="shuffle-label">打亂情緒</span>
            <span className="shuffle-count">{state.shufflesRemaining}</span>
          </button>
        </div>

        {/* 臨時訊息 */}
        {state.message && (
          <div className="game-message">
            <div className="message-content">{state.message}</div>
          </div>
        )}
      </div>

      {/* 遊戲結束覆蓋 */}
      {state.gameStatus === 'gameover' && (
        <GameOverScreen score={state.score} timeRemaining={state.timeRemaining} onRestart={startGame} />
      )}
    </div>
  );
};

export default App;
