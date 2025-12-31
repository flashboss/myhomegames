import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Cover from "./Cover";
import StarRating from "../common/StarRating";
import Summary from "../common/Summary";
import BackgroundManager, { useBackground } from "../common/BackgroundManager";
import LibrariesBar from "../layout/LibrariesBar";
import type { GameItem } from "../../types";
import "./GameDetail.css";

type GameDetailProps = {
  game: GameItem;
  coverUrl: string;
  backgroundUrl: string;
  onPlay: (game: GameItem) => void;
};

export default function GameDetail({
  game,
  coverUrl,
  backgroundUrl,
  onPlay,
}: GameDetailProps) {
  const { t } = useTranslation();
  const coverWidth = 256;
  const coverHeight = 384; // 256 * 1.5
  const hasBackground = Boolean(backgroundUrl && backgroundUrl.trim() !== "");

  // Format release date
  const releaseDate = useMemo(() => {
    if (game.year !== null && game.year !== undefined) {
      if (
        game.day !== null &&
        game.day !== undefined &&
        game.month !== null &&
        game.month !== undefined
      ) {
        return `${game.day}/${game.month}/${game.year}`;
      }
      return game.year.toString();
    }
    return null;
  }, [game.year, game.month, game.day]);

  // Convert stars from 1-10 to 0-5 scale
  const rating = game.stars ? game.stars / 2 : null;

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
        game={game}
        coverUrl={coverUrl}
        coverWidth={coverWidth}
        coverHeight={coverHeight}
        releaseDate={releaseDate}
        rating={rating}
        onPlay={onPlay}
        coverSize={coverSize}
        handleCoverSizeChange={handleCoverSizeChange}
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
  t: (key: string) => string;
}) {
  const { hasBackground, isBackgroundVisible } = useBackground();
  
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
      <div style={{ position: 'relative', zIndex: 2, height: 'calc(100vh - 64px - 64px)', display: 'flex', flexDirection: 'column' }}>
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
              {rating !== null && (
                <StarRating rating={rating} />
              )}
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
                  marginTop: '16px',
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
