import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, API_TOKEN } from "../../config";
import StarRating from "../common/StarRating";
import EditGameModal from "./EditGameModal";
import DropdownMenu from "../common/DropdownMenu";
import Tooltip from "../common/Tooltip";
import { useEditGame } from "../common/actions";
import { useScrollRestoration } from "../../hooks/useScrollRestoration";
import type { GameItem } from "../../types";
import { buildApiUrl } from "../../utils/api";
import "./GamesListTable.css";

type GamesListTableProps = {
  games: GameItem[];
  onGameClick: (game: GameItem) => void;
  onPlay?: (game: GameItem) => void;
  onGameUpdate?: (updatedGame: GameItem) => void;
  onGameDelete?: (deletedGame: GameItem) => void;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  sortField?: "title" | "year" | "stars" | "releaseDate" | "criticRating" | "userRating";
  sortAscending?: boolean;
  onSortChange?: (field: "title" | "year" | "stars" | "releaseDate" | "criticRating" | "userRating") => void;
  onSortDirectionChange?: (ascending: boolean) => void;
};

type ColumnVisibility = {
  title: boolean;
  releaseDate: boolean;
  year: boolean;
  stars: boolean;
  criticRating: boolean;
};

export default function GamesListTable({
  games,
  onGameClick,
  onPlay,
  onGameUpdate,
  onGameDelete,
  itemRefs,
  scrollContainerRef,
  sortField,
  sortAscending = true,
  onSortChange,
  onSortDirectionChange,
}: GamesListTableProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const actualScrollRef = scrollContainerRef || internalScrollRef;
  
  // Use useScrollRestoration directly here, so it's executed only when the component is mounted
  useScrollRestoration(actualScrollRef, "table");
  
  const [localGames, setLocalGames] = useState<GameItem[]>(games);
  const editGame = useEditGame();
  
  // Sync localGames when games prop changes
  useEffect(() => {
    setLocalGames(games);
  }, [games]);

  const handleRatingChange = async (gameId: string, newStars: number) => {
    if (!API_TOKEN) return;
    
    try {
      const url = buildApiUrl(API_BASE, `/games/${gameId}`);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': API_TOKEN,
        },
        body: JSON.stringify({ stars: newStars }),
      });

      if (response.ok) {
        const updatedGames = localGames.map(game => 
          game.ratingKey === gameId 
            ? { ...game, stars: newStars }
            : game
        );
        setLocalGames(updatedGames);
      } else {
        console.error('Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const handleGameUpdate = (updatedGame: GameItem) => {
    const updatedGames = localGames.map(game =>
      game.ratingKey === updatedGame.ratingKey ? updatedGame : game
    );
    setLocalGames(updatedGames);
    if (onGameUpdate) {
      onGameUpdate(updatedGame);
    }
    editGame.closeEditModal();
  };
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
            criticRating: false,
          };
        }
      }
      return { title: true, releaseDate: true, criticRating: false };
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

  const handleSort = (field: "title" | "year" | "stars" | "releaseDate" | "criticRating") => {
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

  // Helper function to format rating value (0-10 float)
  const formatRating = (value: number | null | undefined): string | null => {
    if (value === null || value === undefined || isNaN(value)) {
      return null;
    }
    const numValue = Number(value);
    if (numValue < 0 || numValue > 10) {
      return null;
    }
    // Format to show decimal only if present (e.g., 8.5 instead of 8.50, but 8 instead of 8.0)
    return numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(1);
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
      {
        key: "criticRating" as keyof ColumnVisibility,
        label: t("table.criticRating"),
      },
    ],
    [t, i18n.language]
  );

  if (games.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  const getSortIcon = (field: "title" | "year" | "stars" | "releaseDate" | "criticRating") => {
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
        ref={actualScrollRef as React.RefObject<HTMLDivElement>}
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
                  : columnVisibility.criticRating
                  ? "criticRating"
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
                        className={`has-border-right ${firstVisibleColumn === "releaseDate" ? "first-visible-cell" : ""}`}
                      >
                        <span>{t("table.releaseDate")}</span>
                        <span className="sort-indicator">{getSortIcon("releaseDate")}</span>
                      </th>
                    )}
                    {columnVisibility.stars && (
                      <th
                        onClick={() => handleSort("stars")}
                        className={`has-border-right ${firstVisibleColumn === "stars" ? "first-visible-cell" : ""}`}
                      >
                        <span>{t("table.stars")}</span>
                        <span className="sort-indicator">{getSortIcon("stars")}</span>
                      </th>
                    )}
                    {columnVisibility.year && (
                      <th
                        onClick={() => handleSort("year")}
                        className={`has-border-right ${firstVisibleColumn === "year" ? "first-visible-cell" : ""}`}
                      >
                        <span>{t("table.year")}</span>
                        <span className="sort-indicator">{getSortIcon("year")}</span>
                      </th>
                    )}
                    {columnVisibility.criticRating && (
                      <th
                        onClick={() => handleSort("criticRating")}
                        className={`has-border-right ${firstVisibleColumn === "criticRating" ? "first-visible-cell" : ""}`}
                      >
                        <span>{t("table.criticRating")}</span>
                        <span className="sort-indicator">{getSortIcon("criticRating")}</span>
                      </th>
                    )}
                    <th className="games-table-edit-header"></th>
                  </>
                );
              })()}
            </tr>
          </thead>
                  <tbody>
                    {localGames.map((it, index) => {
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
                : columnVisibility.criticRating
                ? "criticRating"
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
                      <Tooltip text={it.title} delay={1000}>
                        <span 
                          className={firstVisibleColumn === "title" ? "first-cell-text" : "title-cell-text"}
                          onClick={() => onGameClick(it)}
                        >
                          {it.title}
                        </span>
                      </Tooltip>
                    </td>
                  )}
                  {columnVisibility.releaseDate && (
                    <td
                      className={`date-cell ${rowClass} ${
                        columnVisibility.stars || columnVisibility.year || columnVisibility.criticRating
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
                      <div className={firstVisibleColumn === "stars" ? "first-cell-text" : ""} style={{ display: 'flex', alignItems: 'center' }}>
                        <StarRating 
                          rating={it.stars ? (it.stars / 10) * 5 : 0} 
                          starSize={14} 
                          gap={3} 
                          color="rgba(255, 255, 255, 0.4)" 
                          noStroke={true}
                          readOnly={!API_BASE || !API_TOKEN}
                          onRatingChange={API_BASE && API_TOKEN ? (newStars) => handleRatingChange(it.ratingKey, newStars) : undefined}
                        />
                      </div>
                    </td>
                  )}
                  {columnVisibility.year && (
                    <td className={`year-cell ${rowClass} has-border-right ${firstVisibleColumn === "year" ? "first-visible-cell" : ""}`}>
                      {firstVisibleColumn === "year" && onPlay && <PlayIcon />}
                      <span className={firstVisibleColumn === "year" ? "first-cell-text" : ""}>
                        {it.year !== null && it.year !== undefined
                          ? it.year.toString()
                          : "-"}
                      </span>
                    </td>
                  )}
                  {columnVisibility.criticRating && (
                    <td className={`critic-rating-cell ${rowClass} has-border-right ${firstVisibleColumn === "criticRating" ? "first-visible-cell" : ""}`}>
                      {firstVisibleColumn === "criticRating" && onPlay && <PlayIcon />}
                      <div className={firstVisibleColumn === "criticRating" ? "first-cell-text" : ""} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {(() => {
                          const criticRating = formatRating(it.criticratings);
                          const userRating = formatRating(it.userratings);
                          
                          if (criticRating === null && userRating === null) {
                            return <span>-</span>;
                          }
                          
                          return (
                            <>
                              {criticRating !== null && (
                                <Tooltip text={t("gameDetail.criticRating")}>
                                  <div 
                                    className="text-white" 
                                    style={{ 
                                      opacity: 0.8,
                                      fontFamily: 'var(--font-body-2-font-family)',
                                      fontSize: 'var(--font-body-2-font-size)',
                                      lineHeight: 'var(--font-body-2-line-height)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="#FFD700"
                                      stroke="#FFA500"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      style={{ flexShrink: 0 }}
                                    >
                                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                    </svg>
                                    {criticRating}
                                  </div>
                                </Tooltip>
                              )}
                              {userRating !== null && (
                                <Tooltip text={t("gameDetail.userRating")}>
                                  <div 
                                    className="text-white" 
                                    style={{ 
                                      opacity: 0.8,
                                      fontFamily: 'var(--font-body-2-font-family)',
                                      fontSize: 'var(--font-body-2-font-size)',
                                      lineHeight: 'var(--font-body-2-line-height)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="#4CAF50"
                                      stroke="#2E7D32"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      style={{ flexShrink: 0 }}
                                    >
                                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                      <circle cx="9" cy="7" r="4" />
                                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    {userRating}
                                  </div>
                                </Tooltip>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  )}
                  <td className={`games-table-edit-cell ${rowClass}`}>
                    <div className="games-table-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editGame.openEditModal(it);
                        }}
                        className="games-table-edit-button"
                        aria-label="Edit"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <DropdownMenu
                        gameId={it.ratingKey}
                        gameTitle={it.title}
                        onGameDelete={onGameDelete ? (gameId: string) => {
                          const deletedGame = it.ratingKey === gameId ? it : null;
                          if (deletedGame) {
                            onGameDelete(deletedGame);
                          }
                        } : undefined}
                        onGameUpdate={onGameUpdate ? (updatedGame) => {
                          if (updatedGame.ratingKey === it.ratingKey) {
                            handleGameUpdate(updatedGame);
                          }
                        } : undefined}
                        className="games-table-dropdown-menu"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editGame.selectedGame && (
        <EditGameModal
          isOpen={editGame.isEditModalOpen}
          onClose={editGame.closeEditModal}
          game={editGame.selectedGame}
          onGameUpdate={handleGameUpdate}
        />
      )}
    </div>
  );
}
