/**
 * 情緒泡泡元件（改進版）
 * NOTE: 使用 SVG 繪製可愛表情，確保跨平台一致性
 */
import React, { useCallback } from 'react';
import type { Emotion, Tile } from '../types/game';
import { EMOTION_COLORS, EMOTION_RADIUS } from '../utils/constants';
import { isEmotionCovered } from '../utils/game-logic';
import { soundManager } from '../utils/sound-manager';

interface EmotionBubbleProps {
  emotion: Emotion;
  ownerTile: Tile;
  allTiles: Tile[];
  onClick: (tileId: string, emotionId: string) => void;
  boardRotation?: number;
}

/** 用 SVG 繪製可愛表情臉 */
function CuteFace({ covered }: { covered: boolean }) {
  if (covered) return null;
  const size = EMOTION_RADIUS * 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* 眼睛 */}
      <circle cx="11" cy="13" r="2.2" fill="#2d3436" />
      <circle cx="21" cy="13" r="2.2" fill="#2d3436" />
      {/* 高光 */}
      <circle cx="12" cy="12" r="0.8" fill="white" />
      <circle cx="22" cy="12" r="0.8" fill="white" />
      {/* 微笑 */}
      <path
        d="M11 19 Q16 23 21 19"
        stroke="#2d3436"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* 腮紅 */}
      <circle cx="8" cy="18" r="2.5" fill="rgba(255,150,150,0.3)" />
      <circle cx="24" cy="18" r="2.5" fill="rgba(255,150,150,0.3)" />
    </svg>
  );
}

const EmotionBubble: React.FC<EmotionBubbleProps> = React.memo(
  ({ emotion, ownerTile, allTiles, onClick, boardRotation = 0 }) => {
    const covered = isEmotionCovered(emotion, ownerTile, allTiles);
    const colorDef = EMOTION_COLORS[emotion.colorIndex];
    const size = EMOTION_RADIUS * 2;

    const handleClick = useCallback(() => {
      if (!covered) {
        soundManager.playBubblePop(emotion.colorIndex);
        onClick(ownerTile.id, emotion.id);
      }
    }, [covered, ownerTile.id, emotion.id, emotion.colorIndex, onClick]);

    if (emotion.removed) return null;

    // 額外的觸控熱區大小（像素）
    const touchPadding = 6;

    return (
      <div
        className={`emotion-bubble ${covered ? 'covered' : 'exposed'}`}
        style={{
          position: 'absolute',
          // 擴大點擊範圍：往外擴展 touchPadding 像素
          left: emotion.offsetX - EMOTION_RADIUS - touchPadding,
          top: emotion.offsetY - EMOTION_RADIUS - touchPadding,
          width: size + touchPadding * 2,
          height: size + touchPadding * 2,
          // 背景繪製在內部圓形區域
          background: 'transparent',
          borderRadius: '50%',
          cursor: covered ? 'default' : 'pointer',
          // 抵銷板塊本身的旋轉與整個盤面的旋轉
          '--counter-rot': `${-(ownerTile.rotation + boardRotation)}deg`,
          transition: 'all 0.25s ease',
          zIndex: covered ? 0 : 1,
          overflow: 'visible',
        } as React.CSSProperties}
        // 使用 onPointerDown 取代 onClick，觸控反應更快
        onPointerDown={handleClick}
      >
        {/* 實際可見的泡泡圓形 */}
        <div
          style={{
            position: 'absolute',
            left: touchPadding,
            top: touchPadding,
            width: size,
            height: size,
            background: `radial-gradient(circle at 35% 35%, ${colorDef.color}ee, ${colorDef.glow}cc)`,
            boxShadow: covered
              ? 'inset 0 1px 3px rgba(0,0,0,0.1)'
              : `0 2px 8px ${colorDef.glow}88, 0 0 12px ${colorDef.glow}44, inset 0 -3px 6px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.4)`,
            borderRadius: '50%',
            opacity: covered ? 0.35 : 1,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
        {/* 光澤高光 */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '35%',
            height: '25%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.6), transparent)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <CuteFace covered={covered} />
        </div>
      </div>
    );
  }
);

EmotionBubble.displayName = 'EmotionBubble';

export default EmotionBubble;
