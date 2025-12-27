type GameLibrarySection = {
  key: string;
  title: string;
  type: string;
};

import CoverSizeSlider from "./CoverSizeSlider";

type LibrariesBarProps = {
  libraries: GameLibrarySection[];
  activeLibrary: GameLibrarySection | null;
  onSelectLibrary: (library: GameLibrarySection) => void;
  loading: boolean;
  error: string | null;
  coverSize?: number;
  onCoverSizeChange?: (size: number) => void;
};

export default function LibrariesBar({ libraries, activeLibrary, onSelectLibrary, loading, error, coverSize = 150, onCoverSizeChange }: LibrariesBarProps) {
  return (
    <div className="plex-libraries-bar">
      <div className="plex-libraries-container">
        {loading && libraries.length === 0 ? (
          <div className="plex-libraries-loading">Loading libraries…</div>
        ) : (
          libraries.map((s) => (
            <button
              key={s.key}
              className={`plex-library-button ${activeLibrary?.key === s.key ? 'plex-library-active' : ''}`}
              onClick={() => onSelectLibrary(s)}
            >
              {s.title}
            </button>
          ))
        )}
        {error && <div className="plex-libraries-error">{error}</div>}
      </div>
      {onCoverSizeChange && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <CoverSizeSlider value={coverSize} onChange={onCoverSizeChange} />
        </div>
      )}
    </div>
  );
}

