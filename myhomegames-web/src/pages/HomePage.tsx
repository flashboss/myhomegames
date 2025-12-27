import { useState, useEffect } from "react";
import LibrariesBar from "../components/LibrariesBar";

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
  return buildApiUrl(apiBase, cover);
}

export default function HomePage({ apiBase, apiToken, onGameClick, onPlay, onGamesLoaded }: HomePageProps) {
  const [libraries, setLibraries] = useState<GameLibrarySection[]>([]);
  const [activeLibrary, setActiveLibrary] = useState<GameLibrarySection | null>(null);
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const parsed = items.map((v) => ({ ratingKey: v.id, title: v.title, summary: v.summary, cover: v.cover, duration: v.duration }));
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
            <div className="p-8">
              {loading ? (
                <div className="text-sm text-gray-400">Loading games…</div>
              ) : games.length === 0 ? (
                <div className="text-gray-400">No games found</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                  {games.map((it) => (
                    <div
                      key={it.ratingKey}
                      className="group cursor-pointer"
                      onClick={() => handleGameClick(it)}
                    >
                      <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20">
                        {it.cover ? (
                          <img
                            src={buildCoverUrl(apiBase, it.cover)}
                            alt={it.title}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-gray-500 text-4xl">🎮</div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                        {it.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

