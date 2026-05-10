/**
 * 收集目標區域元件
 * NOTE: 顯示 3 個目標泡泡，帶有收集進度和顏色標示
 */
import React from 'react';
import type { CollectionTarget } from '../types/game';
import { EMOTION_COLORS, EMOTIONS_PER_TARGET } from '../utils/constants';

interface CollectionTargetsProps {
  targets: CollectionTarget[];
}

const CollectionTargets: React.FC<CollectionTargetsProps> = ({ targets }) => {
  return (
    <div className="collection-targets">
      {targets.map((target) => {
        const colorDef = EMOTION_COLORS[target.colorIndex];

        return (
          <div
            key={target.id}
            className="target-bubble"
            style={{
              background: `linear-gradient(135deg, ${colorDef.color}66, ${colorDef.color}33)`,
              borderColor: `${colorDef.color}aa`,
              boxShadow: `0 2px 12px ${colorDef.glow}33`,
            }}
          >
            {/* 收集進度指示點 */}
            <div className="target-dots">
              {Array.from({ length: EMOTIONS_PER_TARGET }).map((_, i) => (
                <div
                  key={i}
                  className={`target-dot ${i < target.collected ? 'filled' : ''}`}
                  style={{
                    backgroundColor:
                      i < target.collected ? colorDef.color : 'rgba(255,255,255,0.3)',
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
    </div>
  );
};

export default CollectionTargets;
