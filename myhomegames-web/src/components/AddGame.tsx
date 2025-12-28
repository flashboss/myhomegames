import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type IGDBGame = {
  id: number;
  name: string;
  summary: string;
  cover: string | null;
  releaseDate: number | null;
};

type AddGameProps = {
  isOpen: boolean;
  onClose: () => void;
  onGameSelected: (game: IGDBGame) => void;
  apiBase: string;
  apiToken: string;
};

export default function AddGame({
  isOpen,
  onClose,
  onGameSelected,
  apiBase,
  apiToken,
}: AddGameProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
      setError(null);
      return;
    }

    // Handle ESC key to close modal
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscKey);

    // Clear timeout on unmount
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen, onClose]);

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
        url.searchParams.set("q", searchQuery.trim());

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": apiToken,
          },
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

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="bg-[#1a1a1a] w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden border border-[#2a2a2a] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#2a2a2a] bg-[#0d0d0d]">
          <h2 className="text-xl font-semibold text-white">Add Game</h2>
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

          {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Searching...</div>
            ) : results.length === 0 && searchQuery.trim().length >= 2 ? (
              <div className="text-center text-gray-400 py-8">
                No games found
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Type at least 2 characters to search
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {results.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      onGameSelected(game);
                      onClose();
                    }}
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
                      <div className="text-white font-medium text-lg mb-1">
                        {game.name}
                      </div>
                      {game.releaseDate && (
                        <div className="text-gray-400 text-sm mb-2">
                          {game.releaseDate}
                        </div>
                      )}
                      {game.summary && (
                        <div className="text-gray-300 text-sm line-clamp-2">
                          {game.summary}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
