/**
 * 盤面與板塊生成器（多形狀隨機佈局版）
 * NOTE: 支援 blob、圓形、愛心、星形、菱形、六角形、雲朵、葉子等形狀
 *       板塊位置完全隨機、大小亂數、旋轉角度 ±90°
 */
import type { Tile, Emotion } from '../types/game';
import {
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
    let isValid: boolean;

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
  safeZone: number,
  visualKind: Tile['visualKind'] = 'blob',
  fixedCount?: number,
  strokeWidth = 48
): Emotion[] {
  // 根據板塊面積決定泡泡數量（min 4, max 6）
  const effectiveArea = tileW * tileH * safeZone * safeZone;
  let maxEmotions = EMOTIONS_PER_TILE.min;
  if (effectiveArea > 3000) maxEmotions = 5;
  if (effectiveArea > 5000) maxEmotions = 6;
  const count = fixedCount ?? randInt(EMOTIONS_PER_TILE.min, maxEmotions);
  let positions: { offsetX: number; offsetY: number }[];

  if (visualKind === 'ring') {
    const cx = tileW / 2;
    const cy = tileH / 2;
    const radius = Math.min(tileW, tileH) / 2 - strokeWidth / 2;
    const angleOffset = randFloat(-0.2, 0.2);
    positions = Array.from({ length: count }).map((_, i) => {
      const angle = angleOffset + (Math.PI * 2 * i) / count + randFloat(-0.08, 0.08);
      return {
        offsetX: cx + Math.cos(angle) * radius,
        offsetY: cy + Math.sin(angle) * radius,
      };
    });
  } else if (visualKind === 'tube') {
    const pad = Math.max(24, tileH * 0.55);
    positions = Array.from({ length: count }).map((_, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1);
      return {
        offsetX: pad + t * Math.max(1, tileW - pad * 2) + randFloat(-8, 8),
        offsetY: tileH / 2 + randFloat(-tileH * 0.16, tileH * 0.16),
      };
    });
  } else {
    positions = generateEmotionPositions(tileW, tileH, count, safeZone);
  }

  return positions.map((pos) => ({
    id: uid('emo'),
    colorIndex: colorPool[Math.floor(Math.random() * colorPool.length)],
    offsetX: pos.offsetX,
    offsetY: pos.offsetY,
    removed: false,
  }));
}

// ============================================================
// 板塊尺寸配置（增大以容納更多泡泡）
// ============================================================

const JELLY_COLORS = [
  'rgba(255, 164, 176, 0.58)',
  'rgba(176, 151, 255, 0.62)',
  'rgba(221, 255, 141, 0.58)',
  'rgba(139, 229, 255, 0.56)',
  'rgba(255, 185, 101, 0.54)',
  'rgba(194, 240, 255, 0.50)',
];

interface PrototypeTileSpec {
  visualKind: Tile['visualKind'];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  strokeWidth?: number;
  count: number;
}

