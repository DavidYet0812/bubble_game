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

/** 情緒泡泡半徑（像素）— 增大以提升點擊敏感度 */
export const EMOTION_RADIUS = 22;

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
 * 8 種情緒顏色定義
 * NOTE: 精選高對比色系，確保每種顏色都能一眼辨識
 *       移除了容易混淆的相近色（如蜜桃/玫瑰、薄荷/湖水、向日葵/琥珀）
 */
export const EMOTION_COLORS: { name: string; color: string; glow: string; face: string }[] = [
  { name: '草莓', color: '#FF6B6B', glow: '#E04040', face: '◕‿◕' },
  { name: '柑橘', color: '#FFA502', glow: '#D48900', face: '◕ω◕' },
  { name: '檸檬', color: '#FFEAA7', glow: '#E8D060', face: '◕‿◕' },
  { name: '薄荷', color: '#55E6C1', glow: '#30B88C', face: '◕﹏◕' },
  { name: '天空', color: '#54A0FF', glow: '#2E86DE', face: '◕‿◕' },
  { name: '葡萄', color: '#A55EEA', glow: '#8038C7', face: '◕ᴗ◕' },
  { name: '蜜桃', color: '#FF9FF3', glow: '#D06EB8', face: '◕‿◕' },
  { name: '雲朵', color: '#C8D6E5', glow: '#9AACBD', face: '◕‿◕' },
];

/** 情緒顏色數量 */
export const COLOR_COUNT = EMOTION_COLORS.length;
