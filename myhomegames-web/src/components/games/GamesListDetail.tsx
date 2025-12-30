import { useState } from "react";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "../common/CoverPlaceholder";
import StarRating from "../common/StarRating";
import "./GamesListDetail.css";

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

type GamesListDetailProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

type GameDetailItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  index: number;
};

function GameDetailItem({
  game,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
  itemRefs,
  index,
}: GameDetailItemProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !game.cover || imageError;
  const isEven = index % 2 === 0;
  const coverHeight = FIXED_COVER_SIZE * 1.5;

  const handleCoverClick = (e: React.MouseEvent) => {
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
      className={`group cursor-pointer mb-6 games-list-detail-item ${
        isEven ? "even" : "odd"
      }`}
      onClick={() => onGameClick(game)}
    >
      <div
        className="relative bg-[#2a2a2a] rounded overflow-hidden flex-shrink-0 games-list-detail-cover cover-hover-effect"
        style={{
          height: `${coverHeight}px`,
        }}
        onClick={handleCoverClick}
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
        {onPlay && (
          <button
            onClick={handleCoverClick}
            className="games-list-detail-play-button"
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
      <div className="games-list-detail-content">
        <div className="text-white mb-2 games-list-detail-title">
          {game.title}
        </div>
        {game.summary && (
          <div
            className="text-gray-400 mb-2"
            style={{
              fontSize: "0.95rem",
              lineHeight: "1.5",
            }}
          >
            {game.summary}
          </div>
        )}
        {(game.year !== null && game.year !== undefined) || (game.stars !== null && game.stars !== undefined) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {game.year !== null && game.year !== undefined && (
              <div className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                {game.day !== null &&
                game.day !== undefined &&
                game.month !== null &&
                game.month !== undefined
                  ? `${game.day}/${game.month}/${game.year}`
                  : game.year.toString()}
              </div>
            )}
            {game.stars !== null && game.stars !== undefined && (
              <StarRating rating={(game.stars / 10) * 5} starSize={14} gap={3} />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function GamesListDetail({
  games,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
  itemRefs,
}: GamesListDetailProps) {
  const { t } = useTranslation();
  
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <div className="games-list-detail-container">
      {games.map((game, index) => (
        <GameDetailItem
          key={game.ratingKey}
          game={game}
          apiBase={apiBase}
          onGameClick={onGameClick}
          onPlay={onPlay}
          buildCoverUrl={buildCoverUrl}
          itemRefs={itemRefs}
          index={index}
        />
      ))}
    </div>
  );
}
