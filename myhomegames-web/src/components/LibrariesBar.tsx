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

  return (
    <div className="plex-libraries-bar">
      <div className="plex-libraries-bar-container">
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

        <div className="plex-libraries-actions">
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
