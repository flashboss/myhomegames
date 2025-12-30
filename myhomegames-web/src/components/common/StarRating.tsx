type StarRatingProps = {
  rating: number; // Rating from 0 to 5
  starSize?: number;
  gap?: number;
  color?: string; // Color for filled stars, defaults to white
  noStroke?: boolean; // Remove stroke/border from stars
};

export default function StarRating({ rating, starSize = 16, gap = 4, color = "#ffffff", noStroke = false }: StarRatingProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${gap}px` }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = rating >= star - 0.5 && rating < star;
        const starId = `star-${star}-${rating}`;
        
        return (
          <div key={star} style={{ position: 'relative', width: `${starSize}px`, height: `${starSize}px` }}>
            <svg
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {filled && (
              <svg
                width={starSize}
                height={starSize}
                viewBox="0 0 24 24"
                fill={color}
                stroke={noStroke ? "none" : color}
                strokeWidth={noStroke ? "0" : "1.5"}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            {halfFilled && (
              <svg
                width={starSize}
                height={starSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke={noStroke ? "none" : color}
                strokeWidth={noStroke ? "0" : "1.5"}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id={starId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="50%" stopColor={color} />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={`url(#${starId})`}
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

