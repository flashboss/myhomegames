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
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

type GameListItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

function GameListItem({
  game,
  apiBase,
  onGameClick,
  buildCoverUrl,
  coverSize,
  itemRefs,
}: GameListItemProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !game.cover || imageError;
  const coverHeight = coverSize * 1.5;

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
      <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20">
        {showPlaceholder ? (
          <CoverPlaceholder
            title={game.title}
            width={coverSize}
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
      <div className="truncate games-list-title">{game.title}</div>
    </div>
  );
}

export default function GamesList({
  games,
  apiBase,
  onGameClick,
  buildCoverUrl,
  coverSize = 150,
  itemRefs,
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
          buildCoverUrl={buildCoverUrl}
          coverSize={coverSize}
          itemRefs={itemRefs}
        />
      ))}
    </div>
  );
}
