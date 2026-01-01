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

