/**
 * Range Slider Primitive with Readout Badge
 */

import React from "react";

export interface SliderProps {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
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
  step = 1,
  unit = "",
  formatValue,
  onChange,
  className = "",
}: SliderProps) {
  const displayValue = formatValue
    ? formatValue(value)
    : `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;

  return (
    <div className={`ui-slider-field ${className}`.trim()}>
      <div className="ui-slider-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <label htmlFor={id} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>
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
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
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
