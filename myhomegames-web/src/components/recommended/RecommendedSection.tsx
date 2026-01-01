import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GamesList from "../games/GamesList";
import RecommendedSectionNav from "./RecommendedSectionNav";
import type { GameItem } from "../../types";
import "./RecommendedSection.css";

type RecommendedSectionProps = {
  sectionId: string;
  games: GameItem[];
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  onGameUpdate?: (updatedGame: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
};

export default function RecommendedSection({
  sectionId,
  games,
  onGameClick,
  onPlay,
  onGameUpdate,
  buildCoverUrl,
  coverSize,
}: RecommendedSectionProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const titleKey = `recommended.${sectionId}`;
  const title = t(titleKey, { defaultValue: sectionId });

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
    
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < maxScroll - 1);
  };

  const scrollToFirst = () => {
    scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const scrollToLast = () => {
    const container = scrollRef.current;
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: maxScroll, behavior: 'smooth' });
    }
  };


  // Salva posizione durante lo scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollButtons();
    };

    // Previeni navigazione browser durante scroll orizzontale
    const handleWheel = (e: WheelEvent) => {
      const rect = container.getBoundingClientRect();
      const isOverContainer = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;
      
      if (!isOverContainer) return;
      
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
      if (!hasHorizontalScroll) return;
      
      const isPrimarilyHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      
      if (isPrimarilyHorizontal || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        e.stopPropagation();
        
        const currentScrollLeft = container.scrollLeft;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        const canScrollLeft = currentScrollLeft > 0 && e.deltaX < 0;
        const canScrollRight = currentScrollLeft < maxScrollLeft && e.deltaX > 0;
        
        if (canScrollLeft || canScrollRight) {
          container.scrollLeft += e.deltaX;
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [sectionId]);

  // Aggiorna bottoni quando cambia contenuto
  useEffect(() => {
    updateScrollButtons();
    const timer = setTimeout(updateScrollButtons, 200);
    return () => clearTimeout(timer);
  }, [games.length]);

  if (games.length === 0) {
    return null;
  }

  return (
    <div className="recommended-section">
      <div className="recommended-section-header">
        <h2 className="recommended-section-title">{title}</h2>
        <RecommendedSectionNav
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollToFirst={scrollToFirst}
          onScrollToLast={scrollToLast}
        />
      </div>
      <div
        ref={scrollRef}
        className="recommended-section-scroll"
      >
        <GamesList
          games={games}
          onGameClick={onGameClick}
          onPlay={onPlay}
          onGameUpdate={onGameUpdate}
          buildCoverUrl={buildCoverUrl}
          coverSize={coverSize}
        />
      </div>
    </div>
  );
}
