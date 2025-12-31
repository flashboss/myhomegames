import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import SearchResultsList from "../components/search/SearchResultsList";
import type { GameItem, CollectionItem } from "../types";
import "./SearchResultsPage.css";

type SearchResultsPageProps = {
  apiBase: string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (item: GameItem | CollectionItem) => void;
};

export default function SearchResultsPage({
  apiBase,
  buildCoverUrl,
  onGameClick,
  onPlay,
}: SearchResultsPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Restore scroll position
  useScrollRestoration(scrollContainerRef);

  // Retrieve data from location state
  const { searchQuery, games, collections } =
    (location.state as { searchQuery?: string; games?: GameItem[]; collections?: CollectionItem[] }) || {};

  // Check if we came from game detail page and should redirect
  useLayoutEffect(() => {
    const savedFrom = sessionStorage.getItem("gameDetailFrom");
    // If we have a saved "from" that's not search-results, and we don't have search state,
    // redirect to the saved location
    if (!searchQuery && savedFrom && savedFrom !== "/search-results") {
      sessionStorage.removeItem("gameDetailFrom");
      navigate(savedFrom, { replace: true });
    }
  }, [searchQuery, navigate]);

  // Hide content until fully rendered
  useLayoutEffect(() => {
    if ((games && games.length > 0) || (collections && collections.length > 0)) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    } else {
      setIsReady(false);
    }
  }, [games, collections]);

  if (!searchQuery) {
    return (
      <div className="bg-[#1a1a1a] text-white flex items-center justify-center search-results-page-empty">
        <div className="text-center">
          <div className="text-gray-400">{t("searchResults.noResults")}</div>
        </div>
      </div>
    );
  }

  const totalResults = (games?.length || 0) + (collections?.length || 0);
  if (totalResults === 0) {
    return (
      <div className="bg-[#1a1a1a] text-white search-results-page">
        <div className="search-results-header">
          <div className="search-results-header-content">
            <div className="search-results-title">
              {t("searchResults.title", { query: searchQuery })}
            </div>
          </div>
        </div>
        <div className="search-results-content">
          <div className="search-results-content-inner">
            <div className="search-results-empty">
              <div className="search-results-empty-icon">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="#E5A00D"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="m20 20-4.5-4.5"
                    stroke="#000000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="search-results-empty-message">
                {t("searchResults.noResultsFound")}
              </div>
              <div className="search-results-empty-hint">
                {t("searchResults.tryModifyingSearch")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-[#1a1a1a] text-white search-results-page"
      style={{
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <div className="search-results-header">
        <div className="search-results-header-content">
          <div className="search-results-title">
            {t("searchResults.title", { query: searchQuery })}
          </div>
          <div className="search-results-count">
            {t("searchResults.foundGames", { count: totalResults })}
          </div>
        </div>
      </div>
      <div ref={scrollContainerRef} className="search-results-content">
        <div className="search-results-content-inner">
          <SearchResultsList
            games={games || []}
            collections={collections || []}
            apiBase={apiBase}
            onGameClick={onGameClick}
            buildCoverUrl={buildCoverUrl}
          />
        </div>
      </div>
    </div>
  );
}
