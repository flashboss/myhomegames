import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "../common/CoverPlaceholder";
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

type CollectionItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

type SearchBarProps = {
  games: GameItem[];
  collections: CollectionItem[];
  onGameSelect: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
};

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;

export default function SearchBar({ games, collections, onGameSelect, onPlay }: SearchBarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnSearchResultsPage = location.pathname === "/search-results";
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [filteredGames, setFilteredGames] = useState<GameItem[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<CollectionItem[]>([]);
  const [allFilteredGames, setAllFilteredGames] = useState<GameItem[]>([]);
  const [allFilteredCollections, setAllFilteredCollections] = useState<CollectionItem[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);
  const isSelectingGameRef = useRef(false);

  const saveRecentSearch = useCallback((query: string) => {
    if (query.trim() !== "") {
      setRecentSearches((prev) => {
        const updated = [query.trim(), ...prev.filter(s => s !== query.trim())].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  // Remove focus from searchbox when arriving at search results page
  useEffect(() => {
    if (isOnSearchResultsPage) {
      setIsFocused(false);
      setIsOpen(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, [isOnSearchResultsPage]);

  useEffect(() => {
    // Don't update if we're in the process of closing or selecting a game
    if (isClosing || isSelectingGameRef.current) {
      return;
    }
    
    if (searchQuery.trim() === "") {
      setFilteredGames([]);
      setFilteredCollections([]);
      setAllFilteredGames([]);
      setAllFilteredCollections([]);
      // Show recent searches when focused and query is empty
      if (isFocused) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      return;
    }

    const queryLower = searchQuery.toLowerCase();
    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(queryLower)
    );
    const filteredCols = collections.filter((collection) =>
      collection.title.toLowerCase().includes(queryLower)
    );
    
    setAllFilteredGames(filtered); // Save all results
    setAllFilteredCollections(filteredCols); // Save all collection results
    setFilteredGames(filtered.slice(0, 10)); // Limit to 10 results
    setFilteredCollections(filteredCols.slice(0, 10)); // Limit to 10 collection results
    
    // If on search results page, navigate directly instead of showing popup
    if (isOnSearchResultsPage) {
      saveRecentSearch(searchQuery);
      navigate("/search-results", {
        state: {
          searchQuery: searchQuery,
          games: filtered,
          collections: filteredCols,
        },
        replace: true, // Replace current history entry
      });
      setIsOpen(false);
    } else {
      // Only open if focused and not closing
      if (isFocused && !isClosing) {
        setIsOpen(true); // Always show dropdown when there's a search query (even if no results)
      }
    }
  }, [searchQuery, games, collections, isFocused, isOnSearchResultsPage, navigate, saveRecentSearch, isClosing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        // Mark that we're closing FIRST, before anything else
        setIsClosing(true);
        
        // Clear any pending blur timeout immediately
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
        
        // Close both popup and searchbox together immediately
        setIsOpen(false);
        setIsFocused(false);
        
        // Also blur the input to remove focus
        if (inputRef.current) {
          inputRef.current.blur();
        }
        
        // Reset the flag after blur timeout would have passed
        setTimeout(() => {
          setIsClosing(false);
        }, 300);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Mark that we're closing FIRST
        setIsClosing(true);
        
        // Clear any pending blur timeout
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
        
        // Close both popup and searchbox together
        setIsOpen(false);
        setIsFocused(false);
        // Also blur the input to remove focus
        if (inputRef.current) {
          inputRef.current.blur();
        }
        
        // Reset the flag after a short delay
        setTimeout(() => {
          setIsClosing(false);
        }, 300);
      }
    }

    // Use pointerdown to catch it as early as possible, before blur
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
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
    // Mark that we're selecting a game to prevent popup from reopening
    isSelectingGameRef.current = true;
    
    // Save search query to recent searches
    saveRecentSearch(searchQuery);
    onGameSelect(game);
    
    // Close everything
    setIsOpen(false);
    setIsFocused(false);
    setSearchQuery("");
    
    // Blur the input to remove focus
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Reset the flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isSelectingGameRef.current = false;
    }, 100);
  };

  const handleRemoveRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
    // Keep popup open by refocusing the input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    
    // If on search results page, navigate directly
    if (isOnSearchResultsPage) {
      // Filter games and collections with the selected query
      const queryLower = query.toLowerCase();
      const filtered = games.filter((game) =>
        game.title.toLowerCase().includes(queryLower)
      );
      const filteredCols = collections.filter((collection) =>
        collection.title.toLowerCase().includes(queryLower)
      );
      // Save the search
      saveRecentSearch(query);
      // Navigate to search results page
      navigate("/search-results", {
        state: {
          searchQuery: query,
          games: filtered,
          collections: filteredCols,
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If we're already closing, don't do anything
    if (isClosing) {
      return;
    }
    
    // Check if the related target (where focus is going) is inside our container
    const relatedTarget = e.relatedTarget as Node | null;
    const isClickingInside = relatedTarget && searchRef.current?.contains(relatedTarget);
    
    // If clicking inside (e.g., on a dropdown item), keep the popup open
    if (isClickingInside) {
      return;
    }
    
    // Don't close on blur - let click outside handle it
    // Just update focus state after a delay to allow clicks on dropdown items
    blurTimeoutRef.current = setTimeout(() => {
      if (!isClosing) {
        setIsFocused(false);
      }
      blurTimeoutRef.current = null;
    }, 150);
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
          ref={inputRef}
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
            } else if (e.key === "Enter" && searchQuery.trim() !== "" && (allFilteredGames.length > 0 || allFilteredCollections.length > 0)) {
              // Save search query to recent searches
              saveRecentSearch(searchQuery);
              navigate("/search-results", {
                state: {
                  searchQuery: searchQuery,
                  games: allFilteredGames,
                  collections: allFilteredCollections,
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

      {isOpen && !isOnSearchResultsPage && searchQuery.trim() !== "" && (filteredGames.length > 0 || filteredCollections.length > 0) && (
        <div className="plex-dropdown search-dropdown">
          <div className="search-dropdown-scroll">
            {filteredCollections.map((collection, index) => {
              const showPlaceholder =
                !collection.cover || imageErrors.has(collection.ratingKey);

              return (
                <div
                  key={`collection-${collection.ratingKey}`}
                  onClick={() => {
                    navigate(`/collections/${collection.ratingKey}`);
                    setIsOpen(false);
                    setIsFocused(false);
                    setSearchQuery("");
                  }}
                  className={`w-full plex-dropdown-item search-dropdown-item ${
                    index < filteredCollections.length - 1 || filteredGames.length > 0 ? "has-border" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/collections/${collection.ratingKey}`);
                      setIsOpen(false);
                      setIsFocused(false);
                      setSearchQuery("");
                    }
                  }}
                >
                  {showPlaceholder ? (
                    <div className="search-result-thumbnail">
                      <CoverPlaceholder title={collection.title} width={40} height={60} />
                    </div>
                  ) : (
                    <img
                      src={
                        collection.cover && collection.cover.startsWith("http")
                          ? collection.cover
                          : `http://127.0.0.1:4000${collection.cover || ""}`
                      }
                      alt={collection.title}
                      className="object-cover rounded flex-shrink-0 search-result-thumbnail"
                      onError={() => {
                        setImageErrors((prev) => new Set(prev).add(collection.ratingKey));
                      }}
                    />
                  )}
                  <div className="search-result-content">
                    <div className="text-white text-base truncate search-result-title">
                      {collection.title}
                    </div>
                    <div className="text-gray-400 text-sm truncate mt-1 search-result-type">
                      {t("search.collection")}
                    </div>
                  </div>
                  {onPlay && (
                    <button
                      className="search-result-play-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(collection);
                      }}
                      aria-label="Play collection"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 5v14l11-7z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
            {filteredGames.map((game, index) => {
              const showPlaceholder =
                !game.cover || imageErrors.has(game.ratingKey);

              return (
                <div
                  key={game.ratingKey}
                  onClick={() => {
                    handleGameSelect(game);
                  }}
                  className={`w-full plex-dropdown-item search-dropdown-item ${
                    index < filteredGames.length - 1 ? "has-border" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleGameSelect(game);
                    }
                  }}
                >
                  {showPlaceholder ? (
                    <div className="search-result-thumbnail">
                      <CoverPlaceholder
                        title={game.title}
                        width={60}
                        height={90}
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
                    <div className="text-white text-base truncate search-result-title">
                      {game.title}
                    </div>
                    {game.year !== null && game.year !== undefined && (
                      <div className="text-gray-500 text-sm truncate mt-1 search-result-date">
                        {game.day !== null &&
                        game.day !== undefined &&
                        game.month !== null &&
                        game.month !== undefined
                          ? `${game.day}/${game.month}/${game.year}`
                          : game.year.toString()}
                      </div>
                    )}
                  </div>
                  {onPlay && (
                    <button
                      className="search-result-play-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(game);
                      }}
                      aria-label="Play game"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 5v14l11-7z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {(allFilteredGames.length > 0 || allFilteredCollections.length > 0) && (
            <div className="search-dropdown-footer">
              <button
                onClick={() => {
                  // Save search query to recent searches
                  saveRecentSearch(searchQuery);
                  navigate("/search-results", {
                    state: {
                      searchQuery: searchQuery,
                      games: allFilteredGames,
                      collections: allFilteredCollections,
                    },
                  });
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                className="search-view-all-button"
              >
                {t("search.viewAllResults", { count: allFilteredGames.length + allFilteredCollections.length })}
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
                className={`w-full plex-dropdown-item search-dropdown-item search-recent-item ${
                  index < recentSearches.length - 1 ? "has-border" : ""
                }`}
              >
                <svg
                  className="search-recent-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div className="search-result-content">
                  <div className="text-white text-base truncate search-result-title">
                    {query}
                  </div>
                </div>
                <button
                  className="search-recent-remove"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => handleRemoveRecentSearch(query, e)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
