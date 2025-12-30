import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CollectionsList from "../components/CollectionsList";
import AlphabetNavigator from "../components/AlphabetNavigator";

type CollectionItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

type CollectionsPageProps = {
  apiBase: string;
  apiToken: string;
  onPlay?: (game: any) => void;
  buildApiUrl: (apiBase: string, path: string, params?: Record<string, string | number | boolean>) => string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
};

export default function CollectionsPage({
  apiBase,
  apiToken,
  onPlay,
  buildApiUrl,
  buildCoverUrl,
  coverSize,
}: CollectionsPageProps) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortAscending] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    fetchCollections();
  }, []);


  async function fetchCollections() {
    setLoading(true);
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
      const items = (json.collections || []) as any[];
      const parsed = items.map((v) => ({
        ratingKey: v.id,
        title: v.title,
        cover: v.cover,
      }));
      setCollections(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching collections:", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleCollectionClick(collection: CollectionItem) {
    navigate(`/collections/${collection.ratingKey}`);
  }

  // Sort collections
  const sortedCollections = useMemo(() => {
    const sorted = [...collections];
    sorted.sort((a, b) => {
      const compareResult = (a.title || "").localeCompare(b.title || "");
      return sortAscending ? compareResult : -compareResult;
    });
    return sorted;
  }, [collections, sortAscending]);


  return (
    <div className="home-page-layout">
      <div className="home-page-content-wrapper">
        <div
          ref={scrollContainerRef}
          className="home-page-scroll-container"
        >
          {!loading && (
            <CollectionsList
              collections={sortedCollections}
              apiBase={apiBase}
              onCollectionClick={handleCollectionClick}
              onPlay={onPlay as any}
              buildCoverUrl={buildCoverUrl}
              coverSize={coverSize}
              itemRefs={itemRefs}
            />
          )}
        </div>
      </div>

      <AlphabetNavigator
        games={sortedCollections as any}
        scrollContainerRef={scrollContainerRef}
        itemRefs={itemRefs}
        ascending={sortAscending}
      />
    </div>
  );
}

