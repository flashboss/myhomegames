
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

import { useState, useRef, useEffect } from 'react';

type GamesListTableProps = {
  games: GameItem[];
  onGameClick: (game: GameItem) => void;
};

type SortField = 'title' | 'summary' | 'year' | 'stars';
type SortDirection = 'asc' | 'desc';

type ColumnVisibility = {
  title: boolean;
  summary: boolean;
  releaseDate: boolean;
  year: boolean;
  stars: boolean;
};

export default function GamesListTable({ games, onGameClick }: GamesListTableProps) {
  // Load saved sort state from localStorage
  const loadSortState = (): { field: SortField | null; direction: SortDirection } => {
    const savedField = localStorage.getItem('tableSortField');
    const savedDirection = localStorage.getItem('tableSortDirection');
    return {
      field: savedField ? (savedField as SortField) : null,
      direction: savedDirection ? (savedDirection as SortDirection) : 'asc'
    };
  };

  const savedSortState = loadSortState();
  const [sortField, setSortField] = useState<SortField | null>(savedSortState.field);
  const [sortDirection, setSortDirection] = useState<SortDirection>(savedSortState.direction);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    const saved = localStorage.getItem('tableColumnVisibility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { title: true, summary: true, releaseDate: true, year: false, stars: false };
      }
    }
    return { title: true, summary: true, releaseDate: true };
  });
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

  // Save sort state to localStorage when it changes
  useEffect(() => {
    if (sortField) {
      localStorage.setItem('tableSortField', sortField);
      localStorage.setItem('tableSortDirection', sortDirection);
    } else {
      localStorage.removeItem('tableSortField');
      localStorage.removeItem('tableSortDirection');
    }
  }, [sortField, sortDirection]);

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tableColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedGames = [...games].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: string | number | null = null;
    let bValue: string | number | null = null;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'summary':
        aValue = (a.summary || '').toLowerCase();
        bValue = (b.summary || '').toLowerCase();
        break;
      case 'year':
        aValue = a.year ?? 0;
        bValue = b.year ?? 0;
        break;
      case 'stars':
        aValue = a.stars ?? 0;
        bValue = b.stars ?? 0;
        break;
    }

    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (games.length === 0) {
    return <div className="text-gray-400 text-center">No games found</div>;
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px', height: 'calc(100vh - 114px - 22px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1a1a1a' }}>
          <tr>
            <th style={{ 
              padding: '12px 16px', 
              textAlign: 'left', 
              width: '40px',
              borderRight: '2px solid #1a1a1a',
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: showColumnMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {showColumnMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      zIndex: 100,
                      minWidth: '180px',
                      padding: '8px 0'
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.5)',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '4px'
                      }}
                    >
                      Colonne
                    </div>
                    {[
                      { key: 'title' as keyof ColumnVisibility, label: 'Title' },
                      { key: 'summary' as keyof ColumnVisibility, label: 'Summary' },
                      { key: 'releaseDate' as keyof ColumnVisibility, label: 'Release Date' },
                      { key: 'year' as keyof ColumnVisibility, label: 'Year' },
                      { key: 'stars' as keyof ColumnVisibility, label: 'Stars' }
                    ].map((col) => (
                      <label
                        key={col.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={columnVisibility[col.key]}
                          onChange={() => toggleColumn(col.key)}
                          style={{
                            marginRight: '8px',
                            cursor: 'pointer'
                          }}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </th>
            {columnVisibility.title && (
              <th 
                onClick={() => handleSort('title')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'color 0.2s ease',
                  position: 'relative',
                  borderRight: '2px solid #1a1a1a',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                <span>Title</span>
                <span style={{ position: 'absolute', right: '16px', bottom: '12px' }}>{getSortIcon('title')}</span>
              </th>
            )}
            {columnVisibility.summary && (
              <th 
                onClick={() => handleSort('summary')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'color 0.2s ease',
                  position: 'relative',
                  borderRight: '2px solid #1a1a1a',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                <span>Summary</span>
                <span style={{ position: 'absolute', right: '16px', bottom: '12px' }}>{getSortIcon('summary')}</span>
              </th>
            )}
            {columnVisibility.releaseDate && (
              <th 
                onClick={() => handleSort('year')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'color 0.2s ease',
                  position: 'relative',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                <span>Release Date</span>
                <span style={{ position: 'absolute', right: '16px', bottom: '12px' }}>{getSortIcon('year')}</span>
              </th>
            )}
            {columnVisibility.stars && (
              <th 
                onClick={() => handleSort('stars')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'color 0.2s ease',
                  position: 'relative',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRight: columnVisibility.year ? '2px solid #1a1a1a' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                <span>Stars</span>
                <span style={{ position: 'absolute', right: '16px', bottom: '12px' }}>{getSortIcon('stars')}</span>
              </th>
            )}
            {columnVisibility.year && (
              <th 
                onClick={() => handleSort('year')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'color 0.2s ease',
                  position: 'relative',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                <span>Year</span>
                <span style={{ position: 'absolute', right: '16px', bottom: '12px' }}>{getSortIcon('year')}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedGames.map((it, index) => {
            const isEven = index % 2 === 0;
            const rowBackgroundColor = isEven ? 'transparent' : 'rgba(255, 255, 255, 0.02)';

            return (
              <tr
                key={it.ratingKey}
                className="cursor-pointer"
                style={{
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => onGameClick(it)}
              >
              <td style={{ 
                padding: '12px 16px',
                width: '40px'
              }}></td>
              {columnVisibility.title && (
                <td style={{ 
                  padding: '12px 16px',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  color: '#f8f8f8',
                  backgroundColor: rowBackgroundColor,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = rowBackgroundColor;
                }}
                >
                  {it.title}
                </td>
              )}
              {columnVisibility.summary && (
                <td style={{ 
                  padding: '12px 16px',
                  fontSize: '0.9rem', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: rowBackgroundColor,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = rowBackgroundColor;
                }}
                >
                  {it.summary || '-'}
                </td>
              )}
              {columnVisibility.releaseDate && (
                <td style={{ 
                  padding: '12px 16px',
                  fontSize: '0.85rem', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: rowBackgroundColor,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = rowBackgroundColor;
                }}
                >
                  {(it.year !== null && it.year !== undefined) 
                    ? (it.day !== null && it.day !== undefined && it.month !== null && it.month !== undefined
                        ? `${it.day}/${it.month}/${it.year}`
                        : it.year.toString())
                    : '-'}
                </td>
              )}
              {columnVisibility.stars && (
                <td style={{ 
                  padding: '12px 16px',
                  fontSize: '0.85rem', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: rowBackgroundColor,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = rowBackgroundColor;
                }}
                >
                  {it.stars !== null && it.stars !== undefined ? it.stars.toString() : '-'}
                </td>
              )}
              {columnVisibility.year && (
                <td style={{ 
                  padding: '12px 16px',
                  fontSize: '0.85rem', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: rowBackgroundColor,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = rowBackgroundColor;
                }}
                >
                  {it.year !== null && it.year !== undefined ? it.year.toString() : '-'}
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

