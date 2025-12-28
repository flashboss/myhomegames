import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./ViewModeSelector.css";

type ViewMode = "grid" | "detail" | "table";

type ViewModeSelectorProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewModeSelector({
  value,
  onChange,
}: ViewModeSelectorProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [iconHover, setIconHover] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Recreate modes array when language changes
  const modes: { key: ViewMode; label: string; icon: string }[] = useMemo(
    () => [
      { key: "grid", label: t("viewMode.grid"), icon: "⊞" },
      { key: "detail", label: t("viewMode.detail"), icon: "☰" },
      { key: "table", label: t("viewMode.table"), icon: "☷" },
    ],
    [t, i18n.language]
  );

  const currentMode = modes.find((m) => m.key === value) || modes[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div ref={selectorRef} className="view-mode-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="view-mode-button"
        onMouseEnter={() => {
          setIconHover(true);
        }}
        onMouseLeave={() => {
          setIconHover(false);
        }}
      >
        <span className={`view-mode-icon ${iconHover ? "hover" : ""}`}>
          {currentMode.icon}
        </span>
        <svg
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          className={`view-mode-arrow ${isOpen ? "open" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="view-mode-dropdown">
          {modes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => {
                onChange(mode.key);
                setIsOpen(false);
              }}
              type="button"
              className={`view-mode-option ${
                value === mode.key ? "active" : ""
              }`}
            >
              <span className="view-mode-option-icon">{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
