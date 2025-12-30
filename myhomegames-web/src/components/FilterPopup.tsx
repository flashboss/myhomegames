import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./FilterPopup.css";

type FilterField = "all" | "genre" | "year";

type GameItem = {
  ratingKey: string;
  title: string;
  year?: number | null;
};

type FilterPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: FilterField;
  selectedYear: number | null;
  selectedGenre: string | null;
  onFilterChange?: (field: FilterField) => void;
  onYearFilterChange?: (year: number | null) => void;
  onGenreFilterChange?: (genre: string | null) => void;
  games?: GameItem[];
  availableGenres?: Array<{ id: string; title: string }>;
};

export default function FilterPopup({
  isOpen,
  onClose,
  currentFilter,
  selectedYear,
  selectedGenre,
  onFilterChange,
  onYearFilterChange,
  onGenreFilterChange,
  games = [],
  availableGenres = [],
}: FilterPopupProps) {
  const { t } = useTranslation();
  const [isYearFilterOpen, setIsYearFilterOpen] = useState(false);
  const [isGenreFilterOpen, setIsGenreFilterOpen] = useState(false);
  const [yearSearchQuery, setYearSearchQuery] = useState("");
  const [genreSearchQuery, setGenreSearchQuery] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);
  const yearFilterRef = useRef<HTMLDivElement>(null);
  const genreFilterRef = useRef<HTMLDivElement>(null);

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

  // Filter years based on search query
  const filteredYears = useMemo(() => {
    if (!yearSearchQuery) return availableYears;
    const query = yearSearchQuery.toLowerCase();
    return availableYears.filter((year) => 
      year.toString().includes(query)
    );
  }, [availableYears, yearSearchQuery]);

  // Filter genres based on search query
  const filteredGenres = useMemo(() => {
    if (!genreSearchQuery) return availableGenres;
    const query = genreSearchQuery.toLowerCase();
    return availableGenres.filter((genre) => {
      const genreLabel = t(`genre.${genre.title}`, genre.title).toLowerCase();
      return genreLabel.includes(query) || genre.title.toLowerCase().includes(query);
    });
  }, [availableGenres, genreSearchQuery, t]);

  // Close popups when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        onClose();
      }
      if (yearFilterRef.current && !yearFilterRef.current.contains(event.target as Node)) {
        setIsYearFilterOpen(false);
      }
      if (genreFilterRef.current && !genreFilterRef.current.contains(event.target as Node)) {
        setIsGenreFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleFilterSelect = (field: FilterField) => {
    if (field === "year") {
      setIsYearFilterOpen(true);
      setYearSearchQuery("");
    } else if (field === "genre") {
      setIsGenreFilterOpen(true);
      setGenreSearchQuery("");
    } else {
      onFilterChange?.(field);
      if (onYearFilterChange) {
        onYearFilterChange(null);
      }
      if (onGenreFilterChange) {
        onGenreFilterChange(null);
      }
      onClose();
    }
  };

  const handleYearSelect = (year: number | null) => {
    if (year === null) {
      onFilterChange?.("all");
      onYearFilterChange?.(null);
    } else {
      onFilterChange?.("year");
      onYearFilterChange?.(year);
    }
    setIsYearFilterOpen(false);
    onClose();
  };

  const handleGenreSelect = (genreId: string | null) => {
    if (genreId === null) {
      onFilterChange?.("all");
      onGenreFilterChange?.(null);
    } else {
      onFilterChange?.("genre");
      onGenreFilterChange?.(genreId);
    }
    setIsGenreFilterOpen(false);
    onClose();
  };

  const handleBackToFilters = () => {
    setIsYearFilterOpen(false);
    setIsGenreFilterOpen(false);
    setYearSearchQuery("");
    setGenreSearchQuery("");
  };

  if (!isOpen && !isYearFilterOpen && !isGenreFilterOpen) return null;

  // Show year filter submenu
  if (isYearFilterOpen) {
    return (
      <div className="filter-popup" ref={yearFilterRef}>
        <div className="filter-popup-header">
          <button
            className="filter-popup-back"
            onClick={handleBackToFilters}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="filter-popup-header-title">
            {t("gamesListToolbar.filter.year")}
          </span>
        </div>
        <div className="filter-popup-search">
          <input
            type="text"
            className="filter-popup-search-input"
            placeholder={t("gamesListToolbar.filter.searchYear")}
            value={yearSearchQuery}
            onChange={(e) => setYearSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="filter-popup-content">
          {filteredYears.map((year) => (
            <button
              key={year}
              className={`filter-popup-item ${
                selectedYear === year ? "active" : ""
              }`}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show genre filter submenu
  if (isGenreFilterOpen) {
    return (
      <div className="filter-popup" ref={genreFilterRef}>
        <div className="filter-popup-header">
          <button
            className="filter-popup-back"
            onClick={handleBackToFilters}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="filter-popup-header-title">
            {t("gamesListToolbar.filter.genre")}
          </span>
        </div>
        <div className="filter-popup-search">
          <input
            type="text"
            className="filter-popup-search-input"
            placeholder={t("gamesListToolbar.filter.searchGenre")}
            value={genreSearchQuery}
            onChange={(e) => setGenreSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="filter-popup-content filter-popup-scrollable">
          {filteredGenres.map((genre) => (
            <button
              key={genre.id}
              className={`filter-popup-item ${
                selectedGenre === genre.id ? "active" : ""
              }`}
              onClick={() => handleGenreSelect(genre.id)}
            >
              {t(`genre.${genre.title}`, genre.title)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show main filter menu
  return (
    <div className="filter-popup" ref={filterRef}>
      <button
        className={`filter-popup-item ${
          currentFilter === "all" ? "selected" : ""
        }`}
        onClick={() => handleFilterSelect("all")}
      >
        <span>{t("gamesListToolbar.filter.all")}</span>
        {currentFilter === "all" && (
          <svg
            className="filter-popup-check"
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
      <div className="filter-popup-divider"></div>
      <button
        className={`filter-popup-item ${
          currentFilter === "genre" ? "selected" : ""
        }`}
        onClick={() => handleFilterSelect("genre")}
      >
        <span>{t("gamesListToolbar.filter.genre")}</span>
        {currentFilter === "genre" && (
          <svg
            className="filter-popup-check"
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
      <button
        className={`filter-popup-item ${
          currentFilter === "year" ? "selected" : ""
        }`}
        onClick={() => handleFilterSelect("year")}
      >
        <span>{t("gamesListToolbar.filter.year")}</span>
        {currentFilter === "year" && (
          <svg
            className="filter-popup-check"
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
  );
}

