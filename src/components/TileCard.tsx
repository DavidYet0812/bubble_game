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

function closestAngle(target: number, reference: number): number {
  let adjusted = target;
  while (adjusted - reference > 180) adjusted -= 360;
  while (adjusted - reference < -180) adjusted += 360;
  return adjusted;
}

function getPinnedPose(
  tile: TileType,
  pin: { offsetX: number; offsetY: number },
  boardRotation: number,
  referenceRotation: number
) {
  const cx = tile.width / 2;
  const cy = tile.height / 2;
  const dx = cx - pin.offsetX;
  const dy = cy - pin.offsetY;
  const originalRotationRad = (tile.rotation * Math.PI) / 180;
  const rotatedPinFromCenter = {
    x: Math.cos(originalRotationRad) * (pin.offsetX - cx) -
      Math.sin(originalRotationRad) * (pin.offsetY - cy),
    y: Math.sin(originalRotationRad) * (pin.offsetX - cx) +
      Math.cos(originalRotationRad) * (pin.offsetY - cy),
  };
  const rawRotation = Math.atan2(dx, dy) * (180 / Math.PI) - boardRotation;

  return {
    x: tile.x + cx + rotatedPinFromCenter.x - pin.offsetX,
    y: tile.y + cy + rotatedPinFromCenter.y - pin.offsetY,
    rotation: closestAngle(rawRotation, referenceRotation),
  };
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
    const lastPinnedPoseRef = React.useRef<{ x: number; y: number; rotation: number } | null>(null);
    const lastRotationRef = React.useRef(tile.rotation);

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
    const visualKind = tile.visualKind ?? 'blob';
    const tileColor = tile.color ?? layerStyle.bg;

    // 如果只剩下一個泡泡，將旋轉中心設定為該泡泡的中心點，並讓它受到「重力」影響垂下
    let customOrigin = 'center center';
    let gravityRotation = tile.rotation;
    let renderX = tile.x;
    let renderY = tile.y;

    if (activeCount === 1) {
      const lastEmotion = activeEmotions[0];
      const percentX = (lastEmotion.offsetX / tile.width) * 100;
      const percentY = (lastEmotion.offsetY / tile.height) * 100;
      customOrigin = `${percentX}% ${percentY}%`;

      // 物理模擬：計算需要的旋轉角度，使板塊中心掛在圖釘（泡泡）的「螢幕正下方」
      // NOTE: 由於板塊是 game-board 的子元素，game-board 被旋轉了 boardRotation 度，
      //       所以需要減去 boardRotation 來抵銷，讓重力方向永遠指向螢幕正下方
      const pinnedPose = getPinnedPose(tile, lastEmotion, boardRotation, lastRotationRef.current);
      renderX = pinnedPose.x;
      renderY = pinnedPose.y;
      gravityRotation = pinnedPose.rotation;
      lastPinnedPoseRef.current = pinnedPose;
      lastRotationRef.current = gravityRotation;
    }

    // 計算掉落方向：將螢幕正下方 (0, 1) 轉換到 game-board 的本地座標系
    // NOTE: game-board 被旋轉了 boardRotation 度，所以螢幕正下方在 board 本地座標中
    //       需要反向旋轉回來
    const boardRotRad = (boardRotation * Math.PI) / 180;
    const fallDistance = 400;
    const fallDeltaX = Math.sin(boardRotRad) * fallDistance;
    const fallDeltaY = Math.cos(boardRotRad) * fallDistance;
    const fallStartPose =
      lastPinnedPoseRef.current ??
      (tile.fallAnchor
        ? getPinnedPose(tile, tile.fallAnchor, boardRotation, lastRotationRef.current)
        : { x: tile.x, y: tile.y, rotation: closestAngle(tile.rotation, lastRotationRef.current) });

    return (
      <div
        className={`tile-card tile-${visualKind} ${isFalling ? 'falling' : ''}`}
        style={{
          position: 'absolute',
          left: isFalling ? fallStartPose.x + fallDeltaX : renderX,
          top: isFalling ? fallStartPose.y + fallDeltaY : renderY,
          width: tile.width,
          height: tile.height,
          zIndex: tile.layer * 10,
          transform: isFalling
            ? `rotate(${fallStartPose.rotation + fallDirectionRef.current}deg) scale(0.8)`
            : `rotate(${gravityRotation}deg)`,
          transformOrigin: customOrigin,
          opacity: isFalling ? 0 : layerStyle.opacity,
          transition: isFalling
            ? 'top 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), left 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), transform 0.8s ease-in, opacity 0.6s ease 0.2s'
            : `opacity 0.4s ease, transform ${activeCount === 1 ? '0.3s ease-out' : '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'}`,
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
            backgroundColor: visualKind === 'ring' ? 'transparent' : tileColor,
            backdropFilter: `blur(${layerStyle.blur}px)`,
            WebkitBackdropFilter: `blur(${layerStyle.blur}px)`,
            // 根據形狀類型選擇渲染方式
            borderRadius: visualKind === 'ring' ? '50%' : hasClipPath ? '0' : tile.borderRadius,
            clipPath: tile.clipPath || undefined,
            border: visualKind === 'ring'
              ? `${tile.strokeWidth ?? 48}px solid ${tileColor}`
              : hasClipPath ? 'none' : '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: hasClipPath
              ? 'none'
              : visualKind === 'ring'
                ? `0 12px 28px rgba(60, 100, 125, 0.14), inset 0 0 20px rgba(255,255,255,0.45)`
                : `0 6px 18px rgba(66, 118, 135, 0.12), 0 1px 3px rgba(0,0,0,0.04),
                   inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -8px 18px rgba(80,130,160,0.08)`,
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
