import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { useLoading } from "../contexts/LoadingContext";
import GamesList from "../components/games/GamesList";
import Cover from "../components/games/Cover";
import LibrariesBar from "../components/layout/LibrariesBar";
import StarRating from "../components/common/StarRating";
import Summary from "../components/common/Summary";
import EditCollectionModal from "../components/collections/EditCollectionModal";
import DropdownMenu from "../components/common/DropdownMenu";
import Tooltip from "../components/common/Tooltip";
import BackgroundManager, { useBackground } from "../components/common/BackgroundManager";
import { compareTitles } from "../utils/stringUtils";
import { buildApiUrl, buildCoverUrl, buildBackgroundUrl } from "../utils/api";
import { API_BASE, getApiToken } from "../config";
import type { GameItem, CollectionInfo } from "../types";
import "./CollectionDetail.css";

type CollectionDetailProps = {
  onGameClick: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
  onPlay?: (game: GameItem) => void;
};

export default function CollectionDetail({
  onGameClick,
  onGamesLoaded,
  onPlay,
}: CollectionDetailProps) {
  const { t } = useTranslation();
  const { setLoading: setGlobalLoading } = useLoading();
  const { collectionId } = useParams<{ collectionId: string }>();
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [viewMode] = useState<"grid" | "detail" | "table">("grid");
  const [coverSize, setCoverSize] = useState(() => {
    const saved = localStorage.getItem("coverSize");
    return saved ? parseInt(saved, 10) : 150;
  });
  const [customOrder, setCustomOrder] = useState<string[] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Restore scroll position
  useScrollRestoration(scrollContainerRef);

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

  // Hide content until fully rendered
  useLayoutEffect(() => {
    if (!loading && collection && games.length > 0) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    } else if (loading) {
      setIsReady(false);
    }
  }, [loading, collection, games.length]);

  async function fetchCollectionInfo(collectionId: string) {
    try {
      const url = buildApiUrl(API_BASE, "/collections");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": getApiToken(),
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
          summary: found.summary,
          cover: found.cover,
          background: found.background,
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
      const url = buildApiUrl(API_BASE, `/collections/${collectionId}/games`);
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
      }));
      // Check if the order from backend differs from year-sorted order
      // If it differs, it means there's a custom order saved
      const yearSorted = [...parsed].sort((a, b) => {
        const yearA = a.year ?? 0;
        const yearB = b.year ?? 0;
        if (yearA !== 0 && yearB !== 0) return yearA - yearB;
        if (yearA !== 0 && yearB === 0) return -1;
        if (yearA === 0 && yearB !== 0) return 1;
        return 0;
      });
      
      const orderFromBackend = parsed.map(g => g.ratingKey);
      const yearSortedOrder = yearSorted.map(g => g.ratingKey);
      
      // Only use customOrder if backend order differs from year-sorted order
      const orderMatches = orderFromBackend.length === yearSortedOrder.length &&
        orderFromBackend.every((id, idx) => id === yearSortedOrder[idx]);
      
      if (!orderMatches) {
        // Backend has a custom order saved
        setCustomOrder(orderFromBackend);
      } else {
        // Backend order matches year-sorted, so use default year sorting
        setCustomOrder(null);
      }
      
      setGames(parsed);
      onGamesLoaded(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching collection games:", errorMessage);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }

  // Sort games by year or custom order
  const sortedGames = useMemo(() => {
    if (customOrder && customOrder.length === games.length) {
      // Use custom order if available
      const gameMap = new Map(games.map(g => [g.ratingKey, g]));
      return customOrder.map(id => gameMap.get(id)).filter(Boolean) as GameItem[];
    }
    
    // Otherwise sort by year
    const sorted = [...games];
    sorted.sort((a, b) => {
      const yearA = a.year ?? 0;
      const yearB = b.year ?? 0;
      
      // If both have years, sort by year
      if (yearA !== 0 && yearB !== 0) {
        return yearA - yearB;
      }
      
      // If only one has a year, put the one with year first
      if (yearA !== 0 && yearB === 0) {
        return -1;
      }
      if (yearA === 0 && yearB !== 0) {
        return 1;
      }
      
      // If neither has a year, sort by title (ignoring special characters)
      return compareTitles(a.title || "", b.title || "");
    });
    return sorted;
  }, [games, customOrder]);

  // Handle drag end to reorder games
  const handleDragEnd = async (sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return;

    const newGames = [...sortedGames];
    const [removed] = newGames.splice(sourceIndex, 1);
    newGames.splice(destinationIndex, 0, removed);

    // Update local state immediately
    const newOrder = newGames.map(g => g.ratingKey);
    setCustomOrder(newOrder);
    setGames(newGames);

    // Save to backend
    if (collectionId) {
      try {
        const url = buildApiUrl(API_BASE, `/collections/${collectionId}/games/order`);
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': getApiToken(),
          },
          body: JSON.stringify({ gameIds: newOrder }),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err: any) {
        const errorMessage = String(err.message || err);
        console.error("Error saving collection order:", errorMessage);
        // Revert on error
        setCustomOrder(null);
        fetchCollectionGames(collectionId);
      }
    }
  };

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

  const collectionCoverUrl = collection?.cover ? buildCoverUrl(API_BASE, collection.cover) : "";
  const collectionCoverWidth = 240;
  const collectionCoverHeight = 360; // 2:3 aspect ratio (vertical like games)
  
  const backgroundUrl = buildBackgroundUrl(API_BASE, collection?.background);
  const hasBackground = Boolean(backgroundUrl && backgroundUrl.trim() !== "");

  return (
    <BackgroundManager 
      backgroundUrl={backgroundUrl} 
      hasBackground={hasBackground}
      elementId={collectionId || ""}
    >
      <CollectionDetailContent
        collection={collection}
        collectionCoverUrl={collectionCoverUrl}
        collectionCoverWidth={collectionCoverWidth}
        collectionCoverHeight={collectionCoverHeight}
        yearRange={yearRange}
        averageRating={averageRating}
        onPlay={onPlay}
        sortedGames={sortedGames}
        loading={loading}
        onGameClick={onGameClick}
        buildCoverUrl={(cover?: string) => buildCoverUrl(API_BASE, cover)}
        coverSize={coverSize}
        handleCoverSizeChange={handleCoverSizeChange}
        viewMode={viewMode}
        itemRefs={itemRefs}
        handleDragEnd={handleDragEnd}
        scrollContainerRef={scrollContainerRef}
        isReady={isReady}
        isEditModalOpen={isEditModalOpen}
        onEditModalOpen={() => setIsEditModalOpen(true)}
        onEditModalClose={() => setIsEditModalOpen(false)}
        onCollectionUpdate={(updatedCollection) => {
          setCollection(updatedCollection);
        }}
        t={t}
      />
    </BackgroundManager>
  );
}

