/**
 * Color Picker Primitive with Quick Swatch Presets
 */

import React from "react";

export interface ColorPickerProps {
  id?: string;
  label?: string;
  value: string;
  presets?: string[];
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({
  id,
  label,
  value,
  presets = [
    "#1f77b4",
    "#d62728",
    "#2ca02c",
    "#9467bd",
    "#ff7f0e",
    "#17becf",
    "#e377c2",
    "#000000",
    "#ffffff",
  ],
  onChange,
  className = "",
}: ColorPickerProps) {
  return (
    <div className={`ui-color-picker ${className}`.trim()} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label
          style={{
            position: "relative",
            width: "30px",
            height: "30px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border-strong)",
            backgroundColor: value,
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <input
            id={id}
            type="color"
            value={value.startsWith("#") ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: "absolute",
              opacity: 0,
              width: 0,
              height: 0,
            }}
          />
        </label>
        <span style={{ fontSize: "var(--font-size-xs)", fontFamily: "var(--font-family-mono)", color: "var(--color-text-secondary)" }}>
          {value.toUpperCase()}
        </span>
      </div>
      {presets.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "var(--radius-xs)",
                backgroundColor: preset,
                border: preset.toLowerCase() === value.toLowerCase() ? "2px solid var(--color-surface-900)" : "1px solid rgba(0,0,0,0.15)",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label={`Select ${preset}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
