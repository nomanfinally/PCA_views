/**
 * Accessible Marker Shape Picker Primitive
 */

import React, { useId } from "react";
import type { MarkerSymbol } from "../../core/models/settings";
import { solidSymbols } from "../../core/style/symbols";
import { VectorSwatch } from "./VectorSwatch";

export interface ShapePickerProps {
  label: string;
  title?: string;
  symbols?: readonly MarkerSymbol[];
  value?: MarkerSymbol;
  onChange: (symbol: MarkerSymbol | undefined) => void;
  allowInherit?: boolean;
  className?: string;
}

export function ShapePicker({
  label,
  title = "Marker shape",
  symbols = solidSymbols,
  value,
  onChange,
  allowInherit = false,
  className = "",
}: ShapePickerProps) {
  const name = useId();

  return (
    <fieldset
      className={`ui-shape-picker ${className}`.trim()}
      aria-label={label}
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "8px 12px",
        margin: 0,
      }}
    >
      {title && (
        <legend style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", padding: "0 4px" }}>
          {title}
        </legend>
      )}

      {allowInherit && (
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--font-size-sm)", marginBottom: "8px", cursor: "pointer" }}>
          <input
            type="radio"
            name={name}
            aria-label="Population default"
            checked={value === undefined}
            onChange={() => onChange(undefined)}
            style={{ accentColor: "var(--color-surface-900)" }}
          />
          Population default
        </label>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(28px, 1fr))",
          gap: "4px",
        }}
      >
        {symbols.map((symbol) => {
          const readableTitle = symbol.replaceAll("-", " ");
          const isSelected = value === symbol;

          return (
            <label
              key={symbol}
              title={readableTitle}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                border: isSelected ? "2px solid var(--color-surface-900)" : "1px solid var(--color-border)",
                backgroundColor: isSelected ? "var(--color-surface-100)" : "var(--color-surface-0)",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={name}
                aria-label={readableTitle}
                checked={isSelected}
                onChange={() => onChange(symbol)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              <VectorSwatch symbol={symbol} color="#6b7280" lineColor="#111827" size={14} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
