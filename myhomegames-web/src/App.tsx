import { useState, useEffect } from "react";
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
import ProfilePage from "./pages/ProfilePage";
import AddGamePage from "./pages/AddGamePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import CollectionDetail from "./pages/CollectionDetail";
import CategoryPage from "./pages/CategoryPage";
import LoginPage from "./pages/LoginPage";
import AddGame from "./components/common/AddGame";
import GameDetail from "./components/games/GameDetail";
import LaunchModal from "./components/common/LaunchModal";
import ProtectedRoute from "./components/common/ProtectedRoute";

import type { GameItem, CollectionItem } from "./types";
import { buildApiUrl, buildCoverUrl, buildBackgroundUrl } from "./utils/api";
import { API_BASE, getApiToken } from "./config";
import { useLoading } from "./contexts/LoadingContext";

// Wrapper function for buildApiUrl that uses API_BASE
function buildApiUrlWithBase(
  path: string,
  params: Record<string, string | number | boolean> = {}
) {
  return buildApiUrl(API_BASE, path, params);
}

function AppContent() {
  const [allGames, setAllGames] = useState<GameItem[]>([]);
  const [allCollections, setAllCollections] = useState<CollectionItem[]>([]);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [addGameOpen, setAddGameOpen] = useState(false);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { setLoading } = useLoading();

  const handleCloseLaunchModal = () => {
    setLaunchError(null);
    setIsLaunching(false);
  };

  // Load games on app startup for search
  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      try {
        const url = buildApiUrlWithBase("/libraries/library/games", {
          sort: "title",
        });
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": getApiToken(),
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
        setAllGames(parsed);
      } catch (err: any) {
        const errorMessage = String(err.message || err);
        console.error("Error loading games for search:", errorMessage);
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, [setLoading]);

  // Load collections on app startup
  useEffect(() => {
    async function loadCollections() {
      setLoading(true);
      try {
          const url = buildApiUrlWithBase("/collections");
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": getApiToken(),
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
      } finally {
        setLoading(false);
      }
    }
    loadCollections();
  }, [setLoading]);

  // Load settings from server on app startup
  useEffect(() => {
    async function loadSettings() {
      try {
        const url = new URL("/settings", API_BASE);
        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": getApiToken(),
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

  async function openLauncher(item: GameItem | CollectionItem) {
    setIsLaunching(true);
    setLaunchError(null);
    
    try {
      let gameId = item.ratingKey;
      
      // If it's a collection, get the first game from the collection
      const isCollection = allCollections.some(c => c.ratingKey === item.ratingKey);
      if (isCollection) {
        try {
            const gamesUrl = buildApiUrlWithBase(`/collections/${item.ratingKey}/games`);
          const gamesRes = await fetch(gamesUrl, {
            headers: {
              Accept: "application/json",
              "X-Auth-Token": getApiToken(),
            },
          });
          if (gamesRes.ok) {
            const gamesJson = await gamesRes.json();
            const games = gamesJson.games || [];
            if (games.length > 0) {
              // Use the first game's ID
              gameId = games[0].id;
            } else {
              setIsLaunching(false);
              setLaunchError("Collection is empty");
              return;
            }
          } else {
            setIsLaunching(false);
            setLaunchError("Failed to load collection games");
            return;
          }
        } catch (err: any) {
          setIsLaunching(false);
          setLaunchError(err.message || "Failed to load collection games");
          return;
        }
      }
      
      const launchUrl = buildApiUrlWithBase(`/launcher`, {
        gameId: gameId,
        token: getApiToken(),
      });
      const res = await fetch(launchUrl, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": getApiToken(),
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        // Prefer detail over error as it contains more specific information
        const errorMessage = errorData.detail || errorData.error || `Failed to launch game (HTTP ${res.status})`;
        setIsLaunching(false);
        setLaunchError(errorMessage);
      } else {
        // Success - close loading after a short delay
        setTimeout(() => {
          setIsLaunching(false);
        }, 500);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to launch game";
      setIsLaunching(false);
      setLaunchError(errorMessage);
    }
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
        <Routes>
          {/* Login page - public, no header */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes - require authentication (unless VITE_API_TOKEN is set) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <HomePage
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
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <GameDetailPage onPlay={openLauncher} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/:collectionId"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <CollectionDetail
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
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/:categoryId"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <CategoryPage
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
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-game"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <AddGamePage
                  onGameSelected={(game) => {
                    console.log("Game selected from IGDB:", game);
                    // TODO: Implement game addition logic
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search-results"
            element={
              <ProtectedRoute>
                <Header
                  onPlay={openLauncher}
                  allGames={allGames}
                  allCollections={allCollections}
                  onGameSelect={handleGameSelect}
                  onHomeClick={() => navigate("/")}
                  onSettingsClick={() => navigate("/settings")}
                  onAddGameClick={() => setAddGameOpen(true)}
                />
                <SearchResultsPage
                  onPlay={openLauncher}
                  onGameClick={handleGameClick}
                />
              </ProtectedRoute>
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
        />

        {/* Launch Modal - handles both loading and error states */}
        <LaunchModal
          isLaunching={isLaunching}
          launchError={launchError}
          onClose={handleCloseLaunchModal}
        />
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
  const { setLoading: setGlobalLoading } = useLoading();
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
    setGlobalLoading(true);
    try {
      // Fetch single game from dedicated endpoint
        const url = buildApiUrlWithBase(`/games/${gameId}`);
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": getApiToken(),
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
        genre: found.genre,
        criticratings: found.criticratings,
        userratings: found.userratings,
      };
      setGame(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching game:", errorMessage);
      setGame(null);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
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
      onGameUpdate={(updatedGame) => {
        setGame(updatedGame);
      }}
      onGameDelete={() => {
        // Navigate back after deletion
        window.history.back();
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <AppContent />
    </BrowserRouter>
  );
}
