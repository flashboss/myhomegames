import { useTranslation } from "react-i18next";
import Cover from "../games/Cover";
import { useNavigate } from "react-router-dom";
import type { GameItem, CollectionItem } from "../../types";
import "./SearchResultsList.css";

type SearchResultsListProps = {
  games: GameItem[];
  collections: CollectionItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  variant?: "popup" | "page"; // "popup" for dropdown, "page" for full page
  coverSize?: number; // Cover width (default: 100 for page, 60 for popup games, 40 for popup collections)
  onPlay?: (item: GameItem | CollectionItem) => void; // Play handler
  onCollectionClick?: (collection: CollectionItem) => void; // Collection click handler (for popup)
  onItemClick?: (item: GameItem | CollectionItem) => void; // Generic item click handler
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position
const POPUP_COVER_SIZE = 60;

type SearchResultItemProps = {
  item: GameItem | CollectionItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  variant?: "popup" | "page";
  coverSize?: number;
  onPlay?: (item: GameItem | CollectionItem) => void;
  onCollectionClick?: (collection: CollectionItem) => void;
  hasBorder?: boolean;
};

function SearchResultItem({
  item,
  apiBase,
  onGameClick,
  buildCoverUrl,
  variant = "page",
  coverSize,
  onPlay,
  onCollectionClick,
  hasBorder = false,
}: SearchResultItemProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isGame = "year" in item;
  const actualCoverSize = coverSize || (variant === "popup" ? POPUP_COVER_SIZE : FIXED_COVER_SIZE);
  const coverHeight = actualCoverSize * 1.5;
  const isPopup = variant === "popup";

  const handleClick = () => {
    if (isGame) {
      onGameClick(item);
    } else {
      if (onCollectionClick) {
        onCollectionClick(item);
      } else {
        navigate(`/collections/${item.ratingKey}`);
      }
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isPopup && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick();
    }
  };

  const subtitle = isGame
    ? (item.year !== null && item.year !== undefined
        ? (item.day !== null &&
          item.day !== undefined &&
          item.month !== null &&
          item.month !== undefined
            ? `${item.day}/${item.month}/${item.year}`
            : item.year.toString())
        : null)
    : t("search.collection");

  return (
    <div
      key={item.ratingKey}
      className={`group cursor-pointer ${isPopup ? `plex-dropdown-item search-dropdown-item ${hasBorder ? "has-border" : ""}` : "mb-6 search-results-list-item"}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isPopup ? "button" : undefined}
      tabIndex={isPopup ? 0 : undefined}
      style={isPopup ? { display: "flex", alignItems: "center", gap: "16px" } : undefined}
    >
      <Cover
        title={item.title}
        coverUrl={buildCoverUrl(apiBase, item.cover)}
        width={actualCoverSize}
        height={coverHeight}
        onClick={handleClick}
        showTitle={true}
        subtitle={subtitle}
        titlePosition="bottom"
        detail={true}
        play={false}
        showBorder={false}
      />
      {onPlay && (
        <button
          className="search-result-play-button"
          onClick={handlePlayClick}
          aria-label={isGame ? "Play game" : "Play collection"}
        >
          <svg
            width="24"
            height="24"
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
  );
}

export default function SearchResultsList({
  games,
  collections,
  apiBase,
  onGameClick,
  buildCoverUrl,
  variant = "page",
  coverSize,
  onPlay,
  onCollectionClick,
}: SearchResultsListProps) {
  const { t } = useTranslation();
  
  const totalResults = games.length + collections.length;
  if (totalResults === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  const isPopup = variant === "popup";
  const containerClass = isPopup ? "" : "search-results-list-container";

  const allItems: (GameItem | CollectionItem)[] = [...collections, ...games];

  return (
    <div className={containerClass}>
      {allItems.map((item, index) => (
        <SearchResultItem
          key={item.ratingKey}
          item={item}
          apiBase={apiBase}
          onGameClick={onGameClick}
          buildCoverUrl={buildCoverUrl}
          variant={variant}
          coverSize={coverSize}
          onPlay={onPlay}
          onCollectionClick={onCollectionClick}
          hasBorder={isPopup && index < allItems.length - 1}
        />
      ))}
    </div>
  );
}
