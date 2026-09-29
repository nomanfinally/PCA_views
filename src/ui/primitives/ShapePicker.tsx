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
      className={`marker-shape-picker ui-shape-picker ${className}`.trim()}
      aria-label={label}
    >
      {title && <legend>{title}</legend>}

      {allowInherit && (
        <label
          className="marker-shape-default"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "var(--font-size-sm)",
            marginBottom: "8px",
            cursor: "pointer",
          }}
        >
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

      <div className="marker-shape-grid">
        {symbols.map((symbol, index) => {
          const readableTitle = symbol.replaceAll("-", " ");
          const isSelected = value === symbol;

          return (
            <label
              key={symbol}
              title={readableTitle}
              className={`marker-shape-option ${isSelected ? "selected" : ""}`}
            >
              <input
                type="radio"
                name={name}
                aria-label={readableTitle}
                checked={isSelected}
                onChange={() => onChange(symbol)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    const nextIdx = (index + 1) % symbols.length;
                    onChange(symbols[nextIdx]);
                    const parent = e.currentTarget.closest("fieldset");
                    const radios = parent?.querySelectorAll<HTMLInputElement>(
                      'input[type="radio"]',
                    );
                    const targetRadio =
                      radios?.[allowInherit ? nextIdx + 1 : nextIdx];
                    targetRadio?.focus();
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const prevIdx =
                      (index - 1 + symbols.length) % symbols.length;
                    onChange(symbols[prevIdx]);
                    const parent = e.currentTarget.closest("fieldset");
                    const radios = parent?.querySelectorAll<HTMLInputElement>(
                      'input[type="radio"]',
                    );
                    const targetRadio =
                      radios?.[allowInherit ? prevIdx + 1 : prevIdx];
                    targetRadio?.focus();
                  }
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.001,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                  margin: 0,
                  zIndex: 1,
                }}
              />
              <VectorSwatch
                symbol={symbol}
                color="#6b7280"
                lineColor="#111827"
                size={14}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
