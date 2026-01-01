import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Cover from "./Cover";
import StarRating from "../common/StarRating";
import Summary from "../common/Summary";
import GameCategories from "./GameCategories";
import EditGameModal from "./EditGameModal";
import DropdownMenu from "../common/DropdownMenu";
import Tooltip from "../common/Tooltip";
import BackgroundManager, { useBackground } from "../common/BackgroundManager";
import LibrariesBar from "../layout/LibrariesBar";
import type { GameItem } from "../../types";
import { formatGameDate } from "../../utils/date";
import { buildApiUrl } from "../../utils/api";
import "./GameDetail.css";

type GameDetailProps = {
  game: GameItem;
  coverUrl: string;
  backgroundUrl: string;
  onPlay: (game: GameItem) => void;
  apiBase: string;
  apiToken: string;
  onGameUpdate?: (updatedGame: GameItem) => void;
  onGameDelete?: (game: GameItem) => void;
};

export default function GameDetail({
  game,
  coverUrl,
  backgroundUrl,
  onPlay,
  apiBase,
  apiToken,
  onGameUpdate,
  onGameDelete,
}: GameDetailProps) {
  const { t } = useTranslation();
  const [localGame, setLocalGame] = useState<GameItem>(game);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Sync localGame when game prop changes
  useEffect(() => {
    setLocalGame(game);
  }, [game]);
  
  const coverWidth = 256;
  const coverHeight = 384; // 256 * 1.5
  const hasBackground = Boolean(backgroundUrl && backgroundUrl.trim() !== "");

  // Format release date
  const releaseDate = formatGameDate(localGame);

  // Convert stars from 1-10 to 0-5 scale
  const rating = localGame.stars ? localGame.stars / 2 : null;

  const handleRatingChange = async (newStars: number) => {
    try {
      const url = buildApiUrl(apiBase, `/games/${localGame.ratingKey}`);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': apiToken,
        },
        body: JSON.stringify({ stars: newStars }),
      });

      if (response.ok) {
        const updatedGame: GameItem = {
          ...localGame,
          stars: newStars,
        };
        setLocalGame(updatedGame);
        if (onGameUpdate) {
          onGameUpdate(updatedGame);
        }
      } else {
        console.error('Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  // Get coverSize from localStorage
  const coverSize = (() => {
    const saved = localStorage.getItem("coverSize");
    return saved ? parseInt(saved, 10) : 150;
  })();

  const handleCoverSizeChange = (size: number) => {
    localStorage.setItem("coverSize", size.toString());
  };

  return (
    <BackgroundManager 
      backgroundUrl={backgroundUrl} 
      hasBackground={hasBackground}
      elementId={game.ratingKey}
    >
      <GameDetailContent
        game={localGame}
        coverUrl={coverUrl}
        coverWidth={coverWidth}
        coverHeight={coverHeight}
        releaseDate={releaseDate}
        rating={rating}
        onPlay={onPlay}
        coverSize={coverSize}
        handleCoverSizeChange={handleCoverSizeChange}
        onRatingChange={handleRatingChange}
        isEditModalOpen={isEditModalOpen}
        onEditModalOpen={() => setIsEditModalOpen(true)}
        onEditModalClose={() => setIsEditModalOpen(false)}
        onGameUpdate={(updatedGame) => {
          setLocalGame(updatedGame);
          if (onGameUpdate) {
            onGameUpdate(updatedGame);
          }
        }}
        onGameDelete={onGameDelete}
        t={t}
      />
    </BackgroundManager>
  );
}

function GameDetailContent({
  game,
  coverUrl,
  coverWidth,
  coverHeight,
  releaseDate,
  rating,
  onPlay,
  coverSize,
  handleCoverSizeChange,
  onRatingChange,
  isEditModalOpen,
  onEditModalOpen,
  onEditModalClose,
  onGameUpdate,
  onGameDelete,
  t,
}: {
  game: GameItem;
  coverUrl: string;
  coverWidth: number;
  coverHeight: number;
  releaseDate: string | null;
  rating: number | null;
  onPlay: (game: GameItem) => void;
  coverSize: number;
  handleCoverSizeChange: (size: number) => void;
  onRatingChange?: (newStars: number) => void;
  isEditModalOpen: boolean;
  onEditModalOpen: () => void;
  onEditModalClose: () => void;
  onGameUpdate: (updatedGame: GameItem) => void;
  onGameDelete?: (game: GameItem) => void;
  t: (key: string) => string;
}) {
  const { hasBackground, isBackgroundVisible } = useBackground();
  
  // Helper function to format rating value (0-10 float)
  const formatRating = (value: number | null | undefined): string | null => {
    if (value === null || value === undefined || isNaN(value)) {
      return null;
    }
    const numValue = Number(value);
    if (numValue < 0 || numValue > 10) {
      return null;
    }
    // Format to show decimal only if present (e.g., 8.5 instead of 8.50, but 8 instead of 8.0)
    return numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(1);
  };
  
  const criticRating = formatRating(game.criticratings);
  const userRating = formatRating(game.userratings);
  
  return (
    <>
      <div className={hasBackground && isBackgroundVisible ? 'game-detail-libraries-bar-transparent' : ''} style={{ position: 'relative', zIndex: 2 }}>
        <LibrariesBar
          libraries={[]}
          activeLibrary={{ key: "game", type: "game" }}
          onSelectLibrary={() => {}}
          loading={false}
          error={null}
          coverSize={coverSize}
          onCoverSizeChange={handleCoverSizeChange}
          viewMode="grid"
          onViewModeChange={() => {}}
        />
      </div>
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
              title={game.title}
              coverUrl={coverUrl}
              width={coverWidth}
              height={coverHeight}
              onPlay={() => onPlay(game)}
              showTitle={true}
              titlePosition="overlay"
              detail={false}
              play={true}
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
                {game.title}
              </h1>
              {releaseDate && (
                <div 
                  className="text-white" 
                  style={{ 
                    opacity: 0.8,
                    fontFamily: 'var(--font-body-2-font-family)',
                    fontSize: 'var(--font-body-2-font-size)',
                    lineHeight: 'var(--font-body-2-line-height)'
                  }}
                >
                  {releaseDate}
                </div>
              )}
              <GameCategories game={game} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                {(criticRating !== null) || (userRating !== null) ? (
                  <>
                    {criticRating !== null && (
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
                            gap: '8px',
                            cursor: 'help'
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
                          {criticRating}
                        </div>
                      </Tooltip>
                    )}
                    {userRating !== null && (
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
                            gap: '8px',
                            cursor: 'help'
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
                          {userRating}
                        </div>
                      </Tooltip>
                    )}
                  </>
                ) : null}
                <StarRating 
                  rating={rating || 0} 
                  readOnly={false}
                  onRatingChange={onRatingChange}
                />
              </div>
              <div className="game-detail-actions" style={{ marginTop: '16px' }}>
                <button
                  onClick={() => onPlay(game)}
                  style={{
                    backgroundColor: '#E5A00D',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    paddingLeft: '8px',
                    paddingRight: '12px',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    width: 'fit-content',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    lineHeight: '1.2'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5B041';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#E5A00D';
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ display: 'block' }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t("common.play")}
                </button>
                <Tooltip text={t("common.edit")} delay={200}>
                  <button
                    onClick={onEditModalOpen}
                    className="game-detail-edit-button"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </Tooltip>
                <DropdownMenu
                  onEdit={onEditModalOpen}
                  gameId={game.ratingKey}
                  gameTitle={game.title}
                  onGameDelete={onGameDelete ? (gameId: string) => {
                    if (game.ratingKey === gameId && onGameDelete) {
                      onGameDelete(game);
                    }
                  } : undefined}
                  horizontal={true}
                  className="game-detail-dropdown-menu"
                  toolTipDelay={200}
                />
              </div>
              <EditGameModal
                isOpen={isEditModalOpen}
                onClose={onEditModalClose}
                game={game}
                onGameUpdate={onGameUpdate}
              />
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
    </>
  );
}
