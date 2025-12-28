import { useLocation, useNavigate } from "react-router-dom";
import SearchResultsList from "../components/SearchResultsList";

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
      <div className="bg-[#1a1a1a] text-white flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
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
    <div className="bg-[#1a1a1a] text-white" style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="max-w-7xl mx-auto" style={{ padding: '16px 48px', flexShrink: 0 }}>
        <div style={{ marginBottom: '8px', marginTop: '8px' }}>
          <div 
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.5,
              marginBottom: '8px'
            }}
          >
            Search results: "{searchQuery}"
          </div>
          <div 
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.5
            }}
          >
            Found {games.length} {games.length === 1 ? 'game' : 'games'}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '0 48px 32px 48px', paddingTop: '0px' }}>
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

