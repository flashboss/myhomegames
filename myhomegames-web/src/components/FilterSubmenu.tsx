import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./FilterPopup.css";

type GameItem = {
  ratingKey: string;
  title: string;
  year?: number | null;
};

type FilterSubmenuProps = {
  type: "year" | "genre";
  isOpen: boolean;
  onClose: () => void;
  onCloseCompletely: () => void;
  selectedValue: number | string | null;
  onSelect: (value: number | string | null) => void;
  games?: GameItem[];
  availableGenres?: Array<{ id: string; title: string }>;
};

export default function FilterSubmenu({
  type,
  isOpen,
  onClose,
  onCloseCompletely,
  selectedValue,
  onSelect,
  games = [],
  availableGenres = [],
}: FilterSubmenuProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const submenuRef = useRef<HTMLDivElement>(null);

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
    if (!searchQuery) return availableYears;
    const query = searchQuery.toLowerCase();
    return availableYears.filter((year) => 
      year.toString().includes(query)
    );
  }, [availableYears, searchQuery]);

  // Filter genres based on search query
  const filteredGenres = useMemo(() => {
    if (!searchQuery) return availableGenres;
    const query = searchQuery.toLowerCase();
    return availableGenres.filter((genre) => {
      const genreLabel = t(`genre.${genre.title}`, genre.title).toLowerCase();
      return genreLabel.includes(query) || genre.title.toLowerCase().includes(query);
    });
  }, [availableGenres, searchQuery, t]);

  // Close submenu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        onCloseCompletely();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCloseCompletely]);

  // Close submenu on ESC key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseCompletely();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCloseCompletely]);

  // Reset search when submenu opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleBack = () => {
    onClose();
  };

  const handleSelect = (value: number | string | null) => {
    onSelect(value);
  };

  if (!isOpen) return null;

  if (type === "year") {
    return (
      <div className="filter-popup" ref={submenuRef}>
        <div className="filter-popup-header">
          <button
            className="filter-popup-back"
            onClick={handleBack}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="filter-popup-content">
          {filteredYears.map((year) => (
            <button
              key={year}
              className={`filter-popup-item ${
                selectedValue === year ? "active" : ""
              }`}
              onClick={() => handleSelect(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "genre") {
    return (
      <div className="filter-popup" ref={submenuRef}>
        <div className="filter-popup-header">
          <button
            className="filter-popup-back"
            onClick={handleBack}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="filter-popup-content filter-popup-scrollable">
          {filteredGenres.map((genre) => (
            <button
              key={genre.id}
              className={`filter-popup-item ${
                selectedValue === genre.id ? "active" : ""
              }`}
              onClick={() => handleSelect(genre.id)}
            >
              {t(`genre.${genre.title}`, genre.title)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

