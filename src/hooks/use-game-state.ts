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
  findMatchingTarget,
  autoCollectFromStaging,
  generateTarget,
  generateInitialTargets,
  getAvailableBoardColors,
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
    completedTargetEffects: [],
    collectEffects: [],
    isPaused: false,
  };
}

function effectId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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

    case 'CLEAR_COMPLETED_TARGET_EFFECT': {
      return {
        ...state,
        completedTargetEffects: state.completedTargetEffects.filter((effect) => effect.id !== action.id),
      };
    }

    case 'CLEAR_COLLECT_EFFECT': {
      return {
        ...state,
        collectEffects: state.collectEffects.filter((effect) => effect.id !== action.id),
      };
    }

    case 'SHUFFLE': {
      if (state.gameStatus !== 'playing' || state.isPaused || state.shufflesRemaining <= 0) return state;
      return {
        ...state,
        tiles: shuffleEmotions(state.tiles),
        shufflesRemaining: state.shufflesRemaining - 1,
      };
    }

    case 'TOGGLE_PAUSE': {
      if (state.gameStatus !== 'playing') return state;
      return { ...state, isPaused: !state.isPaused };
    }

    case 'SET_PAUSED': {
      if (state.gameStatus !== 'playing') return state;
      return { ...state, isPaused: action.paused };
    }

    case 'CLICK_EMOTION': {
      if (state.gameStatus !== 'playing' || state.isPaused) return state;

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
          fallAnchor: {
            offsetX: emotion.offsetX,
            offsetY: emotion.offsetY,
          },
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
      const newCompletedEffects = [...state.completedTargetEffects];
      const newCollectEffects = [...state.collectEffects];
      let gameStatus: GameState['gameStatus'] = 'playing';

      // 嘗試匹配收集目標
      const matchIdx = findMatchingTarget(emotion.colorIndex, newTargets);
      if (matchIdx >= 0) {
        newCollectEffects.push({
          id: effectId('collect'),
          colorIndex: emotion.colorIndex,
          destination: 'target',
          slotIndex: matchIdx,
        });
        newTargets[matchIdx] = {
          ...newTargets[matchIdx],
          collected: newTargets[matchIdx].collected + 1,
        };

        // 檢查目標是否完成
        if (newTargets[matchIdx].collected >= EMOTIONS_PER_TARGET) {
          newCompletedEffects.push({
            id: effectId('complete'),
            colorIndex: newTargets[matchIdx].colorIndex,
            slotIndex: matchIdx,
          });
          newScore += SCORE_PER_TARGET;
          newTime += TIME_BONUS;

          // 獎勵目標額外加時
          if (newTargets[matchIdx].hasTimeBonus) {
            newTime += TIME_BONUS;
            newMessage = '⏰ 獎勵目標完成！額外 +5s';
          }

          // 產生新的收集目標（排除其他目標已使用的顏色，並優先挑選盤面上現有顏色）
          const otherColors = newTargets
            .filter((_, i) => i !== matchIdx)
            .map(t => t.colorIndex);
          const availableColors = getAvailableBoardColors(newTiles);
          const newTarget = generateTarget(otherColors, availableColors);
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
            newCompletedEffects.push({
              id: effectId('complete'),
              colorIndex: newTargets[completedIdx].colorIndex,
              slotIndex: completedIdx,
            });
            newScore += SCORE_PER_TARGET;
            newTime += TIME_BONUS;
            if (newTargets[completedIdx].hasTimeBonus) {
              newTime += TIME_BONUS;
            }
            const chainOtherColors = newTargets
              .filter((_, i) => i !== completedIdx)
              .map(t => t.colorIndex);
            const chainAvailableColors = getAvailableBoardColors(newTiles);
            newTargets[completedIdx] = generateTarget(chainOtherColors, chainAvailableColors);
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
        newCollectEffects.push({
          id: effectId('collect'),
          colorIndex: emotion.colorIndex,
          destination: 'staging',
          slotIndex: newStaging.length - 1,
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
          newCompletedEffects.push({
            id: effectId('complete'),
            colorIndex: newTargets[completedIdx].colorIndex,
            slotIndex: completedIdx,
          });
          newScore += SCORE_PER_TARGET;
          newTime += TIME_BONUS;
          if (newTargets[completedIdx].hasTimeBonus) {
            newTime += TIME_BONUS;
          }
          const stageOtherColors = newTargets
            .filter((_, i) => i !== completedIdx)
            .map(t => t.colorIndex);
          const stageAvailableColors = getAvailableBoardColors(newTiles);
          newTargets[completedIdx] = generateTarget(stageOtherColors, stageAvailableColors);
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
        completedTargetEffects: newCompletedEffects,
        collectEffects: newCollectEffects,
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
    if (state.gameStatus === 'playing' && !state.isPaused) {
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
  }, [state.gameStatus, state.isPaused]);

  // 自動清除訊息
  useEffect(() => {
    if (state.message) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_MESSAGE' }), 2500);
      return () => clearTimeout(timer);
    }
  }, [state.message]);

  // 清除短暫動畫資料
  useEffect(() => {
    if (state.completedTargetEffects.length === 0) return;
    const timers = state.completedTargetEffects.map((effect) =>
      window.setTimeout(
        () => dispatch({ type: 'CLEAR_COMPLETED_TARGET_EFFECT', id: effect.id }),
        720
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [state.completedTargetEffects]);

  useEffect(() => {
    if (state.collectEffects.length === 0) return;
    const timers = state.collectEffects.map((effect) =>
      window.setTimeout(
        () => dispatch({ type: 'CLEAR_COLLECT_EFFECT', id: effect.id }),
        620
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [state.collectEffects]);

  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const clickEmotion = useCallback(
    (tileId: string, emotionId: string) =>
      dispatch({ type: 'CLICK_EMOTION', tileId, emotionId }),
    []
  );
  const shuffle = useCallback(() => dispatch({ type: 'SHUFFLE' }), []);
  const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), []);
  const setPaused = useCallback((paused: boolean) => dispatch({ type: 'SET_PAUSED', paused }), []);

  return { state, startGame, clickEmotion, shuffle, togglePause, setPaused };
}
