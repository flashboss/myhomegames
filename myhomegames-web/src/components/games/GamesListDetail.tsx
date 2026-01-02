import { useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../../config";
import Cover from "./Cover";
import EditGameModal from "./EditGameModal";
import DropdownMenu from "../common/DropdownMenu";
import StarRating from "../common/StarRating";
import Summary from "../common/Summary";
import type { GameItem } from "../../types";
import "./GamesListDetail.css";

type GamesListDetailProps = {
  games: GameItem[];
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  onGameUpdate?: (updatedGame: GameItem) => void;
  onGameDelete?: (deletedGame: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

const FIXED_COVER_SIZE = 100; // Fixed size corresponding to minimum slider position

type GameDetailItemProps = {
  game: GameItem;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  onEditClick: (game: GameItem) => void;
  onGameDelete?: (deletedGame: GameItem) => void;
  onGameUpdate?: (updatedGame: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  index: number;
};

function GameDetailItem({
  game,
  onGameClick,
  onPlay,
  onEditClick,
  onGameDelete,
  onGameUpdate,
  buildCoverUrl,
  itemRefs,
  index,
}: GameDetailItemProps) {
  const isEven = index % 2 === 0;
  const coverHeight = FIXED_COVER_SIZE * 1.5;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick(game);
  };

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
        coverUrl={buildCoverUrl(API_BASE, game.cover)}
        width={FIXED_COVER_SIZE}
        height={coverHeight}
        onPlay={onPlay ? () => onPlay(game) : undefined}
        showTitle={false}
        detail={false}
        play={true}
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
      <div className="games-list-detail-actions">
        <button
          onClick={handleEditClick}
          className="games-list-detail-edit-button"
          aria-label="Edit"
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
        <DropdownMenu
          gameId={game.ratingKey}
          gameTitle={game.title}
          onGameDelete={onGameDelete ? (gameId: string) => {
            if (game.ratingKey === gameId) {
              onGameDelete(game);
            }
          } : undefined}
          onGameUpdate={onGameUpdate ? (updatedGame) => {
            if (updatedGame.ratingKey === game.ratingKey) {
              onGameUpdate(updatedGame);
            }
          } : undefined}
          className="games-list-detail-dropdown-menu"
        />
      </div>
    </div>
  );
}

export default function GamesListDetail({
  games,
  onGameClick,
  onPlay,
  onGameUpdate,
  onGameDelete,
  buildCoverUrl,
  itemRefs,
}: GamesListDetailProps) {
  const { t } = useTranslation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  
  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  const handleEditClick = (game: GameItem) => {
    setSelectedGame(game);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedGame(null);
  };

  const handleGameUpdate = (updatedGame: GameItem) => {
    if (onGameUpdate) {
      onGameUpdate(updatedGame);
    }
    handleEditModalClose();
  };

  return (
    <>
      <div className="games-list-detail-container">
        {games.map((game, index) => (
          <GameDetailItem
            key={game.ratingKey}
            game={game}
            onGameClick={onGameClick}
            onPlay={onPlay}
            onEditClick={handleEditClick}
            onGameDelete={onGameDelete}
            onGameUpdate={onGameUpdate}
            buildCoverUrl={buildCoverUrl}
            itemRefs={itemRefs}
            index={index}
          />
        ))}
      </div>
      {selectedGame && (
        <EditGameModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          game={selectedGame}
          onGameUpdate={handleGameUpdate}
        />
      )}
    </>
  );
}
