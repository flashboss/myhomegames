import { useEffect } from "react";

export default function Favicon() {
  useEffect(() => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existingLinks.forEach((link) => link.remove());

    // Create SVG favicon
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="24" height="12" rx="2" fill="url(#faviconGradient)"/>
        <circle cx="9" cy="16" r="1.5" fill="#0d0d0d"/>
        <circle cx="9" cy="19" r="1.5" fill="#0d0d0d"/>
        <circle cx="23" cy="16" r="1.5" fill="#0d0d0d"/>
        <circle cx="23" cy="19" r="1.5" fill="#0d0d0d"/>
        <rect x="13" y="14.5" width="1.5" height="3" fill="#0d0d0d"/>
        <rect x="12.25" y="15.5" width="3" height="1.5" fill="#0d0d0d"/>
        <defs>
          <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E5A00D"/>
            <stop offset="100%" stop-color="#F5B041"/>
          </linearGradient>
        </defs>
      </svg>
    `;

    // Convert SVG to data URL
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // Create and add favicon link
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = url;
    document.head.appendChild(link);

    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
      link.remove();
    };
  }, []);

  return null;
}

