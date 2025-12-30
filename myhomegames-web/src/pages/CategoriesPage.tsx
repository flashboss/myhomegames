import { useState, useEffect, useRef } from "react";
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
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    fetchCategories();
  }, []);

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
        <div className="home-page-content-wrapper">
        <div className="home-page-scroll-container">
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

