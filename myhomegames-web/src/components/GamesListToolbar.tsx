import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./GamesListToolbar.css";

type FilterField = "all" | "title" | "year" | "stars" | "summary";
type SortField = "title" | "year" | "stars" | "releaseDate";

type GamesListToolbarProps = {
  gamesCount: number;
  onFilterChange?: (field: FilterField) => void;
  onSortChange?: (field: SortField) => void;
  currentFilter?: FilterField;
  currentSort?: SortField;
  viewMode?: "grid" | "detail" | "table";
};

export default function GamesListToolbar({
  gamesCount,
  onFilterChange,
  onSortChange,
  currentFilter = "all",
  currentSort = "title",
  viewMode = "grid",
}: GamesListToolbarProps) {
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close popups when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
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
    { value: "title", label: t("gamesListToolbar.filter.title") },
    { value: "year", label: t("gamesListToolbar.filter.year") },
    { value: "stars", label: t("gamesListToolbar.filter.stars") },
    { value: "summary", label: t("gamesListToolbar.filter.summary") },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: "title", label: t("gamesListToolbar.sort.title") },
    { value: "year", label: t("gamesListToolbar.sort.year") },
    { value: "stars", label: t("gamesListToolbar.sort.stars") },
    { value: "releaseDate", label: t("gamesListToolbar.sort.releaseDate") },
  ];

  const handleFilterSelect = (field: FilterField) => {
    onFilterChange?.(field);
    setIsFilterOpen(false);
  };

  const handleSortSelect = (field: SortField) => {
    onSortChange?.(field);
    setIsSortOpen(false);
  };

  const currentFilterLabel = filterOptions.find((opt) => opt.value === currentFilter)?.label || "";
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
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  className={`games-list-toolbar-popup-item ${
                    currentFilter === option.value ? "active" : ""
                  }`}
                  onClick={() => handleFilterSelect(option.value)}
                >
                  {option.label}
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
                <span className="games-list-toolbar-value">{currentSortLabel}</span>
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
                        currentSort === option.value ? "active" : ""
                      }`}
                      onClick={() => handleSortSelect(option.value)}
                    >
                      {option.label}
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

