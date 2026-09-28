/**
 * Viewport-Clamped Floating Popover Primitive
 */

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { useKeyboardTrap } from "../hooks/useKeyboardTrap";

export interface PopoverProps {
  isOpen: boolean;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  className?: string;
}

export function Popover({
  isOpen,
  anchor,
  onClose,
  children,
  width = 280,
  className = "",
}: PopoverProps) {
  const containerRef = useKeyboardTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: onClose,
  });

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !anchor) return;

    // Viewport boundary clamping
    const padding = 12;
    const estHeight = 320;
    const maxLeft = window.innerWidth - width - padding;
    const maxTop = window.innerHeight - estHeight - padding;

    const left = Math.max(padding, Math.min(anchor.x + 8, maxLeft));
    const top = Math.max(padding, Math.min(anchor.y + 8, maxTop));

    setPosition({ left, top });
  }, [isOpen, anchor, width]);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose, containerRef]);

  if (!isOpen || !anchor) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={`ui-popover ${className}`.trim()}
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
      {children}
    </div>
  );
}
