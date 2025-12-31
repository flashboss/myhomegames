/**
 * API utility functions for building URLs
 */

/**
 * Builds an API URL with optional query parameters
 * @param apiBase - The base URL for the API
 * @param path - The API endpoint path
 * @param params - Optional query parameters
 * @returns The complete URL string
 */
export function buildApiUrl(
  apiBase: string,
  path: string,
  params: Record<string, string | number | boolean> = {}
): string {
  const u = new URL(path, apiBase);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

/**
 * Builds a cover image URL
 * @param apiBase - The base URL for the API
 * @param cover - The cover path from the server (e.g., /covers/gameId)
 * @returns The complete cover URL string, or empty string if cover is not provided
 */
export function buildCoverUrl(apiBase: string, cover?: string): string {
  if (!cover) return "";
  // Cover is already a full path from server (e.g., /covers/gameId)
  // We need to prepend the API base URL
  const u = new URL(cover, apiBase);
  return u.toString();
}

/**
 * Builds a background image URL
 * @param apiBase - The base URL for the API
 * @param background - The background path from the server (e.g., /backgrounds/gameId or /collection-backgrounds/collectionId)
 * @returns The complete background URL string, or empty string if background is not provided
 */
export function buildBackgroundUrl(apiBase: string, background?: string): string {
  if (!background) return "";
  // Background is already a full path from server (e.g., /backgrounds/gameId)
  // We need to prepend the API base URL
  const u = new URL(background, apiBase);
  return u.toString();
}

