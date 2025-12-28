import { useState, useRef, useEffect } from "react";
import "./ViewModeSelector.css";

type ViewMode = 'grid' | 'detail' | 'table';

type ViewModeSelectorProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconHover, setIconHover] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const modes: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'grid', label: 'Grid View', icon: '⊞' },
    { key: 'detail', label: 'Detail View', icon: '☰' },
    { key: 'table', label: 'Table View', icon: '☷' }
  ];

  const currentMode = modes.find(m => m.key === value) || modes[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
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
    <div ref={selectorRef} className="relative" style={{ paddingRight: '24px', marginLeft: '8px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={() => {
          setIconHover(true);
        }}
        onMouseLeave={() => {
          setIconHover(false);
        }}
      >
        <span style={{ 
          fontSize: '28px',
          opacity: iconHover ? 0.7 : 1,
          transition: 'opacity 0.2s ease',
          animation: iconHover ? 'pulse 1s ease-in-out infinite' : 'none'
        }}>{currentMode.icon}</span>
        <svg
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '24px',
            marginTop: '8px',
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            zIndex: 100,
            minWidth: '200px',
            overflow: 'hidden'
          }}
        >
          {modes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => {
                onChange(mode.key);
                setIsOpen(false);
              }}
              type="button"
              style={{
                width: '100%',
                padding: '10px 16px',
                background: value === mode.key ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: 'none',
                color: value === mode.key ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: value === mode.key ? 600 : 400,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (value !== mode.key) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== mode.key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

