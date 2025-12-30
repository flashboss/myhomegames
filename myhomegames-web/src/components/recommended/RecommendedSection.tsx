import { useRef } from "react";
import { useTranslation } from "react-i18next";
import GamesList from "../games/GamesList";
import "./RecommendedSection.css";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  day?: number | null;
  month?: number | null;
  year?: number | null;
  stars?: number | null;
};

type RecommendedSectionProps = {
  sectionId: string;
  games: GameItem[];
  apiBase: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  paddingLeft?: number;
};

export default function RecommendedSection({
  sectionId,
  games,
  apiBase,
  onGameClick,
  onPlay,
  buildCoverUrl,
  coverSize,
  paddingLeft: externalPaddingLeft,
}: RecommendedSectionProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const titleKey = `recommended.${sectionId}`;
  const title = t(titleKey, { defaultValue: sectionId });

  // Usa il padding esterno se fornito, altrimenti usa un default
  const paddingLeft = externalPaddingLeft ?? 64;

  if (games.length === 0) {
    return null;
  }

  return (
    <div className="recommended-section">
      <div className="recommended-section-header">
        <h2 className="recommended-section-title">{title}</h2>
      </div>
      <div
        ref={scrollRef}
        className="recommended-section-scroll"
      >
        <GamesList
          games={games}
          apiBase={apiBase}
          onGameClick={onGameClick}
          onPlay={onPlay}
          buildCoverUrl={buildCoverUrl}
          coverSize={coverSize}
          itemRefs={itemRefs}
          style={{ paddingLeft: `${paddingLeft}px` }}
        />
      </div>
    </div>
  );
}

