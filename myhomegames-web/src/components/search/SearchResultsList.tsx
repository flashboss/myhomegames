import { useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../../config";
import Cover from "../games/Cover";
import DropdownMenu from "../common/DropdownMenu";
import EditGameModal from "../games/EditGameModal";
import EditCollectionModal from "../collections/EditCollectionModal";
import { useNavigate } from "react-router-dom";
import type { GameItem, CollectionItem, CollectionInfo } from "../../types";
import "./SearchResultsList.css";

type SearchResultsListProps = {
  games: GameItem[];
  collections: CollectionItem[];
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  variant?: "popup" | "page"; // "popup" for dropdown, "page" for full page
  coverSize?: number; // Cover width (default: 100 for page, 60 for popup games, 40 for popup collections)
  onPlay?: (item: GameItem | CollectionItem) => void; // Play handler
  onCollectionClick?: (collection: CollectionItem) => void; // Collection click handler (for popup)
  onItemClick?: (item: GameItem | CollectionItem) => void; // Generic item click handler
  onGameUpdate?: (updatedGame: GameItem) => void;
  onGameDelete?: (deletedGame: GameItem) => void;
  onCollectionUpdate?: (updatedCollection: CollectionItem) => void;
  onCollectionDelete?: (deletedCollection: CollectionItem) => void;
  onModalOpen?: () => void;
  onModalClose?: () => void;
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position
const POPUP_COVER_SIZE = 60;

type SearchResultItemProps = {
  item: GameItem | CollectionItem;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  variant?: "popup" | "page";
  coverSize?: number;
  onPlay?: (item: GameItem | CollectionItem) => void;
  onCollectionClick?: (collection: CollectionItem) => void;
  hasBorder?: boolean;
  onEditClick?: (item: GameItem | CollectionItem) => void;
  onGameDelete?: (deletedGame: GameItem) => void;
  onGameUpdate?: (updatedGame: GameItem) => void;
  onCollectionDelete?: (deletedCollection: CollectionItem) => void;
  onCollectionUpdate?: (updatedCollection: CollectionItem) => void;
  onModalOpen?: () => void;
  onModalClose?: () => void;
};

function SearchResultItem({
  item,
  onGameClick,
  buildCoverUrl,
  variant = "page",
  coverSize,
  onPlay,
  onCollectionClick,
  hasBorder = false,
  onEditClick,
  onGameDelete,
  onGameUpdate,
  onCollectionDelete,
  onCollectionUpdate,
  onModalOpen,
  onModalClose,
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
      className={`group cursor-pointer ${isPopup ? `mhg-dropdown-item search-dropdown-item ${hasBorder ? "has-border" : ""}` : "mb-6 search-results-list-item"}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isPopup ? "button" : undefined}
      tabIndex={isPopup ? 0 : undefined}
      style={isPopup ? { display: "flex", alignItems: "center", gap: "16px" } : undefined}
    >
      <Cover
        title={item.title}
        coverUrl={buildCoverUrl(API_BASE, item.cover)}
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
      {(onPlay || onEditClick) && (
        <div className="search-result-right-actions">
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
          {onEditClick && (
            <div className="search-result-actions">
              <DropdownMenu
                onEdit={() => onEditClick(item)}
                gameId={isGame ? item.ratingKey : undefined}
                gameTitle={isGame ? item.title : undefined}
                onGameDelete={isGame && onGameDelete ? (gameId: string) => {
                  if (item.ratingKey === gameId) {
                    onGameDelete(item);
                  }
                } : undefined}
                onGameUpdate={isGame && onGameUpdate ? (updatedGame) => {
                  if (updatedGame.ratingKey === item.ratingKey) {
                    onGameUpdate(updatedGame);
                  }
                } : undefined}
                collectionId={!isGame ? item.ratingKey : undefined}
                collectionTitle={!isGame ? item.title : undefined}
                onCollectionDelete={!isGame && onCollectionDelete ? (collectionId: string) => {
                  if (item.ratingKey === collectionId) {
                    onCollectionDelete(item);
                  }
                } : undefined}
                onCollectionUpdate={!isGame && onCollectionUpdate ? (updatedCollection) => {
                  // Convert CollectionInfo to CollectionItem
                  const updatedItem: CollectionItem = {
                    ratingKey: updatedCollection.id,
                    title: updatedCollection.title,
                    summary: updatedCollection.summary,
                    cover: updatedCollection.cover,
                    gameCount: "gameCount" in item ? item.gameCount : undefined,
                  };
                  if (updatedItem.ratingKey === item.ratingKey) {
                    onCollectionUpdate(updatedItem);
                  }
                } : undefined}
                className="search-result-dropdown-menu"
                onModalOpen={onModalOpen}
                onModalClose={onModalClose}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchResultsList({
  games,
  collections,
  onGameClick,
  buildCoverUrl,
  variant = "page",
  coverSize,
  onPlay,
  onCollectionClick,
  onGameUpdate,
  onGameDelete,
  onCollectionUpdate,
  onCollectionDelete,
  onModalOpen,
  onModalClose,
}: SearchResultsListProps) {
  const { t } = useTranslation();
  const [isEditGameModalOpen, setIsEditGameModalOpen] = useState(false);
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<CollectionInfo | null>(null);
  
  const totalResults = games.length + collections.length;
  if (totalResults === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  const isPopup = variant === "popup";
  const containerClass = isPopup ? "" : "search-results-list-container";

  const allItems: (GameItem | CollectionItem)[] = [...collections, ...games];

  const handleEditClick = (item: GameItem | CollectionItem) => {
    if (onModalOpen) {
      onModalOpen();
    }
    if ("year" in item) {
      // It's a game
      setSelectedGame(item);
      setIsEditGameModalOpen(true);
    } else {
      // It's a collection
      const collectionInfo: CollectionInfo = {
        id: item.ratingKey,
        title: item.title,
        summary: item.summary,
        cover: item.cover,
      };
      setSelectedCollection(collectionInfo);
      setIsEditCollectionModalOpen(true);
    }
  };

  const handleGameUpdate = (updatedGame: GameItem) => {
    if (onGameUpdate) {
      onGameUpdate(updatedGame);
    }
    setIsEditGameModalOpen(false);
    setSelectedGame(null);
    if (onModalClose) {
      onModalClose();
    }
  };

  const handleCollectionUpdate = (updatedCollection: CollectionInfo) => {
    if (onCollectionUpdate) {
      const updatedItem: CollectionItem = {
        ratingKey: updatedCollection.id,
        title: updatedCollection.title,
        summary: updatedCollection.summary,
        cover: updatedCollection.cover,
      };
      onCollectionUpdate(updatedItem);
    }
    setIsEditCollectionModalOpen(false);
    setSelectedCollection(null);
    if (onModalClose) {
      onModalClose();
    }
  };

  return (
    <>
      <div className={containerClass}>
        {allItems.map((item, index) => (
          <SearchResultItem
            key={item.ratingKey}
            item={item}
            onGameClick={onGameClick}
            buildCoverUrl={buildCoverUrl}
            variant={variant}
            coverSize={coverSize}
            onPlay={onPlay}
            onCollectionClick={onCollectionClick}
            hasBorder={isPopup && index < allItems.length - 1}
            onEditClick={handleEditClick}
            onGameDelete={onGameDelete}
            onGameUpdate={onGameUpdate}
            onCollectionDelete={onCollectionDelete}
            onCollectionUpdate={onCollectionUpdate}
            onModalOpen={onModalOpen}
            onModalClose={onModalClose}
          />
        ))}
      </div>
      {(selectedGame || selectedCollection) && (
        <>
          {selectedGame && (
            <EditGameModal
              isOpen={isEditGameModalOpen}
              onClose={() => {
                setIsEditGameModalOpen(false);
                setSelectedGame(null);
                if (onModalClose) {
                  onModalClose();
                }
              }}
              game={selectedGame}
              onGameUpdate={handleGameUpdate}
            />
          )}
          {selectedCollection && (
            <EditCollectionModal
              isOpen={isEditCollectionModalOpen}
              onClose={() => {
                setIsEditCollectionModalOpen(false);
                setSelectedCollection(null);
                if (onModalClose) {
                  onModalClose();
                }
              }}
              collection={selectedCollection}
              onCollectionUpdate={handleCollectionUpdate}
            />
          )}
        </>
      )}
    </>
  );
}
