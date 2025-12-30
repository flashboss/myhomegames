export type FilterField = "all" | "genre" | "year" | "decade" | "collection";

export type FilterType = "year" | "genre" | "decade" | "collection";

export type GameItem = {
  ratingKey: string;
  title: string;
  year?: number | null;
};

export type FilterValue = number | string | null;

