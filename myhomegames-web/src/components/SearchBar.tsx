import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;

export default function SearchBar({ games, onGameSelect }: SearchBarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnSearchResultsPage = location.pathname === "/search-results";
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [filteredGames, setFilteredGames] = useState<GameItem[]>([]);
  const [allFilteredGames, setAllFilteredGames] = useState<GameItem[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const searchRef = useRef<HTMLDivElement>(null);

  const saveRecentSearch = useCallback((query: string) => {
    if (query.trim() !== "") {
      setRecentSearches((prev) => {
        const updated = [query.trim(), ...prev.filter(s => s !== query.trim())].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGames([]);
      setAllFilteredGames([]);
      // Show recent searches when focused and query is empty
      if (isFocused) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      return;
    }

    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setAllFilteredGames(filtered); // Save all results
    setFilteredGames(filtered.slice(0, 10)); // Limit to 10 results
    
    // If on search results page, navigate directly instead of showing popup
    if (isOnSearchResultsPage) {
      saveRecentSearch(searchQuery);
      navigate("/search-results", {
        state: {
          searchQuery: searchQuery,
          games: filtered,
        },
        replace: true, // Replace current history entry
      });
      setIsOpen(false);
    } else {
      setIsOpen(true); // Always show dropdown when there's a search query (even if no results)
    }
  }, [searchQuery, games, isFocused, isOnSearchResultsPage, navigate, saveRecentSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClear = () => {
    setSearchQuery("");
    if (isFocused) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleGameSelect = (game: GameItem) => {
    // Save search query to recent searches
    saveRecentSearch(searchQuery);
    onGameSelect(game);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    
    // If on search results page, navigate directly
    if (isOnSearchResultsPage) {
      // Filter games with the selected query
      const filtered = games.filter((game) =>
        game.title.toLowerCase().includes(query.toLowerCase())
      );
      // Save the search
      saveRecentSearch(query);
      // Navigate to search results page
      navigate("/search-results", {
        state: {
          searchQuery: query,
          games: filtered,
        },
      });
      setIsOpen(false);
      setIsFocused(false);
    } else {
      // If not on search results page, show popup
      setIsOpen(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
  };

  const handleBlur = () => {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      setIsFocused(false);
      if (searchQuery.trim() === "") {
        setIsOpen(false);
      }
    }, 200);
  };

  return (
    <div ref={searchRef} className="relative search-bar-container">
      <div className={`plex-search-container-wrapper search-bar-wrapper ${isFocused ? "search-focused" : ""}`}>
        <div className="plex-search-icon-wrapper">
          <svg
            className={isFocused ? "search-icon-focused" : "text-gray-400"}
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={t("search.placeholder")}
          className={`plex-search-input search-input-with-padding ${
            searchQuery ? "has-query" : ""
          } ${isFocused ? "search-input-focused" : ""}`}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              setIsFocused(false);
            } else if (e.key === "Enter" && searchQuery.trim() !== "" && allFilteredGames.length > 0) {
              // Save search query to recent searches
              saveRecentSearch(searchQuery);
              navigate("/search-results", {
                state: {
                  searchQuery: searchQuery,
                  games: allFilteredGames,
                },
              });
              setSearchQuery("");
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

      {isOpen && !isOnSearchResultsPage && filteredGames.length > 0 && (
        <div className="plex-dropdown search-dropdown">
          <div className="search-dropdown-scroll">
            {filteredGames.map((game, index) => {
              const showPlaceholder =
                !game.cover || imageErrors.has(game.ratingKey);

              return (
                <button
                  key={game.ratingKey}
                  onClick={() => {
                    handleGameSelect(game);
                  }}
                  className={`w-full plex-dropdown-item search-dropdown-item ${
                    index < filteredGames.length - 1 ? "has-border" : ""
                  }`}
                >
                  {showPlaceholder ? (
                    <div className="search-result-thumbnail">
                      <CoverPlaceholder
                        title={game.title}
                        width={48}
                        height={72}
                      />
                    </div>
                  ) : (
                    <img
                      src={
                        game.cover && game.cover.startsWith("http")
                          ? game.cover
                          : `http://127.0.0.1:4000${game.cover || ""}`
                      }
                      alt={game.title}
                      className="object-cover rounded flex-shrink-0 search-result-thumbnail"
                      onError={() => {
                        setImageErrors((prev) =>
                          new Set(prev).add(game.ratingKey)
                        );
                      }}
                    />
                  )}
                  <div className="search-result-content">
                    <div className="text-white text-sm truncate search-result-title">
                      {game.title}
                    </div>
                    {game.summary && (
                      <div className="text-gray-400 text-xs truncate mt-1 search-result-summary">
                        {game.summary}
                      </div>
                    )}
                    {game.year !== null && game.year !== undefined && (
                      <div className="text-gray-500 text-xs truncate mt-1 search-result-date">
                        {game.day !== null &&
                        game.day !== undefined &&
                        game.month !== null &&
                        game.month !== undefined
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
                  // Save search query to recent searches
                  saveRecentSearch(searchQuery);
                  navigate("/search-results", {
                    state: {
                      searchQuery: searchQuery,
                      games: allFilteredGames,
                    },
                  });
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                className="search-view-all-button"
              >
                {t("search.viewAllResults", { count: allFilteredGames.length })}
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && !isOnSearchResultsPage && searchQuery.trim() !== "" && filteredGames.length === 0 && (
        <div className="plex-dropdown search-no-results">
          {t("search.noResults", { query: searchQuery })}
        </div>
      )}

      {isOpen && isFocused && searchQuery.trim() === "" && recentSearches.length > 0 && (
        <div className="plex-dropdown search-dropdown">
          <div className="search-dropdown-header">
            {t("search.recentSearches")}
          </div>
          <div className="search-dropdown-scroll">
            {recentSearches.map((query, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(query)}
                className={`w-full plex-dropdown-item search-dropdown-item ${
                  index < recentSearches.length - 1 ? "has-border" : ""
                }`}
              >
                <div className="search-result-content">
                  <div className="text-white text-sm truncate search-result-title">
                    {query}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
