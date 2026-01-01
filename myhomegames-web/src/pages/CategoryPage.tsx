import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import GamesList from "../components/games/GamesList";
import GamesListDetail from "../components/games/GamesListDetail";
import GamesListTable from "../components/games/GamesListTable";
import AlphabetNavigator from "../components/ui/AlphabetNavigator";
import GamesListToolbar from "../components/games/GamesListToolbar";
import LibrariesBar, { type ViewMode } from "../components/layout/LibrariesBar";
import type { FilterField } from "../components/filters/types";
import { compareTitles } from "../utils/stringUtils";
import type { GameItem } from "../types";

type CategoryPageProps = {
  apiBase: string;
  apiToken: string;
  onGameClick: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
  onPlay?: (game: GameItem) => void;
  buildApiUrl: (apiBase: string, path: string, params?: Record<string, string | number | boolean>) => string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
};

export default function CategoryPage({
  apiBase,
  apiToken,
  onGameClick,
  onGamesLoaded,
  onPlay,
  buildApiUrl,
  buildCoverUrl,
}: CategoryPageProps) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const coverSize = (() => {
    const saved = localStorage.getItem("coverSize");
    return saved ? parseInt(saved, 10) : 150;
  })();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("viewMode_category");
    return (saved as ViewMode) || "grid";
  });
  const [filterField, setFilterField] = useState<FilterField>("genre");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [allGenres, setAllGenres] = useState<Array<{ id: string; title: string }>>([]);
  const [availableGenres, setAvailableGenres] = useState<Array<{ id: string; title: string }>>([]);
  const [availableCollections, setAvailableCollections] = useState<Array<{ id: string; title: string }>>([]);
  const [collectionGameIds, setCollectionGameIds] = useState<Map<string, string[]>>(new Map());
  const [sortField, setSortField] = useState<"title" | "year" | "stars" | "releaseDate">("title");
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Restore scroll position (use the appropriate ref based on view mode)
  const activeScrollRef = viewMode === "table" ? tableScrollRef : scrollContainerRef;
  useScrollRestoration(activeScrollRef, viewMode);

  useEffect(() => {
    fetchLibraryGames();
    fetchCategories();
    fetchCollections();
  }, []);

  // Hide content until fully rendered
  useLayoutEffect(() => {
    if (!loading && games.length > 0) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    } else if (loading) {
      setIsReady(false);
    }
  }, [loading, games.length]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem("viewMode_category", viewMode);
  }, [viewMode]);

  // Handler to change view mode
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Set genre filter when categoryId changes
  useEffect(() => {
    if (categoryId && allGenres.length > 0) {
      // Find the genre by ID or title
      const genre = allGenres.find((g) => g.id === categoryId || g.title === categoryId);
      if (genre) {
        setSelectedGenre(genre.id);
        setFilterField("genre");
      }
    }
  }, [categoryId, allGenres]);

  async function fetchCategories() {
    try {
      const url = buildApiUrl(apiBase, "/categories");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.categories || []) as any[];
      const parsed = items.map((v) => ({
        id: v.id,
        title: v.title,
      }));
      setAllGenres(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching categories:", errorMessage);
    }
  }

  async function fetchCollections() {
    try {
      const url = buildApiUrl(apiBase, "/collections");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.collections || []) as any[];
      const parsed = items.map((v) => ({
        id: v.id,
        title: v.title,
      }));
      setAvailableCollections(parsed);

      // Fetch game IDs for each collection
      const gameIdsMap = new Map<string, string[]>();
      for (const collection of parsed) {
        try {
          const gamesUrl = buildApiUrl(apiBase, `/collections/${collection.id}/games`);
          const gamesRes = await fetch(gamesUrl, {
            headers: {
              Accept: "application/json",
              "X-Auth-Token": apiToken,
            },
          });
          if (gamesRes.ok) {
            const gamesJson = await gamesRes.json();
            const gameIds = (gamesJson.games || []).map((g: any) => g.id);
            gameIdsMap.set(collection.id, gameIds);
          }
        } catch (err: any) {
          console.error(`Error fetching games for collection ${collection.id}:`, err.message);
        }
      }
      setCollectionGameIds(gameIdsMap);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching collections:", errorMessage);
    }
  }

  async function fetchLibraryGames() {
    setLoading(true);
    try {
      const url = buildApiUrl(apiBase, `/libraries/library/games`, {
        sort: "title",
      });
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.games || []) as any[];
      const parsed = items.map((v) => ({
        ratingKey: v.id,
        title: v.title,
        summary: v.summary,
        cover: v.cover,
        day: v.day,
        month: v.month,
        year: v.year,
        stars: v.stars,
        genre: v.genre,
      }));
      setGames(parsed);
      onGamesLoaded(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching library games:", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Update available genres based on games in the library
  useEffect(() => {
    if (games.length === 0 || allGenres.length === 0) return;

    // Extract unique genre IDs and titles from games
    const genresInGames = new Set<string>();
    games.forEach((game) => {
      if (game.genre) {
        if (Array.isArray(game.genre)) {
          game.genre.forEach((g) => genresInGames.add(g));
        } else if (typeof game.genre === "string") {
          genresInGames.add(game.genre);
        }
      }
    });

    // Filter all genres to only those present in games
    const filteredGenres = allGenres.filter((genre) => {
      // Check if the genre ID or title matches any genre in games
      return genresInGames.has(genre.id) || genresInGames.has(genre.title);
    });

    setAvailableGenres(filteredGenres);

    // Validate selected genre - if it's no longer available, reset it
    if (selectedGenre !== null && filterField === "genre") {
      const genreExists = filteredGenres.some((g) => g.id === selectedGenre);
      if (!genreExists) {
        setSelectedGenre(null);
        setFilterField("all");
      }
    }
  }, [games, allGenres, selectedGenre, filterField]);

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...games];

    // Apply filter
    if (filterField !== "all") {
      filtered = filtered.filter((game) => {
        switch (filterField) {
          case "genre":
            if (selectedGenre !== null) {
              // Find the genre object to get both id and title
              const selectedGenreObj = availableGenres.find((g) => g.id === selectedGenre);
              if (!selectedGenreObj) return false;
              
              // Filter games that have the selected genre
              // The game.genre field might contain either the ID (e.g., "genre_action") or the title (e.g., "action")
              if (Array.isArray(game.genre)) {
                return game.genre.includes(selectedGenreObj.id) || game.genre.includes(selectedGenreObj.title);
              } else if (typeof game.genre === "string") {
                return game.genre === selectedGenreObj.id || game.genre === selectedGenreObj.title;
              }
              return false;
            }
            return true;
          case "year":
            if (selectedYear !== null) {
              return game.year === selectedYear;
            }
            return game.year !== null && game.year !== undefined;
          case "decade":
            if (selectedDecade !== null && game.year !== null && game.year !== undefined) {
              const decade = Math.floor(game.year / 10) * 10;
              return decade === selectedDecade;
            }
            return false;
          case "collection":
            if (selectedCollection !== null) {
              const gameIds = collectionGameIds.get(selectedCollection);
              return gameIds ? gameIds.includes(game.ratingKey) : false;
            }
            return false;
          default:
            return true;
        }
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      let compareResult = 0;
      switch (sortField) {
        case "title":
          compareResult = compareTitles(a.title || "", b.title || "");
          break;
        case "year":
          const yearA = a.year ?? 0;
          const yearB = b.year ?? 0;
          compareResult = yearB - yearA;
          break;
        case "stars":
          const starsA = a.stars ?? 0;
          const starsB = b.stars ?? 0;
          compareResult = starsB - starsA;
          break;
        case "releaseDate":
          const dateA = a.year ?? 0;
          const dateB = b.year ?? 0;
          if (dateA !== dateB) {
            compareResult = dateB - dateA;
          } else {
            const monthA = a.month ?? 0;
            const monthB = b.month ?? 0;
            if (monthA !== monthB) {
              compareResult = monthB - monthA;
            } else {
              const dayA = a.day ?? 0;
              const dayB = b.day ?? 0;
              compareResult = dayB - dayA;
            }
          }
          break;
        default:
          return 0;
      }
      if (sortField === "title") {
        return sortAscending ? compareResult : -compareResult;
      } else {
        return sortAscending ? -compareResult : compareResult;
      }
    });

    return filtered;
  }, [games, filterField, selectedYear, selectedDecade, selectedGenre, selectedCollection, sortField, sortAscending, availableGenres, collectionGameIds]);

  return (
    <>
      <LibrariesBar
        libraries={[]}
        activeLibrary={null}
        onSelectLibrary={() => {}}
        loading={false}
        error={null}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      <div className="bg-[#1a1a1a] home-page-main-container">
        <main className="flex-1 home-page-content">
          <div className="home-page-layout">
            <div 
              className={`home-page-content-wrapper ${!loading && games.length > 0 ? "has-toolbar" : ""}`}
              style={{
                opacity: isReady ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
              }}
            >
        {/* Toolbar with filter and sort */}
        {!loading && games.length > 0 && (
          <GamesListToolbar
            gamesCount={filteredAndSortedGames.length}
            games={games}
            onFilterChange={setFilterField}
            onYearFilterChange={setSelectedYear}
            onGenreFilterChange={setSelectedGenre}
            onDecadeFilterChange={setSelectedDecade}
            onSortChange={setSortField}
            onSortDirectionChange={setSortAscending}
            currentFilter={filterField}
            selectedYear={selectedYear}
            selectedGenre={selectedGenre}
            selectedDecade={selectedDecade}
            selectedCollection={selectedCollection}
            onCollectionFilterChange={setSelectedCollection}
            currentSort={sortField}
            sortAscending={sortAscending}
            viewMode={viewMode}
            availableGenres={availableGenres}
            availableCollections={availableCollections}
          />
        )}
        {/* Scrollable lists container */}
        <div
          ref={scrollContainerRef}
          className={`home-page-scroll-container ${
            viewMode === "table" ? "table-view" : ""
          }`}
        >
          {!loading && (
            <>
              {viewMode === "grid" && (
                <GamesList
                  games={filteredAndSortedGames}
                  apiBase={apiBase}
                  onGameClick={onGameClick}
                  onPlay={onPlay}
                  buildCoverUrl={buildCoverUrl}
                  coverSize={coverSize}
                  itemRefs={itemRefs}
                  viewMode={viewMode}
                />
              )}
              {viewMode === "detail" && (
                <GamesListDetail
                  games={filteredAndSortedGames}
                  onGameClick={onGameClick}
                  onPlay={onPlay}
                  buildCoverUrl={buildCoverUrl}
                  itemRefs={itemRefs}
                />
              )}
              {viewMode === "table" && (
                <GamesListTable
                  games={filteredAndSortedGames}
                  onGameClick={onGameClick}
                  onPlay={onPlay}
                  itemRefs={itemRefs}
                  scrollContainerRef={tableScrollRef}
                  sortField={sortField}
                  sortAscending={sortAscending}
                  onSortChange={setSortField}
                  onSortDirectionChange={setSortAscending}
                />
              )}
            </>
          )}
        </div>
          </div>

            {/* Alphabet navigator container */}
            {sortField === "title" && isReady && (
              <AlphabetNavigator
                games={filteredAndSortedGames}
                scrollContainerRef={
                  viewMode === "table" ? tableScrollRef : scrollContainerRef
                }
                itemRefs={itemRefs}
                ascending={sortAscending}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

