import "./AlphabetNavigator.css";

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
  ascending?: boolean;
};

export default function AlphabetNavigator({
  games,
  scrollContainerRef,
  itemRefs,
  ascending = true,
}: AlphabetNavigatorProps) {
  const alphabet = ascending
    ? ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")]
    : [..."ZYXWVUTSRQPONMLKJIHGFEDCBA".split(""), "#"];

  // Get first letter of each game title
  const getFirstLetter = (title: string): string => {
    const firstChar = title.trim().charAt(0).toUpperCase();
    if (/[A-Z]/.test(firstChar)) {
      return firstChar;
    } else if (/[0-9]/.test(firstChar)) {
      return "#";
    } else {
      // For other special characters, use the first letter found in the title
      const match = title.match(/[A-Z]/i);
      return match ? match[0].toUpperCase() : "#";
    }
  };

  // Check if a letter has games
  const hasGamesForLetter = (letter: string): boolean => {
    return games.some((game) => getFirstLetter(game.title) === letter);
  };

  // Scroll to first game starting with letter
  const scrollToLetter = (letter: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Find first game starting with this letter
    const firstGameIndex = games.findIndex(
      (game) => getFirstLetter(game.title) === letter
    );
    if (firstGameIndex === -1) return;

    const game = games[firstGameIndex];

    // Try to find element using itemRefs
    if (itemRefs?.current) {
      const element = itemRefs.current.get(game.ratingKey);
      if (element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop =
          container.scrollTop + elementRect.top - containerRect.top - 20; // 20px offset from top

        container.scrollTo({
          top: scrollTop,
          behavior: "smooth",
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
      behavior: "smooth",
    });
  };

  return (
    <div className="alphabet-navigator">
      {alphabet.map((letter) => {
        const hasGames = hasGamesForLetter(letter);
        return (
          <button
            key={letter}
            onClick={() => scrollToLetter(letter)}
            disabled={!hasGames}
            className="alphabet-button"
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
