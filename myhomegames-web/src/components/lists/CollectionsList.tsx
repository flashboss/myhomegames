import { useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../../config";
import Cover from "../games/Cover";
import EditCollectionModal from "../collections/EditCollectionModal";
import type { CollectionItem, CollectionInfo } from "../../types";
import "./CollectionsList.css";

type CollectionsListProps = {
  collections: CollectionItem[];
  onCollectionClick: (collection: CollectionItem) => void;
  onPlay?: (collection: CollectionItem) => void;
  onCollectionUpdate?: (updatedCollection: CollectionItem) => void;
  onCollectionDelete?: (deletedCollection: CollectionItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

type CollectionListItemProps = {
  collection: CollectionItem;
  onCollectionClick: (collection: CollectionItem) => void;
  onPlay?: (collection: CollectionItem) => void;
  onEditClick: (collection: CollectionItem) => void;
  onCollectionDelete?: (deletedCollection: CollectionItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

function CollectionListItem({
  collection,
  onCollectionClick,
  onPlay,
  onEditClick,
  onCollectionDelete,
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
        coverUrl={buildCoverUrl(API_BASE, collection.cover)}
        width={coverSize}
        height={coverHeight}
        onPlay={onPlay ? () => onPlay(collection) : undefined}
        onClick={() => onCollectionClick(collection)}
        onEdit={() => onEditClick(collection)}
        collectionId={collection.ratingKey}
        collectionTitle={collection.title}
        onCollectionDelete={onCollectionDelete ? (collectionId: string) => {
          if (collection.ratingKey === collectionId) {
            onCollectionDelete(collection);
          }
        } : undefined}
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
  onCollectionClick,
  onPlay,
  onCollectionUpdate,
  onCollectionDelete,
  buildCoverUrl,
  coverSize = 150,
  itemRefs,
}: CollectionsListProps) {
  const { t } = useTranslation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<CollectionInfo | null>(null);
  
  if (collections.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  const handleEditClick = (collection: CollectionItem) => {
    // Convert CollectionItem to CollectionInfo using available data
    const collectionInfo: CollectionInfo = {
      id: collection.ratingKey,
      title: collection.title,
      summary: collection.summary,
      cover: collection.cover,
    };
    setSelectedCollection(collectionInfo);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedCollection(null);
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
    handleEditModalClose();
  };

  return (
    <>
      <div
        className="collections-list-container"
        style={{ gridTemplateColumns: `repeat(auto-fill, ${coverSize}px)` }}
      >
        {collections.map((collection) => (
          <CollectionListItem
            key={collection.ratingKey}
            collection={collection}
            onCollectionClick={onCollectionClick}
            onPlay={onPlay}
            onEditClick={handleEditClick}
            onCollectionDelete={onCollectionDelete}
            buildCoverUrl={buildCoverUrl}
            coverSize={coverSize}
            itemRefs={itemRefs}
          />
        ))}
      </div>
      {selectedCollection && (
        <EditCollectionModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          collection={selectedCollection}
          onCollectionUpdate={handleCollectionUpdate}
        />
      )}
    </>
  );
}

