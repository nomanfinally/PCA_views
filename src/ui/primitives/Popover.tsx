/**
 * Viewport-Clamped Floating Popover Primitive
 */

import React, { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useKeyboardTrap } from "../hooks/useKeyboardTrap";

export interface Anchor {
  x: number;
  y: number;
}

export interface PopoverProps {
  isOpen?: boolean;
  anchor: Anchor | null;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  className?: string;
}

export function Popover({
  isOpen,
  anchor,
  title,
  onClose,
  children,
  width = 280,
  className = "",
}: PopoverProps) {
  const active = isOpen !== undefined ? isOpen : Boolean(anchor);

  const containerRef = useKeyboardTrap<HTMLDivElement>({
    active,
    onEscape: onClose,
  });

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!active || !anchor) return;

    // Viewport boundary clamping
    const padding = 12;
    const estHeight = 320;
    const maxLeft = typeof window !== "undefined" ? window.innerWidth - width - padding : 800;
    const maxTop = typeof window !== "undefined" ? window.innerHeight - estHeight - padding : 600;

    const left = Math.max(padding, Math.min(anchor.x + 8, maxLeft));
    const top = Math.max(padding, Math.min(anchor.y + 8, maxTop));

    setPosition({ left, top });
  }, [active, anchor, width]);

  useEffect(() => {
    if (!active) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay listener to avoid closing immediately on trigger click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [active, onClose, containerRef]);

  if (!active || !anchor) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={`ui-popover popover ${className}`.trim()}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${width}px`,
        backgroundColor: "var(--color-surface-0)",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-popover)",
        zIndex: "var(--z-popover)",
        padding: "16px",
        outline: "none",
      }}
    >
      {title && (
        <div className="popover-header">
          <strong>{title}</strong>
          <button
            className="icon-button"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
