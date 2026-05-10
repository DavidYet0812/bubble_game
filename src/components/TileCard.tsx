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

const TileCard: React.FC<TileCardProps> = React.memo(
  ({ tile, allTiles, onEmotionClick, boardRotation = 0 }) => {
    // 檢查剩餘的泡泡數量與狀態
    const activeEmotions = tile.emotions.filter((e) => !e.removed);
    const activeCount = activeEmotions.length;

    // 當 activeCount 變為 0，且元件仍在渲染時，表示正在掉落
    const isFalling = activeCount === 0;

    // 如果沒有情緒且沒有在掉落（可能在第一次渲染就是空的，通常不會發生），或者掉落動畫已結束
    const [shouldUnmount, setShouldUnmount] = React.useState(false);

    React.useEffect(() => {
      if (isFalling) {
        // 設定定時器，在掉落動畫結束後解除掛載 (動畫設定 0.8s)
        const timer = setTimeout(() => {
          setShouldUnmount(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }, [isFalling]);

    if (shouldUnmount) return null;

    const layerStyle = LAYER_STYLES[tile.layer % LAYER_STYLES.length];
    const hasClipPath = !!tile.clipPath;

    // 如果只剩下一個泡泡，將旋轉中心設定為該泡泡的中心點
    let customOrigin = 'center center';
    if (activeCount === 1) {
      const lastEmotion = activeEmotions[0];
      const percentX = (lastEmotion.offsetX / tile.width) * 100;
      const percentY = (lastEmotion.offsetY / tile.height) * 100;
      customOrigin = `${percentX}% ${percentY}%`;
    }

    return (
      <div
        className={`tile-card ${isFalling ? 'falling' : ''}`}
        style={{
          position: 'absolute',
          left: tile.x,
          top: tile.y,
          width: tile.width,
          height: tile.height,
          zIndex: tile.layer * 10,
          transform: `rotate(${tile.rotation}deg)`,
          transformOrigin: customOrigin,
          opacity: isFalling ? 0 : layerStyle.opacity,
          transition: isFalling 
            ? 'transform 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 0.6s ease 0.2s'
            : 'opacity 0.4s ease',
          overflow: 'visible',
          // 掉落動畫：往下掉並旋轉（分離旋轉與位移，確保永遠往正下方掉落）
          ...(isFalling && {
            transform: `translate(0px, 300px) rotate(${tile.rotation + (Math.random() > 0.5 ? 60 : -60)}deg) scale(0.8)`,
            pointerEvents: 'none',
          }),
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
            ownerTile={{...tile, rotation: isFalling ? tile.rotation : tile.rotation}} // 確保 props 更新
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
