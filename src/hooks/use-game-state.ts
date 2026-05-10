/**
 * 遊戲核心狀態管理 Hook
 * NOTE: 使用 useReducer 管理複雜的遊戲狀態轉換
 */
import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameAction } from '../types/game';
import {
  GAME_DURATION,
  TIME_BONUS,
  SCORE_PER_TARGET,
  EMOTIONS_PER_TARGET,
  STAGING_CAPACITY,
  INITIAL_SHUFFLES,
} from '../utils/constants';
import { generateInitialBoard, generateLayer, shuffleEmotions } from '../utils/board-generator';
import {
  isEmotionCovered,
  isLayerCleared,
  findMatchingTarget,
  autoCollectFromStaging,
  generateTarget,
  generateInitialTargets,
  getTopLayer,
} from '../utils/game-logic';

/** 初始狀態 */
function createInitialState(): GameState {
  return {
    tiles: [],
    collectionTargets: [],
    stagingArea: [],
    score: 0,
    timeRemaining: GAME_DURATION,
    shufflesRemaining: INITIAL_SHUFFLES,
    extraSlotUsed: false,
    stagingCapacity: STAGING_CAPACITY,
    gameStatus: 'idle',
    nextLayerIndex: 0,
    message: null,
  };
}

/**
 * 遊戲 Reducer
 * 處理所有遊戲狀態轉換邏輯
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const initialTargets = generateInitialTargets();
      const targetColors = initialTargets.map((t) => t.colorIndex);
      const { tiles, nextLayerIndex } = generateInitialBoard(targetColors);
      return {
        ...createInitialState(),
        tiles,
        collectionTargets: initialTargets,
        nextLayerIndex,
        gameStatus: 'playing',
      };
    }

    case 'TICK': {
      if (state.gameStatus !== 'playing') return state;
      const newTime = state.timeRemaining - 1;
      if (newTime <= 0) {
        return { ...state, timeRemaining: 0, gameStatus: 'gameover' };
      }
      return { ...state, timeRemaining: newTime };
    }

    case 'ADD_TIME': {
      if (state.gameStatus !== 'playing') return state;
      return { ...state, timeRemaining: state.timeRemaining + action.amount };
    }

    case 'CLEAR_MESSAGE': {
      return { ...state, message: null };
    }

    case 'SHUFFLE': {
      if (state.gameStatus !== 'playing' || state.shufflesRemaining <= 0) return state;
      return {
        ...state,
        tiles: shuffleEmotions(state.tiles),
        shufflesRemaining: state.shufflesRemaining - 1,
      };
    }

    case 'CLICK_EMOTION': {
      if (state.gameStatus !== 'playing') return state;

      const { tileId, emotionId } = action;

      // 找到板塊和情緒
      const tileIdx = state.tiles.findIndex((t) => t.id === tileId);
      if (tileIdx === -1) return state;
      const tile = state.tiles[tileIdx];
      const emoIdx = tile.emotions.findIndex((e) => e.id === emotionId);
      if (emoIdx === -1) return state;
      const emotion = tile.emotions[emoIdx];

      // 檢查是否已移除或被遮擋
      if (emotion.removed) return state;
      if (isEmotionCovered(emotion, tile, state.tiles)) return state;

      // 移除情緒
      const newTiles = state.tiles.map((t, i) => {
        if (i !== tileIdx) return t;
        return {
          ...t,
          emotions: t.emotions.map((e, j) =>
            j === emoIdx ? { ...e, removed: true } : e
          ),
        };
      });

      let newTargets = state.collectionTargets.map((t) => ({ ...t }));
      let newStaging = [...state.stagingArea];
      let newScore = state.score;
      let newTime = state.timeRemaining;
      let newMessage = state.message;
      let newExtraSlotUsed = state.extraSlotUsed;
      let newStagingCapacity = state.stagingCapacity;
      let gameStatus: GameState['gameStatus'] = 'playing';

      // 嘗試匹配收集目標
      const matchIdx = findMatchingTarget(emotion.colorIndex, newTargets);
      if (matchIdx >= 0) {
        newTargets[matchIdx] = {
          ...newTargets[matchIdx],
          collected: newTargets[matchIdx].collected + 1,
        };

        // 檢查目標是否完成
        if (newTargets[matchIdx].collected >= EMOTIONS_PER_TARGET) {
          newScore += SCORE_PER_TARGET;
          newTime += TIME_BONUS;

          // 獎勵目標額外加時
          if (newTargets[matchIdx].hasTimeBonus) {
            newTime += TIME_BONUS;
            newMessage = '⏰ 獎勵目標完成！額外 +5s';
          }

          // 產生新的收集目標
          const newTarget = generateTarget();
          newTargets[matchIdx] = newTarget;

          // 從臨時整理區自動收集
          const autoResult = autoCollectFromStaging(newStaging, newTargets);
          newStaging = autoResult.newStaging;
          newTargets = autoResult.newTargets;

          // 檢查自動收集後是否有目標再次完成（連鎖反應）
          let bonusChecks = 0;
          while (bonusChecks < 10) {
            const completedIdx = newTargets.findIndex(
              (t) => t.collected >= EMOTIONS_PER_TARGET
            );
            if (completedIdx === -1) break;
            newScore += SCORE_PER_TARGET;
            newTime += TIME_BONUS;
            if (newTargets[completedIdx].hasTimeBonus) {
              newTime += TIME_BONUS;
            }
            newTargets[completedIdx] = generateTarget();
            const recheck = autoCollectFromStaging(newStaging, newTargets);
            newStaging = recheck.newStaging;
            newTargets = recheck.newTargets;
            bonusChecks++;
          }
        }
      } else {
        // 不匹配 → 放入臨時整理區
        newStaging.push({
          id: emotion.id,
          colorIndex: emotion.colorIndex,
        });

        // 放入整理區後，立即嘗試自動收集（整理區中同色泡泡可能已湊齊目標）
        const autoResult = autoCollectFromStaging(newStaging, newTargets);
        newStaging = autoResult.newStaging;
        newTargets = autoResult.newTargets;

        // 連鎖檢查：自動收集可能完成了某個目標
        let bonusChecks = 0;
        while (bonusChecks < 10) {
          const completedIdx = newTargets.findIndex(
            (t) => t.collected >= EMOTIONS_PER_TARGET
          );
          if (completedIdx === -1) break;
          newScore += SCORE_PER_TARGET;
          newTime += TIME_BONUS;
          if (newTargets[completedIdx].hasTimeBonus) {
            newTime += TIME_BONUS;
          }
          newTargets[completedIdx] = generateTarget();
          const recheck = autoCollectFromStaging(newStaging, newTargets);
          newStaging = recheck.newStaging;
          newTargets = recheck.newTargets;
          bonusChecks++;
        }

        // 檢查整理區是否滿了
        if (newStaging.length >= newStagingCapacity) {
          if (!newExtraSlotUsed) {
            // 首次滿：獲得額外空位
            newExtraSlotUsed = true;
            newStagingCapacity += 1;
            newMessage = '獲得額外空位！每局僅限 1 次';
          } else {
            // 第二次滿：遊戲結束
            gameStatus = 'gameover';
          }
        }
      }

      // 檢查是否需要產生新層
      let finalTiles = newTiles;
      let nextLayerIdx = state.nextLayerIndex;

      // 取得目前最高活躍層
      const topLayer = getTopLayer(finalTiles);
      if (topLayer >= 0 && isLayerCleared(finalTiles, topLayer)) {
        // 移除已清空的板塊
        finalTiles = finalTiles.filter(
          (t) => t.layer !== topLayer || !t.emotions.every((e) => e.removed)
        );
      }

      // 如果活躍層數不足，補充新層
      const activeLayers = new Set(
        finalTiles.filter((t) => !t.emotions.every((e) => e.removed)).map((t) => t.layer)
      );
      if (activeLayers.size < 3 && gameStatus === 'playing') {
        const targetColors = newTargets.map((t) => t.colorIndex);
        const newLayerTiles = generateLayer(nextLayerIdx, targetColors);
        finalTiles = [...finalTiles, ...newLayerTiles];
        nextLayerIdx++;
      }

      return {
        ...state,
        tiles: finalTiles,
        collectionTargets: newTargets,
        stagingArea: newStaging,
        score: newScore,
        timeRemaining: newTime,
        extraSlotUsed: newExtraSlotUsed,
        stagingCapacity: newStagingCapacity,
        gameStatus,
        nextLayerIndex: nextLayerIdx,
        message: newMessage,
      };
    }

    default:
      return state;
  }
}

/**
 * 遊戲狀態 Hook
 * 封裝 reducer 並提供計時器管理
 */
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const timerRef = useRef<number | null>(null);

  // 計時器管理
  useEffect(() => {
    if (state.gameStatus === 'playing') {
      timerRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.gameStatus]);

  // 自動清除訊息
  useEffect(() => {
    if (state.message) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_MESSAGE' }), 2500);
      return () => clearTimeout(timer);
    }
  }, [state.message]);

  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const clickEmotion = useCallback(
    (tileId: string, emotionId: string) =>
      dispatch({ type: 'CLICK_EMOTION', tileId, emotionId }),
    []
  );
  const shuffle = useCallback(() => dispatch({ type: 'SHUFFLE' }), []);

  return { state, startGame, clickEmotion, shuffle };
}
