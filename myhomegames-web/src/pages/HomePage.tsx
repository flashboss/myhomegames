import { useState, useEffect } from "react";
import LibrariesBar from "../components/LibrariesBar";
import type { ViewMode } from "../components/LibrariesBar";
import GamesList from "../components/GamesList";
import GamesListDetail from "../components/GamesListDetail";
import GamesListTable from "../components/GamesListTable";

type GameLibrarySection = {
  key: string;
  title: string;
  type: string;
};

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  duration?: number;
  day?: number | null;
  month?: number | null;
  year?: number | null;
};

type HomePageProps = {
  apiBase: string;
  apiToken: string;
  onGameClick: (game: GameItem) => void;
  onPlay: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
};

function buildApiUrl(apiBase: string, path: string, params: Record<string, string | number | boolean> = {}) {
  const u = new URL(path, apiBase);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

function buildCoverUrl(apiBase: string, cover?: string) {
  if (!cover) return "";
  // Cover is already a full path from server (e.g., /covers/gameId)
  return buildApiUrl(apiBase, cover);
}

export default function HomePage({ apiBase, apiToken, onGameClick, onPlay, onGamesLoaded }: HomePageProps) {
  const [libraries, setLibraries] = useState<GameLibrarySection[]>([]);
  const [activeLibrary, setActiveLibrary] = useState<GameLibrarySection | null>(null);
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverSize, setCoverSize] = useState(150);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    fetchLibraries();
  }, []);

  // Restore last selected library or auto-select first library when libraries are loaded
  useEffect(() => {
    if (libraries.length > 0 && !activeLibrary) {
      // Try to restore last selected library from localStorage
      const savedLibraryKey = localStorage.getItem("lastSelectedLibrary");
      const libraryToSelect = savedLibraryKey 
        ? libraries.find(lib => lib.key === savedLibraryKey) || libraries[0]
        : libraries[0];
      
      setActiveLibrary(libraryToSelect);
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
          "X-Auth-Token": apiToken
        } 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const libs = (json.libraries || []) as any[];
      const parsed = libs.map((d) => ({ key: d.key, title: d.title, type: d.type }));
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
      const url = buildApiUrl(apiBase, `/libraries/${sectionKey}/games`, { sort: "title" });
      const res = await fetch(url, { 
        headers: { 
          Accept: "application/json",
          "X-Auth-Token": apiToken
        } 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.games || []) as any[];
      const parsed = items.map((v) => ({ 
        ratingKey: v.id, 
        title: v.title, 
        summary: v.summary, 
        cover: v.cover, 
        duration: v.duration,
        day: v.day,
        month: v.month,
        year: v.year
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
        onViewModeChange={setViewMode}
      />

      <div className="h-[calc(100vh-57px-57px)] overflow-y-auto bg-[#1a1a1a]">
        <main className="flex-1">
          {!activeLibrary ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <div className="text-2xl mb-2">🎮</div>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: '22px', paddingBottom: '32px' }}>
              {loading ? (
                <div className="text-sm text-gray-400 text-center">Loading games…</div>
              ) : (
                <>
                  {viewMode === 'grid' && (
                    <GamesList 
                      games={games}
                      apiBase={apiBase}
                      onGameClick={handleGameClick}
                      buildCoverUrl={buildCoverUrl}
                      coverSize={coverSize}
                    />
                  )}
                  {viewMode === 'detail' && (
                    <GamesListDetail 
                      games={games}
                      apiBase={apiBase}
                      onGameClick={handleGameClick}
                      buildCoverUrl={buildCoverUrl}
                      coverSize={coverSize}
                    />
                  )}
                  {viewMode === 'table' && (
                    <GamesListTable 
                      games={games}
                      apiBase={apiBase}
                      onGameClick={handleGameClick}
                      buildCoverUrl={buildCoverUrl}
                      coverSize={coverSize}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

