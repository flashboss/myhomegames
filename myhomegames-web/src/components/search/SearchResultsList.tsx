import { useState } from "react";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "../common/CoverPlaceholder";
import "./SearchResultsList.css";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  day?: number | null;
  month?: number | null;
  year?: number | null;
  stars?: number | null;
};

type SearchResultsListProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

type SearchResultItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
};

function SearchResultItem({
  game,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
}: SearchResultItemProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !game.cover || imageError;
  const coverHeight = FIXED_COVER_SIZE * 1.5;

  return (
    <div
      key={game.ratingKey}
      className="group cursor-pointer mb-6 search-results-list-item"
      onClick={() => onGameClick(game)}
    >
      <div
        className="relative bg-[#2a2a2a] rounded overflow-hidden flex-shrink-0 search-results-list-cover"
        style={{
          height: `${coverHeight}px`,
        }}
      >
        {showPlaceholder ? (
          <CoverPlaceholder
            title={game.title}
            width={FIXED_COVER_SIZE}
            height={coverHeight}
          />
        ) : (
          <img
            src={buildCoverUrl(apiBase, game.cover)}
            alt={game.title}
            className="object-cover w-full h-full"
            onError={() => {
              setImageError(true);
            }}
          />
        )}
      </div>
      <div className="search-results-list-content">
        <div className="text-white mb-2 search-results-list-title">
          {game.title}
        </div>
        {game.summary && (
          <div className="text-gray-400 mb-2 search-results-list-summary">
            {game.summary}
          </div>
        )}
        {game.year !== null && game.year !== undefined && (
          <div className="text-gray-500 search-results-list-date">
            {game.day !== null &&
            game.day !== undefined &&
            game.month !== null &&
            game.month !== undefined
              ? `${game.day}/${game.month}/${game.year}`
              : game.year.toString()}
          </div>
        )}
      </div>
      {onPlay && (
        <button
          className="search-results-list-play-button"
          onClick={(e) => {
            e.stopPropagation();
            onPlay(game);
          }}
          aria-label="Play game"
        >
          <svg
            width="20"
            height="20"
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
  );
}

export default function SearchResultsList({
  games,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
}: SearchResultsListProps) {
  const { t } = useTranslation();
  
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <div className="search-results-list-container">
      {games.map((game) => (
        <SearchResultItem
          key={game.ratingKey}
          game={game}
          apiBase={apiBase}
          onGameClick={onGameClick}
          onPlay={onPlay}
          buildCoverUrl={buildCoverUrl}
        />
      ))}
    </div>
  );
}
