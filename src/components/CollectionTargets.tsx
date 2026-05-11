/**
 * 收集目標區域元件
 * NOTE: 顯示 3 個目標泡泡，帶有收集進度和顏色標示
 *       獎勵目標會在左上角顯示 ⏰ 圖示
 */
import React from 'react';
import type { CollectionTarget, CollectEffect, CompletedTargetEffect } from '../types/game';
import { EMOTION_COLORS, EMOTIONS_PER_TARGET } from '../utils/constants';

interface CollectionTargetsProps {
  targets: CollectionTarget[];
  completedEffects: CompletedTargetEffect[];
  collectEffects: CollectEffect[];
}

const CollectionTargets: React.FC<CollectionTargetsProps> = ({
  targets,
  completedEffects,
  collectEffects,
}) => {
  return (
    <div className="collection-targets">
      {targets.map((target) => {
        const colorDef = EMOTION_COLORS[target.colorIndex];

        return (
          <div
            key={target.id}
            className="target-bubble"
            style={{
              position: 'relative',
              background: `linear-gradient(135deg, ${colorDef.color}66, ${colorDef.color}33)`,
              borderColor: `${colorDef.color}aa`,
              boxShadow: `0 2px 12px ${colorDef.glow}33`,
            }}
            >
            {collectEffects
              .filter((effect) => effect.destination === 'target' && effect.slotIndex === targets.indexOf(target))
              .map((effect) => {
                const effectColor = EMOTION_COLORS[effect.colorIndex];
                return (
                  <span
                    key={effect.id}
                    className="collect-stream target-stream"
                    style={{ background: `linear-gradient(90deg, transparent, ${effectColor.color}, white, transparent)` }}
                  />
                );
              })}

            {/* 獎勵目標提示符號 */}
            {target.hasTimeBonus && (
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD93D, #FF8C00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  lineHeight: 1,
                  boxShadow: '0 1px 4px rgba(255, 140, 0, 0.5)',
                  zIndex: 2,
                  animation: 'pulse-glow 1.5s ease-in-out infinite',
                }}
              >
                ⏰
              </div>
            )}

            {/* 收集進度指示點 */}
            <div className="target-dots">
              {Array.from({ length: EMOTIONS_PER_TARGET }).map((_, i) => (
                <div
                  key={i}
                  className={`target-dot ${i < target.collected ? 'filled' : ''}`}
                  style={{
                    backgroundColor:
                      i < target.collected ? colorDef.color : '#6f8286',
                    boxShadow:
                      i < target.collected
                        ? `0 0 6px ${colorDef.glow}88`
                        : 'inset 0 1px 2px rgba(0,0,0,0.1)',
                    border: i < target.collected
                      ? `1px solid ${colorDef.glow}`
                      : '1px solid rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>
            {/* 顏色名稱標籤 */}
            <span
              className="target-label"
              style={{ color: colorDef.glow, fontSize: '10px', fontWeight: 600 }}
            >
              {colorDef.name}
            </span>
          </div>
        );
      })}
      {completedEffects.map((effect) => {
        const colorDef = EMOTION_COLORS[effect.colorIndex];
        return (
          <div
            key={effect.id}
            className="target-complete-effect"
            style={{
              left: effect.slotIndex === 0 ? 2 : effect.slotIndex === 1 ? '50%' : 'calc(100% - 118px)',
              top: effect.slotIndex === 1 ? -6 : 2,
              transform: effect.slotIndex === 1 ? 'translateX(-50%)' : undefined,
              background: `linear-gradient(135deg, ${colorDef.color}aa, ${colorDef.color}55)`,
              borderColor: `${colorDef.color}dd`,
              boxShadow: `0 0 22px ${colorDef.glow}77`,
            }}
          >
            <div className="target-dots">
              {Array.from({ length: EMOTIONS_PER_TARGET }).map((_, i) => (
                <div
                  key={i}
                  className="target-dot filled"
                  style={{
                    backgroundColor: colorDef.color,
                    border: `1px solid ${colorDef.glow}`,
                    boxShadow: `0 0 8px ${colorDef.glow}aa`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollectionTargets;
