import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GamesList from "../components/GamesList";
import AlphabetNavigator from "../components/AlphabetNavigator";

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

type CollectionDetailProps = {
  apiBase: string;
  apiToken: string;
  onGameClick: (game: GameItem) => void;
  onGamesLoaded: (games: GameItem[]) => void;
  onPlay?: (game: GameItem) => void;
  buildApiUrl: (apiBase: string, path: string, params?: Record<string, string | number | boolean>) => string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
};

export default function CollectionDetail({
  apiBase,
  apiToken,
  onGameClick,
  onGamesLoaded,
  onPlay,
  buildApiUrl,
  buildCoverUrl,
  coverSize,
}: CollectionDetailProps) {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortAscending] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (collectionId) {
      fetchCollectionGames(collectionId);
    }
  }, [collectionId]);

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

  if (!collectionId) {
    return (
      <div className="bg-[#1a1a1a] text-white flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">Collection not found</div>
          <button
            onClick={() => navigate("/")}
            className="text-[#E5A00D] hover:text-[#F5B041] transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

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

      <AlphabetNavigator
        games={sortedGames as any}
        scrollContainerRef={scrollContainerRef}
        itemRefs={itemRefs}
        ascending={sortAscending}
      />
    </div>
  );
}

