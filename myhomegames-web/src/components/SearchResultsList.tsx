import React, { useState } from 'react';
import CoverPlaceholder from './CoverPlaceholder';
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
  buildCoverUrl: (apiBase: string, cover?: string) => string;
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

export default function SearchResultsList({ games, apiBase, onGameClick, buildCoverUrl }: SearchResultsListProps) {
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  const coverHeight = FIXED_COVER_SIZE * 1.5;

  return (
    <div className="search-results-list-container">
      {games.map((it) => {
        const [imageError, setImageError] = useState(false);
        const showPlaceholder = !it.cover || imageError;

        return (
          <div
            key={it.ratingKey}
            className="group cursor-pointer mb-6 search-results-list-item"
            onClick={() => onGameClick(it)}
          >
            <div 
              className="relative bg-[#2a2a2a] rounded overflow-hidden flex-shrink-0 search-results-list-cover"
              style={{ 
                height: `${coverHeight}px`
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
          <div className="search-results-list-content">
            <div className="text-white mb-2 search-results-list-title">
              {it.title}
            </div>
            {it.summary && (
              <div className="text-gray-400 mb-2 search-results-list-summary">
                {it.summary}
              </div>
            )}
            {(it.year !== null && it.year !== undefined) && (
              <div className="text-gray-500 search-results-list-date">
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

