import { useState } from "react";
import { useTranslation } from "react-i18next";
import Cover from "./Cover";
import EditGameModal from "./EditGameModal";
import type { GameItem } from "../../types";
import "./GamesList.css";

type GamesListProps = {
  games: GameItem[];
  apiBase: string;
  apiToken?: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  onGameUpdate?: (updatedGame: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  draggable?: boolean;
  onDragEnd?: (sourceIndex: number, destinationIndex: number) => void;
  style?: React.CSSProperties;
  viewMode?: "grid" | "detail" | "table";
};


type GameListItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  onEditClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  draggable?: boolean;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
  viewMode?: "grid" | "detail" | "table";
};

function GameListItem({
  game,
  apiBase,
  onGameClick,
  onPlay,
  onEditClick,
  buildCoverUrl,
  coverSize,
  itemRefs,
  draggable = false,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
  viewMode,
}: GameListItemProps) {
  const coverHeight = coverSize * 1.5;

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(index);
  };

  const handleDragEnd = () => {
    if (!draggable) return;
    onDragEnd();
  };

  const isDragOver = dragOverIndex === index && isDragging;

  return (
    <div
      key={game.ratingKey}
      ref={(el) => {
        if (el && itemRefs?.current) {
          itemRefs.current.set(game.ratingKey, el);
        }
      }}
      className={`group cursor-pointer games-list-item ${draggable ? 'games-list-item-draggable' : ''} ${isDragOver ? 'games-list-item-drag-over' : ''}`}
      style={{ width: `${coverSize}px`, minWidth: `${coverSize}px` }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragLeave={(e) => {
        if (!draggable) return;
        // Only clear dragOver if we're actually leaving the element
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          if (dragOverIndex === index) {
            onDragOver(-1);
          }
        }
      }}
    >
      <Cover
        title={game.title}
        coverUrl={buildCoverUrl(apiBase, game.cover)}
        width={coverSize}
        height={coverHeight}
        onPlay={onPlay ? () => onPlay(game) : undefined}
        onClick={() => onGameClick(game)}
        onEdit={() => onEditClick(game)}
        showTitle={true}
        subtitle={game.year}
        detail={true}
        play={true}
        showBorder={viewMode !== "detail"}
      />
    </div>
  );
}

export default function GamesList({
  games,
  apiBase,
  apiToken,
  onGameClick,
  onPlay,
  onGameUpdate,
  buildCoverUrl,
  coverSize = 150,
  itemRefs,
  draggable = false,
  onDragEnd,
  style,
  viewMode,
}: GamesListProps) {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex && onDragEnd) {
      onDragEnd(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleEditClick = (game: GameItem) => {
    setSelectedGame(game);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedGame(null);
  };

  const handleGameUpdate = (updatedGame: GameItem) => {
    if (onGameUpdate) {
      onGameUpdate(updatedGame);
    }
    handleEditModalClose();
  };
  
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <>
      <div
        className="games-list-container"
        style={{ gridTemplateColumns: `repeat(auto-fill, ${coverSize}px)`, ...style }}
      >
        {games.map((game, index) => (
          <GameListItem
            key={game.ratingKey}
            game={game}
            apiBase={apiBase}
            onGameClick={onGameClick}
            onPlay={onPlay}
            onEditClick={handleEditClick}
            buildCoverUrl={buildCoverUrl}
            coverSize={coverSize}
            itemRefs={itemRefs}
            draggable={draggable}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            isDragging={draggedIndex !== null}
            dragOverIndex={dragOverIndex}
            viewMode={viewMode}
          />
        ))}
      </div>
      {selectedGame && apiToken && (
        <EditGameModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          game={selectedGame}
          apiBase={apiBase}
          apiToken={apiToken}
          onGameUpdate={handleGameUpdate}
        />
      )}
    </>
  );
}
