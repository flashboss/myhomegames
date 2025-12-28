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
  
  // Recupera i dati dalla location state
  const { searchQuery, games } = (location.state as { searchQuery?: string; games?: GameItem[] }) || {};

  if (!searchQuery || !games || games.length === 0) {
    return (
      <div className="bg-[#1a1a1a] text-white flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">Nessun risultato trovato</div>
          <button
            onClick={() => navigate("/")}
            className="text-[#E5A00D] hover:text-[#F5B041] transition-colors"
          >
            Torna alla home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] text-white" style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '16px 48px' }}>
          <div style={{ marginBottom: '24px', marginTop: '8px' }}>
            <div 
              style={{
                fontSize: '18px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.5,
                marginBottom: '8px'
              }}
            >
              Risultati della ricerca: "{searchQuery}"
            </div>
            <div 
              style={{
                fontSize: '18px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.5
              }}
            >
              Trovati {games.length} {games.length === 1 ? 'gioco' : 'giochi'}
            </div>
          </div>

          <div style={{ paddingTop: '8px', paddingBottom: '32px' }}>
            <SearchResultsList 
              games={games}
              apiBase={apiBase}
              onGameClick={onGameClick}
              buildCoverUrl={buildCoverUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

