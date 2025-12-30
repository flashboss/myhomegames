import { useState, useEffect, useRef } from "react";
import GamesList from "../components/GamesList";

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
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    fetchLibraryGames();
  }, []);

  async function fetchLibraryGames() {
    setLoading(true);
    try {
      const url = buildApiUrl(apiBase, `/libraries/consigliati/games`, {
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
      console.error("Error fetching recommended games:", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Sort games by title for alphabet navigator
  const sortedGames = [...games].sort((a, b) => 
    (a.title || "").localeCompare(b.title || "")
  );

  return (
    <div className="home-page-layout">
      <div className="home-page-content-wrapper">
        <div
          ref={scrollContainerRef}
          className="home-page-scroll-container"
        >
          {!loading && (
            <GamesList
              games={sortedGames}
              apiBase={apiBase}
              onGameClick={onGameClick}
              onPlay={onPlay}
              buildCoverUrl={buildCoverUrl}
              coverSize={coverSize}
              itemRefs={itemRefs}
            />
          )}
        </div>
      </div>
    </div>
  );
}

