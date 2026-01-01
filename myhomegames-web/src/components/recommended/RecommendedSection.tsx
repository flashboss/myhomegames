import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import GamesList from "../games/GamesList";
import RecommendedSectionNav from "./RecommendedSectionNav";
import type { GameItem } from "../../types";
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
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isRestoringRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const storageKey = `${location.pathname}:${sectionId}`;
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
    setCanScrollRight(scrollLeft < maxScroll - 1); // -1 per tolleranza
  };

  const scrollToFirst = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollToLast = () => {
    const container = scrollRef.current;
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: maxScroll, behavior: 'smooth' });
    }
  };

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
      updateScrollButtons();
    };

    // Prevent browser navigation when scrolling horizontally with touchpad
    const handleWheel = (e: WheelEvent) => {
      // Check if the event is happening over the container
      const rect = container.getBoundingClientRect();
      const isOverContainer = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;
      
      if (!isOverContainer) return;
      
      // Check if there's horizontal scrollable content
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
      
      if (!hasHorizontalScroll) return;
      
      // If there's horizontal scroll and any horizontal component in the gesture,
      // prevent navigation (even for slow gestures)
      const hasHorizontalComponent = Math.abs(e.deltaX) > 0;
      const isPrimarilyHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      
      // Prevent navigation if:
      // 1. Gesture is primarily horizontal, OR
      // 2. Gesture has any horizontal component (even slow gestures)
      // This ensures slow horizontal gestures don't trigger browser navigation
      if (isPrimarilyHorizontal || hasHorizontalComponent) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if we can scroll in the requested direction
        const currentScrollLeft = container.scrollLeft;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        const canScrollLeft = currentScrollLeft > 0 && e.deltaX < 0;
        const canScrollRight = currentScrollLeft < maxScrollLeft && e.deltaX > 0;
        
        // Only apply scroll if we can actually scroll in that direction
        if (canScrollLeft || canScrollRight) {
          container.scrollLeft += e.deltaX;
        }
        // Even if we can't scroll (at the limit), we still prevent default
        // to avoid browser navigation
      }
    };

    // Save scroll before page unload
    const handleBeforeUnload = () => {
      const position = container.scrollLeft;
      setScrollPosition(storageKey, position);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
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

  // Update scroll buttons when content changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Initial check
    updateScrollButtons();

    // Check after a delay to ensure content is rendered
    const timeoutId = setTimeout(() => {
      updateScrollButtons();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
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
          itemRefs={itemRefs}
        />
      </div>
    </div>
  );
}

