import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type IGDBGame = {
  id: number;
  name: string;
  summary: string;
  cover: string | null;
  releaseDate: number | null;
};

type AddGamePageProps = {
  apiBase: string;
  apiToken: string;
  onGameSelected: (game: IGDBGame) => void;
};

export default function AddGamePage({ apiBase, apiToken, onGameSelected }: AddGamePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Debounce search
    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = new URL("/igdb/search", apiBase);

        const res = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Auth-Token": apiToken,
          },
          body: JSON.stringify({ query: searchQuery.trim() }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        setResults(json.games || []);
        setError(null);
      } catch (err: any) {
        setError(String(err.message || err));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, apiBase, apiToken]);

  function handleGameSelect(game: IGDBGame) {
    onGameSelected(game);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header with back button */}
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <div className="bg-[#1a1a1a] rounded-lg shadow-2xl overflow-hidden border border-[#2a2a2a] max-h-[80vh] flex flex-col">
          <div className="p-6 border-b border-[#2a2a2a] bg-[#0d0d0d]">
            <h2 className="text-2xl font-semibold text-white">Add Game</h2>
          </div>

          <div className="p-6 flex-1 overflow-hidden flex flex-col">
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a game..."
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E5A00D] transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 text-red-400 text-sm">{error}</div>
            )}

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Searching...</div>
              ) : results.length === 0 && searchQuery.trim().length >= 2 ? (
                <div className="text-center text-gray-400 py-8">No games found</div>
              ) : results.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Type at least 2 characters to search</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {results.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handleGameSelect(game)}
                      className="flex items-center gap-4 p-4 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a] transition-colors text-left"
                    >
                      {game.cover ? (
                        <img
                          src={game.cover}
                          alt={game.name}
                          className="w-20 h-28 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-20 h-28 bg-[#1a1a1a] rounded flex items-center justify-center flex-shrink-0">
                          <div className="text-gray-500 text-2xl">🎮</div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-lg mb-1">{game.name}</div>
                        {game.releaseDate && (
                          <div className="text-gray-400 text-sm mb-2">{game.releaseDate}</div>
                        )}
                        {game.summary && (
                          <div className="text-gray-300 text-sm line-clamp-2">{game.summary}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

