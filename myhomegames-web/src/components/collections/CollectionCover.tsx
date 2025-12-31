import { useState } from "react";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "../common/CoverPlaceholder";
import "./CollectionCover.css";

type CollectionCoverProps = {
  title: string;
  coverUrl: string;
  width: number;
  height: number;
  onPlay?: () => void;
  hasGames: boolean;
};

export default function CollectionCover({
  title,
  coverUrl,
  width,
  height,
  onPlay,
  hasGames,
}: CollectionCoverProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !coverUrl || imageError;

  const handleCoverClick = () => {
    if (onPlay && hasGames) {
      onPlay();
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay && hasGames) {
      onPlay();
    }
  };

  return (
    <div
      className="collection-cover-container cover-hover-effect relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden"
      style={{ width: `${width}px` }}
      onClick={handleCoverClick}
    >
      {showPlaceholder ? (
        <CoverPlaceholder title={title} width={width} height={height} />
      ) : (
        <img
          src={coverUrl}
          alt={title}
          className="object-cover w-full h-full"
          onError={() => {
            setImageError(true);
          }}
        />
      )}
      {onPlay && hasGames && (
        <button
          onClick={handlePlayClick}
          className="collection-cover-play-button"
          aria-label={t("common.play")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}

