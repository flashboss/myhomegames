type CoverPlaceholderProps = {
  title: string;
  width: number;
  height: number;
};

export default function CoverPlaceholder({ title, width, height }: CoverPlaceholderProps) {
  // Calculate font size based on width
  const fontSize = Math.max(10, Math.min(16, Math.floor(width / 8)));
  const padding = Math.max(4, Math.floor(width / 20));

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-[#2a2a2a]"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          padding: `${padding}px`,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          lineHeight: 1.3,
          wordBreak: 'break-word',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: Math.max(2, Math.floor(height / (fontSize * 1.5))),
          WebkitBoxOrient: 'vertical',
          width: '100%',
          maxHeight: '100%'
        }}
      >
        {title}
      </div>
    </div>
  );
}

