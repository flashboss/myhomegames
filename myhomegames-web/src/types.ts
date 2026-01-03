// Common types used across the application

export type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  background?: string;
  day?: number | null;
  month?: number | null;
  year?: number | null;
  stars?: number | null;
  genre?: string | string[];
  criticratings?: number | null;
  userratings?: number | null;
  command?: string | null;
};

export type CollectionItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  gameCount?: number;
};

export type CategoryItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

export type CollectionInfo = {
  id: string;
  title: string;
  summary?: string;
  cover?: string;
  background?: string;
};

export type IGDBGame = {
  id: number;
  name: string;
  summary: string;
  cover: string | null;
  background?: string | null;
  releaseDate: number | null;
  releaseDateFull?: {
    year: number;
    month: number;
    day: number;
    timestamp: number;
  } | null;
  genres?: string[];
  criticRating?: number | null;
  userRating?: number | null;
};

export type SortField = "title" | "year" | "stars" | "releaseDate" | "criticRating" | "userRating";

export type ViewMode = "grid" | "detail" | "table";

export type GameLibrarySection = {
  key: string;
  title?: string; // Optional, will be translated using key
  type: string;
};

