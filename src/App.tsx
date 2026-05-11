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
  const { state, startGame, clickEmotion, shuffle, togglePause, setPaused } = useGameState();
  const [showRules, setShowRules] = React.useState(false);
  const [rulesPausedGame, setRulesPausedGame] = React.useState(false);

  const openRules = React.useCallback(() => {
    setShowRules(true);
    if (state.gameStatus === 'playing' && !state.isPaused) {
      setPaused(true);
      setRulesPausedGame(true);
    } else {
      setRulesPausedGame(false);
    }
  }, [setPaused, state.gameStatus, state.isPaused]);

  const closeRules = React.useCallback(() => {
    setShowRules(false);
    if (rulesPausedGame) {
      setPaused(false);
      setRulesPausedGame(false);
    }
  }, [rulesPausedGame, setPaused]);

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
          isPaused={state.isPaused}
          onTogglePause={togglePause}
          onShowRules={openRules}
        />

        <CollectionTargets
          targets={state.collectionTargets}
          completedEffects={state.completedTargetEffects}
          collectEffects={state.collectEffects}
        />

        <StagingArea
          stagingArea={state.stagingArea}
          capacity={state.stagingCapacity}
          collectEffects={state.collectEffects}
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
            disabled={state.shufflesRemaining <= 0 || state.isPaused}
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

      {state.isPaused && (
        <div className="pause-chip">暫停中</div>
      )}

      {showRules && (
        <div className="rules-overlay" onClick={closeRules}>
          <div className="rules-panel" role="dialog" aria-modal="true" aria-label="遊戲規則" onClick={(e) => e.stopPropagation()}>
            <button className="rules-close" aria-label="關閉規則" onClick={closeRules}>×</button>
            <h2>遊戲規則</h2>
            <p>點擊沒有被遮擋的情緒泡泡，收集到上方相同顏色的目標圈。</p>
            <p>每個目標集滿 3 顆會得分並加時；不符合目標的泡泡會進入臨時整理區。</p>
            <p>臨時整理區滿時會先獲得 1 次額外空位，再次滿格就結束。</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
