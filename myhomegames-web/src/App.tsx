import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import Favicon from "./components/Favicon";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import AddGamePage from "./pages/AddGamePage";
import GameDetail from "./components/GameDetail";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  duration?: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000";
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

function buildApiUrl(path: string, params: Record<string, string | number | boolean> = {}) {
  const u = new URL(path, API_BASE);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

function buildCoverUrl(cover?: string) {
  if (!cover) return "";
  return buildApiUrl(cover);
}

function AppContent() {
  const [allGames, setAllGames] = useState<GameItem[]>([]);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  function openLauncher(item: GameItem) {
    const launchUrl = buildApiUrl(`/launcher`, { gameId: item.ratingKey, token: API_TOKEN });
    setPlayerUrl(launchUrl);
  }

  function handleGameClick(game: GameItem) {
    navigate(`/game/${game.ratingKey}`);
  }

  function handleGameSelect(game: GameItem) {
    navigate(`/game/${game.ratingKey}`);
  }

  return (
    <>
      <Favicon />
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header 
          allGames={allGames} 
          onGameSelect={handleGameSelect}
          onHomeClick={() => navigate("/")}
          onSettingsClick={() => navigate("/settings")}
          onAddGameClick={() => navigate("/add-game")}
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
                    const existingIds = new Set(prev.map((g: GameItem) => g.ratingKey));
                    const newGames = games.filter((g: GameItem) => !existingIds.has(g.ratingKey));
                    return [...prev, ...newGames];
                  });
                }}
              />
            } 
          />
          <Route 
            path="/game/:gameId" 
            element={
              <GameDetailPage 
                allGames={allGames}
                onPlay={openLauncher}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={<SettingsPage />} 
          />
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
        </Routes>

        {/* Modal Plex-style for launcher */}
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

function GameDetailPage({ allGames, onPlay }: { 
  allGames: GameItem[];
  onPlay: (game: GameItem) => void;
}) {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const game = allGames.find(g => g.ratingKey === gameId);

  if (!game) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">Game not found</div>
          <button
            onClick={() => navigate("/")}
            className="text-[#E5A00D] hover:text-[#F5B041] transition-colors"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameDetail
      game={game}
      coverUrl={buildCoverUrl(game.cover)}
      onPlay={onPlay}
      onClose={() => navigate("/")}
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
