/**
 * Academic Number Input Primitive
 *
 * Provides a clean, academic number input text box with up and down buttons
 * on the right, matching scientific desktop software standards.
 */

import React, { useState, useEffect } from "react";

export interface NumberInputProps {
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

export function NumberInput({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = "",
  percent = false,
  onChange,
  className = "",
}: NumberInputProps) {
  const effectiveMin = min ?? 0;
  const effectiveMax = max ?? (percent ? 1 : 100);
  const effectiveStep = step ?? (percent ? 0.05 : 1);
  const effectiveUnit = percent ? (unit || "%") : unit;

  // Display raw value (e.g. 0.25 for opacity or 16 for size)
  const displayNum =
    percent && effectiveMax === 1
      ? Number.isInteger(value)
        ? value
        : Number(value.toFixed(2))
      : value;

  const [localText, setLocalText] = useState<string>(String(displayNum));

  useEffect(() => {
    setLocalText(String(displayNum));
  }, [displayNum]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);
    if (raw === "" || raw === "-") return;

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      // If percent with max 1 and user entered an integer > 1 (e.g. 25 instead of 0.25), interpret as percentage
      let val = parsed;
      if (percent && effectiveMax === 1 && parsed > 1) {
        val = parsed / 100;
      }
      const clamped = Math.max(effectiveMin, Math.min(effectiveMax, val));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    if (localText === "" || isNaN(parseFloat(localText))) {
      setLocalText(String(displayNum));
      return;
    }
    const parsed = parseFloat(localText);
    let val = parsed;
    if (percent && effectiveMax === 1 && parsed > 1) {
      val = parsed / 100;
    }
    const clamped = Math.max(effectiveMin, Math.min(effectiveMax, val));
    setLocalText(String(clamped));
    onChange(clamped);
  };

  const inputId =
    id ?? `num-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className={`control-row ui-number-row ${className}`.trim()}>
      <label htmlFor={inputId} className="ui-number-label">
        {label}
      </label>
      <div className="ui-number-input-wrap">
        <input
          id={inputId}
          aria-label={label}
          type="number"
          min={effectiveMin}
          max={effectiveMax}
          step={effectiveStep}
          value={localText}
          onChange={handleChange}
          onBlur={handleBlur}
          className="ui-number-input"
        />
        {effectiveUnit && <span className="ui-number-unit">{effectiveUnit}</span>}
      </div>
    </div>
  );
}

// Backwards-compatible alias
export const Slider = NumberInput;
export type SliderProps = NumberInputProps;
