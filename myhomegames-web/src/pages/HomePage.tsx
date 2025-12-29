import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import LibrariesBar from "../components/LibrariesBar";
import type { ViewMode } from "../components/LibrariesBar";
import GamesList from "../components/GamesList";
import GamesListDetail from "../components/GamesListDetail";
import GamesListTable from "../components/GamesListTable";
import AlphabetNavigator from "../components/AlphabetNavigator";
import GamesListToolbar from "../components/GamesListToolbar";
import "./HomePage.css";

type GameLibrarySection = {
  key: string;
  title?: string; // Optional, will be translated using key
  type: string;
};

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

type HomePageProps = {
  apiBase: string;
  apiToken: string;
  onGameClick: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
  onPlay?: (game: GameItem) => void;
};

function buildApiUrl(
  apiBase: string,
  path: string,
  params: Record<string, string | number | boolean> = {}
) {
  const u = new URL(path, apiBase);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

function buildCoverUrl(apiBase: string, cover?: string) {
  if (!cover) return "";
  // Cover is already a full path from server (e.g., /covers/gameId)
  return buildApiUrl(apiBase, cover);
}

export default function HomePage({
  apiBase,
  apiToken,
  onGameClick,
  onGamesLoaded,
  onPlay,
}: HomePageProps) {
  const { t } = useTranslation();
  const [libraries, setLibraries] = useState<GameLibrarySection[]>([]);
  const [activeLibrary, setActiveLibrary] = useState<GameLibrarySection | null>(
    null
  );
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverSize, setCoverSize] = useState(150);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterField, setFilterField] = useState<"all" | "title" | "year" | "stars" | "summary">("all");
  const [sortField, setSortField] = useState<"title" | "year" | "stars" | "releaseDate">("title");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Function to save view mode for a library
  const saveViewModeForLibrary = (libraryKey: string, mode: ViewMode) => {
    localStorage.setItem(`viewMode_${libraryKey}`, mode);
  };

  // Function to load saved view mode for a library
  const loadViewModeForLibrary = (libraryKey: string): ViewMode => {
    const saved = localStorage.getItem(`viewMode_${libraryKey}`);
    return (saved as ViewMode) || "grid";
  };

  // Handler to change view mode (only for libreria)
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (activeLibrary && activeLibrary.key === "libreria") {
      saveViewModeForLibrary(activeLibrary.key, mode);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  // Restore last selected library or auto-select first library when libraries are loaded
  useEffect(() => {
    if (libraries.length > 0 && !activeLibrary) {
      // Try to restore last selected library from localStorage
      const savedLibraryKey = localStorage.getItem("lastSelectedLibrary");
      const libraryToSelect = savedLibraryKey
        ? libraries.find((lib) => lib.key === savedLibraryKey) || libraries[0]
        : libraries[0];

      setActiveLibrary(libraryToSelect);
      // Load saved view mode for this library (only for libreria)
      // For consigliati, raccolte and categorie, always use grid view
      if (libraryToSelect.key === "libreria") {
        const savedViewMode = loadViewModeForLibrary(libraryToSelect.key);
        setViewMode(savedViewMode);
      } else {
        setViewMode("grid");
      }
      fetchLibraryGames(libraryToSelect.key);
    }
  }, [libraries]);

  async function fetchLibraries() {
    setLoading(true);
    setError(null);
    try {
      const url = buildApiUrl(apiBase, "/libraries");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const libs = (json.libraries || []) as any[];
      const parsed = libs.map((d) => ({
        key: d.key,
        title: d.title, // Optional, will be translated using key in LibrariesBar
        type: d.type,
      }));
      setLibraries(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      // Translate fetch errors
      if (errorMessage.toLowerCase().includes("failed to fetch") || 
          errorMessage.toLowerCase().includes("fetch")) {
        setError(t("common.fetchError"));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchLibraryGames(sectionKey: string) {
    setLoading(true);
    setError(null);
    try {
      const url = buildApiUrl(apiBase, `/libraries/${sectionKey}/games`, {
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
      // Translate fetch errors
      if (errorMessage.toLowerCase().includes("failed to fetch") || 
          errorMessage.toLowerCase().includes("fetch")) {
        setError(t("common.fetchError"));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  function onSelectLibrary(s: GameLibrarySection) {
    // Save selected library to localStorage
    localStorage.setItem("lastSelectedLibrary", s.key);
    // Update active library immediately for instant visual feedback
    setActiveLibrary(s);
    // Load saved view mode for this library (only for libreria)
    // For consigliati, raccolte and categorie, always use grid view
    if (s.key === "libreria") {
      const savedViewMode = loadViewModeForLibrary(s.key);
      setViewMode(savedViewMode);
    } else {
      setViewMode("grid");
    }
    // Clear previous games immediately
    setGames([]);
    // Set loading state immediately
    setLoading(true);
    setError(null);
    // Then fetch new games
    fetchLibraryGames(s.key);
  }

  function handleGameClick(game: GameItem) {
    onGameClick(game);
  }

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...games];

    // Apply filter
    if (filterField !== "all") {
      filtered = filtered.filter((game) => {
        switch (filterField) {
          case "title":
            return game.title && game.title.trim() !== "";
          case "year":
            return game.year !== null && game.year !== undefined;
          case "stars":
            return game.stars !== null && game.stars !== undefined;
          case "summary":
            return game.summary && game.summary.trim() !== "";
          default:
            return true;
        }
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortField) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "year":
          const yearA = a.year ?? 0;
          const yearB = b.year ?? 0;
          return yearB - yearA; // Descending (newest first)
        case "stars":
          const starsA = a.stars ?? 0;
          const starsB = b.stars ?? 0;
          return starsB - starsA; // Descending (highest first)
        case "releaseDate":
          // Sort by release date (year, month, day)
          const dateA = a.year ?? 0;
          const dateB = b.year ?? 0;
          if (dateA !== dateB) return dateB - dateA;
          const monthA = a.month ?? 0;
          const monthB = b.month ?? 0;
          if (monthA !== monthB) return monthB - monthA;
          const dayA = a.day ?? 0;
          const dayB = b.day ?? 0;
          return dayB - dayA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [games, filterField, sortField]);

  return (
    <>
      <LibrariesBar
        libraries={libraries}
        activeLibrary={activeLibrary}
        onSelectLibrary={onSelectLibrary}
        loading={loading}
        error={error}
        coverSize={coverSize}
        onCoverSizeChange={setCoverSize}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <div className="bg-[#1a1a1a] home-page-main-container">
        <main className={`flex-1 home-page-content`}>
          {!activeLibrary ? (
            <div className="flex items-center justify-center h-full">
            </div>
          ) : (
            <div className="home-page-layout">
              <div className={`home-page-content-wrapper ${!loading && games.length > 0 && activeLibrary.key === "libreria" ? "has-toolbar" : ""}`}>
                {/* Toolbar with filter and sort - only for libreria */}
                {!loading && games.length > 0 && activeLibrary.key === "libreria" && (
                  <GamesListToolbar
                    gamesCount={filteredAndSortedGames.length}
                    onFilterChange={setFilterField}
                    onSortChange={setSortField}
                    currentFilter={filterField}
                    currentSort={sortField}
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
                        onGameClick={handleGameClick}
                        onPlay={activeLibrary.key === "categorie" ? undefined : onPlay}
                        buildCoverUrl={buildCoverUrl}
                        coverSize={coverSize}
                        itemRefs={itemRefs}
                        isCategory={activeLibrary.key === "categorie"}
                      />
                    )}
                    {viewMode === "detail" && (
                      <GamesListDetail
                        games={filteredAndSortedGames}
                        apiBase={apiBase}
                        onGameClick={handleGameClick}
                        onPlay={activeLibrary.key === "categorie" ? undefined : onPlay}
                        buildCoverUrl={buildCoverUrl}
                        itemRefs={itemRefs}
                      />
                    )}
                    {viewMode === "table" && (
                      <GamesListTable
                        games={filteredAndSortedGames}
                        onGameClick={handleGameClick}
                        onPlay={activeLibrary.key === "categorie" ? undefined : onPlay}
                        itemRefs={itemRefs}
                        scrollContainerRef={tableScrollRef}
                      />
                    )}
                  </>
                )}
              </div>
              </div>

              {/* Alphabet navigator container - separate div */}
              {games.length > 0 && 
               activeLibrary && 
               activeLibrary.key !== "consigliati" && 
               activeLibrary.key !== "categorie" && (
                <div className="home-page-alphabet-container">
                  <AlphabetNavigator
                    games={games}
                    scrollContainerRef={
                      viewMode === "table" ? tableScrollRef : scrollContainerRef
                    }
                    itemRefs={itemRefs}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
