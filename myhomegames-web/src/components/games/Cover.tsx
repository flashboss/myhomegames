import { useState } from "react";
import { useTranslation } from "react-i18next";
import type React from "react";
import DropdownMenu from "../common/DropdownMenu";
import "./Cover.css";

type CoverProps = {
  title: string;
  coverUrl: string;
  width: number;
  height: number;
  onPlay?: () => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  gameId?: string;
  gameTitle?: string;
  onGameDelete?: (gameId: string) => void;
  collectionId?: string;
  collectionTitle?: string;
  onCollectionDelete?: (collectionId: string) => void;
  showTitle?: boolean;
  subtitle?: string | number | null;
  detail?: boolean;
  play?: boolean;
  showBorder?: boolean;
  aspectRatio?: string; // e.g., "2/3" or "16/9"
  overlayContent?: React.ReactNode; // Content to overlay on the cover
  brightness?: number; // Brightness filter (0-100 or higher, default: 100)
  blur?: number; // Blur filter in pixels (default: 0)
  titlePosition?: "bottom" | "overlay"; // Position of title: below cover or inside image (default: "bottom")
  editButtonPosition?: "bottom-left" | "bottom-right"; // Position of edit button (default: "bottom-left")
};

export default function Cover({
  title,
  coverUrl,
  width,
  height,
  onPlay,
  onClick,
  onEdit,
  onDelete,
  gameId,
  gameTitle,
  onGameDelete,
  collectionId,
  collectionTitle,
  onCollectionDelete,
  showTitle = false,
  subtitle,
  detail = true,
  play = true,
  showBorder = true,
  aspectRatio = "2/3",
  overlayContent,
  brightness,
  blur,
  titlePosition = "bottom",
  editButtonPosition = "bottom-left",
}: CoverProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !coverUrl || imageError;
  
  // Calculate font size and padding for placeholder overlay
  let calculatedFontSize = Math.max(10, Math.min(16, Math.floor(width / 8)));
  // Increase font size for 16/9 aspect ratio with overlay title
  if (aspectRatio === "16/9" && titlePosition === "overlay") {
    calculatedFontSize = Math.max(14, Math.min(24, Math.floor(width / 5)));
  }
  const padding = Math.max(4, Math.floor(width / 20));
  const lineClamp = Math.max(2, Math.floor(height / (calculatedFontSize * 1.5)));

  const handleCoverClick = (e: React.MouseEvent) => {
    if (play && !detail && onPlay) {
      // If play only (no detail), clicking the cover plays
      e.stopPropagation(); // Prevent event from bubbling to parent
      onPlay();
    } else if (detail && onClick) {
      // If detail enabled, clicking the cover goes to detail
      e.stopPropagation(); // Prevent event from bubbling to parent
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };


  const shouldShowPlayButton = play && onPlay;
  const isClickable = detail || play;

  // Build filter style string
  const filterParts: string[] = [];
  if (brightness !== undefined) {
    filterParts.push(`brightness(${brightness}%)`);
  }
  if (blur !== undefined) {
    filterParts.push(`blur(${blur}px)`);
  }
  const filterStyle = filterParts.length > 0 ? filterParts.join(' ') : undefined;

  return (
    <>
      <div
        className={`games-list-cover relative bg-[#2a2a2a] rounded overflow-hidden transition-all ${showBorder ? 'cover-hover-effect' : ''} ${play ? 'games-list-cover-play' : ''} ${detail ? 'games-list-cover-detail' : ''} ${blur !== undefined && blur > 0 ? 'cover-with-blur' : ''}`}
        style={{ 
          width: `${width}px`, 
          aspectRatio: aspectRatio,
          cursor: isClickable ? 'pointer' : 'default' 
        }}
        onClick={handleCoverClick}
      >
        {showPlaceholder ? (
          <div
            className="cover-placeholder"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#2a2a2a",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxSizing: "border-box",
            }}
          >
            <div
              className="cover-placeholder-text"
              style={{
                padding: `${padding}px`,
                fontSize: `${calculatedFontSize}px`,
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.85)",
                fontWeight: 600,
                lineHeight: 1.3,
                wordBreak: "break-word",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: lineClamp,
                WebkitBoxOrient: "vertical",
                width: "100%",
                maxHeight: "100%",
              }}
            >
              {title}
            </div>
          </div>
        ) : (
          <img
            src={coverUrl}
            alt={title}
            className="object-cover w-full h-full"
            style={filterStyle ? { filter: filterStyle } : undefined}
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
        {onEdit && (
          <button
            onClick={handleEditClick}
            className={`games-list-edit-button ${editButtonPosition === "bottom-right" ? "games-list-edit-button-bottom-right" : ""}`}
            aria-label={t("common.edit", "Edit")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {onEdit && (
          <div className="games-list-dropdown-wrapper games-list-dropdown-wrapper-bottom-right">
            <DropdownMenu
              onEdit={onEdit}
              onDelete={onDelete}
              gameId={gameId}
              gameTitle={gameTitle}
              onGameDelete={onGameDelete}
              collectionId={collectionId}
              collectionTitle={collectionTitle}
              onCollectionDelete={onCollectionDelete}
              className="games-list-dropdown-menu"
            />
          </div>
        )}
        {overlayContent && (
          <div className="cover-overlay-content">
            {overlayContent}
          </div>
        )}
        {titlePosition === "overlay" && showTitle && !showPlaceholder && (
          <div className="cover-overlay-content" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `${padding}px`,
          }}>
            <div
              style={{
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.95)",
                fontWeight: 600,
                fontSize: `${calculatedFontSize}px`,
                lineHeight: 1.3,
                wordBreak: "break-word",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: lineClamp,
                WebkitBoxOrient: "vertical",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              {title}
            </div>
          </div>
        )}
      </div>
      {(showTitle || subtitle != null) && titlePosition === "bottom" && (
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

