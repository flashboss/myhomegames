import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./Tooltip.css";

type TooltipProps = {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: React.ReactNode;
};

export default function Tooltip({
  text,
  position = "bottom",
  delay = 1000,
  children,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setTooltipStyle({
          position: "fixed",
          top: `${rect.bottom + 8}px`,
          left: `${rect.left}px`,
          zIndex: 99999,
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={wrapperRef}
        className="tooltip-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <span className="tooltip tooltip-portal" style={tooltipStyle}>
            {text}
          </span>,
          document.body
        )}
    </>
  );
}

