import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import CoverSizeSlider from "./ui/CoverSizeSlider";
import ViewModeSelector from "./ui/ViewModeSelector";
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
    <div className="mhg-libraries-bar">
      <div className="mhg-libraries-bar-container" ref={containerRef}>
        {activeLibrary && (
          <>
            {isNarrow ? (
              <div className="mhg-libraries-combobox-container">
                {loading && libraries.length === 0 ? (
                  <div className="mhg-libraries-loading">{t("home.loadingLibraries")}</div>
                ) : (
                  <select
                    className="mhg-libraries-combobox"
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
                {error && <div className="mhg-libraries-error">{error}</div>}
              </div>
            ) : (
              <div className="mhg-libraries-container">
                {loading && libraries.length === 0 ? (
                  <div className="mhg-libraries-loading">{t("home.loadingLibraries")}</div>
                ) : (
                  libraries.map((s) => (
                    <button
                      key={s.key}
                      className={`mhg-library-button ${
                        activeLibrary?.key === s.key ? "mhg-library-active" : ""
                      }`}
                      onClick={() => onSelectLibrary(s)}
                    >
                      {s.title || t(`libraries.${s.key}`)}
                    </button>
                  ))
                )}
                {error && <div className="mhg-libraries-error">{error}</div>}
              </div>
            )}
          </>
        )}

        <div className="mhg-libraries-actions" ref={actionsRef}>
          {onCoverSizeChange && (
            <div
              className={`mhg-libraries-actions-slider-container ${
                viewMode === "grid" ? "" : "hidden"
              }`}
            >
              <CoverSizeSlider value={coverSize} onChange={onCoverSizeChange} />
            </div>
          )}
          {onViewModeChange && (
            <div className="mhg-libraries-actions-view-mode-container">
              <ViewModeSelector 
                value={viewMode} 
                onChange={onViewModeChange}
                disabled={activeLibrary ? activeLibrary.key !== "libreria" && activeLibrary.key !== "category" : false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
