import { useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SearchResultsList from "../components/search/SearchResultsList";
import "./SearchResultsPage.css";

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

type SearchResultsPageProps = {
  apiBase: string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
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

  // Retrieve data from location state
  const { searchQuery, games } =
    (location.state as { searchQuery?: string; games?: GameItem[] }) || {};

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

  if (!searchQuery) {
    return (
      <div className="bg-[#1a1a1a] text-white flex items-center justify-center search-results-page-empty">
        <div className="text-center">
          <div className="text-gray-400 mb-4">{t("searchResults.noResults")}</div>
          <button
            onClick={() => navigate("/")}
            className="text-[#E5A00D] hover:text-[#F5B041] transition-colors"
          >
            {t("searchResults.goBack")}
          </button>
        </div>
      </div>
    );
  }

  if (!games || games.length === 0) {
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
    <div className="bg-[#1a1a1a] text-white search-results-page">
      <div className="search-results-header">
        <div className="search-results-header-content">
          <div className="search-results-title">
            {t("searchResults.title", { query: searchQuery })}
          </div>
          <div className="search-results-count">
            {t("searchResults.foundGames", { count: games.length })}
          </div>
        </div>
      </div>
      <div className="search-results-content">
        <div className="search-results-content-inner">
          <SearchResultsList
            games={games}
            apiBase={apiBase}
            onGameClick={onGameClick}
            onPlay={onPlay}
            buildCoverUrl={buildCoverUrl}
          />
        </div>
      </div>
    </div>
  );
}
