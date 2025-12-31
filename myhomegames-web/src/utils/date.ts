import type { GameItem } from "../types";

/**
 * Formats a game's release date
 * @param game - The game item with year, month, and day properties
 * @returns Formatted date string (DD/MM/YYYY) or year only, or null if no date available
 */
export function formatGameDate(game: GameItem): string | null {
  if (game.year === null || game.year === undefined) {
    return null;
  }

  if (
    game.day !== null &&
    game.day !== undefined &&
    game.month !== null &&
    game.month !== undefined
  ) {
    return `${game.day}/${game.month}/${game.year}`;
  }

  return game.year.toString();
}

