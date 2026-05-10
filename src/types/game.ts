/**
 * 泡泡情緒收集遊戲 — 核心類型定義
 * NOTE: 所有位置座標以像素為單位，相對於遊戲盤面左上角
 */

/** 情緒泡泡（可點擊的彩色小球） */
export interface Emotion {
  id: string;
  colorIndex: number;
  /** 相對於所屬板塊的偏移位置 */
  offsetX: number;
  offsetY: number;
  removed: boolean;
}

/** 思緒板塊（承載情緒泡泡的卡片） */
export interface Tile {
  id: string;
  /** 板塊在盤面上的絕對位置 */
  x: number;
  y: number;
  width: number;
  height: number;
  /** 層級，數字越大越靠上（可被點擊） */
  layer: number;
  emotions: Emotion[];
  /** CSS border-radius（用於 blob、圓形等形狀） */
  borderRadius: string;
  /** CSS clip-path（用於愛心、星形、菱形等形狀），設定時覆蓋 borderRadius */
  clipPath?: string;
  /** 隨機旋轉角度（度） */
  rotation: number;
}

/** 收集目標泡泡 */
export interface CollectionTarget {
  id: string;
  colorIndex: number;
  /** 已收集數量（0~3），達到 3 為完成 */
  collected: number;
  /** 是否為獎勵目標：完成時額外獲得 +5s 時間 */
  hasTimeBonus?: boolean;
}

/** 暫存在臨時整理區的情緒 */
export interface StagedEmotion {
  id: string;
  colorIndex: number;
}

/** 遊戲狀態 */
export type GameStatus = 'idle' | 'playing' | 'gameover';

/** 完整遊戲狀態 */
export interface GameState {
  tiles: Tile[];
  collectionTargets: CollectionTarget[];
  stagingArea: StagedEmotion[];
  score: number;
  timeRemaining: number;
  shufflesRemaining: number;
  /** 是否已使用過額外空位機會 */
  extraSlotUsed: boolean;
  stagingCapacity: number;
  gameStatus: GameStatus;
  /** 累計已生成的層數，用於產生新層 */
  nextLayerIndex: number;
  /** 臨時訊息（如「獲得額外空位」） */
  message: string | null;
}

/** Reducer Action 類型 */
export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'CLICK_EMOTION'; tileId: string; emotionId: string }
  | { type: 'TICK' }
  | { type: 'SHUFFLE' }
  | { type: 'CLEAR_MESSAGE' }
  | { type: 'ADD_TIME'; amount: number };
