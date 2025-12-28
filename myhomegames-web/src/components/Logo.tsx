export default function Logo() {
  return (
    <svg
      width="90"
      height="50"
      viewBox="0 0 90 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Controller shape */}
      <rect
        x="4"
        y="15"
        width="82"
        height="20"
        rx="5"
        fill="url(#logoGradient)"
      />
      {/* Left buttons */}
      <circle cx="14" cy="25" r="3" fill="#0d0d0d" />
      <circle cx="14" cy="32" r="3" fill="#0d0d0d" />
      {/* Right buttons */}
      <circle cx="76" cy="25" r="3" fill="#0d0d0d" />
      <circle cx="76" cy="32" r="3" fill="#0d0d0d" />
      {/* D-pad */}
      <rect x="26" y="22" width="3" height="6" fill="#0d0d0d" />
      <rect x="24.5" y="24" width="6" height="3" fill="#0d0d0d" />
      {/* Additional decorative elements */}
      <rect
        x="38"
        y="22"
        width="14"
        height="6"
        rx="2"
        fill="#0d0d0d"
        opacity="0.3"
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5A00D" />
          <stop offset="100%" stopColor="#F5B041" />
        </linearGradient>
      </defs>
    </svg>
  );
}
