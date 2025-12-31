import { useRef, useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import GamesList from "../games/GamesList";
import "./RecommendedSection.css";

// Helper functions to get/set scroll positions from sessionStorage
function getScrollPosition(key: string): number | null {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored === null) return null;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

function setScrollPosition(key: string, position: number): void {
  try {
    sessionStorage.setItem(key, position.toString());
  } catch {
    // Ignore storage errors
  }
}

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
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isRestoringRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const storageKey = `${location.pathname}:${sectionId}`;

  const titleKey = `recommended.${sectionId}`;
  const title = t(titleKey, { defaultValue: sectionId });

  // Usa il padding esterno se fornito, altrimenti usa un default
  const paddingLeft = externalPaddingLeft ?? 64;

  // Save scroll before route changes
  useEffect(() => {
    // Save the last known scroll position before route changes
    if (lastScrollPositionRef.current > 0) {
      setScrollPosition(storageKey, lastScrollPositionRef.current);
    }
  }, [location.pathname, storageKey]);

  // Restore horizontal scroll position when route changes
  useLayoutEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    isRestoringRef.current = true;
    
    const restoreScroll = (attempt = 0) => {
      const container = scrollRef.current;
      if (!container) {
        if (attempt < 30) {
          timeoutRef.current = setTimeout(() => {
            restoreScroll(attempt + 1);
          }, 100) as unknown as number;
        } else {
          isRestoringRef.current = false;
        }
        return;
      }

      // Wait for content to be rendered
      if (container.scrollWidth <= container.clientWidth && attempt < 20) {
        timeoutRef.current = setTimeout(() => {
          restoreScroll(attempt + 1);
        }, 100) as unknown as number;
        return;
      }

      const savedPosition = getScrollPosition(storageKey);
      
      if (savedPosition !== null && savedPosition > 0) {
        container.scrollLeft = savedPosition;
        
        if (attempt < 10) {
          timeoutRef.current = setTimeout(() => {
            const currentPos = container.scrollLeft;
            if (Math.abs(currentPos - savedPosition) > 10) {
              container.scrollLeft = savedPosition;
              restoreScroll(attempt + 1);
            } else {
              isRestoringRef.current = false;
            }
          }, 300) as unknown as number;
        } else {
          isRestoringRef.current = false;
        }
      } else {
        isRestoringRef.current = false;
      }
    };

    const initialDelay = setTimeout(() => {
      restoreScroll();
    }, 800);

    return () => {
      clearTimeout(initialDelay);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location.pathname, sectionId, storageKey]);

  // Save horizontal scroll position when scrolling and prevent browser navigation
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isRestoringRef.current) return;
      const position = container.scrollLeft;
      lastScrollPositionRef.current = position;
      setScrollPosition(storageKey, position);
    };

    // Prevent browser navigation when scrolling horizontally with touchpad
    const handleWheel = (e: WheelEvent) => {
      // If scrolling horizontally, prevent default to avoid browser navigation
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        // Manually scroll the container
        container.scrollLeft += e.deltaX;
      }
    };

    // Save scroll before page unload
    const handleBeforeUnload = () => {
      const position = container.scrollLeft;
      setScrollPosition(storageKey, position);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save the last known scroll position when component unmounts
      if (lastScrollPositionRef.current > 0) {
        setScrollPosition(storageKey, lastScrollPositionRef.current);
      }
    };
  }, [location.pathname, sectionId, storageKey]);


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

