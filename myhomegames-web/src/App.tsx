import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./App.css";
import Favicon from "./components/common/Favicon";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import AddGamePage from "./pages/AddGamePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import CollectionDetail from "./pages/CollectionDetail";
import CategoryPage from "./pages/CategoryPage";
import AddGame from "./components/common/AddGame";
import GameDetail from "./components/games/GameDetail";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  background?: string;
  day?: number | null;
  month?: number | null;
  year?: number | null;
  stars?: number | null;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000";
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

function buildApiUrl(
  path: string,
  params: Record<string, string | number | boolean> = {}
) {
  const u = new URL(path, API_BASE);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

function buildCoverUrl(apiBase: string, cover?: string) {
  if (!cover) return "";
  // Cover is already a full path from server (e.g., /covers/gameId)
  // We need to prepend the API base URL
  const u = new URL(cover, apiBase);
  return u.toString();
}

function buildBackgroundUrl(apiBase: string, background?: string) {
  if (!background) return "";
  // Background is already a full path from server (e.g., /backgrounds/gameId)
  // We need to prepend the API base URL
  const u = new URL(background, apiBase);
  return u.toString();
}

type CollectionItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

function AppContent() {
  const [allGames, setAllGames] = useState<GameItem[]>([]);
  const [allCollections, setAllCollections] = useState<CollectionItem[]>([]);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [addGameOpen, setAddGameOpen] = useState(false);
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // Block body scroll when player modal is open
  useEffect(() => {
    if (playerUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [playerUrl]);

  // Handle ESC key to close player modal
  useEffect(() => {
    if (!playerUrl) return;
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPlayerUrl(null);
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerUrl]);

  // Load games on app startup for search
  useEffect(() => {
    async function loadGames() {
      try {
        const url = buildApiUrl("/libraries/library/games", {
          sort: "title",
        });
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": API_TOKEN,
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
        setAllGames(parsed);
      } catch (err: any) {
        const errorMessage = String(err.message || err);
        console.error("Error loading games for search:", errorMessage);
      }
    }
    loadGames();
  }, []);

  // Load collections on app startup
  useEffect(() => {
    async function loadCollections() {
      try {
        const url = buildApiUrl("/collections");
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": API_TOKEN,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = (json.collections || []) as any[];
        const parsed = items.map((v) => ({
          ratingKey: v.id,
          title: v.title,
          cover: v.cover,
        }));
        setAllCollections(parsed);
      } catch (err: any) {
        const errorMessage = String(err.message || err);
        console.error("Error loading collections:", errorMessage);
      }
    }
    loadCollections();
  }, []);

  // Load settings from server on app startup
  useEffect(() => {
    async function loadSettings() {
      try {
        const url = new URL("/settings", API_BASE);
        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": API_TOKEN,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const loadedLanguage = data.language || "en";
          // Update i18n language if different from current
          if (i18n.language !== loadedLanguage) {
            i18n.changeLanguage(loadedLanguage);
          }
          // Also update localStorage
          localStorage.setItem("language", loadedLanguage);
        }
      } catch (err) {
        console.error("Failed to load settings on startup:", err);
        // Keep using localStorage value
      }
    }
    loadSettings();
  }, [i18n]);

  function openLauncher(item: GameItem | CollectionItem) {
    const launchUrl = buildApiUrl(`/launcher`, {
      gameId: item.ratingKey,
      token: API_TOKEN,
    });
    setPlayerUrl(launchUrl);
  }

  function handleGameClick(game: GameItem) {
    navigate(`/game/${game.ratingKey}`, {
      state: { from: window.location.pathname }
    });
  }

  function handleGameSelect(game: GameItem) {
    navigate(`/game/${game.ratingKey}`);
  }

  return (
    <>
      <Favicon />
      <div
        className="bg-[#1a1a1a] text-white"
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          onPlay={openLauncher}
          allGames={allGames}
          allCollections={allCollections}
          onGameSelect={handleGameSelect}
          onHomeClick={() => navigate("/")}
          onSettingsClick={() => navigate("/settings")}
          onAddGameClick={() => setAddGameOpen(true)}
        />

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                apiBase={API_BASE}
                apiToken={API_TOKEN}
                onGameClick={handleGameClick}
                onPlay={openLauncher}
                onGamesLoaded={(games) => {
                  setAllGames((prev: GameItem[]) => {
                    const existingIds = new Set(
                      prev.map((g: GameItem) => g.ratingKey)
                    );
                    const newGames = games.filter(
                      (g: GameItem) => !existingIds.has(g.ratingKey)
                    );
                    return [...prev, ...newGames];
                  });
                }}
              />
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <GameDetailPage onPlay={openLauncher} />
            }
          />
          <Route
            path="/collections/:collectionId"
            element={
              <CollectionDetail
                apiBase={API_BASE}
                apiToken={API_TOKEN}
                onGameClick={handleGameClick}
                onGamesLoaded={(games) => {
                  setAllGames((prev: GameItem[]) => {
                    const existingIds = new Set(
                      prev.map((g: GameItem) => g.ratingKey)
                    );
                    const newGames = games.filter(
                      (g: GameItem) => !existingIds.has(g.ratingKey)
                    );
                    return [...prev, ...newGames];
                  });
                }}
                onPlay={openLauncher}
                buildApiUrl={(_apiBase: string, path: string, params?: Record<string, string | number | boolean>) => 
                  buildApiUrl(path, params)
                }
                buildCoverUrl={buildCoverUrl}
              />
            }
          />
          <Route
            path="/category/:categoryId"
            element={
              <CategoryPage
                apiBase={API_BASE}
                apiToken={API_TOKEN}
                onGameClick={handleGameClick}
                onGamesLoaded={(games) => {
                  setAllGames((prev: GameItem[]) => {
                    const existingIds = new Set(
                      prev.map((g: GameItem) => g.ratingKey)
                    );
                    const newGames = games.filter(
                      (g: GameItem) => !existingIds.has(g.ratingKey)
                    );
                    return [...prev, ...newGames];
                  });
                }}
                onPlay={openLauncher}
                buildApiUrl={(_apiBase: string, path: string, params?: Record<string, string | number | boolean>) => 
                  buildApiUrl(path, params)
                }
                buildCoverUrl={buildCoverUrl}
              />
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/add-game"
            element={
              <AddGamePage
                apiBase={API_BASE}
                apiToken={API_TOKEN}
                onGameSelected={(game) => {
                  console.log("Game selected from IGDB:", game);
                  // TODO: Implement game addition logic
                }}
              />
            }
          />
          <Route
            path="/search-results"
            element={
              <SearchResultsPage
                apiBase={API_BASE}
                buildCoverUrl={buildCoverUrl}
                onPlay={openLauncher}
                onGameClick={handleGameClick}
              />
            }
          />
        </Routes>

        {/* Add Game Modal */}
        <AddGame
          isOpen={addGameOpen}
          onClose={() => setAddGameOpen(false)}
          onGameSelected={(game) => {
            console.log("Game selected from IGDB:", game);
            // TODO: Implement game addition logic
          }}
          apiBase={API_BASE}
          apiToken={API_TOKEN}
        />

        {/* Modal Plex-style for launcher */}
        {playerUrl && createPortal(
          <div
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              pointerEvents: 'auto',
              overflow: 'hidden'
            }}
            onClick={() => setPlayerUrl(null)}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                border: '1px solid #2a2a2a',
                width: '90%',
                maxWidth: '1400px',
                height: '85%',
                maxHeight: '900px',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                padding: '16px', 
                borderBottom: '1px solid #2a2a2a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                backgroundColor: '#0d0d0d',
                flexShrink: 0
              }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#ffffff',
                  margin: 0
                }}>
                  Game Launcher
                </h2>
                <button
                  style={{
                    color: '#9ca3af',
                    fontSize: '18px',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => setPlayerUrl(null)}
                  aria-label="Close"
                >
                  ✕ Close
                </button>
              </div>
              <div style={{ 
                flex: 1, 
                overflow: 'hidden', 
                minHeight: 0 
              }}>
                <iframe
                  src={playerUrl}
                  title="Game Launcher"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}

function GameDetailPage({
  onPlay,
}: {
  onPlay: (game: GameItem) => void;
}) {
  const { t } = useTranslation();
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gameId) {
      // Always fetch from API to get background field
      fetchGame(gameId);
    }
  }, [gameId]);

  async function fetchGame(gameId: string) {
    setLoading(true);
    try {
      // Fetch single game from dedicated endpoint
      const url = buildApiUrl(`/games/${gameId}`);
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": API_TOKEN,
        },
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          setGame(null);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      
      const found = await res.json();
      const parsed: GameItem = {
        ratingKey: found.id,
        title: found.title,
        summary: found.summary,
        cover: found.cover,
        background: found.background,
        day: found.day,
        month: found.month,
        year: found.year,
        stars: found.stars,
      };
      setGame(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching game:", errorMessage);
      setGame(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className="bg-[#1a1a1a] text-white flex items-center justify-center"
        style={{ width: "100%", height: "100%" }}
      >
        <div className="text-center">
          <div className="text-gray-400">{t("home.loadingLibraries")}</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div
        className="bg-[#1a1a1a] text-white flex items-center justify-center"
        style={{ width: "100%", height: "100%" }}
      >
        <div className="text-center">
          <div className="text-gray-400">{t("gameDetail.notFound")}</div>
        </div>
      </div>
    );
  }

  return (
    <GameDetail
      game={game}
      coverUrl={buildCoverUrl(API_BASE, game.cover)}
      backgroundUrl={buildBackgroundUrl(API_BASE, game.background)}
      onPlay={onPlay}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
