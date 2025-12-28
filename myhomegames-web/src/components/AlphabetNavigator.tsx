
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

type AlphabetNavigatorProps = {
  games: GameItem[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

export default function AlphabetNavigator({ games, scrollContainerRef, itemRefs }: AlphabetNavigatorProps) {
  const alphabet = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  
  // Get first letter of each game title
  const getFirstLetter = (title: string): string => {
    const firstChar = title.trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(firstChar) ? firstChar : '#';
  };

  // Check if a letter has games
  const hasGamesForLetter = (letter: string): boolean => {
    return games.some(game => getFirstLetter(game.title) === letter);
  };

  // Scroll to first game starting with letter
  const scrollToLetter = (letter: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Find first game starting with this letter
    const firstGameIndex = games.findIndex(game => getFirstLetter(game.title) === letter);
    if (firstGameIndex === -1) return;

    const game = games[firstGameIndex];
    
    // Try to find element using itemRefs
    if (itemRefs?.current) {
      const element = itemRefs.current.get(game.ratingKey);
      if (element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop = container.scrollTop + elementRect.top - containerRect.top - 20; // 20px offset from top
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        return;
      }
    }

    // Fallback: scroll by calculating position
    // This is a simple approach - might need adjustment based on item height
    const itemsPerRow = Math.floor(container.clientWidth / 200); // Approximate
    const rowIndex = Math.floor(firstGameIndex / itemsPerRow);
    const scrollPosition = rowIndex * 200; // Approximate row height
    
    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        pointerEvents: 'auto'
      }}
    >
      {alphabet.map((letter) => {
        const hasGames = hasGamesForLetter(letter);
        return (
          <button
            key={letter}
            onClick={() => scrollToLetter(letter)}
            disabled={!hasGames}
            style={{
              background: 'none',
              border: 'none',
              color: hasGames ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.2)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: hasGames ? 'pointer' : 'default',
              padding: '2px 4px',
              transition: 'color 0.2s ease',
              minWidth: '20px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (hasGames) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
              }
            }}
            onMouseLeave={(e) => {
              if (hasGames) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

