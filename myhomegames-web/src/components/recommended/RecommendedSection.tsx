import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import GamesList from "../games/GamesList";
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
  apiBase: string;
  apiToken?: string;
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  onGameUpdate?: (updatedGame: GameItem) => void;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
};

export default function RecommendedSection({
  sectionId,
  games,
  apiBase,
  apiToken,
  onGameClick,
  onPlay,
  onGameUpdate,
  buildCoverUrl,
  coverSize,
}: RecommendedSectionProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gamesListRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isRestoringRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const [paddingLeft, setPaddingLeft] = useState(64); // Initial value, will be calculated immediately
  const storageKey = `${location.pathname}:${sectionId}`;
  const isInitializedRef = useRef(false);

  const titleKey = `recommended.${sectionId}`;
  const title = t(titleKey, { defaultValue: sectionId });

  // Calculate initial padding before first paint to avoid visual jumps
  useLayoutEffect(() => {
    if (isInitializedRef.current) return;
    
    const scrollContainer = scrollRef.current;
    const titleElement = titleRef.current;
    const gamesListElement = gamesListRef.current;
    
    if (!scrollContainer || !titleElement || !gamesListElement) return;
    
    // Calculate padding based on title position
    const scrollRect = scrollContainer.getBoundingClientRect();
    const titleRect = titleElement.getBoundingClientRect();
    const titleLeft = titleRect.left - scrollRect.left;
    
    // Set initial padding to title position (will be fine-tuned later)
    setPaddingLeft(titleLeft);
    isInitializedRef.current = true;
  }, []);

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

  // Adjust padding dynamically based on available space
  useEffect(() => {
    let isCalculating = false;
    let calculationTimeout: number | null = null;
    
    const adjustPadding = () => {
      const scrollContainer = scrollRef.current;
      const titleElement = titleRef.current;
      const gamesListElement = gamesListRef.current;
      
      if (!scrollContainer || !titleElement || !gamesListElement || isCalculating) return;
      
      // Clear any pending calculation
      if (calculationTimeout) {
        clearTimeout(calculationTimeout);
        calculationTimeout = null;
      }
      
      isCalculating = true;
      
      // Calculate padding in background without modifying visible scroll
      // Use requestIdleCallback if available, otherwise use setTimeout
      const scheduleCalculation = (callback: () => void) => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(callback, { timeout: 500 });
        } else {
          setTimeout(callback, 0);
        }
      };
      
      scheduleCalculation(() => {
        const firstGame = gamesListElement.querySelector('.games-list-item');
        if (!firstGame) {
          isCalculating = false;
          return;
        }
        
        // Check if images are loaded (for large images)
        const firstImage = firstGame.querySelector('img');
        if (firstImage && !firstImage.complete) {
          // Image not loaded yet, wait for it
          firstImage.addEventListener('load', () => {
            isCalculating = false;
            adjustPadding();
          }, { once: true });
          isCalculating = false;
          return;
        }
        
        // Get current positions without modifying scroll
        const scrollRect = scrollContainer.getBoundingClientRect();
        const titleRect = titleElement.getBoundingClientRect();
        const firstGameRect = firstGame.getBoundingClientRect();
        const firstGameWidth = firstGameRect.width;
        
        // Calculate positions relative to container
        const titleLeft = titleRect.left - scrollRect.left;
        const currentScrollLeft = scrollContainer.scrollLeft;
        
        // Calculate where firstGameLeft would be when scrollLeft = 0
        // When scrollLeft = 0, firstGameLeft = paddingLeft + offset (where offset is margin/padding)
        // Current firstGameLeft = paddingLeft + offset - currentScrollLeft
        // So: firstGameLeft at scrollLeft=0 = current firstGameLeft + currentScrollLeft
        const firstGameLeftAtZero = (firstGameRect.left - scrollRect.left) + currentScrollLeft;
        
        // Target: align first game with title when scrollLeft = 0
        const targetPadding = titleLeft;
        
        // Calculate the offset (margin/padding of wrapper)
        const offset = firstGameLeftAtZero - paddingLeft;
        
        // Determine if image is large (needs extra padding)
        const extraPadding = firstGameWidth > 200 
          ? Math.min(500, 100 + (firstGameWidth - 200) * 2) 
          : 0;
        
        // Calculate new padding: targetPadding = newPadding + offset
        // So: newPadding = targetPadding - offset
        const newPadding = targetPadding - offset + extraPadding;
        const maxPadding = Math.max(3000, targetPadding + extraPadding + 500);
        const finalPadding = Math.max(0, Math.min(maxPadding, newPadding));
        
        // Calculate excess space on the right
        const contentWidth = gamesListElement.scrollWidth;
        const containerWidth = scrollContainer.clientWidth;
        const visibleRight = currentScrollLeft + containerWidth;
        const contentRight = paddingLeft + contentWidth;
        const excessSpace = visibleRight - contentRight;
        
        // Apply padding adjustment only if significant change
        if (Math.abs(finalPadding - paddingLeft) > 5) {
          // Apply padding update in next frame to avoid visual jumps
          requestAnimationFrame(() => {
            setPaddingLeft(finalPadding);
            isCalculating = false;
          });
          return;
        }
        
        // If there's too much space on the right, reduce padding slightly
        if (excessSpace > 100 && paddingLeft > targetPadding) {
          const reducedPadding = Math.max(targetPadding, paddingLeft - 50);
          if (Math.abs(reducedPadding - paddingLeft) > 5) {
            requestAnimationFrame(() => {
              setPaddingLeft(reducedPadding);
              isCalculating = false;
            });
            return;
          }
        }
        
        isCalculating = false;
      });
    };

    // Adjust padding when content loads or window resizes
    const resizeObserver = new ResizeObserver(() => {
      // Longer delay for large images that might take time to load and resize
      setTimeout(adjustPadding, 200);
    });

    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }
    if (gamesListRef.current) {
      resizeObserver.observe(gamesListRef.current);
    }

    window.addEventListener('resize', adjustPadding);
    
    // Initial adjustment after content is loaded (longer delay for large images)
    setTimeout(adjustPadding, 1200);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', adjustPadding);
    };
  }, [games.length, paddingLeft]);

  if (games.length === 0) {
    return null;
  }

  return (
    <div className="recommended-section">
      <div className="recommended-section-header">
        <h2 ref={titleRef} className="recommended-section-title">{title}</h2>
      </div>
      <div
        ref={scrollRef}
        className="recommended-section-scroll"
      >
        <div ref={gamesListRef}>
          <GamesList
            games={games}
            apiBase={apiBase}
            apiToken={apiToken}
            onGameClick={onGameClick}
            onPlay={onPlay}
            onGameUpdate={onGameUpdate}
            buildCoverUrl={buildCoverUrl}
            coverSize={coverSize}
            itemRefs={itemRefs}
            style={{ paddingLeft: `${paddingLeft}px` }}
          />
        </div>
      </div>
    </div>
  );
}

