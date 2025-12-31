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
  subtitle?: string | number | null;
  detail?: boolean;
  play?: boolean;
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
  subtitle,
  detail = true,
  play = true,
  showBorder = true,
}: CoverProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !coverUrl || imageError;

  const handleCoverClick = (e: React.MouseEvent) => {
    if (play && !detail && onPlay) {
      // If play only (no detail), clicking the cover plays
      e.stopPropagation(); // Prevent event from bubbling to parent
      onPlay();
    } else if (detail && onClick) {
      // If detail enabled, clicking the cover goes to detail
      onClick();
    }
    // If neither play nor detail, do nothing
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay();
    }
  };

  const shouldShowPlayButton = play && onPlay;
  const isClickable = detail || play;

  return (
    <>
      <div
        className={`games-list-cover relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden transition-all ${showBorder ? 'cover-hover-effect' : ''} ${play ? 'games-list-cover-play' : ''} ${detail ? 'games-list-cover-detail' : ''}`}
        style={{ width: `${width}px`, cursor: isClickable ? 'pointer' : 'default' }}
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
            className={`games-list-play-button ${detail ? 'games-list-play-button-detail' : 'games-list-play-button-play-only'}`}
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
      {(showTitle || subtitle != null) && (
        <div className="games-list-title-wrapper">
          {showTitle && (
            <div 
              className={`truncate games-list-title ${detail ? "games-list-title-clickable" : ""}`}
              onClick={detail && onClick ? (e) => {
                e.stopPropagation();
                onClick();
              } : undefined}
            >
              {title}
            </div>
          )}
          {subtitle != null && (
            <div className="games-list-year">{subtitle}</div>
          )}
        </div>
      )}
    </>
  );
}

