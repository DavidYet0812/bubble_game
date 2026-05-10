/**
 * 盤面與板塊生成器（多形狀隨機佈局版）
 * NOTE: 支援 blob、圓形、愛心、星形、菱形、六角形、雲朵、葉子等形狀
 *       板塊位置完全隨機、大小亂數、旋轉角度 ±90°
 */
import type { Tile, Emotion } from '../types/game';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  EMOTIONS_PER_TILE,
  COLOR_COUNT,
  EMOTION_RADIUS,
} from './constants';

let idCounter = 0;

/** 產生唯一 ID */
function uid(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

/** 隨機整數 [min, max] */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 隨機浮點 [min, max] */
function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ============================================================
// 形狀配置（固定形狀）
// NOTE: 12 種固定形狀，大小由板塊生成時隨機決定
// ============================================================

interface ShapeConfig {
  borderRadius: string;
  clipPath?: string;
  /** 情緒放置的安全區域比例（0~1），越小越靠近中心 */
  safeZone: number;
}

/**
 * 12 種固定形狀定義
 * NOTE: 形狀本身不隨機，只有板塊的寬高會隨機變化
 */
const SHAPE_LIST: ShapeConfig[] = [
  // === blob（固定的有機不規則形狀） ===
  {
    borderRadius: '42% 58% 35% 65% / 55% 38% 62% 45%',
    safeZone: 0.60,
  },

  // === 圓形 ===
  {
    borderRadius: '50%',
    safeZone: 0.58,
  },

  // === 愛心 ===
  {
    borderRadius: '0',
    clipPath: 'polygon(50% 18%, 62% 3%, 78% 0%, 90% 8%, 98% 22%, 100% 38%, 92% 58%, 50% 95%, 8% 58%, 0% 38%, 2% 22%, 10% 8%, 22% 0%, 38% 3%)',
    safeZone: 0.45,
  },

  // === 星形（五角，胖版） ===
  {
    borderRadius: '0',
    clipPath: 'polygon(50% 0%, 63% 30%, 100% 35%, 75% 60%, 82% 98%, 50% 78%, 18% 98%, 25% 60%, 0% 35%, 37% 30%)',
    safeZone: 0.38,
  },

  // === 菱形 ===
  {
    borderRadius: '0',
    clipPath: 'polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)',
    safeZone: 0.42,
  },

  // === 六角形 ===
  {
    borderRadius: '0',
    clipPath: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)',
    safeZone: 0.58,
  },

  // === 雲朵 ===
  {
    borderRadius: '50% 50% 42% 58% / 48% 55% 45% 52%',
    safeZone: 0.55,
  },

  // === 葉子 ===
  {
    borderRadius: '8% 75% 8% 75%',
    safeZone: 0.48,
  },

  // === 水滴 ===
  {
    borderRadius: '0',
    clipPath: 'polygon(50% 0%, 85% 35%, 95% 60%, 90% 80%, 72% 95%, 50% 100%, 28% 95%, 10% 80%, 5% 60%, 15% 35%)',
    safeZone: 0.45,
  },

  // === 十字 / 加號 ===
  {
    borderRadius: '0',
    clipPath: 'polygon(30% 0%, 70% 0%, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0% 70%, 0% 30%, 30% 30%)',
    safeZone: 0.35,
  },

  // === 蛋形 ===
  {
    borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
    safeZone: 0.52,
  },

  // === 花瓣 ===
  {
    borderRadius: '0',
    clipPath: 'polygon(50% 0%, 70% 15%, 95% 25%, 100% 50%, 95% 75%, 70% 85%, 50% 100%, 30% 85%, 5% 75%, 0% 50%, 5% 25%, 30% 15%)',
    safeZone: 0.50,
  },
];

/**
 * 隨機選取一個固定形狀
 */
function pickRandomShape(): ShapeConfig {
  return SHAPE_LIST[Math.floor(Math.random() * SHAPE_LIST.length)];
}

// ============================================================
// 情緒泡泡位置生成
// ============================================================

/**
 * 在板塊內的安全區域中產生不重疊的情緒位置
 * NOTE: 安全區域根據形狀類型縮小，確保泡泡不會落在形狀邊緣外
 */
function generateEmotionPositions(
  tileW: number,
  tileH: number,
  count: number,
  safeZone: number
): { offsetX: number; offsetY: number }[] {
  const positions: { offsetX: number; offsetY: number }[] = [];
  const marginX = tileW * (1 - safeZone) / 2;
  const marginY = tileH * (1 - safeZone) / 2;
  const minDist = EMOTION_RADIUS * 2 + 3;

  const cx = tileW / 2;
  const cy = tileH / 2;
  // 進一步縮小 safeZone，並減去泡泡半徑，確保泡泡最邊緣也不會超出圖形
  const a = Math.max(10, (tileW * safeZone) / 2 - EMOTION_RADIUS * 0.5);
  const b = Math.max(10, (tileH * safeZone) / 2 - EMOTION_RADIUS * 0.5);

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let ox: number, oy: number;
    let isValid = false;

    do {
      ox = marginX + Math.random() * (tileW - marginX * 2);
      oy = marginY + Math.random() * (tileH - marginY * 2);
      attempts++;

      // 確保在安全橢圓內
      const dx = ox - cx;
      const dy = oy - cy;
      const inEllipse = (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1;

      // 確保不重疊
      const noOverlap = !positions.some(
        (p) => Math.hypot(p.offsetX - ox, p.offsetY - oy) < minDist
      );

      isValid = inEllipse && noOverlap;
    } while (!isValid && attempts < 200);

    if (isValid || attempts >= 200) {
      // 即使超過嘗試次數，也強制放入最後一個點（通常會被擠在邊緣）
      positions.push({ offsetX: ox, offsetY: oy });
    }
  }
  return positions;
}

