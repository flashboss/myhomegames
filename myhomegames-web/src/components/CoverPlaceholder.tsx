import "./CoverPlaceholder.css";

type CoverPlaceholderProps = {
  title: string;
  width: number;
  height: number;
};

export default function CoverPlaceholder({ title, width, height }: CoverPlaceholderProps) {
  // Calculate font size based on width
  const fontSize = Math.max(10, Math.min(16, Math.floor(width / 8)));
  const padding = Math.max(4, Math.floor(width / 20));
  const lineClamp = Math.max(2, Math.floor(height / (fontSize * 1.5)));

  return (
    <div
      className="cover-placeholder"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`
      }}
    >
      <div
        className="cover-placeholder-text"
        style={{
          padding: `${padding}px`,
          fontSize: `${fontSize}px`,
          WebkitLineClamp: lineClamp
        }}
      >
        {title}
      </div>
    </div>
  );
}

