import { useState } from "react";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "../common/CoverPlaceholder";
import "./Cover.css";

type CoverProps = {
  title: string;
  coverUrl: string;
  width: number;
  height: number;
  onPlay?: () => void;
  onClick?: () => void;
  showTitle?: boolean;
  showYear?: boolean;
  year?: number | null;
  mode?: "play-only" | "play-or-detail" | "no-click";
  showBorder?: boolean;
};

export default function Cover({
  title,
  coverUrl,
  width,
  height,
  onPlay,
  onClick,
  showTitle = false,
  showYear = false,
  year,
  mode = "play-or-detail",
  showBorder = true,
}: CoverProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !coverUrl || imageError;

  const handleCoverClick = (e: React.MouseEvent) => {
    if (mode === "play-only" && onPlay) {
      // In play-only mode, clicking the cover plays the game
      e.stopPropagation(); // Prevent event from bubbling to parent
      onPlay();
    } else if (mode === "play-or-detail" && onClick) {
      // In play-or-detail mode, clicking the cover goes to detail
      onClick();
    }
    // In no-click mode, do nothing
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay();
    }
  };

  const shouldShowPlayButton = mode !== "no-click" && onPlay;
  const isNoClick = mode === "no-click";

  return (
    <>
      <div
        className={`games-list-cover relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden transition-all ${showBorder ? 'cover-hover-effect' : ''} games-list-cover-${mode}`}
        style={{ width: `${width}px`, cursor: isNoClick ? 'default' : 'pointer' }}
        onClick={handleCoverClick}
      >
        {showPlaceholder ? (
          <CoverPlaceholder
            title={title}
            width={width}
            height={height}
          />
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
        {shouldShowPlayButton && (
          <button
            onClick={handlePlayClick}
            className={`games-list-play-button games-list-play-button-${mode}`}
            aria-label={t("common.play")}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 5v14l11-7z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>
      {(showTitle || (showYear && year != null)) && (
        <div className="games-list-title-wrapper">
          {showTitle && (
            <div 
              className={`truncate games-list-title ${mode === "play-or-detail" ? "games-list-title-clickable" : ""}`}
              onClick={mode === "play-or-detail" && onClick ? (e) => {
                e.stopPropagation();
                onClick();
              } : undefined}
            >
              {title}
            </div>
          )}
          {showYear && year != null && typeof year === 'number' && (
            <div className="games-list-year">{year}</div>
          )}
        </div>
      )}
    </>
  );
}

