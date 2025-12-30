import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Store scroll positions for each route
const scrollPositions = new Map<string, number>();

export function useScrollRestoration(scrollContainerRef: React.RefObject<HTMLElement | null>) {
  const location = useLocation();
  const isRestoringRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restore scroll position when route changes
  useLayoutEffect(() => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    isRestoringRef.current = true;
    
    const restoreScroll = (attempt = 0) => {
      const container = scrollContainerRef.current;
      if (!container) {
        // Container not ready yet, retry
        if (attempt < 10) {
          timeoutRef.current = setTimeout(() => {
            restoreScroll(attempt + 1);
          }, 50 * (attempt + 1));
        } else {
          isRestoringRef.current = false;
        }
        return;
      }

      const savedPosition = scrollPositions.get(location.pathname);
      
      if (savedPosition !== undefined && savedPosition > 0) {
        container.scrollTop = savedPosition;
        
        // Verify restoration worked, retry if needed
        if (attempt < 5) {
          timeoutRef.current = setTimeout(() => {
            const currentPos = container.scrollTop;
            if (Math.abs(currentPos - savedPosition) > 10) {
              restoreScroll(attempt + 1);
            } else {
              isRestoringRef.current = false;
            }
          }, 100 * (attempt + 1));
        } else {
          isRestoringRef.current = false;
        }
      } else {
        // If no saved position, scroll to top
        container.scrollTop = 0;
        isRestoringRef.current = false;
      }
    };

    // Try immediately
    requestAnimationFrame(() => {
      restoreScroll();
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location.pathname, scrollContainerRef]);

  // Save scroll position when scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isRestoringRef.current) return;
      
      const position = container.scrollTop;
      if (position > 0) {
        scrollPositions.set(location.pathname, position);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      // Save position when leaving
      const position = container.scrollTop;
      if (position > 0) {
        scrollPositions.set(location.pathname, position);
      }
    };
  }, [location.pathname, scrollContainerRef]);
}

