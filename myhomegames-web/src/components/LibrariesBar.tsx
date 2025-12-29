import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import CoverSizeSlider from "./CoverSizeSlider";
import ViewModeSelector from "./ViewModeSelector";
import "./LibrariesBar.css";

type GameLibrarySection = {
  key: string;
  title?: string; // Optional, will be translated using key
  type: string;
};

export type ViewMode = "grid" | "detail" | "table";

type LibrariesBarProps = {
  libraries: GameLibrarySection[];
  activeLibrary: GameLibrarySection | null;
  onSelectLibrary: (library: GameLibrarySection) => void;
  loading: boolean;
  error: string | null;
  coverSize?: number;
  onCoverSizeChange?: (size: number) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
};

export default function LibrariesBar({
  libraries,
  activeLibrary,
  onSelectLibrary,
  loading,
  error,
  coverSize = 150,
  onCoverSizeChange,
  viewMode = "grid",
  onViewModeChange,
}: LibrariesBarProps) {
  const { t } = useTranslation();
  const [isNarrow, setIsNarrow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkWidth = () => {
      // Use window width as primary check
      const windowWidth = window.innerWidth;
      
      // Show combobox if window is narrower than 800px
      if (windowWidth < 800) {
        setIsNarrow(true);
        return;
      }

      // Otherwise, check if buttons would fit
      if (containerRef.current && actionsRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const actionsWidth = actionsRef.current.offsetWidth;
        // Calculate available width for library buttons
        const availableWidth = containerWidth - actionsWidth - 180; // 180px for margins and spacing
        // Estimate minimum width needed (approximately 110px per button)
        const minButtonsWidth = libraries.length * 110;
        // Show combobox if available width is less than minimum needed
        setIsNarrow(availableWidth < minButtonsWidth);
      }
    };

    // Initial check
    checkWidth();
    
    // Check again after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(checkWidth, 100);

    window.addEventListener("resize", checkWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkWidth);
    };
  }, [libraries, viewMode, coverSize]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLibrary = libraries.find((lib) => lib.key === e.target.value);
    if (selectedLibrary) {
      onSelectLibrary(selectedLibrary);
    }
  };

  return (
    <div className="plex-libraries-bar">
      <div className="plex-libraries-bar-container" ref={containerRef}>
        {isNarrow ? (
          <div className="plex-libraries-combobox-container">
            {loading && libraries.length === 0 ? (
              <div className="plex-libraries-loading">{t("home.loadingLibraries")}</div>
            ) : (
              <select
                className="plex-libraries-combobox"
                value={activeLibrary?.key || ""}
                onChange={handleSelectChange}
              >
                {libraries.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.title || t(`libraries.${s.key}`)}
                  </option>
                ))}
              </select>
            )}
            {error && <div className="plex-libraries-error">{error}</div>}
          </div>
        ) : (
          <div className="plex-libraries-container">
            {loading && libraries.length === 0 ? (
              <div className="plex-libraries-loading">{t("home.loadingLibraries")}</div>
            ) : (
              libraries.map((s) => (
                <button
                  key={s.key}
                  className={`plex-library-button ${
                    activeLibrary?.key === s.key ? "plex-library-active" : ""
                  }`}
                  onClick={() => onSelectLibrary(s)}
                >
                  {s.title || t(`libraries.${s.key}`)}
                </button>
              ))
            )}
            {error && <div className="plex-libraries-error">{error}</div>}
          </div>
        )}

        <div className="plex-libraries-actions" ref={actionsRef}>
          {onCoverSizeChange && (
            <div
              className={`plex-libraries-actions-slider-container ${
                viewMode === "grid" ? "" : "hidden"
              }`}
            >
              <CoverSizeSlider value={coverSize} onChange={onCoverSizeChange} />
            </div>
          )}
          {onViewModeChange && activeLibrary && (
            <div className="plex-libraries-actions-view-mode-container">
              <ViewModeSelector 
                value={viewMode} 
                onChange={onViewModeChange}
                disabled={activeLibrary.key !== "libreria"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
