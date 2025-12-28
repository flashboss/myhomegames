import { useLocation, useNavigate } from "react-router-dom";
import SearchResultsList from "../components/SearchResultsList";
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
};

export default function SearchResultsPage({ apiBase, buildCoverUrl, onGameClick }: SearchResultsPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve data from location state
  const { searchQuery, games } = (location.state as { searchQuery?: string; games?: GameItem[] }) || {};

  if (!searchQuery || !games || games.length === 0) {
    return (
      <div className="bg-[#1a1a1a] text-white flex items-center justify-center search-results-page-empty">
        <div className="text-center">
          <div className="text-gray-400 mb-4">No results found</div>
          <button
            onClick={() => navigate("/")}
            className="text-[#E5A00D] hover:text-[#F5B041] transition-colors"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] text-white search-results-page">
      <div className="search-results-header">
        <div className="search-results-header-content">
          <div className="search-results-title">
            Search results: "{searchQuery}"
          </div>
          <div className="search-results-count">
            Found {games.length} {games.length === 1 ? 'game' : 'games'}
          </div>
        </div>
      </div>
      <div className="search-results-content">
        <div className="search-results-content-inner">
          <SearchResultsList 
            games={games}
            apiBase={apiBase}
            onGameClick={onGameClick}
            buildCoverUrl={buildCoverUrl}
          />
        </div>
      </div>
    </div>
  );
}

