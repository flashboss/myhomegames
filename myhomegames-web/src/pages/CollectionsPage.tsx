import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import CollectionsList from "../components/lists/CollectionsList";
import AlphabetNavigator from "../components/ui/AlphabetNavigator";
import { compareTitles } from "../utils/stringUtils";
import type { CollectionItem } from "../types";

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
  const [isReady, setIsReady] = useState(false);
  const [sortAscending] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Restore scroll position
  useScrollRestoration(scrollContainerRef);

  useEffect(() => {
    fetchCollections();
  }, []);

  // Hide content until fully rendered
  useLayoutEffect(() => {
    if (!loading && collections.length > 0) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    } else if (loading) {
      setIsReady(false);
    }
  }, [loading, collections.length]);


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
        summary: v.summary,
        cover: v.cover,
        gameCount: v.gameCount,
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

  const handleCollectionUpdate = (updatedCollection: CollectionItem) => {
    setCollections((prevCollections) =>
      prevCollections.map((collection) =>
        collection.ratingKey === updatedCollection.ratingKey ? updatedCollection : collection
      )
    );
  };

  // Sort collections
  const sortedCollections = useMemo(() => {
    const sorted = [...collections];
    sorted.sort((a, b) => {
      const compareResult = compareTitles(a.title || "", b.title || "");
      return sortAscending ? compareResult : -compareResult;
    });
    return sorted;
  }, [collections, sortAscending]);


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
        >
          {!loading && (
            <CollectionsList
              collections={sortedCollections}
              apiBase={apiBase}
              apiToken={apiToken}
              onCollectionClick={handleCollectionClick}
              onPlay={onPlay as any}
              onCollectionUpdate={handleCollectionUpdate}
              buildCoverUrl={buildCoverUrl}
              coverSize={coverSize}
              itemRefs={itemRefs}
            />
          )}
        </div>
      </div>

      {isReady && (
        <AlphabetNavigator
          games={sortedCollections as any}
          scrollContainerRef={scrollContainerRef}
          itemRefs={itemRefs}
          ascending={sortAscending}
        />
      )}
      </div>
    </main>
  );
}

