import React, { useEffect, useState } from "react";

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
  u.searchParams.set("X-Auth-Token", API_TOKEN);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

export default function App() {
  const [libraries, setLibraries] = useState<GameLibrarySection[]>([]);
  const [activeLibrary, setActiveLibrary] = useState<GameLibrarySection | null>(null);
  const [games, setGames] = useState<GameItem[]>([]);
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
      const res = await fetch(url, { headers: { Accept: "application/json" } });
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
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.games || []) as any[];
      const parsed = items.map((v) => ({ ratingKey: v.id, title: v.title, summary: v.summary, cover: v.cover, duration: v.duration }));
      setGames(parsed);
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
    const launchUrl = buildApiUrl(`/launcher?gameId=${item.ratingKey}`);
    setPlayerUrl(launchUrl);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="flex items-center gap-4 p-4 shadow bg-white">
        <h1 className="text-xl font-semibold">MyHomeGames Web App</h1>
        <div className="ml-auto text-sm text-gray-600">Server: <span className="font-mono">{API_BASE}</span></div>
      </header>

      <div className="flex">
        <aside className="w-64 p-4 border-r bg-white">
          <h2 className="font-medium mb-2">Game Libraries</h2>
          {loading && libraries.length === 0 ? (
            <div className="text-sm text-gray-500">Loading libraries…</div>
          ) : (
            <ul className="space-y-2">
              {libraries.map((s) => (
                <li key={s.key}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded ${activeLibrary?.key === s.key ? "bg-blue-50" : "hover:bg-gray-100"}`}
                    onClick={() => onSelectLibrary(s)}
                  >
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-gray-500">{s.type}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        </aside>

        <main className="flex-1 p-6">
          {!activeLibrary ? (
            <div className="text-gray-600">Seleziona una libreria di giochi a sinistra.</div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-4">{activeLibrary.title}</h2>
              {loading ? (
                <div className="text-sm text-gray-500">Loading games…</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {games.map((it) => (
                    <div key={it.ratingKey} className="bg-white rounded shadow-sm overflow-hidden">
                      <div className="h-40 bg-gray-100 flex items-center justify-center">
                        {it.cover ? (
                          <img src={buildCoverUrl(it.cover)} alt={it.title} className="object-cover h-full w-full" />
                        ) : (
                          <div className="text-sm text-gray-500">No image</div>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="font-medium text-sm truncate">{it.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{it.summary ? it.summary.slice(0, 80) + (it.summary.length > 80 ? "…" : "") : ""}</div>
                        <div className="mt-2 flex gap-2">
                          <button className="px-2 py-1 text-xs border rounded" onClick={() => openLauncher(it)}>
                            Launch Game
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {playerUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setPlayerUrl(null)}>
          <div className="bg-white w-11/12 h-4/5 rounded shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-2 border-b flex items-center justify-between">
              <div>Game Launcher</div>
              <button className="text-sm" onClick={() => setPlayerUrl(null)}>Close</button>
            </div>
            <iframe src={playerUrl} title="Game Launcher" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
