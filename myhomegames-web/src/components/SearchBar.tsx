import { useState, useEffect, useRef } from "react";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  day?: number | null;
  month?: number | null;
  year?: number | null;
};

type SearchBarProps = {
  games: GameItem[];
  onGameSelect: (game: GameItem) => void;
};

export default function SearchBar({ games, onGameSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredGames, setFilteredGames] = useState<GameItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGames([]);
      setIsOpen(false);
      return;
    }

    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Debug: verifica se i giochi hanno i campi di data
    if (filtered.length > 0) {
      console.log("First filtered game:", filtered[0]);
    }
    setFilteredGames(filtered.slice(0, 10)); // Limit to 10 results
    setIsOpen(filtered.length > 0);
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
            if (filteredGames.length > 0) setIsOpen(true);
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
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          onWheel={(e) => {
            const target = e.currentTarget;
            const isAtTop = target.scrollTop === 0;
            const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
            
            // Se siamo in cima e scrolliamo verso l'alto, o in fondo e scrolliamo verso il basso,
            // permettiamo lo scroll del body
            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
              // Non fermare la propagazione, permettere lo scroll del body
              return;
            }
            // Altrimenti ferma la propagazione per scrollare solo il popup
            e.stopPropagation();
          }}
        >
          {filteredGames.map((game, index) => (
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
              {game.cover && (
                <img
                  src={game.cover.startsWith("http") ? game.cover : `http://127.0.0.1:4000${game.cover}`}
                  alt={game.title}
                  className="object-cover rounded flex-shrink-0"
                  style={{ width: '48px', height: '72px', minWidth: '48px', minHeight: '72px', alignSelf: 'flex-start' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
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
          ))}
        </div>
      )}

      {isOpen && searchQuery.trim() !== "" && filteredGames.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 plex-dropdown p-4 text-center text-gray-400 text-sm z-50">
          No games found
        </div>
      )}
    </div>
  );
}

