import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import LibrariesBar from "../components/LibrariesBar";
import type { ViewMode } from "../components/LibrariesBar";
import GamesList from "../components/GamesList";
import GamesListDetail from "../components/GamesListDetail";
import GamesListTable from "../components/GamesListTable";
import AlphabetNavigator from "../components/AlphabetNavigator";
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

  // Handler to change view mode
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (activeLibrary) {
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
      // Load saved view mode for this library
      const savedViewMode = loadViewModeForLibrary(libraryToSelect.key);
      setViewMode(savedViewMode);
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
      setError(String(err.message || err));
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
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function onSelectLibrary(s: GameLibrarySection) {
    // Save selected library to localStorage
    localStorage.setItem("lastSelectedLibrary", s.key);
    // Update active library immediately for instant visual feedback
    setActiveLibrary(s);
    // Load saved view mode for this library
    const savedViewMode = loadViewModeForLibrary(s.key);
    setViewMode(savedViewMode);
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
              <div className="text-gray-400 text-center">
                <div className="text-2xl mb-2">🎮</div>
              </div>
            </div>
          ) : (
            <div className="home-page-layout">
              {/* Scrollable lists container */}
              <div
                ref={scrollContainerRef}
                className={`home-page-scroll-container ${
                  viewMode === "table" ? "table-view" : ""
                }`}
              >
                {loading ? (
                  <div className="text-sm text-gray-400 text-center">
                    {t("home.loadingGames")}
                  </div>
                ) : (
                  <>
                    {viewMode === "grid" && (
                      <GamesList
                        games={games}
                        apiBase={apiBase}
                        onGameClick={handleGameClick}
                        buildCoverUrl={buildCoverUrl}
                        coverSize={coverSize}
                        itemRefs={itemRefs}
                      />
                    )}
                    {viewMode === "detail" && (
                      <GamesListDetail
                        games={games}
                        apiBase={apiBase}
                        onGameClick={handleGameClick}
                        buildCoverUrl={buildCoverUrl}
                        itemRefs={itemRefs}
                      />
                    )}
                    {viewMode === "table" && (
                      <GamesListTable
                        games={games}
                        onGameClick={handleGameClick}
                        itemRefs={itemRefs}
                        scrollContainerRef={tableScrollRef}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Alphabet navigator container - separate div */}
              {games.length > 0 && (
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
