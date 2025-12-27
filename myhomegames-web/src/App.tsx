import { useEffect, useState } from "react";
import "./App.css";
import Favicon from "./components/Favicon";
import Header from "./components/Header";

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

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000"; // MyHomeGames Server address
const API_TOKEN = import.meta.env.VITE_API_TOKEN || ""; // Your API token

function buildApiUrl(path: string, params: Record<string, string | number | boolean> = {}) {
  const u = new URL(path, API_BASE);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

export default function App() {
  const [libraries, setLibraries] = useState<GameLibrarySection[]>([]);
  const [activeLibrary, setActiveLibrary] = useState<GameLibrarySection | null>(null);
  const [games, setGames] = useState<GameItem[]>([]);
  const [allGames, setAllGames] = useState<GameItem[]>([]); // All games across all libraries for search
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraries();
  }, []);

  async function fetchLibraries() {
    setLoading(true);
    setError(null);
    try {
      const url = buildApiUrl("/libraries");
      const res = await fetch(url, { 
        headers: { 
          Accept: "application/json",
          "X-Auth-Token": API_TOKEN
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
      const url = buildApiUrl(`/libraries/${sectionKey}/games`, { sort: "title" });
      const res = await fetch(url, { 
        headers: { 
          Accept: "application/json",
          "X-Auth-Token": API_TOKEN
        } 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.games || []) as any[];
      const parsed = items.map((v) => ({ ratingKey: v.id, title: v.title, summary: v.summary, cover: v.cover, duration: v.duration }));
      setGames(parsed);
      // Add to allGames for search (avoid duplicates)
      setAllGames((prev: GameItem[]) => {
        const existingIds = new Set(prev.map((g: GameItem) => g.ratingKey));
        const newGames = parsed.filter((g: GameItem) => !existingIds.has(g.ratingKey));
        return [...prev, ...newGames];
      });
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function onSelectLibrary(s: GameLibrarySection) {
    setActiveLibrary(s);
    fetchLibraryGames(s.key);
  }

  function buildCoverUrl(cover?: string) {
    if (!cover) return "";
    return buildApiUrl(cover);
  }

  function openLauncher(item: GameItem) {
    const launchUrl = buildApiUrl(`/launcher`, { gameId: item.ratingKey, token: API_TOKEN });
    setPlayerUrl(launchUrl);
  }

  function handleGameSelect(game: GameItem) {
    openLauncher(game);
  }

  return (
    <>
      <Favicon />
      <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header 
        allGames={allGames} 
        onGameSelect={handleGameSelect}
        onHomeClick={() => {
          setActiveLibrary(null);
          setGames([]);
        }}
      />

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar Plex-style */}
        <aside className="w-64 bg-[#0d0d0d] border-r border-[#2a2a2a] overflow-y-auto">
          <div className="p-4">
            {loading && libraries.length === 0 ? (
              <div className="text-sm text-gray-500">Loading libraries…</div>
            ) : (
              <ul className="space-y-1">
                {libraries.map((s) => (
                  <li key={s.key}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        activeLibrary?.key === s.key
                          ? "bg-[#E5A00D] text-black font-medium"
                          : "text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                      }`}
                      onClick={() => onSelectLibrary(s)}
                    >
                      <div className="text-sm">{s.title}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
          </div>
        </aside>

        {/* Main content Plex-style */}
        <main className="flex-1 overflow-y-auto bg-[#1a1a1a]">
          {!activeLibrary ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <div className="text-2xl mb-2">🎮</div>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-white">{activeLibrary.title}</h2>
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
                      onClick={() => openLauncher(it)}
                    >
                      <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20">
                        {it.cover ? (
                          <img
                            src={buildCoverUrl(it.cover)}
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
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-[#E5A00D] text-black px-4 py-2 rounded font-medium text-sm">
                            Play
                          </div>
                        </div>
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

      {/* Modal Plex-style */}
      {playerUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPlayerUrl(null)}
        >
          <div
            className="bg-[#1a1a1a] w-11/12 h-4/5 rounded-lg shadow-2xl overflow-hidden border border-[#2a2a2a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0d0d0d]">
              <div className="text-white font-medium">Game Launcher</div>
              <button
                className="text-gray-400 hover:text-white transition-colors text-sm px-3 py-1 rounded hover:bg-[#2a2a2a]"
                onClick={() => setPlayerUrl(null)}
              >
                ✕ Close
              </button>
            </div>
            <iframe src={playerUrl} title="Game Launcher" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
