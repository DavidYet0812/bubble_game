/**
 * 臨時整理區元件
 * NOTE: 顯示暫存的情緒泡泡和剩餘容量，接近滿時有警示動畫
 */
import React from 'react';
import type { CollectEffect, StagedEmotion } from '../types/game';
import { EMOTION_COLORS } from '../utils/constants';

interface StagingAreaProps {
  stagingArea: StagedEmotion[];
  capacity: number;
  collectEffects: CollectEffect[];
}

const StagingArea: React.FC<StagingAreaProps> = ({ stagingArea, capacity, collectEffects }) => {
  const isAlmostFull = stagingArea.length >= capacity - 1;
  const isFull = stagingArea.length >= capacity;

  return (
    <div className={`staging-area ${isAlmostFull ? 'warning' : ''} ${isFull ? 'danger' : ''}`}>
      <div className="staging-slots">
        {Array.from({ length: capacity }).map((_, i) => {
          const staged = stagingArea[i];
          const colorDef = staged ? EMOTION_COLORS[staged.colorIndex] : null;
          const slotEffects = collectEffects.filter(
            (effect) => effect.destination === 'staging' && effect.slotIndex === i
          );

          return (
            <div
              key={i}
              className={`staging-slot ${staged ? 'filled' : 'empty'}`}
              style={{
                background: staged
                  ? `radial-gradient(circle at 35% 35%, ${colorDef!.color}, ${colorDef!.glow})`
                  : '#73878b',
                boxShadow: staged
                  ? `0 1px 6px ${colorDef!.glow}66, inset 0 1px 2px rgba(255,255,255,0.4)`
                  : 'inset 0 1px 3px rgba(0,0,0,0.08)',
                border: staged
                  ? `1.5px solid ${colorDef!.color}cc`
                  : '1.5px solid rgba(255,255,255,0.25)',
              }}
            >
              {slotEffects.map((effect) => {
                const effectColor = EMOTION_COLORS[effect.colorIndex];
                return (
                  <span
                    key={effect.id}
                    className="collect-stream staging-stream"
                    style={{ background: `linear-gradient(90deg, transparent, ${effectColor.color}, white, transparent)` }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="staging-label">
        臨時整理區 {stagingArea.length}/{capacity}
      </div>
    </div>
  );
};

export default StagingArea;
