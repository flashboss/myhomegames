import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./GamesListToolbar.css";

type FilterField = "all" | "year";
type SortField = "title" | "year" | "stars" | "releaseDate";

type GameItem = {
  ratingKey: string;
  title: string;
  year?: number | null;
};

type GamesListToolbarProps = {
  gamesCount: number;
  games?: GameItem[];
  onFilterChange?: (field: FilterField) => void;
  onYearFilterChange?: (year: number | null) => void;
  onSortChange?: (field: SortField) => void;
  onSortDirectionChange?: (ascending: boolean) => void;
  currentFilter?: FilterField;
  selectedYear?: number | null;
  currentSort?: SortField;
  sortAscending?: boolean;
  viewMode?: "grid" | "detail" | "table";
};

export default function GamesListToolbar({
  gamesCount,
  games = [],
  onFilterChange,
  onYearFilterChange,
  onSortChange,
  onSortDirectionChange,
  currentFilter = "all",
  selectedYear = null,
  currentSort = "title",
  sortAscending = true,
  viewMode = "grid",
}: GamesListToolbarProps) {
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isYearFilterOpen, setIsYearFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const yearFilterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Get available years from games
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    games.forEach((game) => {
      if (game.year !== null && game.year !== undefined) {
        years.add(game.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  }, [games]);

  // Close popups when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (yearFilterRef.current && !yearFilterRef.current.contains(event.target as Node)) {
        setIsYearFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filterOptions: { value: FilterField; label: string }[] = [
    { value: "all", label: t("gamesListToolbar.filter.all") },
    { value: "year", label: t("gamesListToolbar.filter.year") },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: "title", label: t("gamesListToolbar.sort.title") },
    { value: "year", label: t("gamesListToolbar.sort.year") },
    { value: "stars", label: t("gamesListToolbar.sort.stars") },
    { value: "releaseDate", label: t("gamesListToolbar.sort.releaseDate") },
  ];

  const handleFilterSelect = (field: FilterField) => {
    if (field === "year") {
      // Open year filter popup without setting the filter yet
      setIsYearFilterOpen(true);
      setIsFilterOpen(false);
    } else {
      onFilterChange?.(field);
      if (onYearFilterChange) {
        onYearFilterChange(null); // Clear year filter when selecting other filter
      }
      setIsFilterOpen(false);
    }
  };

  const handleYearSelect = (year: number | null) => {
    if (year === null) {
      // If selecting "Tutto", reset filter to "all"
      onFilterChange?.("all");
      onYearFilterChange?.(null);
    } else {
      // Only set filter to "year" when a specific year is selected
      onFilterChange?.("year");
      onYearFilterChange?.(year);
    }
    setIsYearFilterOpen(false);
    setIsFilterOpen(false);
  };

  const handleSortSelect = (field: SortField) => {
    if (field === currentSort && onSortDirectionChange) {
      // If clicking the same field, toggle direction
      onSortDirectionChange(!sortAscending);
    } else {
      // If selecting a new field, set to ascending by default
      onSortChange?.(field);
      if (onSortDirectionChange) {
        onSortDirectionChange(true);
      }
    }
    setIsSortOpen(false);
  };

  const getCurrentFilterLabel = () => {
    if (currentFilter === "year" && selectedYear !== null) {
      return selectedYear.toString();
    }
    return filterOptions.find((opt) => opt.value === currentFilter)?.label || "";
  };

  const currentFilterLabel = getCurrentFilterLabel();
  const currentSortLabel = sortOptions.find((opt) => opt.value === currentSort)?.label || "";

  return (
    <div className="games-list-toolbar">
      <div className="games-list-toolbar-left">
        <div className="games-list-toolbar-item" ref={filterRef}>
          <button
            className="games-list-toolbar-button"
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsSortOpen(false);
            }}
          >
            {currentFilter && currentFilter !== "all" && (
              <button
                className="games-list-toolbar-clear-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterChange?.("all");
                  if (onYearFilterChange) {
                    onYearFilterChange(null);
                  }
                  setIsFilterOpen(false);
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <span className="games-list-toolbar-value">{currentFilterLabel}</span>
            <svg
              className={`games-list-toolbar-arrow ${isFilterOpen ? "open" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L1 4h10L6 9z"
                fill="currentColor"
              />
            </svg>
          </button>
          {isFilterOpen && (
            <div className="games-list-toolbar-popup">
              <button
                className={`games-list-toolbar-popup-item ${
                  currentFilter === "all" ? "selected" : ""
                }`}
                onClick={() => handleFilterSelect("all")}
              >
                <span>{t("gamesListToolbar.filter.all")}</span>
                {currentFilter === "all" && (
                  <svg
                    className="games-list-toolbar-popup-check"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      fill="#E5A00D"
                    />
                  </svg>
                )}
              </button>
              <div className="games-list-toolbar-popup-divider"></div>
              <button
                className={`games-list-toolbar-popup-item ${
                  currentFilter === "year" ? "selected" : ""
                }`}
                onClick={() => handleFilterSelect("year")}
              >
                <span>{t("gamesListToolbar.filter.year")}</span>
                {currentFilter === "year" && (
                  <svg
                    className="games-list-toolbar-popup-check"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      fill="#E5A00D"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}
          {isYearFilterOpen && (
            <div className="games-list-toolbar-popup" ref={yearFilterRef}>
              <button
                className={`games-list-toolbar-popup-item ${
                  selectedYear === null ? "active" : ""
                }`}
                onClick={() => handleYearSelect(null)}
              >
                {t("gamesListToolbar.filter.all")}
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  className={`games-list-toolbar-popup-item ${
                    selectedYear === year ? "active" : ""
                  }`}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        {viewMode !== "table" && (
          <>
            <div className="games-list-toolbar-item" ref={sortRef}>
              <button
                className="games-list-toolbar-button"
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsFilterOpen(false);
                }}
              >
                <span className="games-list-toolbar-value">
                  {t("gamesListToolbar.sort.prefix")} {currentSortLabel}
                </span>
                <svg
                  className={`games-list-toolbar-arrow ${isSortOpen ? "open" : ""}`}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L1 4h10L6 9z"
                    fill="currentColor"
                  />
                </svg>
              </button>
                  {isSortOpen && (
                    <div className="games-list-toolbar-popup">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          className={`games-list-toolbar-popup-item ${
                            currentSort === option.value ? "selected" : ""
                          }`}
                          onClick={() => handleSortSelect(option.value)}
                        >
                          <span>{option.label}</span>
                          {currentSort === option.value && (
                            <svg
                              className={`games-list-toolbar-popup-sort-direction ${sortAscending ? "ascending" : "descending"}`}
                              width="10"
                              height="10"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d={sortAscending ? "M6 2L10 8H2L6 2Z" : "M6 10L2 4H10L6 10Z"}
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
            </div>
            <span className="games-list-toolbar-count">
              {gamesCount}
            </span>
          </>
        )}
        {viewMode === "table" && (
          <span className="games-list-toolbar-count">
            {gamesCount}
          </span>
        )}
      </div>
    </div>
  );
}

