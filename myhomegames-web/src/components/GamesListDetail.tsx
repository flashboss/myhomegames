import React from 'react';

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  duration?: number;
  day?: number | null;
  month?: number | null;
  year?: number | null;
};

type GamesListDetailProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
};

export default function GamesListDetail({ games, apiBase, onGameClick, buildCoverUrl, coverSize = 150 }: GamesListDetailProps) {
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px' }}>
      {games.map((it) => (
        <div
          key={it.ratingKey}
          className="group cursor-pointer mb-6"
          style={{ 
            display: 'flex',
            flexDirection: 'row',
            gap: '20px',
            padding: '16px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => onGameClick(it)}
        >
          <div 
            className="relative bg-[#2a2a2a] rounded overflow-hidden flex-shrink-0"
            style={{ 
              width: `${coverSize}px`, 
              height: `${coverSize * 1.5}px`,
              minWidth: `${coverSize}px`,
              minHeight: `${coverSize * 1.5}px`
            }}
          >
            {it.cover ? (
              <img
                src={buildCoverUrl(apiBase, it.cover)}
                alt={it.title}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-500 text-4xl">🎮</div>
              </div>
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
      ))}
    </div>
  );
}

