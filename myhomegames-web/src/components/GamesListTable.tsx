import React, { useState } from 'react';
import CoverPlaceholder from './CoverPlaceholder';

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  duration?: number;
  day?: number | null;
  month?: number | null;
  year?: number | null;
  stars?: number | null;
};

type GamesListTableProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
};

export default function GamesListTable({ games, apiBase, onGameClick, buildCoverUrl, coverSize = 150 }: GamesListTableProps) {
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <th style={{ 
              padding: '12px 16px', 
              textAlign: 'left', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>Cover</th>
            <th style={{ 
              padding: '12px 16px', 
              textAlign: 'left', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>Title</th>
            <th style={{ 
              padding: '12px 16px', 
              textAlign: 'left', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>Summary</th>
            <th style={{ 
              padding: '12px 16px', 
              textAlign: 'left', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>Release Date</th>
          </tr>
        </thead>
        <tbody>
          {games.map((it) => {
            const [imageError, setImageError] = useState(false);
            const showPlaceholder = !it.cover || imageError;

            return (
              <tr
                key={it.ratingKey}
                className="cursor-pointer"
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
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
                <td style={{ padding: '12px 16px' }}>
                  <div 
                    className="relative bg-[#2a2a2a] rounded overflow-hidden"
                    style={{ 
                      width: '60px', 
                      height: '90px',
                      minWidth: '60px',
                      minHeight: '90px'
                    }}
                  >
                    {showPlaceholder ? (
                      <CoverPlaceholder title={it.title} width={60} height={90} />
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
                </td>
              <td style={{ 
                padding: '12px 16px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                color: '#f8f8f8'
              }}>
                {it.title}
              </td>
              <td style={{ 
                padding: '12px 16px',
                fontSize: '0.9rem', 
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {it.summary || '-'}
              </td>
              <td style={{ 
                padding: '12px 16px',
                fontSize: '0.85rem', 
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {(it.year !== null && it.year !== undefined) 
                  ? (it.day !== null && it.day !== undefined && it.month !== null && it.month !== undefined
                      ? `${it.day}/${it.month}/${it.year}`
                      : it.year.toString())
                  : '-'}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

