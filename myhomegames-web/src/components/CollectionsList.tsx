import { useState } from "react";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "./CoverPlaceholder";
import "./CollectionsList.css";

type CollectionItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

type CollectionsListProps = {
  collections: CollectionItem[];
  apiBase: string;
  onCollectionClick: (collection: CollectionItem) => void;
  onPlay?: (collection: CollectionItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

type CollectionListItemProps = {
  collection: CollectionItem;
  apiBase: string;
  onCollectionClick: (collection: CollectionItem) => void;
  onPlay?: (collection: CollectionItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

function CollectionListItem({
  collection,
  apiBase,
  onCollectionClick,
  onPlay,
  buildCoverUrl,
  coverSize,
  itemRefs,
}: CollectionListItemProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !collection.cover || imageError;
  const coverHeight = coverSize * 1.5;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(collection);
    }
  };

  return (
    <div
      key={collection.ratingKey}
      ref={(el) => {
        if (el && itemRefs?.current) {
          itemRefs.current.set(collection.ratingKey, el);
        }
      }}
      className="group cursor-pointer collections-list-item"
      style={{ width: `${coverSize}px`, minWidth: `${coverSize}px` }}
      onClick={() => onCollectionClick(collection)}
    >
      <div className="relative aspect-[2/3] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-all group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20 collections-list-cover">
        {showPlaceholder ? (
          <CoverPlaceholder
            title={collection.title}
            width={coverSize}
            height={coverHeight}
          />
        ) : (
          <>
            <img
              src={buildCoverUrl(apiBase, collection.cover)}
              alt={collection.title}
              className="object-cover w-full h-full"
              onError={() => {
                setImageError(true);
              }}
            />
          </>
        )}
        {onPlay && (
          <button
            onClick={handlePlayClick}
            className="collections-list-play-button"
            aria-label="Play collection"
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
      <div className="truncate collections-list-title">{collection.title}</div>
    </div>
  );
}

export default function CollectionsList({
  collections,
  apiBase,
  onCollectionClick,
  onPlay,
  buildCoverUrl,
  coverSize = 150,
  itemRefs,
}: CollectionsListProps) {
  const { t } = useTranslation();
  
  if (collections.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <div
      className="collections-list-container"
      style={{ gridTemplateColumns: `repeat(auto-fill, ${coverSize}px)` }}
    >
      {collections.map((collection) => (
        <CollectionListItem
          key={collection.ratingKey}
          collection={collection}
          apiBase={apiBase}
          onCollectionClick={onCollectionClick}
          onPlay={onPlay}
          buildCoverUrl={buildCoverUrl}
          coverSize={coverSize}
          itemRefs={itemRefs}
        />
      ))}
    </div>
  );
}

