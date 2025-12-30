import { useState } from "react";
import CoverPlaceholder from "../common/CoverPlaceholder";
import "./GameDetail.css";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  stars?: number | null;
};

type GameDetailProps = {
  game: GameItem;
  coverUrl: string;
  onPlay: (game: GameItem) => void;
  onBack?: () => void;
};

export default function GameDetail({
  game,
  coverUrl,
  onPlay,
  onBack,
}: GameDetailProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !coverUrl || imageError;
  const coverWidth = 256;
  const coverHeight = 384; // 256 * 1.5

  return (
    <div className="bg-[#1a1a1a] text-white game-detail-page">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            <div className="w-64 aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden">
              {showPlaceholder ? (
                <CoverPlaceholder
                  title={game.title}
                  width={coverWidth}
                  height={coverHeight}
                />
              ) : (
                <img
                  src={coverUrl}
                  alt={game.title}
                  className="object-cover w-full h-full"
                  onError={() => {
                    setImageError(true);
                  }}
                />
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

            {/* Action Buttons */}
            <div className="flex gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded font-semibold text-lg transition-colors"
                >
                  Back
                </button>
              )}
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
    </div>
  );
}
