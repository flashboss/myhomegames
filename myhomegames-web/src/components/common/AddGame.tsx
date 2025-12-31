import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./AddGame.css";

type IGDBGame = {
  id: number;
  name: string;
  summary: string;
  cover: string | null;
  releaseDate: number | null;
};

type AddGameProps = {
  isOpen: boolean;
  onClose: () => void;
  onGameSelected: (game: IGDBGame) => void;
  apiBase: string;
  apiToken: string;
};

export default function AddGame({
  isOpen,
  onClose,
  onGameSelected,
  apiBase,
  apiToken,
}: AddGameProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
      setError(null);
      return;
    }

    // Handle ESC key to close modal
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscKey);

    // Clear timeout on unmount
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Debounce search
    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = new URL("/igdb/search", apiBase);
        url.searchParams.set("q", searchQuery.trim());

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": apiToken,
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        setResults(json.games || []);
        setError(null);
      } catch (err: any) {
        setError(String(err.message || err));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, apiBase, apiToken]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="add-game-overlay"
      onClick={onClose}
    >
      <div
        className="add-game-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-game-header">
          <h2 className="add-game-title">{t("addGame.title")}</h2>
        </div>

        <div className="add-game-content">
          <div className="add-game-search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("addGame.searchPlaceholder")}
              className="add-game-search-input"
              autoFocus
            />
          </div>

          {error && (
            <div className="add-game-error">
              {t("addGame.error")}: {error}
            </div>
          )}

          <div className="add-game-results">
            {loading ? (
              <div className="add-game-loading">
                <div className="add-game-spinner"></div>
                <div>{t("addGame.loading")}</div>
              </div>
            ) : results.length === 0 && searchQuery.trim().length >= 2 ? (
              <div className="add-game-empty-state">
                {t("addGame.noResults")}
              </div>
            ) : results.length === 0 ? (
              <div className="add-game-empty-state">
                {t("addGame.typeToSearch")}
              </div>
            ) : (
              <div className="add-game-results-list">
                {results.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      onGameSelected(game);
                      onClose();
                    }}
                    className="add-game-result-item"
                  >
                    {game.cover ? (
                      <img
                        src={game.cover}
                        alt={game.name}
                        className="add-game-result-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="add-game-result-placeholder">
                        🎮
                      </div>
                    )}
                    <div className="add-game-result-content">
                      <div className="add-game-result-title">
                        {game.name}
                      </div>
                      {game.releaseDate && (
                        <div className="add-game-result-date">
                          {game.releaseDate}
                        </div>
                      )}
                      {game.summary && (
                        <div className="add-game-result-summary">
                          {game.summary}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
