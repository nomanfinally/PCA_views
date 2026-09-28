/**
 * Accessible High-Contrast Button Primitive
 * 
 * Guarantees accessible contrast across all hover, active, and focus states.
 */

import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "done"
  | "ghost"
  | "icon"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  active?: boolean;
  children?: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      icon,
      active = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const variantClass =
      variant === "primary"
        ? "btn-primary"
        : variant === "dark" || variant === "done"
          ? "btn-done"
          : variant === "danger"
            ? "btn-danger"
            : variant === "ghost" || variant === "icon"
              ? "btn-ghost"
              : "btn-secondary";

    const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "btn-md";
    const activeClass = active ? "is-active" : "";

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={`btn ${variantClass} ${sizeClass} ${activeClass} ${className}`.trim()}
        {...props}
      >
        {icon && <span className="btn-icon-wrapper" aria-hidden="true">{icon}</span>}
        {children && <span>{children}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
