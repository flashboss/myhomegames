import { useLayoutEffect, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Store scroll positions for each route
const scrollPositions = new Map<string, number>();

export default function ScrollRestoration() {
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const isRestoringRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  // Find the scrollable container
  const findScrollContainer = (): HTMLElement | null => {
    // Try to find common scroll containers in order of priority
    const selectors = [
      '.home-page-scroll-container',
      '.home-page-main-container',
      'main.home-page-content',
      'main',
      '[role="main"]',
      '.scroll-container'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        // Check if element is scrollable or has scrollable children
        const style = window.getComputedStyle(element);
        const isScrollable = 
          (element.scrollHeight > element.clientHeight) ||
          style.overflow === 'auto' ||
          style.overflow === 'scroll' ||
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll';
        
        if (isScrollable) {
          return element;
        }
      }
    }
    
    // Fallback to window
    return null;
  };

  // Save scroll position before navigation
  useEffect(() => {
    const container = scrollContainerRef.current || findScrollContainer();
    const savedPosition = scrollPositions.get(location.pathname);
    
    const handleScroll = () => {
      if (isRestoringRef.current) return;
      
      const position = container ? container.scrollTop : window.scrollY;
      if (position > 0) {
        scrollPositions.set(location.pathname, position);
      }
    };

    // Monitor for unexpected scroll resets and restore if needed
    const checkScrollReset = () => {
      if (isRestoringRef.current) return;
      if (savedPosition === undefined || savedPosition === 0) return;
      
      const currentPos = container ? container.scrollTop : window.scrollY;
      // If scroll was reset to top unexpectedly, restore it
      if (currentPos === 0 && savedPosition > 100) {
        isRestoringRef.current = true;
        if (container) {
          container.scrollTop = savedPosition;
        } else {
          window.scrollTo(0, savedPosition);
        }
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      }
    };

    const scrollTarget = container || window;
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check for scroll resets periodically
    const resetCheckInterval = setInterval(checkScrollReset, 100);

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      clearInterval(resetCheckInterval);
      // Save position when leaving
      const position = container ? container.scrollTop : window.scrollY;
      if (position > 0) {
        scrollPositions.set(location.pathname, position);
      }
    };
  }, [location.pathname]);

  // Restore scroll position
  useLayoutEffect(() => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    isRestoringRef.current = true;
    
    const restoreScroll = (attempt = 0) => {
      const container = findScrollContainer();
      scrollContainerRef.current = container;

      const savedPosition = scrollPositions.get(location.pathname);
      
      if (savedPosition !== undefined && savedPosition > 0) {
        if (container) {
          container.scrollTop = savedPosition;
        } else {
          window.scrollTo(0, savedPosition);
        }
        
        // Verify restoration worked, retry if needed
        if (attempt < 5) {
          timeoutRef.current = setTimeout(() => {
            const currentPos = container ? container.scrollTop : window.scrollY;
            if (Math.abs(currentPos - savedPosition) > 10) {
              restoreScroll(attempt + 1);
            } else {
              isRestoringRef.current = false;
            }
          }, 200 * (attempt + 1));
        } else {
          isRestoringRef.current = false;
        }
      } else {
        // If no saved position, scroll to top
        if (container) {
          container.scrollTop = 0;
        } else {
          window.scrollTo(0, 0);
        }
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
  }, [location.pathname]);

  return null;
}

