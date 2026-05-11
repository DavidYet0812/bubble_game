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
export const STAGING_CAPACITY = 5;

/** 同時可見的最大層數 */
export const MAX_VISIBLE_LAYERS = 3;

/** 每層的板塊數量範圍 */
export const TILES_PER_LAYER = { min: 4, max: 6 };

/** 每個板塊上的情緒數量範圍 */
export const EMOTIONS_PER_TILE = { min: 4, max: 6 };

/** 情緒泡泡半徑（像素） */
export const EMOTION_RADIUS = 14;

/** 板塊最小/最大尺寸 */
export const TILE_SIZE = {
  minW: 60,
  maxW: 100,
  minH: 50,
  maxH: 80,
};

/** 盤面尺寸 */
export const BOARD_WIDTH = 392;
export const BOARD_HEIGHT = 560;

/**
 * 8 種情緒顏色定義
 * NOTE: 精選高對比色系，確保每種顏色都能一眼辨識
 *       移除了容易混淆的相近色（如蜜桃/玫瑰、薄荷/湖水、向日葵/琥珀）
 */
export const EMOTION_COLORS: { name: string; color: string; glow: string; face: string }[] = [
  { name: '藍露', color: '#8fdcff', glow: '#45a7da', face: '˘ᵕ˘' },
  { name: '橘光', color: '#ffb25f', glow: '#e47a2c', face: '˃ᴗ˂' },
  { name: '星紫', color: '#b9a3ff', glow: '#7c63d8', face: '✦ᴗ✦' },
  { name: '青綠', color: '#5ee7cc', glow: '#27a992', face: '•‿•' },
  { name: '嫩綠', color: '#a8dd55', glow: '#73a832', face: '•̀ᴗ•́' },
  { name: '粉桃', color: '#ff94dc', glow: '#cf55aa', face: '◕‿◕' },
  { name: '月白', color: '#d9ecff', glow: '#8eb7d5', face: '◡‿◡' },
  { name: '海鹽', color: '#76b7ff', glow: '#3d82d0', face: '◕ᴗ◕' },
];

/** 情緒顏色數量 */
export const COLOR_COUNT = EMOTION_COLORS.length;
