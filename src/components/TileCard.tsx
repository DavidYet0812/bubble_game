/**
 * 思緒板塊元件（多形狀版）
 * NOTE: 支援兩種形狀渲染方式：
 *   1. border-radius 形狀（blob、圓形、雲朵等）— 直接套用在容器上
 *   2. clip-path 形狀（愛心、星形、菱形等）— 套用在背景層，情緒不被裁切
 */
import React from 'react';
import type { Tile as TileType } from '../types/game';
import EmotionBubble from './EmotionBubble';

interface TileCardProps {
  tile: TileType;
  allTiles: TileType[];
  onEmotionClick: (tileId: string, emotionId: string) => void;
  boardRotation?: number;
}

/** 每層的視覺樣式（色調、透明度、模糊度） */
const LAYER_STYLES: { bg: string; opacity: number; blur: number }[] = [
  { bg: 'rgba(180, 210, 255, 0.95)', opacity: 1, blur: 6 },
  { bg: 'rgba(210, 190, 255, 0.95)', opacity: 1, blur: 8 },
  { bg: 'rgba(255, 210, 225, 0.95)', opacity: 1, blur: 10 },
  { bg: 'rgba(200, 240, 220, 0.95)', opacity: 1, blur: 8 },
  { bg: 'rgba(255, 235, 200, 0.95)', opacity: 1, blur: 8 },
  { bg: 'rgba(220, 200, 240, 0.95)', opacity: 1, blur: 10 },
];

/**
 * 碰撞偵測：沿著旋轉弧線逐步檢查，找到第一個碰撞角度
 * NOTE: 使用邊界圓近似其他板塊，檢測旋轉板塊的四個角是否觸碰
 */
function findCollisionAngle(
  tile: TileType,
  pivotLocalX: number,
  pivotLocalY: number,
  startAngle: number,
  targetAngle: number,
  allTiles: TileType[],
): number {
  const pivotAbsX = tile.x + pivotLocalX;
  const pivotAbsY = tile.y + pivotLocalY;

  // 板塊四個角相對於旋轉中心（圖釘）的偏移量
  const corners = [
    { dx: -pivotLocalX, dy: -pivotLocalY },
    { dx: tile.width - pivotLocalX, dy: -pivotLocalY },
    { dx: -pivotLocalX, dy: tile.height - pivotLocalY },
    { dx: tile.width - pivotLocalX, dy: tile.height - pivotLocalY },
  ];

  // 將其他仍有泡泡的板塊近似為邊界圓
  const obstacles = allTiles
    .filter((t) => t.id !== tile.id && t.emotions.some((e) => !e.removed))
    .map((t) => ({
      cx: t.x + t.width / 2,
      cy: t.y + t.height / 2,
      r: Math.hypot(t.width, t.height) / 2 * 0.42,
    }));

  if (obstacles.length === 0) return targetAngle;

  const totalDelta = targetAngle - startAngle;
  // 每 3 度檢測一次
  const stepCount = Math.max(1, Math.ceil(Math.abs(totalDelta) / 3));

  for (let i = 1; i <= stepCount; i++) {
    const angle = startAngle + (totalDelta * i) / stepCount;
    const rad = (angle * Math.PI) / 180;

    for (const corner of corners) {
      const absX = pivotAbsX + corner.dx * Math.cos(rad) - corner.dy * Math.sin(rad);
      const absY = pivotAbsY + corner.dx * Math.sin(rad) + corner.dy * Math.cos(rad);

      for (const obs of obstacles) {
        if (Math.hypot(absX - obs.cx, absY - obs.cy) < obs.r) {
          // 碰撞！回傳前一步的安全角度
          return startAngle + (totalDelta * (i - 1)) / stepCount;
        }
      }
    }
  }

  return targetAngle;
}

