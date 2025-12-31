import type { GameItem } from "../../types";

export type FilterField = "all" | "genre" | "year" | "decade" | "collection";

export type FilterType = "year" | "genre" | "decade" | "collection";

export type { GameItem };

export type FilterValue = number | string | null;

