import { useState, useEffect } from "react";

type BackgroundManagerProps = {
  backgroundUrl: string;
  hasBackground: boolean;
  children: React.ReactNode;
  isBackgroundVisible?: boolean;
  onBackgroundVisibilityChange?: (visible: boolean) => void;
};

export default function BackgroundManager({
  backgroundUrl,
  hasBackground,
  children,
  isBackgroundVisible: controlledIsVisible,
  onBackgroundVisibilityChange,
}: BackgroundManagerProps) {
  const [internalIsVisible, setInternalIsVisible] = useState(hasBackground);
  const isBackgroundVisible = controlledIsVisible !== undefined ? controlledIsVisible : internalIsVisible;

  useEffect(() => {
    if (hasBackground && controlledIsVisible === undefined) {
      setInternalIsVisible(hasBackground);
    }
  }, [hasBackground, controlledIsVisible]);

  const handleVisibilityChange = (visible: boolean) => {
    if (onBackgroundVisibilityChange) {
      onBackgroundVisibilityChange(visible);
    } else {
      setInternalIsVisible(visible);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: hasBackground && isBackgroundVisible ? 'transparent' : '#1a1a1a',
          backgroundImage: hasBackground && isBackgroundVisible ? `url(${backgroundUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          zIndex: 0,
          cursor: hasBackground && isBackgroundVisible ? 'pointer' : 'default'
        }}
        onClick={() => {
          if (hasBackground && isBackgroundVisible) {
            handleVisibilityChange(false);
          }
        }}
      >
        {hasBackground && isBackgroundVisible && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(26, 26, 26, 0.85)',
                zIndex: 1
              }}
            />
            <img
              src={backgroundUrl}
              alt=""
              style={{ display: 'none' }}
            />
          </>
        )}
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </>
  );
}