const TileCard: React.FC<TileCardProps> = React.memo(
  ({ tile, allTiles, onEmotionClick, boardRotation = 0 }) => {
    // 檢查剩餘的泡泡數量與狀態
    const activeEmotions = tile.emotions.filter((e) => !e.removed);
    const activeCount = activeEmotions.length;

    // 當 activeCount 變為 0，表示正在掉落
    const isFalling = activeCount === 0;

    const [shouldUnmount, setShouldUnmount] = React.useState(false);

    // 鎖定掉落時的隨機旋轉方向，避免每次 re-render 時值改變導致閃爍
    const fallDirectionRef = React.useRef<number>(Math.random() > 0.5 ? 90 : -90);

    React.useEffect(() => {
      if (isFalling) {
        const timer = setTimeout(() => {
          setShouldUnmount(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }, [isFalling]);

    if (shouldUnmount) return null;

    const layerStyle = LAYER_STYLES[tile.layer % LAYER_STYLES.length];
    const hasClipPath = !!tile.clipPath;

    // 如果只剩下一個泡泡，將旋轉中心設定為該泡泡的中心點，並讓它受到「重力」影響垂下
    let customOrigin = 'center center';
    let gravityRotation = tile.rotation;

    if (activeCount === 1) {
      const lastEmotion = activeEmotions[0];
      const percentX = (lastEmotion.offsetX / tile.width) * 100;
      const percentY = (lastEmotion.offsetY / tile.height) * 100;
      customOrigin = `${percentX}% ${percentY}%`;

      // 物理模擬：計算圖釘到板塊中心的向量，讓中心掉落到圖釘的正下方
      const cx = tile.width / 2;
      const cy = tile.height / 2;
      const dx = cx - lastEmotion.offsetX;
      const dy = cy - lastEmotion.offsetY;

      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      const targetDelta = 90 - currentAngle;
      const targetRotation = tile.rotation + targetDelta;

      // 碰撞偵測：如果旋轉途中碰到其他板塊，就停在碰撞的位置
      gravityRotation = findCollisionAngle(
        tile,
        lastEmotion.offsetX,
        lastEmotion.offsetY,
        tile.rotation,
        targetRotation,
        allTiles,
      );
    }

    // 計算掉落方向：將螢幕正下方 (0, 1) 轉換到 game-board 的本地座標系
    // NOTE: game-board 被旋轉了 boardRotation 度，所以螢幕正下方在 board 本地座標中
    //       需要反向旋轉回來
    const boardRotRad = (boardRotation * Math.PI) / 180;
    const fallDistance = 400;
    const fallDeltaX = Math.sin(boardRotRad) * fallDistance;
    const fallDeltaY = Math.cos(boardRotRad) * fallDistance;

    return (
      <div
        className={`tile-card ${isFalling ? 'falling' : ''}`}
        style={{
          position: 'absolute',
          left: isFalling ? tile.x + fallDeltaX : tile.x,
          top: isFalling ? tile.y + fallDeltaY : tile.y,
          width: tile.width,
          height: tile.height,
          zIndex: tile.layer * 10,
          transform: isFalling
            ? `rotate(${tile.rotation + fallDirectionRef.current}deg) scale(0.8)`
            : `rotate(${gravityRotation}deg)`,
          transformOrigin: customOrigin,
          opacity: isFalling ? 0 : layerStyle.opacity,
          transition: isFalling
            ? 'top 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), left 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), transform 0.8s ease-in, opacity 0.6s ease 0.2s'
            : 'opacity 0.4s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'visible',
          ...(isFalling && { pointerEvents: 'none' as const }),
          // clip-path 形狀使用 filter: drop-shadow 代替 box-shadow
          filter: hasClipPath
            ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.06)) drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
            : undefined,
        }}
      >
        {/* 板塊形狀背景層 */}
        <div
          className="tile-shape-bg"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: layerStyle.bg,
            backdropFilter: `blur(${layerStyle.blur}px)`,
            WebkitBackdropFilter: `blur(${layerStyle.blur}px)`,
            // 根據形狀類型選擇渲染方式
            borderRadius: hasClipPath ? '0' : tile.borderRadius,
            clipPath: tile.clipPath || undefined,
            border: hasClipPath ? 'none' : '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: hasClipPath
              ? 'none'
              : `0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04),
                 inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.03)`,
            overflow: 'hidden',
          }}
        >
          {/* 光澤高光效果 */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '15%',
              width: '40%',
              height: '30%',
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.3), transparent)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* 情緒泡泡（不被 clip-path 裁切，保持在板塊座標內） */}
        {tile.emotions.map((emotion) => (
          <EmotionBubble
            key={emotion.id}
            emotion={emotion}
            ownerTile={tile}
            allTiles={allTiles}
            onClick={onEmotionClick}
            boardRotation={boardRotation}
          />
        ))}
      </div>
    );
  }
);

TileCard.displayName = 'TileCard';

export default TileCard;
