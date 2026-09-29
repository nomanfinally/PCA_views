/**
 * Accessible Modal Dialog Primitive with Backdrop
 */

import React, { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useKeyboardTrap } from "../hooks/useKeyboardTrap";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number | string;
  width?: number | string;
  className?: string;
  closeLabel?: string;
  noPadding?: boolean;
}

export function Modal({
  isOpen,
  title,
  onClose,
  children,
  footer,
  maxWidth,
  width,
  className = "",
  closeLabel = "Close dialog",
  noPadding = false,
}: ModalProps) {
  const titleId = useId();
  const containerRef = useKeyboardTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: onClose,
  });

  if (!isOpen) return null;

  const resolvedMaxWidth =
    maxWidth !== undefined
      ? typeof maxWidth === "number"
        ? `${maxWidth}px`
        : maxWidth
      : width !== undefined
        ? typeof width === "number"
          ? `${Math.max(width, 540)}px`
          : width
        : "min(94vw, 540px)";

  return (
    <div
      className="ui-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(17, 24, 39, 0.45)",
        backdropFilter: "blur(2px)",
        zIndex: "var(--z-modal)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`ui-modal ${className}`.trim()}
        style={{
          width:
            width !== undefined
              ? typeof width === "number"
                ? `${width}px`
                : width
              : "100%",
          maxWidth: resolvedMaxWidth,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--color-surface-0)",
          color: "var(--color-text-primary)",
          borderRadius: "3px",
          boxShadow: "var(--shadow-modal)",
          border: "1px solid var(--color-border)",
          outline: "none",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2
            id={titleId}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="icon-button modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          className="ui-modal-body"
          style={{
            padding: noPadding ? 0 : "20px",
            overflowY: noPadding ? "hidden" : "auto",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
              padding: "14px 20px",
              borderTop: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-50)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
