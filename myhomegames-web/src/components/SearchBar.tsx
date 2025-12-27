import { useState, useEffect, useRef } from "react";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
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
          style={{ position: 'relative', zIndex: 101 }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />
      </div>

      {isOpen && filteredGames.length > 0 && (
        <div 
          className="plex-dropdown max-h-96 overflow-y-auto" 
          style={{ 
            position: 'absolute',
            top: '100%',
            left: '138px',
            marginTop: '0px',
            zIndex: 50,
            pointerEvents: 'auto',
            maxWidth: '500px',
            width: 'calc(100% - 276px)'
          }}
        >
          {filteredGames.map((game) => (
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
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {game.cover && (
                <img
                  src={game.cover.startsWith("http") ? game.cover : `http://127.0.0.1:4000${game.cover}`}
                  alt={game.title}
                  className="object-cover rounded flex-shrink-0"
                  style={{ width: '32px', height: '48px', minWidth: '32px', minHeight: '48px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-white text-sm font-medium truncate">{game.title}</div>
                {game.summary && (
                  <div className="text-gray-400 text-xs truncate mt-1">{game.summary}</div>
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

