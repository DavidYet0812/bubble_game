/**
 * 遊戲邏輯工具函式
 * NOTE: 處理遮擋判定、自動收集等核心邏輯
 */
import type { Tile, Emotion, CollectionTarget, StagedEmotion } from '../types/game';
import { COLOR_COUNT, EMOTIONS_PER_TARGET } from './constants';

/**
 * 判斷某個情緒是否被上層遮擋（雙層分組制）
 * NOTE: 每兩層為一組（第1-2層、第3-4層...），同組內的板塊可同時操作。
 *       只有上面那組全部清除後，才能操作下面那組的板塊。
 *       例如：第3-4層消除完 → 第1-2層可操作
 */
export function isEmotionCovered(
  emotion: Emotion,
  ownerTile: Tile,
  allTiles: Tile[]
): boolean {
  if (emotion.removed) return true;

  // 計算此板塊所在的分組（每兩層一組：0-1 = 組0, 2-3 = 組1, 4-5 = 組2...）
  const myGroup = Math.floor(ownerTile.layer / 2);

  // 檢查是否有更高分組的板塊尚未清除
  return allTiles.some((tile) => {
    const tileGroup = Math.floor(tile.layer / 2);
    if (tileGroup <= myGroup) return false;
    // 該板塊是否仍有未移除的情緒
    return tile.emotions.some((e) => !e.removed);
  });
}

/**
 * 檢查板塊是否已清空（所有情緒都已移除）
 */
export function isTileCleared(tile: Tile): boolean {
  return tile.emotions.every((e) => e.removed);
}

/**
 * 檢查某一層的所有板塊是否都已清空
 */
export function isLayerCleared(tiles: Tile[], layerIndex: number): boolean {
  return tiles
    .filter((t) => t.layer === layerIndex)
    .every((t) => isTileCleared(t));
}

/**
 * 取得目前最高的可見層級
 */
export function getTopLayer(tiles: Tile[]): number {
  let maxLayer = -1;
  for (const tile of tiles) {
    if (!isTileCleared(tile) && tile.layer > maxLayer) {
      maxLayer = tile.layer;
    }
  }
  return maxLayer;
}

/**
 * 產生隨機收集目標
 * NOTE: 約 30% 機率成為獎勵目標（完成時額外 +5s）
 */
export function generateTarget(): CollectionTarget {
  return {
    id: `target_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    colorIndex: Math.floor(Math.random() * COLOR_COUNT),
    collected: 0,
    hasTimeBonus: Math.random() < 0.3,
  };
}

/**
 * 產生初始收集目標（3 個不同顏色）
 */
export function generateInitialTargets(): CollectionTarget[] {
  const targets: CollectionTarget[] = [];
  const usedColors = new Set<number>();

  for (let i = 0; i < 3; i++) {
    let colorIndex: number;
    do {
      colorIndex = Math.floor(Math.random() * COLOR_COUNT);
    } while (usedColors.has(colorIndex));
    usedColors.add(colorIndex);
    targets.push({
      id: `target_init_${i}`,
      colorIndex,
      collected: 0,
    });
  }
  return targets;
}

/**
 * 嘗試將情緒收集到目標中
 * @returns 匹配的目標 index，若無匹配則回傳 -1
 */
export function findMatchingTarget(
  colorIndex: number,
  targets: CollectionTarget[]
): number {
  return targets.findIndex(
    (t) => t.colorIndex === colorIndex && t.collected < EMOTIONS_PER_TARGET
  );
}

/**
 * 從臨時整理區自動收集匹配的情緒到新的目標中
 * @returns 更新後的整理區和目標
 */
export function autoCollectFromStaging(
  stagingArea: StagedEmotion[],
  targets: CollectionTarget[]
): {
  newStaging: StagedEmotion[];
  newTargets: CollectionTarget[];
  collectedCount: number;
} {
  const newStaging = [...stagingArea];
  const newTargets = targets.map((t) => ({ ...t }));
  let collectedCount = 0;

  // 反覆掃描整理區，直到沒有可自動收集的
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = newStaging.length - 1; i >= 0; i--) {
      const staged = newStaging[i];
      const targetIdx = findMatchingTarget(staged.colorIndex, newTargets);
      if (targetIdx >= 0) {
        newTargets[targetIdx].collected++;
        newStaging.splice(i, 1);
        collectedCount++;
        changed = true;
      }
    }
  }

  return { newStaging, newTargets, collectedCount };
}
