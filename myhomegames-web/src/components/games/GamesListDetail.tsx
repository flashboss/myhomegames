import { useTranslation } from "react-i18next";
import Cover from "./Cover";
import StarRating from "../common/StarRating";
import Summary from "../common/Summary";
import type { GameItem } from "../../types";
import "./GamesListDetail.css";

type GamesListDetailProps = {
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

type GameDetailItemProps = {
  game: GameItem;
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  index: number;
};

function GameDetailItem({
  game,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
  itemRefs,
  index,
}: GameDetailItemProps) {
  const isEven = index % 2 === 0;
  const coverHeight = FIXED_COVER_SIZE * 1.5;

  return (
    <div
      key={game.ratingKey}
      ref={(el) => {
        if (el && itemRefs?.current) {
          itemRefs.current.set(game.ratingKey, el);
        }
      }}
      className={`group cursor-pointer mb-6 games-list-detail-item ${
        isEven ? "even" : "odd"
      }`}
      onClick={() => onGameClick(game)}
    >
      <Cover
        title={game.title}
        coverUrl={buildCoverUrl(apiBase, game.cover)}
        width={FIXED_COVER_SIZE}
        height={coverHeight}
        onPlay={onPlay ? () => onPlay(game) : undefined}
        showTitle={false}
        showYear={false}
        mode="play-only"
        showBorder={false}
      />
      <div className="games-list-detail-content">
        <div className="text-white mb-2 games-list-detail-title">
          {game.title}
        </div>
        {(game.year !== null && game.year !== undefined) || (game.stars !== null && game.stars !== undefined) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {game.year !== null && game.year !== undefined && (
              <div className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                {game.day !== null &&
                game.day !== undefined &&
                game.month !== null &&
                game.month !== undefined
                  ? `${game.day}/${game.month}/${game.year}`
                  : game.year.toString()}
              </div>
            )}
            {game.stars !== null && game.stars !== undefined && (
              <StarRating rating={(game.stars / 10) * 5} starSize={14} gap={3} />
            )}
          </div>
        ) : null}
        {game.summary && (
          <Summary summary={game.summary} truncateOnly={true} maxLines={2} fontSize="0.85rem" />
        )}
      </div>
    </div>
  );
}

export default function GamesListDetail({
  games,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
  itemRefs,
}: GamesListDetailProps) {
  const { t } = useTranslation();
  
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <div className="games-list-detail-container">
      {games.map((game, index) => (
        <GameDetailItem
          key={game.ratingKey}
          game={game}
          apiBase={apiBase}
          onGameClick={onGameClick}
          onPlay={onPlay}
          buildCoverUrl={buildCoverUrl}
          itemRefs={itemRefs}
          index={index}
        />
      ))}
    </div>
  );
}
