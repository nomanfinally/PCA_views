/**
 * Range Slider Primitive with Readout Badge
 */

import React from "react";

export interface SliderProps {
  id?: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  percent?: boolean;
  formatValue?: (val: number) => string;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = "",
  percent = false,
  formatValue,
  onChange,
  className = "",
}: SliderProps) {
  const effectiveMin = min ?? (percent ? 0 : 0);
  const effectiveMax = max ?? (percent ? 1 : 100);
  const effectiveStep = step ?? (percent ? 0.01 : 1);

  const displayValue = formatValue
    ? formatValue(value)
    : percent
      ? `${Math.round(value * 100)}%`
      : `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;

  const inputId =
    id ?? `slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className={`ui-slider-field ${className}`.trim()}>
      <div
        className="ui-slider-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <label
          htmlFor={inputId}
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            fontWeight: 500,
          }}
        >
          {label}
        </label>
        <span
          className="ui-slider-badge"
          style={{
            fontSize: "var(--font-size-xs)",
            fontFamily: "var(--font-family-mono)",
            backgroundColor: "var(--color-surface-100)",
            color: "var(--color-text-primary)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
          }}
        >
          {displayValue}
        </span>
      </div>
      <input
        id={inputId}
        aria-label={label}
        type="range"
        min={effectiveMin}
        max={effectiveMax}
        step={effectiveStep}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--color-surface-900)",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
