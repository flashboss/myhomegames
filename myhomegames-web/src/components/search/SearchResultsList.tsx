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
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

type SearchResultItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
};

function SearchResultItem({
  game,
  apiBase,
  onGameClick,
  buildCoverUrl,
}: SearchResultItemProps) {
  const coverHeight = FIXED_COVER_SIZE * 1.5;

  return (
    <div
      key={game.ratingKey}
      className="group cursor-pointer mb-6 search-results-list-item"
      onClick={() => onGameClick(game)}
    >
      <Cover
        title={game.title}
        coverUrl={buildCoverUrl(apiBase, game.cover)}
        width={FIXED_COVER_SIZE}
        height={coverHeight}
        onClick={() => onGameClick(game)}
        showTitle={false}
        detail={true}
        play={false}
        showBorder={false}
      />
      <div className="search-results-list-content">
        <div className="text-white mb-2 search-results-list-title">
          {game.title}
        </div>
        {game.year !== null && game.year !== undefined && (
          <div className="text-gray-500 search-results-list-date">
            {game.day !== null &&
            game.day !== undefined &&
            game.month !== null &&
            game.month !== undefined
              ? `${game.day}/${game.month}/${game.year}`
              : game.year.toString()}
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionResultItem({
  collection,
  apiBase,
  buildCoverUrl,
}: {
  collection: CollectionItem;
  apiBase: string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const coverHeight = FIXED_COVER_SIZE * 1.5;

  return (
    <div
      key={collection.ratingKey}
      className="group cursor-pointer mb-6 search-results-list-item"
      onClick={() => navigate(`/collections/${collection.ratingKey}`)}
    >
      <Cover
        title={collection.title}
        coverUrl={buildCoverUrl(apiBase, collection.cover)}
        width={FIXED_COVER_SIZE}
        height={coverHeight}
        onClick={() => navigate(`/collections/${collection.ratingKey}`)}
        showTitle={false}
        detail={true}
        play={false}
        showBorder={false}
      />
      <div className="search-results-list-content">
        <div className="text-white mb-2 search-results-list-title">
          {collection.title}
        </div>
        <div className="text-gray-400 mb-2 search-results-list-summary">
          {t("search.collection")}
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsList({
  games,
  collections,
  apiBase,
  onGameClick,
  buildCoverUrl,
}: SearchResultsListProps) {
  const { t } = useTranslation();
  
  const totalResults = games.length + collections.length;
  if (totalResults === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <div className="search-results-list-container">
      {collections.map((collection) => (
        <CollectionResultItem
          key={`collection-${collection.ratingKey}`}
          collection={collection}
          apiBase={apiBase}
          buildCoverUrl={buildCoverUrl}
        />
      ))}
      {games.map((game) => (
        <SearchResultItem
          key={game.ratingKey}
          game={game}
          apiBase={apiBase}
          onGameClick={onGameClick}
          buildCoverUrl={buildCoverUrl}
        />
      ))}
    </div>
  );
}
