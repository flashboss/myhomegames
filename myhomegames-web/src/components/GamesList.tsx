import { useState } from "react";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "./CoverPlaceholder";
import "./GamesList.css";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  stars?: number | null;
};

type GamesListProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  isCategory?: boolean;
};

type GameListItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  isCategory?: boolean;
};

function GameListItem({
  game,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
  coverSize,
  itemRefs,
  isCategory = false,
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

  return (
    <div
      key={game.ratingKey}
      ref={(el) => {
        if (el && itemRefs?.current) {
          itemRefs.current.set(game.ratingKey, el);
        }
      }}
      className="group cursor-pointer games-list-item"
      style={{ width: `${coverSize}px`, minWidth: `${coverSize}px` }}
      onClick={() => onGameClick(game)}
    >
      <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-all group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20 games-list-cover">
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
            {isCategory && (
              <div className="games-list-title-overlay">
                <div className="games-list-title-inside">{game.title}</div>
              </div>
            )}
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
      {!isCategory && (
        <div className="truncate games-list-title">{game.title}</div>
      )}
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
  isCategory = false,
}: GamesListProps) {
  const { t } = useTranslation();
  
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <div
      className="games-list-container"
      style={{ gridTemplateColumns: `repeat(auto-fill, ${coverSize}px)` }}
    >
      {games.map((game) => (
        <GameListItem
          key={game.ratingKey}
          game={game}
          apiBase={apiBase}
          onGameClick={onGameClick}
          onPlay={onPlay}
          buildCoverUrl={buildCoverUrl}
          coverSize={coverSize}
          itemRefs={itemRefs}
          isCategory={isCategory}
        />
      ))}
    </div>
  );
}