const PROTOTYPE_LAYOUTS: PrototypeTileSpec[][] = [
  [
    { visualKind: 'ring', x: 10, y: 98, width: 360, height: 360, rotation: -16, color: JELLY_COLORS[0], strokeWidth: 50, count: 15 },
    { visualKind: 'tube', x: 95, y: 145, width: 250, height: 48, rotation: 74, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'tube', x: 76, y: 230, width: 270, height: 46, rotation: -48, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'tube', x: 120, y: 258, width: 260, height: 46, rotation: 50, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'tube', x: 112, y: 350, width: 250, height: 46, rotation: -70, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'blob', x: 235, y: 305, width: 118, height: 70, rotation: -28, color: JELLY_COLORS[2], count: 3 },
  ],
  [
    { visualKind: 'blob', x: 70, y: 170, width: 255, height: 210, rotation: -4, color: JELLY_COLORS[5], count: 8 },
    { visualKind: 'tube', x: -40, y: 360, width: 430, height: 54, rotation: -28, color: JELLY_COLORS[0], count: 7 },
    { visualKind: 'tube', x: 34, y: 250, width: 260, height: 48, rotation: 36, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'tube', x: 118, y: 230, width: 255, height: 48, rotation: -62, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'blob', x: 220, y: 198, width: 112, height: 76, rotation: 20, color: JELLY_COLORS[3], count: 3 },
    { visualKind: 'blob', x: 46, y: 320, width: 122, height: 80, rotation: -18, color: JELLY_COLORS[4], count: 3 },
  ],
  [
    { visualKind: 'blob', x: 58, y: 125, width: 290, height: 285, rotation: 18, color: JELLY_COLORS[5], count: 10 },
    { visualKind: 'blob', x: 112, y: 165, width: 120, height: 92, rotation: 34, color: JELLY_COLORS[4], count: 3 },
    { visualKind: 'blob', x: 218, y: 180, width: 132, height: 102, rotation: -22, color: JELLY_COLORS[3], count: 3 },
    { visualKind: 'tube', x: 78, y: 380, width: 245, height: 48, rotation: 44, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'tube', x: 160, y: 422, width: 180, height: 48, rotation: -52, color: JELLY_COLORS[1], count: 3 },
  ],
  [
    { visualKind: 'ring', x: 18, y: 132, width: 342, height: 342, rotation: 10, color: 'rgba(255, 224, 122, 0.56)', strokeWidth: 50, count: 14 },
    { visualKind: 'tube', x: 80, y: 165, width: 255, height: 48, rotation: -70, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'tube', x: 60, y: 285, width: 260, height: 48, rotation: 38, color: JELLY_COLORS[1], count: 4 },
    { visualKind: 'blob', x: 205, y: 240, width: 130, height: 86, rotation: 18, color: JELLY_COLORS[2], count: 3 },
  ],
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
  const layout = PROTOTYPE_LAYOUTS[layerIndex % PROTOTYPE_LAYOUTS.length];
  const tiles: Tile[] = [];

  // 建立顏色池：目標色佔絕大多數，並加入 1~2 種非目標色作為備用
  // NOTE: 必須有非目標色存在，這樣當目標完成換新目標時，盤面上才有現成顏色可以成為新目標
  const colorPool: number[] = [];
  const usedColors = new Set<number>();

  if (targetColors && targetColors.length > 0) {
    targetColors.forEach(c => {
      if (!usedColors.has(c)) {
        // 目標色權重為 6，確保佔多數
        for (let i = 0; i < 6; i++) colorPool.push(c);
        usedColors.add(c);
      }
    });
  }

  // 隨機加入 1~2 種非目標色（各加 2 次），作為未來的預備目標
  const extraCount = randInt(1, 2);
  let extraAdded = 0;
  let attempts = 0;
  while (extraAdded < extraCount && attempts < 20) {
    const c = Math.floor(Math.random() * COLOR_COUNT);
    if (!usedColors.has(c)) {
      usedColors.add(c);
      colorPool.push(c, c); // 非目標色權重為 2
      extraAdded++;
    }
    attempts++;
  }

  for (const spec of layout) {
    const shape = pickRandomShape();

    tiles.push({
      id: uid('tile'),
      x: spec.x + randFloat(-8, 8),
      y: spec.y + randFloat(-8, 8),
      width: spec.width,
      height: spec.height,
      layer: layerIndex,
      emotions: generateEmotions(
        spec.width,
        spec.height,
        colorPool,
        shape.safeZone,
        spec.visualKind,
        spec.count,
        spec.strokeWidth
      ),
      borderRadius: spec.visualKind === 'tube' ? '999px' : shape.borderRadius,
      clipPath: spec.visualKind === 'blob' ? shape.clipPath : undefined,
      rotation: spec.rotation + randFloat(-6, 6),
      visualKind: spec.visualKind,
      color: spec.color,
      strokeWidth: spec.strokeWidth,
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
