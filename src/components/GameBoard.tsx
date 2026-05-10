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

  return (
    <div className="game-board-wrapper">
      <div
        className="game-board"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          position: 'relative',
        }}
      >
        {sortedTiles.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            allTiles={tiles}
            onEmotionClick={onEmotionClick}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
