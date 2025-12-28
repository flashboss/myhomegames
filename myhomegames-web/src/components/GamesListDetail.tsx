import { useState } from 'react';
import CoverPlaceholder from './CoverPlaceholder';

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
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

export default function GamesListDetail({ games, apiBase, onGameClick, buildCoverUrl }: GamesListDetailProps) {
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  const coverHeight = FIXED_COVER_SIZE * 1.5;

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px' }}>
      {games.map((it, index) => {
        const [imageError, setImageError] = useState(false);
        const showPlaceholder = !it.cover || imageError;
        const isEven = index % 2 === 0;
        const baseBackgroundColor = isEven ? 'transparent' : 'rgba(255, 255, 255, 0.02)';

        return (
          <div
            key={it.ratingKey}
            className="group cursor-pointer mb-6"
            style={{ 
              display: 'flex',
              flexDirection: 'row',
              gap: '20px',
              padding: '16px',
              borderRadius: '8px',
              transition: 'background-color 0.2s ease',
              backgroundColor: baseBackgroundColor
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = baseBackgroundColor;
            }}
            onClick={() => onGameClick(it)}
          >
            <div 
              className="relative bg-[#2a2a2a] rounded overflow-hidden flex-shrink-0"
              style={{ 
                width: `${FIXED_COVER_SIZE}px`, 
                height: `${coverHeight}px`,
                minWidth: `${FIXED_COVER_SIZE}px`,
                minHeight: `${coverHeight}px`
              }}
            >
              {showPlaceholder ? (
                <CoverPlaceholder title={it.title} width={FIXED_COVER_SIZE} height={coverHeight} />
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div 
              className="text-white mb-2"
              style={{ 
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', 
                fontSize: '1.2rem', 
                fontWeight: 600, 
                color: '#f8f8f8'
              }}
            >
              {it.title}
            </div>
            {it.summary && (
              <div 
                className="text-gray-400 mb-2"
                style={{ 
                  fontSize: '0.95rem', 
                  lineHeight: '1.5'
                }}
              >
                {it.summary}
              </div>
            )}
            {(it.year !== null && it.year !== undefined) && (
              <div 
                className="text-gray-500"
                style={{ fontSize: '0.85rem' }}
              >
                {it.day !== null && it.day !== undefined && it.month !== null && it.month !== undefined
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

