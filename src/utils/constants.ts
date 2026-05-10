/**
 * 遊戲常數配置
 * NOTE: 所有數值已針對無盡模式平衡調整
 */

/** 遊戲時間（秒） */
export const GAME_DURATION = 360;

/** 完成收集目標獎勵時間（秒） */
export const TIME_BONUS = 5;

/** 完成收集目標獎勵分數 */
export const SCORE_PER_TARGET = 100;

/** 每個收集目標需要的情緒數量 */
export const EMOTIONS_PER_TARGET = 3;

/** 同時顯示的收集目標數 */
export const TARGET_COUNT = 3;

/** 初始打亂次數 */
export const INITIAL_SHUFFLES = 3;

/** 臨時整理區初始容量 */
export const STAGING_CAPACITY = 7;

/** 同時可見的最大層數 */
export const MAX_VISIBLE_LAYERS = 3;

/** 每層的板塊數量範圍 */
export const TILES_PER_LAYER = { min: 4, max: 6 };

/** 每個板塊上的情緒數量範圍 */
export const EMOTIONS_PER_TILE = { min: 1, max: 3 };

/** 情緒泡泡半徑（像素） */
export const EMOTION_RADIUS = 18;

/** 板塊最小/最大尺寸 */
export const TILE_SIZE = {
  minW: 60,
  maxW: 100,
  minH: 50,
  maxH: 80,
};

/** 盤面尺寸 */
export const BOARD_WIDTH = 340;
export const BOARD_HEIGHT = 420;

/**
 * 10 種情緒顏色定義
 * NOTE: 選用柔和粉彩色系以還原原圖夢幻風格
 */
export const EMOTION_COLORS: { name: string; color: string; glow: string; face: string }[] = [
  { name: '薄荷', color: '#A8E6CF', glow: '#7DCEA0', face: '◕‿◕' },
  { name: '蜜桃', color: '#FFB7B2', glow: '#E8918B', face: '◕ω◕' },
  { name: '天空', color: '#87CEEB', glow: '#5DADE2', face: '◕﹏◕' },
  { name: '薰衣草', color: '#B19CD9', glow: '#8E7CC3', face: '◕‿◕' },
  { name: '玫瑰', color: '#FFB6C1', glow: '#E88DA0', face: '◕ᴗ◕' },
  { name: '向日葵', color: '#FFEAA7', glow: '#F0D078', face: '◕‿◕' },
  { name: '珊瑚', color: '#FF7675', glow: '#E05550', face: '◕д◕' },
  { name: '湖水', color: '#81ECEC', glow: '#55C7C7', face: '◕‿◕' },
  { name: '琥珀', color: '#FDCB6E', glow: '#D4A843', face: '◕‿◕' },
  { name: '珍珠', color: '#DFE6E9', glow: '#B0BEC5', face: '◕‿◕' },
];

/** 情緒顏色數量 */
export const COLOR_COUNT = EMOTION_COLORS.length;
