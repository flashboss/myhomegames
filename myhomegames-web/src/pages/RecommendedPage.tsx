import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import RecommendedSection from "../components/recommended/RecommendedSection";
import type { GameItem } from "../types";

type RecommendedSection = {
  id: string;
  games: GameItem[];
};

type RecommendedPageProps = {
  apiBase: string;
  apiToken: string;
  onGameClick: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
  onPlay?: (game: GameItem) => void;
  buildApiUrl: (apiBase: string, path: string, params?: Record<string, string | number | boolean>) => string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
};

export default function RecommendedPage({
  apiBase,
  apiToken,
  onGameClick,
  onGamesLoaded,
  onPlay,
  buildApiUrl,
  buildCoverUrl,
  coverSize,
}: RecommendedPageProps) {
  const [sections, setSections] = useState<RecommendedSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Restore scroll position
  useScrollRestoration(scrollContainerRef);

  useEffect(() => {
    fetchRecommendedSections();
  }, []);

  // Hide content until fully rendered
  useLayoutEffect(() => {
    if (!loading && sections.length > 0) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    } else if (loading) {
      setIsReady(false);
    }
  }, [loading, sections.length]);

  async function fetchRecommendedSections() {
    setLoading(true);
    try {
      const url = buildApiUrl(apiBase, `/recommended`);
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const sectionsData = (json.sections || []) as any[];
      
      const parsedSections = sectionsData.map((section) => ({
        id: section.id,
        games: (section.games || []).map((v: any) => ({
          ratingKey: v.id,
          title: v.title,
          summary: v.summary,
          cover: v.cover,
          day: v.day,
          month: v.month,
          year: v.year,
          stars: v.stars,
        })),
      }));
      
      setSections(parsedSections);
      
      // Collect all games for onGamesLoaded callback
      const allGames = parsedSections.flatMap(section => section.games);
      onGamesLoaded(allGames);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching recommended sections:", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 home-page-content">
      <div className="home-page-layout">
      <div 
        className="home-page-content-wrapper"
        style={{
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        <div
          ref={scrollContainerRef}
          className="home-page-scroll-container"
          style={{ paddingTop: '32px', paddingBottom: '32px' }}
        >
          {!loading && sections.map((section) => (
            <RecommendedSection
              key={section.id}
              sectionId={section.id}
              games={section.games}
              apiBase={apiBase}
              onGameClick={onGameClick}
              onPlay={onPlay}
              buildCoverUrl={buildCoverUrl}
              coverSize={coverSize}
            />
          ))}
        </div>
      </div>
      </div>
    </main>
  );
}

