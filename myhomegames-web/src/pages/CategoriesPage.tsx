import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import CategoriesList from "../components/lists/CategoriesList";
import type { CategoryItem, GameItem } from "../types";

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
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Restore scroll position
  useScrollRestoration(scrollContainerRef);

  useEffect(() => {
    fetchCategories();
    fetchLibraryGames();
  }, []);

  // Filter categories to only those with games available
  useEffect(() => {
    if (games.length === 0 || allCategories.length === 0) {
      setCategories([]);
      return;
    }

    // Extract unique genre IDs and titles from games
    const genresInGames = new Set<string>();
    games.forEach((game) => {
      if (game.genre) {
        if (Array.isArray(game.genre)) {
          game.genre.forEach((g) => genresInGames.add(g));
        } else if (typeof game.genre === "string") {
          genresInGames.add(game.genre);
        }
      }
    });

    // Filter categories to only those present in games
    const filteredCategories = allCategories.filter((category) => {
      // Check if the category ID or title matches any genre in games
      return genresInGames.has(category.ratingKey) || genresInGames.has(category.title);
    });

    setCategories(filteredCategories);
  }, [games, allCategories]);

  // Hide content until fully rendered
  useLayoutEffect(() => {
    if (!loading && (categories.length > 0 || (allCategories.length > 0 && games.length > 0))) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    } else if (loading) {
      setIsReady(false);
    }
  }, [loading, categories.length, allCategories.length, games.length]);

  async function fetchCategories() {
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
      setAllCategories(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching categories:", errorMessage);
    }
  }

  async function fetchLibraryGames() {
    setLoading(true);
    try {
      const url = buildApiUrl(apiBase, "/libraries/library/games", {
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
        genre: v.genre,
      }));
      setGames(parsed);
    } catch (err: any) {
      const errorMessage = String(err.message || err);
      console.error("Error fetching library games:", errorMessage);
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

