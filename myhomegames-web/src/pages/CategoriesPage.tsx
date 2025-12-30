import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import CategoriesList from "../components/lists/CategoriesList";

type CategoryItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

type CategoriesPageProps = {
  apiBase: string;
  apiToken: string;
  buildApiUrl: (apiBase: string, path: string, params?: Record<string, string | number | boolean>) => string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
};

export default function CategoriesPage({
  apiBase,
  apiToken,
  buildApiUrl,
  buildCoverUrl,
  coverSize,
}: CategoriesPageProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Restore scroll position
  useScrollRestoration(scrollContainerRef);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Hide content until fully rendered
  useLayoutEffect(() => {
    if (!loading && categories.length > 0) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    } else if (loading) {
      setIsReady(false);
    }
  }, [loading, categories.length]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const url = buildApiUrl(apiBase, "/categories");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": apiToken,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.categories || []) as any[];
      const parsed = items.map((v) => ({
        ratingKey: v.id,
        title: v.title,
        cover: v.cover,
      }));
      setCategories(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching categories:", errorMessage);
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
        <div ref={scrollContainerRef} className="home-page-scroll-container">
          {!loading && (
            <CategoriesList
              categories={categories}
              apiBase={apiBase}
              buildCoverUrl={buildCoverUrl}
              coverSize={coverSize * 2}
              itemRefs={itemRefs}
            />
          )}
        </div>
      </div>
      </div>
    </main>
  );
}

