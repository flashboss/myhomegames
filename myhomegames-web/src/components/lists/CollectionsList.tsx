import { useTranslation } from "react-i18next";
import Cover from "../games/Cover";
import type { CollectionItem } from "../../types";
import "./CollectionsList.css";

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
  const { t } = useTranslation();
  const coverHeight = coverSize * 1.5;

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
    >
      <Cover
        title={collection.title}
        coverUrl={buildCoverUrl(apiBase, collection.cover)}
        width={coverSize}
        height={coverHeight}
        onPlay={onPlay ? () => onPlay(collection) : undefined}
        onClick={() => onCollectionClick(collection)}
        showTitle={true}
        subtitle={collection.gameCount !== undefined ? `${collection.gameCount} ${t("common.elements")}` : undefined}
        detail={true}
        play={true}
        showBorder={true}
      />
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

