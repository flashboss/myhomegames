import { useState } from "react";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "../common/CoverPlaceholder";
import type { GameItem } from "../../types";
import "./GamesList.css";

type GamesListProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  draggable?: boolean;
  onDragEnd?: (sourceIndex: number, destinationIndex: number) => void;
  style?: React.CSSProperties;
};

type GameListItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
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
};

function GameListItem({
  game,
  apiBase,
  onGameClick,
  onPlay,
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
}: GameListItemProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !game.cover || imageError;
  const coverHeight = coverSize * 1.5;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(game);
    }
  };

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
      onClick={() => onGameClick(game)}
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
      <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden games-list-cover transition-all group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20 cover-hover-effect">
        {showPlaceholder ? (
          <CoverPlaceholder
            title={game.title}
            width={coverSize}
            height={coverHeight}
          />
        ) : (
          <>
            <img
              src={buildCoverUrl(apiBase, game.cover)}
              alt={game.title}
              className="object-cover w-full h-full"
              onError={() => {
                setImageError(true);
              }}
            />
          </>
        )}
        {onPlay && (
          <button
            onClick={handlePlayClick}
            className="games-list-play-button"
            aria-label="Play game"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 5v14l11-7z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="games-list-title-wrapper">
        <div className="truncate games-list-title">{game.title}</div>
        {game.year != null && typeof game.year === 'number' && (
          <div className="games-list-year">{game.year}</div>
        )}
      </div>
    </div>
  );
}

export default function GamesList({
  games,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
  coverSize = 150,
  itemRefs,
  draggable = false,
  onDragEnd,
  style,
}: GamesListProps) {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
  
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
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
        />
      ))}
    </div>
  );
}