/**
 * 為指定板塊產生情緒泡泡
 */
function generateEmotions(
  tileW: number,
  tileH: number,
  colorPool: number[],
  safeZone: number
): Emotion[] {
  // 根據板塊面積和安全區域決定情緒數量
  const effectiveArea = tileW * tileH * safeZone * safeZone;
  let maxEmotions = EMOTIONS_PER_TILE.max;
  if (effectiveArea > 4000) maxEmotions = 3;
  if (effectiveArea > 6000) maxEmotions = 4;
  if (effectiveArea > 9000) maxEmotions = 5;
  const count = randInt(EMOTIONS_PER_TILE.min, maxEmotions);
  const positions = generateEmotionPositions(tileW, tileH, count, safeZone);

  return positions.map((pos) => ({
    id: uid('emo'),
    colorIndex: colorPool[Math.floor(Math.random() * colorPool.length)],
    offsetX: pos.offsetX,
    offsetY: pos.offsetY,
    removed: false,
  }));
}

// ============================================================
// 板塊尺寸配置
// ============================================================

const TILE_SIZES = [
  { minW: 65, maxW: 85, minH: 55, maxH: 70 },
  { minW: 85, maxW: 110, minH: 65, maxH: 85 },
  { minW: 100, maxW: 140, minH: 80, maxH: 110 },
  { minW: 120, maxW: 160, minH: 90, maxH: 130 },
];

// ============================================================
// 層生成
// ============================================================

/**
 * 產生單一層的板塊佈局
 * NOTE: 位置完全隨機，大小亂數，形狀多樣，旋轉 ±90°
 * @param targetColors 目前的收集目標顏色，用來提升這些顏色出現的機率
 */
export function generateLayer(layerIndex: number, targetColors?: number[]): Tile[] {
  // 增加每層板塊數量到 10~16 個
  const tileCount = randInt(10, 16);
  const tiles: Tile[] = [];

  // 建立顏色池（每層 4~6 種顏色）
  const colorPool: number[] = [];
  const colorCount = randInt(4, Math.min(6, COLOR_COUNT));
  const usedColors = new Set<number>();

  // 將當前的收集目標顏色以高權重加入顏色池（提高出現機率）
  if (targetColors && targetColors.length > 0) {
    targetColors.forEach(c => {
      if (!usedColors.has(c)) {
        // 重複加入 3 次以增加權重
        colorPool.push(c, c, c);
        usedColors.add(c);
      }
    });
  }

  // 隨機補滿其餘顏色
  while (usedColors.size < colorCount) {
    const c = Math.floor(Math.random() * COLOR_COUNT);
    if (!usedColors.has(c)) {
      usedColors.add(c);
      colorPool.push(c);
    }
  }

  // 已放置板塊的中心點（鬆散碰撞檢測）
  const placedCenters: { cx: number; cy: number }[] = [];

  for (let i = 0; i < tileCount; i++) {
    const sizeClass = TILE_SIZES[Math.floor(Math.random() * TILE_SIZES.length)];
    const tileW = randInt(sizeClass.minW, sizeClass.maxW);
    const tileH = randInt(sizeClass.minH, sizeClass.maxH);

    // 隨機位置，允許部分超出盤面邊緣
    let x: number, y: number;
    let attempts = 0;
    const minSpacing = 30;

    do {
      x = randFloat(-tileW * 0.15, BOARD_WIDTH - tileW * 0.85);
      y = randFloat(-tileH * 0.15, BOARD_HEIGHT - tileH * 0.85);
      attempts++;

      const cx = x + tileW / 2;
      const cy = y + tileH / 2;
      const tooClose = placedCenters.some(
        (p) => Math.hypot(p.cx - cx, p.cy - cy) < minSpacing
      );
      if (!tooClose || attempts > 60) break;
    } while (true);

    placedCenters.push({ cx: x + tileW / 2, cy: y + tileH / 2 });

    // 隨機選擇形狀
    const shape = pickRandomShape();

    // 旋轉角度 ±90°
    const rotation = randFloat(-90, 90);

    tiles.push({
      id: uid('tile'),
      x,
      y,
      width: tileW,
      height: tileH,
      layer: layerIndex,
      emotions: generateEmotions(tileW, tileH, colorPool, shape.safeZone),
      borderRadius: shape.borderRadius,
      clipPath: shape.clipPath,
      rotation,
    });
  }

  return tiles;
}

/**
 * 產生初始遊戲盤面（3 層）
 * @param targetColors 初始的收集目標顏色
 */
export function generateInitialBoard(targetColors: number[]): { tiles: Tile[]; nextLayerIndex: number } {
  const allTiles: Tile[] = [];
  for (let i = 0; i < 3; i++) {
    allTiles.push(...generateLayer(i, targetColors));
  }
  return { tiles: allTiles, nextLayerIndex: 3 };
}

/**
 * 重新分配所有可見且未移除的情緒顏色（打亂功能）
 */
export function shuffleEmotions(tiles: Tile[]): Tile[] {
  const emotionRefs: { tileIdx: number; emoIdx: number; colorIndex: number }[] = [];
  tiles.forEach((tile, tileIdx) => {
    tile.emotions.forEach((emo, emoIdx) => {
      if (!emo.removed) {
        emotionRefs.push({ tileIdx, emoIdx, colorIndex: emo.colorIndex });
      }
    });
  });

  const colors = emotionRefs.map((r) => r.colorIndex);
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  const newTiles = tiles.map((t) => ({
    ...t,
    emotions: t.emotions.map((e) => ({ ...e })),
  }));

  emotionRefs.forEach((ref, idx) => {
    newTiles[ref.tileIdx].emotions[ref.emoIdx].colorIndex = colors[idx];
  });

  return newTiles;
}
