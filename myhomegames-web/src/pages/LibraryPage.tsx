import { useState, useEffect, useRef, useMemo } from "react";
import GamesList from "../components/GamesList";
import GamesListDetail from "../components/GamesListDetail";
import GamesListTable from "../components/GamesListTable";
import AlphabetNavigator from "../components/AlphabetNavigator";
import GamesListToolbar from "../components/GamesListToolbar";
import type { ViewMode } from "../components/LibrariesBar";

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

type LibraryPageProps = {
  apiBase: string;
  apiToken: string;
  onGameClick: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
  onPlay?: (game: GameItem) => void;
  buildApiUrl: (apiBase: string, path: string, params?: Record<string, string | number | boolean>) => string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  viewMode: ViewMode;
};

export default function LibraryPage({
  apiBase,
  apiToken,
  onGameClick,
  onGamesLoaded,
  onPlay,
  buildApiUrl,
  buildCoverUrl,
  coverSize,
  viewMode,
}: LibraryPageProps) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterField, setFilterField] = useState<"all" | "year">("all");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortField, setSortField] = useState<"title" | "year" | "stars" | "releaseDate">("title");
  const [sortAscending, setSortAscending] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    fetchLibraryGames();
  }, []);

  async function fetchLibraryGames() {
    setLoading(true);
    try {
      const url = buildApiUrl(apiBase, `/libraries/libreria/games`, {
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
      }));
      setGames(parsed);
      onGamesLoaded(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      // Error is handled by parent component
      console.error("Error fetching library games:", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...games];

    // Apply filter
    if (filterField !== "all") {
      filtered = filtered.filter((game) => {
        switch (filterField) {
          case "year":
            if (selectedYear !== null) {
              return game.year === selectedYear;
            }
            return game.year !== null && game.year !== undefined;
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
          compareResult = (a.title || "").localeCompare(b.title || "");
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
  }, [games, filterField, selectedYear, sortField, sortAscending]);

  return (
    <div className="home-page-layout">
      <div className={`home-page-content-wrapper ${!loading && games.length > 0 ? "has-toolbar" : ""}`}>
        {/* Toolbar with filter and sort */}
        {!loading && games.length > 0 && (
          <GamesListToolbar
            gamesCount={filteredAndSortedGames.length}
            games={games}
            onFilterChange={setFilterField}
            onYearFilterChange={setSelectedYear}
            onSortChange={setSortField}
            onSortDirectionChange={setSortAscending}
            currentFilter={filterField}
            selectedYear={selectedYear}
            currentSort={sortField}
            sortAscending={sortAscending}
            viewMode={viewMode}
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
                />
              )}
              {viewMode === "detail" && (
                <GamesListDetail
                  games={filteredAndSortedGames}
                  apiBase={apiBase}
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
      {sortField === "title" && (
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
  );
}

