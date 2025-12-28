import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CoverPlaceholder from "./CoverPlaceholder";
import "./SearchBar.css";

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
    <div ref={searchRef} className="relative search-bar-container">
      <div className="plex-search-container-wrapper search-bar-wrapper">
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
          className={`plex-search-input search-input-with-padding ${searchQuery ? 'has-query' : ''}`}
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
            className="search-clear-button"
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
        <div className="plex-dropdown search-dropdown">
          <div className="search-dropdown-scroll">
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
                className={`w-full plex-dropdown-item search-dropdown-item ${index < filteredGames.length - 1 ? 'has-border' : ''}`}
              >
                {showPlaceholder ? (
                  <div className="search-result-thumbnail">
                    <CoverPlaceholder title={game.title} width={48} height={72} />
                  </div>
                ) : (
                  <img
                    src={game.cover && game.cover.startsWith("http") ? game.cover : `http://127.0.0.1:4000${game.cover || ''}`}
                    alt={game.title}
                    className="object-cover rounded flex-shrink-0 search-result-thumbnail"
                    onError={() => {
                      setImageErrors(prev => new Set(prev).add(game.ratingKey));
                    }}
                  />
                )}
              <div className="search-result-content">
                <div className="text-white text-sm truncate search-result-title">{game.title}</div>
                {game.summary && (
                  <div className="text-gray-400 text-xs truncate mt-1 search-result-summary">{game.summary}</div>
                )}
                {(game.year !== null && game.year !== undefined) && (
                  <div className="text-gray-500 text-xs truncate mt-1 search-result-date">
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
            <div className="search-dropdown-footer">
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
                className="search-view-all-button"
              >
                View all results ({allFilteredGames.length})
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && searchQuery.trim() !== "" && filteredGames.length === 0 && (
        <div className="plex-dropdown search-no-results">
          No results found for the term "{searchQuery}"
        </div>
      )}
    </div>
  );
}

