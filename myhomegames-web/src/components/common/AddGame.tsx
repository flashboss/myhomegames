import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE, API_TOKEN } from "../../config";
import type { GameItem, IGDBGame } from "../../types";
import "./AddGame.css";

type AddGameProps = {
  isOpen: boolean;
  onClose: () => void;
  allGames?: GameItem[];
};

export default function AddGame({
  isOpen,
  onClose,
  allGames = [],
}: AddGameProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if an IGDB game matches a local game (by ID)
  function findMatchingLocalGame(igdbGame: IGDBGame): GameItem | undefined {
    return allGames.find(
      (localGame) => String(localGame.ratingKey) === String(igdbGame.id)
    );
  }

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
        const url = new URL("/igdb/search", API_BASE);
        url.searchParams.set("q", searchQuery.trim());

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": API_TOKEN,
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
  }, [searchQuery]);

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
              id="add-game-search"
              name="search"
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
                {results.map((game) => {
                  const matchingGame = findMatchingLocalGame(game);
                  const isNew = !matchingGame;
                  
                  return (
                    <button
                      key={game.id}
                      onClick={() => {
                        if (matchingGame) {
                          // Navigate to existing game detail
                          navigate(`/game/${matchingGame.ratingKey}`);
                          onClose();
                        } else {
                          // Navigate to IGDB game detail page with game data
                          navigate(`/igdb-game/${game.id}`, {
                            state: { gameData: game }
                          });
                          onClose();
                        }
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
                        <div className="add-game-result-title-row">
                          <div className="add-game-result-title">
                            {game.name}
                          </div>
                          {isNew && (
                            <span className="add-game-result-new-label">
                              {t("addGame.new")}
                            </span>
                          )}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
