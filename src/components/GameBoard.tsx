/**
 * 遊戲盤面元件
 * NOTE: 渲染所有板塊和情緒泡泡的主要遊戲區域
 */
import React from 'react';
import type { Tile } from '../types/game';
import TileCard from './TileCard';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../utils/constants';

interface GameBoardProps {
  tiles: Tile[];
  onEmotionClick: (tileId: string, emotionId: string) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles, onEmotionClick }) => {
  // 按層級排序渲染（底層先渲染）
  const sortedTiles = [...tiles].sort((a, b) => a.layer - b.layer);

  const [boardRotation, setBoardRotation] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const isDragging = React.useRef(false);
  const lastMousePos = React.useRef<{ x: number; y: number } | null>(null);
  const boardRef = React.useRef<HTMLDivElement>(null);

  // 處理指針按下事件
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 只有點擊到 game-board 且沒有點擊到 bubble 時才啟動拖曳
    if ((e.target as HTMLElement).closest('.emotion-bubble')) return;
    
    isDragging.current = true;
    setDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    // 鎖定滑鼠，防止游標跑出區域時中斷拖曳
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // 處理指針移動事件
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !lastMousePos.current || !boardRef.current) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    // 取得盤面中心點
    const rect = boardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 計算上一點到中心的角度
    const lastAngle = Math.atan2(lastMousePos.current.y - centerY, lastMousePos.current.x - centerX);
    // 計算當前點到中心的角度
    const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);

    // 計算角度差 (弧度轉角度)
    let deltaAngle = (currentAngle - lastAngle) * (180 / Math.PI);

    // 處理跨越 180 到 -180 的邊界問題
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    setBoardRotation((prev) => prev + deltaAngle);
    lastMousePos.current = { x: currentX, y: currentY };
  };

  // 處理指針放開或離開事件
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      setDragging(false);
      lastMousePos.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="game-board-wrapper">
      <div
        ref={boardRef}
        className="game-board"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          position: 'relative',
          transform: `rotate(${boardRotation}deg)`,
          transformOrigin: 'center center',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none', // 防止移動端滾動干擾
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {sortedTiles.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            allTiles={tiles}
            onEmotionClick={onEmotionClick}
            boardRotation={boardRotation}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
