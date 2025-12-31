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
  showTitle?: boolean;
  showYear?: boolean;
  year?: number | null;
};

export default function Cover({
  title,
  coverUrl,
  width,
  height,
  onPlay,
  showTitle = false,
  showYear = false,
  year,
}: CoverProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !coverUrl || imageError;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay();
    }
  };

  return (
    <>
      <div
        className="games-list-cover relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden transition-all cover-hover-effect"
        style={{ width: `${width}px` }}
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
        {onPlay && (
          <button
            onClick={handlePlayClick}
            className="games-list-play-button"
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
            <div className="truncate games-list-title">{title}</div>
          )}
          {showYear && year != null && typeof year === 'number' && (
            <div className="games-list-year">{year}</div>
          )}
        </div>
      )}
    </>
  );
}

