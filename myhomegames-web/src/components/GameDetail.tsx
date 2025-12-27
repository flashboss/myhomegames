type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  duration?: number;
};

type GameDetailProps = {
  game: GameItem;
  coverUrl: string;
  onPlay: (game: GameItem) => void;
};

export default function GameDetail({ game, coverUrl, onPlay }: GameDetailProps) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            <div className="w-64 aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={game.title}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-500 text-6xl">🎮</div>
                </div>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{game.title}</h1>
            
            {game.summary && (
              <div className="text-gray-300 mb-6">
                <p className="text-lg">{game.summary}</p>
              </div>
            )}

            {/* Play Button */}
            <button
              onClick={() => onPlay(game)}
              className="bg-[#E5A00D] hover:bg-[#F5B041] text-black px-8 py-3 rounded font-semibold text-lg transition-colors"
            >
              Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

