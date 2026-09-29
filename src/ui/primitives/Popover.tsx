/**
 * Viewport-Clamped Floating Popover Primitive
 */

import React, {
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
  width,
  className = "",
}: PopoverProps) {
  const active = isOpen !== undefined ? isOpen : Boolean(anchor);

  const containerRef = useKeyboardTrap<HTMLDivElement>({
    active,
    onEscape: onClose,
  });

  const [position, setPosition] = useState({
    x: anchor?.x ?? 0,
    y: anchor?.y ?? 0,
  });

  useLayoutEffect(() => {
    if (!active || !anchor) return;
    const element = containerRef.current;
    if (!element) return;

    const reposition = () => {
      const box = element.getBoundingClientRect();
      const x = Math.max(
        8,
        Math.min(anchor.x, window.innerWidth - box.width - 8),
      );
      const y = Math.max(
        8,
        Math.min(anchor.y, window.innerHeight - box.height - 8),
      );
      setPosition((previous) =>
        previous.x === x && previous.y === y ? previous : { x, y },
      );
    };

    reposition();
    const observer = new ResizeObserver(reposition);
    observer.observe(element);
    window.addEventListener("resize", reposition);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reposition);
    };
  }, [active, anchor]);

  useEffect(() => {
    if (!active) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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

  const content = (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className={`popover ${className}`.trim()}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        ...(width ? { width: `${width}px` } : {}),
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

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
}
