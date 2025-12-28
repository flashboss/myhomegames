import { useState } from 'react';
import CoverPlaceholder from './CoverPlaceholder';

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  duration?: number;
  stars?: number | null;
};

type GamesListProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
};

export default function GamesList({ games, apiBase, onGameClick, buildCoverUrl, coverSize = 150 }: GamesListProps) {
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  const coverHeight = coverSize * 1.5;

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(auto-fill, ${coverSize}px)`, gap: '40px', justifyContent: 'center' }}>
      {games.map((it) => {
        const [imageError, setImageError] = useState(false);
        const showPlaceholder = !it.cover || imageError;

        return (
          <div
            key={it.ratingKey}
            className="group cursor-pointer"
            style={{ width: `${coverSize}px`, minWidth: `${coverSize}px`, flexShrink: 0 }}
            onClick={() => onGameClick(it)}
          >
            <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20">
              {showPlaceholder ? (
                <CoverPlaceholder title={it.title} width={coverSize} height={coverHeight} />
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
            <div className="truncate" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: '0.85rem', fontWeight: 500, color: '#f8f8f8', backgroundColor: 'transparent', padding: 0 }}>
              {it.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

