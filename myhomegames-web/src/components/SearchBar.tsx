import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CoverPlaceholder from "./CoverPlaceholder";

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

type SearchBarProps = {
  games: GameItem[];
  onGameSelect: (game: GameItem) => void;
};

export default function SearchBar({ games, onGameSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredGames, setFilteredGames] = useState<GameItem[]>([]);
  const [allFilteredGames, setAllFilteredGames] = useState<GameItem[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGames([]);
      setIsOpen(false);
      return;
    }

    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Debug: check if games have date fields
    if (filtered.length > 0) {
      console.log("First filtered game:", filtered[0]);
    }
    setAllFilteredGames(filtered); // Save all results
    setFilteredGames(filtered.slice(0, 10)); // Limit to 10 results
    setIsOpen(true); // Always show dropdown when there's a search query (even if no results)
  }, [searchQuery, games]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClear = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="plex-search-container-wrapper" style={{ position: 'relative', zIndex: 100 }}>
        <div className="plex-search-icon-wrapper">
          <svg
            className="text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            width="16"
            height="16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim() !== "") setIsOpen(true);
          }}
          className="plex-search-input"
          style={{ position: 'relative', zIndex: 101, paddingRight: searchQuery ? '36px' : undefined }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            type="button"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 102,
              color: 'rgba(255, 255, 255, 0.6)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              width="16"
              height="16"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {isOpen && filteredGames.length > 0 && (
        <div 
          className="plex-dropdown" 
          style={{ 
            position: 'absolute',
            top: '100%',
            left: '138px',
            marginTop: '0px',
            zIndex: 50,
            pointerEvents: 'auto',
            maxWidth: '500px',
            width: 'calc(100% - 276px)',
            maxHeight: 'calc(100vh - 150px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {filteredGames.map((game, index) => {
            const showPlaceholder = !game.cover || imageErrors.has(game.ratingKey);

            return (
              <button
                key={game.ratingKey}
                onClick={() => {
                  onGameSelect(game);
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                className="w-full plex-dropdown-item"
                style={{ 
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  alignContent: 'flex-start',
                  gap: '12px',
                  textAlign: 'left',
                  width: 'calc(100% - 32px)',
                  marginLeft: '16px',
                  marginRight: '16px',
                  borderRadius: '8px',
                  borderBottom: index < filteredGames.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  boxSizing: 'border-box'
                }}
              >
                {showPlaceholder ? (
                  <div style={{ width: '48px', height: '72px', minWidth: '48px', minHeight: '72px', flexShrink: 0, alignSelf: 'flex-start' }}>
                    <CoverPlaceholder title={game.title} width={48} height={72} />
                  </div>
                ) : (
                  <img
                    src={game.cover && game.cover.startsWith("http") ? game.cover : `http://127.0.0.1:4000${game.cover || ''}`}
                    alt={game.title}
                    className="object-cover rounded flex-shrink-0"
                    style={{ width: '48px', height: '72px', minWidth: '48px', minHeight: '72px', alignSelf: 'flex-start' }}
                    onError={() => {
                      setImageErrors(prev => new Set(prev).add(game.ratingKey));
                    }}
                  />
                )}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                <div className="text-white text-sm truncate" style={{ fontWeight: 700 }}>{game.title}</div>
                {game.summary && (
                  <div className="text-gray-400 text-xs truncate mt-1" style={{ fontWeight: 400 }}>{game.summary}</div>
                )}
                {(game.year !== null && game.year !== undefined) && (
                  <div className="text-gray-500 text-xs truncate mt-1" style={{ fontWeight: 400 }}>
                    {game.day !== null && game.day !== undefined && game.month !== null && game.month !== undefined
                      ? `${game.day}/${game.month}/${game.year}`
                      : game.year.toString()}
                  </div>
                )}
              </div>
            </button>
            );
          })}
          </div>
          {allFilteredGames.length > 0 && (
            <div style={{ 
              padding: '12px 16px', 
              display: 'flex', 
              justifyContent: 'flex-end',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#1a1a1a',
              flexShrink: 0
            }}>
              <button
                onClick={() => {
                  navigate("/search-results", {
                    state: {
                      searchQuery: searchQuery,
                      games: allFilteredGames
                    }
                  });
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#E5A00D',
                  border: '1px solid #E5A00D',
                  borderRadius: '6px',
                  color: '#000000',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5B041';
                  e.currentTarget.style.borderColor = '#F5B041';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5A00D';
                  e.currentTarget.style.borderColor = '#E5A00D';
                }}
              >
                View all results ({allFilteredGames.length})
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && searchQuery.trim() !== "" && filteredGames.length === 0 && (
        <div 
          className="plex-dropdown" 
          style={{ 
            position: 'absolute',
            top: '100%',
            left: '138px',
            marginTop: '0px',
            zIndex: 50,
            pointerEvents: 'auto',
            maxWidth: '500px',
            width: 'calc(100% - 276px)',
            padding: '16px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem'
          }}
        >
          No results found for the term "{searchQuery}"
        </div>
      )}
    </div>
  );
}

