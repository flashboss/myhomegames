import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FilterSubmenu from "./FilterSubmenu";
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
  const [openSubmenu, setOpenSubmenu] = useState<"year" | "genre" | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const lastOpenSubmenuRef = useRef<"year" | "genre" | null>(null);
  const wentBackRef = useRef(false); // Track if user went back to main menu
  const isFirstOpenRef = useRef(true); // Track if this is the first time opening after page load

  // When popup opens, always show main menu on first open (after page refresh)
  // After that, preserve submenu state during the session
  useEffect(() => {
    if (isOpen) {
      if (isFirstOpenRef.current) {
        // First time opening after page load - always show main menu
        setOpenSubmenu(null);
        isFirstOpenRef.current = false;
        if (currentFilter === "year") {
          lastOpenSubmenuRef.current = "year";
        } else if (currentFilter === "genre") {
          lastOpenSubmenuRef.current = "genre";
        } else {
          lastOpenSubmenuRef.current = null;
        }
        wentBackRef.current = false;
      } else {
        // Subsequent opens during the same session
        // If user went back to main menu, always show main menu
        if (wentBackRef.current) {
          setOpenSubmenu(null);
          // Keep track of filter but don't show submenu
          if (currentFilter === "year") {
            lastOpenSubmenuRef.current = "year";
          } else if (currentFilter === "genre") {
            lastOpenSubmenuRef.current = "genre";
          }
        } else if (currentFilter === "year") {
          setOpenSubmenu("year");
          lastOpenSubmenuRef.current = "year";
        } else if (currentFilter === "genre") {
          setOpenSubmenu("genre");
          lastOpenSubmenuRef.current = "genre";
        } else if (lastOpenSubmenuRef.current) {
          // Restore the last open submenu even if no filter is active
          setOpenSubmenu(lastOpenSubmenuRef.current);
        } else {
          setOpenSubmenu(null);
        }
      }
    }
    // Don't reset openSubmenu when popup closes - it will persist
  }, [isOpen, currentFilter]);


  // Close popup when clicking outside
  useEffect(() => {
    if (!isOpen && !openSubmenu) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Check which popup is currently visible
      let clickedOutside = false;
      
      if (isOpen && filterRef.current) {
        clickedOutside = !filterRef.current.contains(target);
      }
      
      // If clicked outside the main menu, close everything
      if (clickedOutside && !openSubmenu) {
        // Don't reset wentBackRef here - it should persist when closing after going back
        // This way when reopening, we'll still show main menu
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, openSubmenu, onClose]);

  // Close popup on ESC key
  useEffect(() => {
    if (!isOpen && !openSubmenu) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (openSubmenu) {
          setOpenSubmenu(null);
          wentBackRef.current = true; // Mark that user went back to main menu
        } else {
          // Don't reset wentBackRef here - it should persist when closing after going back
          // This way when reopening, we'll still show main menu
          onClose();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, openSubmenu, onClose]);

  const handleFilterSelect = (field: FilterField) => {
    if (field === "year") {
      setOpenSubmenu("year");
      lastOpenSubmenuRef.current = "year";
      wentBackRef.current = false; // Reset went back flag when selecting a filter
    } else if (field === "genre") {
      setOpenSubmenu("genre");
      lastOpenSubmenuRef.current = "genre";
      wentBackRef.current = false; // Reset went back flag when selecting a filter
    } else {
      onFilterChange?.(field);
      if (onYearFilterChange) {
        onYearFilterChange(null);
      }
      if (onGenreFilterChange) {
        onGenreFilterChange(null);
      }
      setOpenSubmenu(null);
      lastOpenSubmenuRef.current = null;
      onClose();
    }
  };

  const handleYearSelect = (value: number | string | null) => {
    const year = typeof value === "number" ? value : null;
    if (year === null) {
      onFilterChange?.("all");
      onYearFilterChange?.(null);
      setOpenSubmenu(null);
      lastOpenSubmenuRef.current = null;
      onClose();
    } else {
      onFilterChange?.("year");
      onYearFilterChange?.(year);
      // Keep the year submenu state, just close the popup
      lastOpenSubmenuRef.current = "year";
      onClose();
    }
  };

  const handleGenreSelect = (value: number | string | null) => {
    const genreId = typeof value === "string" ? value : null;
    if (genreId === null) {
      onFilterChange?.("all");
      onGenreFilterChange?.(null);
      setOpenSubmenu(null);
      lastOpenSubmenuRef.current = null;
      onClose();
    } else {
      onFilterChange?.("genre");
      onGenreFilterChange?.(genreId);
      // Keep the genre submenu state, just close the popup
      lastOpenSubmenuRef.current = "genre";
      onClose();
    }
  };

  const handleSubmenuClose = () => {
    setOpenSubmenu(null);
    lastOpenSubmenuRef.current = null; // Reset state when going back to main menu
    wentBackRef.current = true; // Mark that user went back to main menu
    // Don't close the main popup, just go back to main menu
  };

  const handleSubmenuCloseCompletely = () => {
    setOpenSubmenu(null);
    // Don't reset wentBackRef here - it should persist when closing after going back
    // This way when reopening, we'll still show main menu
    onClose();
    // Close the popup completely
  };

  // Show submenu if open and popup is open
  if (isOpen && openSubmenu === "year") {
    return (
      <FilterSubmenu
        type="year"
        isOpen={true}
        onClose={handleSubmenuClose}
        onCloseCompletely={handleSubmenuCloseCompletely}
        selectedValue={selectedYear}
        onSelect={handleYearSelect}
        games={games}
      />
    );
  }

  if (isOpen && openSubmenu === "genre") {
    return (
      <FilterSubmenu
        type="genre"
        isOpen={true}
        onClose={handleSubmenuClose}
        onCloseCompletely={handleSubmenuCloseCompletely}
        selectedValue={selectedGenre}
        onSelect={handleGenreSelect}
        games={games}
        availableGenres={availableGenres}
      />
    );
  }

  // Only show main menu if popup is open and no submenu is active
  if (!isOpen || openSubmenu) return null;

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

