import { useState } from "react";
import CoverPlaceholder from "./CoverPlaceholder";
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
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

export default function GamesListDetail({
  games,
  apiBase,
  onGameClick,
  buildCoverUrl,
  itemRefs,
}: GamesListDetailProps) {
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  const coverHeight = FIXED_COVER_SIZE * 1.5;

  return (
    <div className="games-list-detail-container">
      {games.map((it, index) => {
        const [imageError, setImageError] = useState(false);
        const showPlaceholder = !it.cover || imageError;
        const isEven = index % 2 === 0;

        return (
          <div
            key={it.ratingKey}
            ref={(el) => {
              if (el && itemRefs?.current) {
                itemRefs.current.set(it.ratingKey, el);
              }
            }}
            className={`group cursor-pointer mb-6 games-list-detail-item ${
              isEven ? "even" : "odd"
            }`}
            onClick={() => onGameClick(it)}
          >
            <div
              className="relative bg-[#2a2a2a] rounded overflow-hidden flex-shrink-0 games-list-detail-cover"
              style={{
                height: `${coverHeight}px`,
              }}
            >
              {showPlaceholder ? (
                <CoverPlaceholder
                  title={it.title}
                  width={FIXED_COVER_SIZE}
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
            <div className="games-list-detail-content">
              <div className="text-white mb-2 games-list-detail-title">
                {it.title}
              </div>
              {it.summary && (
                <div
                  className="text-gray-400 mb-2"
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.5",
                  }}
                >
                  {it.summary}
                </div>
              )}
              {it.year !== null && it.year !== undefined && (
                <div className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                  {it.day !== null &&
                  it.day !== undefined &&
                  it.month !== null &&
                  it.month !== undefined
                    ? `${it.day}/${it.month}/${it.year}`
                    : it.year.toString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
