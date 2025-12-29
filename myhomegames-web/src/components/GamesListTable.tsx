import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./GamesListTable.css";

type GameItem = {
  ratingKey: string;
  title: string;
  summary?: string;
  cover?: string;
  day?: number | null;
  month?: number | null;
  year?: number | null;
  stars?: number | null;
};

type GamesListTableProps = {
  games: GameItem[];
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  sortField?: "title" | "year" | "stars" | "releaseDate";
  sortAscending?: boolean;
  onSortChange?: (field: "title" | "year" | "stars" | "releaseDate") => void;
  onSortDirectionChange?: (ascending: boolean) => void;
};

type ColumnVisibility = {
  title: boolean;
  releaseDate: boolean;
  year: boolean;
  stars: boolean;
};

export default function GamesListTable({
  games,
  onGameClick,
  onPlay,
  itemRefs,
  scrollContainerRef,
  sortField,
  sortAscending = true,
  onSortChange,
  onSortDirectionChange,
}: GamesListTableProps) {
  const { t, i18n } = useTranslation();
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    () => {
      const saved = localStorage.getItem("tableColumnVisibility");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {
            title: true,
            releaseDate: true,
            year: false,
            stars: false,
          };
        }
      }
      return { title: true, releaseDate: true };
    }
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Save column visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "tableColumnVisibility",
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  const handleSort = (field: "title" | "year" | "stars" | "releaseDate") => {
    if (!onSortChange || !onSortDirectionChange) return;
    
    // Map releaseDate to year for sorting
    const sortFieldMapped = field === "releaseDate" ? "releaseDate" : field;
    
    if (sortField === sortFieldMapped) {
      // If clicking the same field, toggle direction
      onSortDirectionChange(!sortAscending);
    } else {
      // If selecting a new field, set to ascending by default
      onSortChange(sortFieldMapped);
      onSortDirectionChange(true);
    }
  };

  // Column definitions with translations
  const columnDefinitions = useMemo(
    () => [
      {
        key: "title" as keyof ColumnVisibility,
        label: t("table.title"),
      },
      {
        key: "releaseDate" as keyof ColumnVisibility,
        label: t("table.releaseDate"),
      },
      {
        key: "year" as keyof ColumnVisibility,
        label: t("table.year"),
      },
      {
        key: "stars" as keyof ColumnVisibility,
        label: t("table.stars"),
      },
    ],
    [t, i18n.language]
  );

  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  const getSortIcon = (field: "title" | "year" | "stars" | "releaseDate") => {
    // Map releaseDate to year for comparison
    const fieldMapped = field === "releaseDate" ? "releaseDate" : field;
    if (sortField !== fieldMapped) return "";
    return sortAscending ? "↑" : "↓";
  };

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  return (
    <div className="games-table-container">
      <div
        className="games-table-scroll"
        ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
      >
        <table className="games-table">
          <thead>
            <tr>
              <th className="games-table th column-menu">
                <div className="games-table-column-menu-wrapper" ref={menuRef}>
                  <button
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className="games-table-column-menu-button"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      className={`games-table-column-menu-arrow ${
                        showColumnMenu ? "open" : ""
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                  {showColumnMenu && (
                    <div className="games-table-column-menu-popup">
                      {columnDefinitions.map((col) => (
                        <button
                          key={col.key}
                          className={`games-table-column-menu-item ${
                            columnVisibility[col.key] ? "selected" : ""
                          }`}
                          onClick={() => toggleColumn(col.key)}
                        >
                          <span>{col.label}</span>
                          {columnVisibility[col.key] && (
                            <svg
                              className="games-table-column-menu-check"
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
                      ))}
                    </div>
                  )}
                </div>
              </th>
              {(() => {
                // Determine the first visible column for header alignment
                const firstVisibleColumn = columnVisibility.title
                  ? "title"
                  : columnVisibility.releaseDate
                  ? "releaseDate"
                  : columnVisibility.stars
                  ? "stars"
                  : columnVisibility.year
                  ? "year"
                  : null;

                return (
                  <>
                    {columnVisibility.title && (
                      <th
                        onClick={() => handleSort("title")}
                        className={`has-border-right ${firstVisibleColumn === "title" ? "first-visible-cell" : ""}`}
                      >
                        <span>{t("table.title")}</span>
                        <span className="sort-indicator">{getSortIcon("title")}</span>
                      </th>
                    )}
                    {columnVisibility.releaseDate && (
                      <th
                        onClick={() => handleSort("releaseDate")}
                        className={`${
                          columnVisibility.stars || columnVisibility.year
                            ? "has-border-right"
                            : ""
                        } ${firstVisibleColumn === "releaseDate" ? "first-visible-cell" : ""}`}
                      >
                        <span>{t("table.releaseDate")}</span>
                        <span className="sort-indicator">{getSortIcon("releaseDate")}</span>
                      </th>
                    )}
                    {columnVisibility.stars && (
                      <th
                        onClick={() => handleSort("stars")}
                        className={`${columnVisibility.year ? "has-border-right" : ""} ${firstVisibleColumn === "stars" ? "first-visible-cell" : ""}`}
                      >
                        <span>{t("table.stars")}</span>
                        <span className="sort-indicator">{getSortIcon("stars")}</span>
                      </th>
                    )}
                    {columnVisibility.year && (
                      <th
                        onClick={() => handleSort("year")}
                        className={firstVisibleColumn === "year" ? "first-visible-cell" : ""}
                      >
                        <span>{t("table.year")}</span>
                        <span className="sort-indicator">{getSortIcon("year")}</span>
                      </th>
                    )}
                  </>
                );
              })()}
            </tr>
          </thead>
                  <tbody>
                    {games.map((it, index) => {
              const isEven = index % 2 === 0;
              const rowClass = isEven ? "even-row" : "odd-row";
              
              // Determine the first visible column
              const firstVisibleColumn = columnVisibility.title
                ? "title"
                : columnVisibility.releaseDate
                ? "releaseDate"
                : columnVisibility.stars
                ? "stars"
                : columnVisibility.year
                ? "year"
                : null;

              const PlayIcon = () => {
                const handlePlayClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (onPlay) {
                    onPlay(it);
                  }
                };

                return (
                  <button 
                    className="first-cell-play-button" 
                    aria-label="Play game"
                    onClick={handlePlayClick}
                  >
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 5v14l11-7z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                );
              };

              return (
                <tr
                  key={it.ratingKey}
                  ref={(el) => {
                    if (el && itemRefs?.current) {
                      itemRefs.current.set(it.ratingKey, el);
                    }
                  }}
                >
                  <td className="column-menu-cell"></td>
                  {columnVisibility.title && (
                    <td className={`title-cell ${rowClass} ${firstVisibleColumn === "title" ? "first-visible-cell" : ""}`}>
                      {firstVisibleColumn === "title" && onPlay && <PlayIcon />}
                      <span 
                        className={firstVisibleColumn === "title" ? "first-cell-text" : "title-cell-text"}
                        onClick={() => onGameClick(it)}
                      >
                        {it.title}
                      </span>
                    </td>
                  )}
                  {columnVisibility.releaseDate && (
                    <td
                      className={`date-cell ${rowClass} ${
                        columnVisibility.stars || columnVisibility.year
                          ? "has-border-right"
                          : ""
                      } ${firstVisibleColumn === "releaseDate" ? "first-visible-cell" : ""}`}
                    >
                      {firstVisibleColumn === "releaseDate" && onPlay && <PlayIcon />}
                      <span className={firstVisibleColumn === "releaseDate" ? "first-cell-text" : ""}>
                        {it.year !== null && it.year !== undefined
                          ? it.day !== null &&
                            it.day !== undefined &&
                            it.month !== null &&
                            it.month !== undefined
                            ? `${it.day}/${it.month}/${it.year}`
                            : it.year.toString()
                          : "-"}
                      </span>
                    </td>
                  )}
                  {columnVisibility.stars && (
                    <td className={`stars-cell ${rowClass} ${firstVisibleColumn === "stars" ? "first-visible-cell" : ""}`}>
                      {firstVisibleColumn === "stars" && onPlay && <PlayIcon />}
                      <span className={firstVisibleColumn === "stars" ? "first-cell-text" : ""}>
                        {it.stars !== null && it.stars !== undefined
                          ? it.stars.toString()
                          : "-"}
                      </span>
                    </td>
                  )}
                  {columnVisibility.year && (
                    <td className={`year-cell ${rowClass} ${firstVisibleColumn === "year" ? "first-visible-cell" : ""}`}>
                      {firstVisibleColumn === "year" && onPlay && <PlayIcon />}
                      <span className={firstVisibleColumn === "year" ? "first-cell-text" : ""}>
                        {it.year !== null && it.year !== undefined
                          ? it.year.toString()
                          : "-"}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
