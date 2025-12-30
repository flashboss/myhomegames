import "./CoverPlaceholder.css";

type CoverPlaceholderProps = {
  title: string;
  width: number;
  height: number;
  fontSize?: number; // Optional fixed font size
};

export default function CoverPlaceholder({
  title,
  width,
  height,
  fontSize,
}: CoverPlaceholderProps) {
  // Calculate font size based on width if not provided
  const calculatedFontSize = fontSize !== undefined 
    ? fontSize 
    : Math.max(10, Math.min(16, Math.floor(width / 8)));
  const padding = Math.max(4, Math.floor(width / 20));
  const lineClamp = Math.max(2, Math.floor(height / (calculatedFontSize * 1.5)));

  return (
    <div
      className="cover-placeholder"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
      }}
    >
      <div
        className="cover-placeholder-text"
        style={{
          padding: `${padding}px`,
          fontSize: `${calculatedFontSize}px`,
          WebkitLineClamp: lineClamp,
        }}
      >
        {title}
      </div>
    </div>
  );
}