function CollectionDetailContent({
  collection,
  collectionCoverUrl,
  collectionCoverWidth,
  collectionCoverHeight,
  yearRange,
  averageRating,
  onPlay,
  sortedGames,
  loading,
  onGameClick,
  buildCoverUrl,
  coverSize,
  handleCoverSizeChange,
  viewMode,
  itemRefs,
  handleDragEnd,
  scrollContainerRef,
  isReady,
  isEditModalOpen,
  onEditModalOpen,
  onEditModalClose,
  onCollectionUpdate,
  t,
}: {
  collection: CollectionInfo | null;
  collectionCoverUrl: string;
  collectionCoverWidth: number;
  collectionCoverHeight: number;
  yearRange: string | null;
  averageRating: number | null;
  onPlay?: (game: GameItem) => void;
  sortedGames: GameItem[];
  loading: boolean;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  handleCoverSizeChange: (size: number) => void;
  viewMode: "grid" | "detail" | "table";
  itemRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  handleDragEnd: (sourceIndex: number, destinationIndex: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isReady: boolean;
  isEditModalOpen: boolean;
  onEditModalOpen: () => void;
  onEditModalClose: () => void;
  onCollectionUpdate: (updatedCollection: CollectionInfo) => void;
  t: (key: string) => string;
}) {
  const { hasBackground, isBackgroundVisible } = useBackground();
  
  return (
    <>
      <div className={hasBackground && isBackgroundVisible ? 'game-detail-libraries-bar-transparent' : ''} style={{ position: 'relative', zIndex: 1000, pointerEvents: 'auto' }}>
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
        <main className="flex-1 home-page-content" style={{ minHeight: 0 }}>
      <div className="home-page-layout" style={{ minHeight: 0 }}>
        <div 
          className="home-page-content-wrapper"
          style={{
            opacity: isReady ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            minHeight: 0
          }}
        >
          {/* Games List */}
          <div
            ref={scrollContainerRef}
            className="home-page-scroll-container"
            style={{ paddingLeft: '64px', paddingRight: '64px', paddingTop: '5px', paddingBottom: '32px' }}
          >
            {/* Collection Cover and Title */}
            {collection && (
              <div className="pt-8" style={{ display: 'flex', flexDirection: 'row', gap: '48px', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box', marginBottom: '32px' }}>
                {/* Cover */}
                <div style={{ flexShrink: 0 }}>
                  <Cover
                    title={collection.title}
                    coverUrl={collectionCoverUrl}
                    width={collectionCoverWidth}
                    height={collectionCoverHeight}
                    onPlay={onPlay && sortedGames.length > 0 ? () => {
                      if (sortedGames[0]) {
                        onPlay(sortedGames[0]);
                      }
                    } : undefined}
                    showTitle={false}
                    detail={false}
                    play={true}
                    showBorder={true}
                  />
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
                      <StarRating rating={averageRating} />
                    )}
                    {(onPlay && sortedGames.length > 0) || collection ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                        {onPlay && sortedGames.length > 0 && (
                          <button
                            onClick={() => {
                              // Play first game in collection
                              if (sortedGames[0]) {
                                onPlay(sortedGames[0]);
                              }
                            }}
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
                        )}
                        {collection && (
                          <Tooltip text={t("common.edit")} delay={200}>
                            <button
                              onClick={onEditModalOpen}
                              className="collection-detail-edit-button"
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
                        )}
                        {collection && (
                          <DropdownMenu
                            onEdit={onEditModalOpen}
                            collectionId={collection.id}
                            collectionTitle={collection.title}
                            onCollectionDelete={(collectionId: string) => {
                              if (collection.id === collectionId) {
                                // Navigate back after deletion
                                window.history.back();
                              }
                            }}
                            onCollectionUpdate={onCollectionUpdate}
                            horizontal={true}
                            className="collection-detail-dropdown-menu"
                            toolTipDelay={200}
                          />
                        )}
                      </div>
                    ) : null}
                    {collection && (
                      <EditCollectionModal
                        isOpen={isEditModalOpen}
                        onClose={onEditModalClose}
                        collection={collection}
                        onCollectionUpdate={onCollectionUpdate}
                      />
                    )}
                    {collection.summary && <Summary summary={collection.summary} />}
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
                    onGameClick={onGameClick}
                    onPlay={onPlay}
                    buildCoverUrl={(cover?: string) => buildCoverUrl(API_BASE, cover)}
                    coverSize={coverSize}
                    itemRefs={itemRefs}
                    draggable={true}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
        </div>
      </div>
    </>
  );
}

