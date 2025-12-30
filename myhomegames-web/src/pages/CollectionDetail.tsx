import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GamesList from "../components/games/GamesList";
import CoverPlaceholder from "../components/common/CoverPlaceholder";
import LibrariesBar from "../components/layout/LibrariesBar";

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

type CollectionInfo = {
  id: string;
  title: string;
  cover?: string;
};

type CollectionDetailProps = {
  apiBase: string;
  apiToken: string;
  onGameClick: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
  onPlay?: (game: GameItem) => void;
  buildApiUrl: (apiBase: string, path: string, params?: Record<string, string | number | boolean>) => string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
};

export default function CollectionDetail({
  apiBase,
  apiToken,
  onGameClick,
  onGamesLoaded,
  onPlay,
  buildApiUrl,
  buildCoverUrl,
}: CollectionDetailProps) {
  const { t } = useTranslation();
  const { collectionId } = useParams<{ collectionId: string }>();
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortAscending] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [viewMode] = useState<"grid" | "detail" | "table">("grid");
  const [coverSize, setCoverSize] = useState(() => {
    const saved = localStorage.getItem("coverSize");
    return saved ? parseInt(saved, 10) : 150;
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Handler to change cover size
  const handleCoverSizeChange = (size: number) => {
    setCoverSize(size);
    localStorage.setItem("coverSize", size.toString());
  };

  useEffect(() => {
    if (collectionId) {
      fetchCollectionInfo(collectionId);
      fetchCollectionGames(collectionId);
    }
  }, [collectionId]);

  async function fetchCollectionInfo(collectionId: string) {
    try {
      const url = buildApiUrl(apiBase, "/collections");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const collections = (json.collections || []) as any[];
      const found = collections.find((c) => c.id === collectionId);
      if (found) {
        setCollection({
          id: found.id,
          title: found.title,
          cover: found.cover,
        });
      }
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching collection info:", errorMessage);
    }
  }

  async function fetchCollectionGames(collectionId: string) {
    setLoading(true);
    try {
      const url = buildApiUrl(apiBase, `/collections/${collectionId}/games`, {
        sort: "title",
      });
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
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
      setGames(parsed);
      onGamesLoaded(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching collection games:", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Sort games
  const sortedGames = useMemo(() => {
    const sorted = [...games];
    sorted.sort((a, b) => {
      const compareResult = (a.title || "").localeCompare(b.title || "");
      return sortAscending ? compareResult : -compareResult;
    });
    return sorted;
  }, [games, sortAscending]);

  // Calculate year range from games
  const yearRange = useMemo(() => {
    const years = games
      .map((game) => game.year)
      .filter((year): year is number => year !== null && year !== undefined);
    
    if (years.length === 0) {
      return null;
    }
    
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    
    if (minYear === maxYear) {
      return minYear.toString();
    }
    
    return `${minYear} - ${maxYear}`;
  }, [games]);

  // Calculate average rating from games (scale 1-10 to 0-5 stars)
  const averageRating = useMemo(() => {
    const ratings = games
      .map((game) => game.stars)
      .filter((stars): stars is number => stars !== null && stars !== undefined);
    
    if (ratings.length === 0) {
      return null;
    }
    
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    const average = sum / ratings.length;
    // Convert from 1-10 scale to 0-5 stars scale
    return (average / 10) * 5;
  }, [games]);

  if (!collectionId) {
    return (
      <div className="bg-[#1a1a1a] text-white flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
        <div className="text-center">
          <div className="text-gray-400">Collection not found</div>
        </div>
      </div>
    );
  }

  const collectionCoverUrl = collection?.cover ? buildCoverUrl(apiBase, collection.cover) : "";
  const showPlaceholder = !collectionCoverUrl || imageError;
  const collectionCoverWidth = 240;
  const collectionCoverHeight = 135; // 16:9 aspect ratio

  return (
    <>
      <LibrariesBar
        libraries={[]}
        activeLibrary={{ key: "collection", type: "collection" }}
        onSelectLibrary={() => {}}
        loading={false}
        error={null}
        coverSize={coverSize}
        onCoverSizeChange={handleCoverSizeChange}
        viewMode={viewMode}
        onViewModeChange={() => {}}
      />
      <div className="bg-[#1a1a1a] home-page-main-container">
        <main className="flex-1 home-page-content">
      <div className="home-page-layout">
        <div className="home-page-content-wrapper">
          {/* Games List */}
          <div
            ref={scrollContainerRef}
            className="home-page-scroll-container"
            style={{ paddingLeft: '64px', paddingRight: '64px' }}
          >
            {/* Collection Cover and Title */}
            {collection && (
              <div className="pt-8" style={{ display: 'flex', flexDirection: 'row', gap: '48px', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box', marginBottom: '32px' }}>
                {/* Cover */}
                <div style={{ flexShrink: 0 }}>
                  <div className="relative aspect-[16/9] bg-[#2a2a2a] rounded overflow-hidden" style={{ width: `${collectionCoverWidth}px` }}>
                    {showPlaceholder ? (
                      <CoverPlaceholder
                        title={collection.title}
                        width={collectionCoverWidth}
                        height={collectionCoverHeight}
                      />
                    ) : (
                      <img
                        src={collectionCoverUrl}
                        alt={collection.title}
                        className="object-cover w-full h-full"
                        onError={() => {
                          setImageError(true);
                        }}
                      />
                    )}
                  </div>
                </div>
                {/* Collection Info Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '16px', minHeight: `${collectionCoverHeight}px`, minWidth: 0, visibility: 'visible' }}>
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
                      {collection.title}
                    </h1>
                    {yearRange && (
                      <div 
                        className="text-white" 
                        style={{ 
                          opacity: 0.8,
                          fontFamily: 'var(--font-body-2-font-family)',
                          fontSize: 'var(--font-body-2-font-size)',
                          lineHeight: 'var(--font-body-2-line-height)'
                        }}
                      >
                        {yearRange}
                      </div>
                    )}
                    {averageRating !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const filled = averageRating >= star;
                          const halfFilled = averageRating >= star - 0.5 && averageRating < star;
                          const starId = `star-${star}-${averageRating}`;
                          
                          return (
                            <div key={star} style={{ position: 'relative', width: '16px', height: '16px' }}>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.3)"
                                strokeWidth="1.5"
                                style={{ position: 'absolute', top: 0, left: 0 }}
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              {filled && (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="#ffffff"
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  style={{ position: 'absolute', top: 0, left: 0 }}
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              )}
                              {halfFilled && (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  style={{ position: 'absolute', top: 0, left: 0 }}
                                >
                                  <defs>
                                    <linearGradient id={starId} x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="50%" stopColor="#ffffff" />
                                      <stop offset="50%" stopColor="transparent" />
                                    </linearGradient>
                                  </defs>
                                  <path
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                    fill={`url(#${starId})`}
                                  />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Additional information can be added here */}
                  </div>
                </div>
              </div>
            )}

            {!loading && (
              <div style={{ width: '100%' }}>
                {/* Games count */}
                <div style={{ paddingLeft: '0', marginBottom: '32px', marginTop: '8px' }}>
                  <h2 
                    className="text-white"
                    style={{
                      fontFamily: 'var(--font-heading-2-font-family)',
                      fontSize: 'var(--font-heading-2-font-size)',
                      lineHeight: 'var(--font-heading-2-line-height)',
                      fontWeight: 600
                    }}
                  >
                    {sortedGames.length} {t("common.games")}
                  </h2>
                </div>
                <style>{`
                  .collection-detail-games-list .games-list-container {
                    justify-content: flex-start !important;
                  }
                `}</style>
                <div className="collection-detail-games-list">
                  <GamesList
                    games={sortedGames}
                    apiBase={apiBase}
                    onGameClick={onGameClick}
                    onPlay={onPlay}
                    buildCoverUrl={buildCoverUrl}
                    coverSize={coverSize}
                    itemRefs={itemRefs}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
      </div>
    </>
  );
}

