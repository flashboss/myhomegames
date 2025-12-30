import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import LibrariesBar from "../components/layout/LibrariesBar";
import type { ViewMode } from "../components/layout/LibrariesBar";
import LibraryPage from "./LibraryPage";
import RecommendedPage from "./RecommendedPage";
import CollectionsPage from "./CollectionsPage";
import CategoriesPage from "./CategoriesPage";
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

type CategoryItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

export type { GameItem, CategoryItem };

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverSize, setCoverSize] = useState(() => {
    const saved = localStorage.getItem("coverSize");
    return saved ? parseInt(saved, 10) : 150;
  });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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

  // Handler to change cover size
  const handleCoverSizeChange = (size: number) => {
    setCoverSize(size);
    localStorage.setItem("coverSize", size.toString());
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  // Restore last selected library or auto-select first library when libraries are loaded
  useEffect(() => {
    if (libraries.length > 0 && !activeLibrary) {
      const savedLibraryKey = localStorage.getItem("lastSelectedLibrary");
      const libraryToSelect = savedLibraryKey
        ? libraries.find((lib) => lib.key === savedLibraryKey) || libraries[0]
        : libraries[0];

      setActiveLibrary(libraryToSelect);
      if (libraryToSelect.key === "libreria") {
        const savedViewMode = loadViewModeForLibrary(libraryToSelect.key);
        setViewMode(savedViewMode);
      } else {
        setViewMode("grid");
      }
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
      // Add "raccolte" (collections) as a separate section, before "categorie"
      const categorieIndex = parsed.findIndex((lib) => lib.key === "categorie");
      const raccolteItem = { key: "raccolte", title: undefined, type: "collections" };
      if (categorieIndex >= 0) {
        parsed.splice(categorieIndex, 0, raccolteItem);
      } else {
        parsed.push(raccolteItem);
      }
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


  function onSelectLibrary(s: GameLibrarySection) {
    localStorage.setItem("lastSelectedLibrary", s.key);
    setActiveLibrary(s);
    if (s.key === "libreria") {
      const savedViewMode = loadViewModeForLibrary(s.key);
      setViewMode(savedViewMode);
    } else {
      setViewMode("grid");
    }
  }

  function handleGameClick(game: GameItem | CategoryItem) {
    onGameClick(game as GameItem);
  }

  function handleGamesLoaded(loadedGames: GameItem[]) {
    onGamesLoaded(loadedGames);
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
        onCoverSizeChange={handleCoverSizeChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <div className="bg-[#1a1a1a] home-page-main-container">
        {!activeLibrary ? (
          <div className="flex items-center justify-center h-full">
          </div>
        ) : (
          <>
            {activeLibrary.key === "libreria" && (
              <LibraryPage
                apiBase={apiBase}
                apiToken={apiToken}
                onGameClick={handleGameClick}
                onGamesLoaded={handleGamesLoaded}
                onPlay={onPlay}
                buildApiUrl={buildApiUrl}
                buildCoverUrl={buildCoverUrl}
                coverSize={coverSize}
                viewMode={viewMode}
              />
            )}
            {activeLibrary.key === "consigliati" && (
              <RecommendedPage
                apiBase={apiBase}
                apiToken={apiToken}
                onGameClick={handleGameClick}
                onGamesLoaded={handleGamesLoaded}
                onPlay={onPlay}
                buildApiUrl={buildApiUrl}
                buildCoverUrl={buildCoverUrl}
                coverSize={coverSize}
              />
            )}
            {activeLibrary.key === "raccolte" && (
              <CollectionsPage
                apiBase={apiBase}
                apiToken={apiToken}
                onPlay={onPlay}
                buildApiUrl={buildApiUrl}
                buildCoverUrl={buildCoverUrl}
                coverSize={coverSize}
              />
            )}
            {activeLibrary.key === "categorie" && (
              <CategoriesPage
                apiBase={apiBase}
                apiToken={apiToken}
                buildApiUrl={buildApiUrl}
                buildCoverUrl={buildCoverUrl}
                coverSize={coverSize}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
