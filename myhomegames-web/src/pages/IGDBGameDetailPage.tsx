import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Cover from "../components/games/Cover";
import Summary from "../components/common/Summary";
import GameCategories from "../components/games/GameCategories";
import BackgroundManager from "../components/common/BackgroundManager";
import Tooltip from "../components/common/Tooltip";
import { buildApiUrl } from "../utils/api";
import { API_BASE, getApiToken } from "../config";
import { useLoading } from "../contexts/LoadingContext";
import type { GameItem, IGDBGame } from "../types";
import "./IGDBGameDetailPage.css";

export default function IGDBGameDetailPage() {
  const { t } = useTranslation();
  const { igdbId } = useParams<{ igdbId: string }>();
  const navigate = useNavigate();
  const { setLoading: setGlobalLoading } = useLoading();
  const [game, setGame] = useState<IGDBGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingAsOwned, setMarkingAsOwned] = useState(false);

  // Helper function to format release date (same as GameDetail)
  const formatReleaseDate = (game: IGDBGame): string | null => {
    if (game.releaseDateFull) {
      return `${game.releaseDateFull.day}/${game.releaseDateFull.month}/${game.releaseDateFull.year}`;
    }
    if (game.releaseDate) {
      return game.releaseDate.toString();
    }
    return null;
  };

  // Helper function to format rating value (IGDB uses 0-100 scale, convert to 0-10)
  const formatRating = (value: number | null | undefined): string | null => {
    if (value === null || value === undefined || isNaN(value)) {
      return null;
    }
    const numValue = Number(value);
    // IGDB ratings are on 0-100 scale, convert to 0-10
    if (numValue >= 0 && numValue <= 100) {
      const convertedValue = numValue / 10;
      // Format to show decimal only if present (e.g., 8.5 instead of 8.50, but 8 instead of 8.0)
      return convertedValue % 1 === 0 ? convertedValue.toString() : convertedValue.toFixed(1);
    }
    return null;
  };

  // Create a temporary GameItem for GameCategories component
  const gameItemForCategories: GameItem | null = game && game.genres && game.genres.length > 0
    ? {
        ratingKey: `igdb-${game.id}`,
        title: game.name,
        summary: game.summary,
        cover: game.cover || "",
        background: undefined,
        day: game.releaseDateFull?.day || null,
        month: game.releaseDateFull?.month || null,
        year: game.releaseDateFull?.year || game.releaseDate || null,
        stars: null,
        genre: game.genres,
        criticratings: game.criticRating || null,
        userratings: game.userRating || null,
        command: null,
      }
    : null;

  useEffect(() => {
    // Always fetch game details with high-res cover from dedicated endpoint
    // This ensures we get the high-resolution cover even if game data was passed via state
    if (igdbId) {
      fetchIGDBGame(parseInt(igdbId, 10));
    }
  }, [igdbId]);

  async function fetchIGDBGame(gameId: number) {
    setLoading(true);
    setGlobalLoading(true);
    try {
      // Fetch game details with high-res cover from dedicated endpoint
      const url = buildApiUrl(API_BASE, `/igdb/game/${gameId}`);
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

      const foundGame = await res.json();

      if (!foundGame) {
        setGame(null);
        return;
      }

      setGame(foundGame);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching IGDB game:", errorMessage);
      setGame(null);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }

  async function handleMarkAsOwned() {
    if (!game) return;

    setMarkingAsOwned(true);
    setGlobalLoading(true);
    try {
      const url = buildApiUrl(API_BASE, "/games/add-from-igdb");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Auth-Token": getApiToken(),
        },
        body: JSON.stringify({
          igdbId: game.id,
          name: game.name,
          summary: game.summary,
          cover: game.cover,
          releaseDate: game.releaseDateFull?.timestamp || game.releaseDate,
          genres: game.genres,
          criticRating: game.criticRating,
          userRating: game.userRating,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      // Navigate to the newly added game detail page
      if (json.gameId) {
        navigate(`/game/${json.gameId}`);
      } else {
        // If no gameId returned, reload games and navigate to home
        navigate("/");
      }
    } catch (err: any) {
      console.error("Error marking game as owned:", err);
      alert(t("igdbGameDetail.errorAdding") + ": " + (err.message || String(err)));
    } finally {
      setMarkingAsOwned(false);
      setGlobalLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  if (!game) {
    return (
      <div
        className="bg-[#1a1a1a] text-white flex items-center justify-center"
        style={{ width: "100%", height: "100%" }}
      >
        <div className="text-center">
          <div className="text-gray-400">{t("igdbGameDetail.notFound")}</div>
        </div>
      </div>
    );
  }

  const coverWidth = 256;
  const coverHeight = 384;
  const coverUrl = game.cover || "";
  const hasBackground = Boolean(game?.background && game.background.trim() !== "");
  const backgroundUrl = game?.background || "";

  return (
    <BackgroundManager 
      backgroundUrl={backgroundUrl} 
      hasBackground={hasBackground}
      elementId={`igdb-${game.id}`}
    >
      <div style={{ position: 'relative', zIndex: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div 
          className="home-page-main-container"
          style={{
            backgroundColor: 'transparent',
            position: 'relative',
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          <main className="flex-1 home-page-content" style={{ position: 'relative', zIndex: 1, minHeight: 0 }}>
          <div className="home-page-layout" style={{ minHeight: 0 }}>
            <div className="home-page-content-wrapper" style={{ minHeight: 0 }}>
              <div
                className="home-page-scroll-container"
                style={{ paddingLeft: '64px', paddingRight: '64px', paddingTop: '5px', paddingBottom: '32px' }}
              >
        <div className="pt-8" style={{ display: 'flex', flexDirection: 'row', gap: '48px', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' }}>
          {/* Cover Image */}
          <div style={{ flexShrink: 0 }}>
            <Cover
              title={game.name}
              coverUrl={coverUrl}
              width={coverWidth}
              height={coverHeight}
              showTitle={false}
              titlePosition="overlay"
              detail={false}
              play={false}
              showBorder={false}
            />
          </div>

          {/* Game Info Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '16px', minHeight: `${coverHeight}px`, minWidth: 0, visibility: 'visible' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', visibility: 'visible' }}>
              <h1 
                className="text-white" 
                style={{ 
                  visibility: 'visible', 
                  display: 'block',
                  fontFamily: 'var(--font-heading-1-font-family)',
                  fontSize: 'var(--font-heading-1-font-size)',
                  lineHeight: 'var(--font-heading-1-line-height)'
                }}
              >
                {game.name}
              </h1>
              {formatReleaseDate(game) && (
                <div 
                  className="text-white" 
                  style={{ 
                    opacity: 0.8,
                    fontFamily: 'var(--font-body-2-font-family)',
                    fontSize: 'var(--font-body-2-font-size)',
                    lineHeight: 'var(--font-body-2-line-height)'
                  }}
                >
                  {formatReleaseDate(game)}
                </div>
              )}
              {gameItemForCategories && <GameCategories game={gameItemForCategories} />}
              {(() => {
                const criticRatingFormatted = formatRating(game.criticRating);
                const userRatingFormatted = formatRating(game.userRating);
                return (criticRatingFormatted !== null) || (userRatingFormatted !== null) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {criticRatingFormatted !== null && (
                      <Tooltip text={t("gameDetail.criticRating")}>
                        <div 
                          className="text-white" 
                          style={{ 
                            opacity: 0.8,
                            fontFamily: 'var(--font-body-2-font-family)',
                            fontSize: 'var(--font-body-2-font-size)',
                            lineHeight: 'var(--font-body-2-line-height)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="#FFD700"
                            stroke="#FFA500"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                          >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          {criticRatingFormatted}
                        </div>
                      </Tooltip>
                    )}
                    {userRatingFormatted !== null && (
                      <Tooltip text={t("gameDetail.userRating")}>
                        <div 
                          className="text-white" 
                          style={{ 
                            opacity: 0.8,
                            fontFamily: 'var(--font-body-2-font-family)',
                            fontSize: 'var(--font-body-2-font-size)',
                            lineHeight: 'var(--font-body-2-line-height)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="#4CAF50"
                            stroke="#2E7D32"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {userRatingFormatted}
                        </div>
                      </Tooltip>
                    )}
                  </div>
                ) : null;
              })()}
              <div className="game-detail-actions" style={{ marginTop: '16px' }}>
                <button
                  onClick={handleMarkAsOwned}
                  disabled={markingAsOwned}
                  style={{
                    backgroundColor: markingAsOwned ? '#666' : '#E5A00D',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    paddingLeft: '8px',
                    paddingRight: '12px',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    cursor: markingAsOwned ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    width: 'fit-content',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    lineHeight: '1.2',
                    opacity: markingAsOwned ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!markingAsOwned) {
                      e.currentTarget.style.backgroundColor = '#F5B041';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!markingAsOwned) {
                      e.currentTarget.style.backgroundColor = '#E5A00D';
                    }
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ display: 'block' }}
                  >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  {markingAsOwned ? t("igdbGameDetail.adding") : t("igdbGameDetail.add")}
                </button>
              </div>
              {game.summary && <Summary summary={game.summary} />}
            </div>
          </div>
        </div>
              </div>
            </div>
          </div>
          </main>
        </div>
      </div>
    </BackgroundManager>
  );
}

