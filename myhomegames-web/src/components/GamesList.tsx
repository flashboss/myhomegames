import { useState } from "react";
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

export default function GamesList({
  games,
  apiBase,
  onGameClick,
  buildCoverUrl,
  coverSize = 150,
  itemRefs,
}: GamesListProps) {
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  const coverHeight = coverSize * 1.5;

  return (
    <div
      className="games-list-container"
      style={{ gridTemplateColumns: `repeat(auto-fill, ${coverSize}px)` }}
    >
      {games.map((it) => {
        const [imageError, setImageError] = useState(false);
        const showPlaceholder = !it.cover || imageError;

        return (
          <div
            key={it.ratingKey}
            ref={(el) => {
              if (el && itemRefs?.current) {
                itemRefs.current.set(it.ratingKey, el);
              }
            }}
            className="group cursor-pointer games-list-item"
            style={{ width: `${coverSize}px`, minWidth: `${coverSize}px` }}
            onClick={() => onGameClick(it)}
          >
            <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20">
              {showPlaceholder ? (
                <CoverPlaceholder
                  title={it.title}
                  width={coverSize}
                  height={coverHeight}
                />
              ) : (
                <img
                  src={buildCoverUrl(apiBase, it.cover)}
                  alt={it.title}
                  className="object-cover w-full h-full"
                  onError={() => {
                    setImageError(true);
                  }}
                />
              )}
            </div>
            <div className="truncate games-list-title">{it.title}</div>
          </div>
        );
      })}
    </div>
  );
}
