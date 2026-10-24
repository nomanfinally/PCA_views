/**
 * Academic Number Input Primitive
 *
 * Provides a clean, academic number input text box with up and down buttons
 * on the right, matching scientific desktop software standards.
 */

import React, { useEffect, useState } from "react";

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
  const effectiveUnit = percent ? unit || "%" : unit;

  // Percent controls display 25 for a stored fraction of 0.25.
  const multiplier = percent ? 100 : 1;
  const displayNum = Number((value * multiplier).toFixed(6));

  const [localText, setLocalText] = useState<string>(String(displayNum));

  useEffect(() => {
    setLocalText(String(displayNum));
  }, [displayNum]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);
    if (raw === "" || raw === "-") return;

    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      const val = parsed / multiplier;
      const clamped = Math.max(effectiveMin, Math.min(effectiveMax, val));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    if (localText === "" || !Number.isFinite(Number(localText))) {
      setLocalText(String(displayNum));
      return;
    }
    const val = Number(localText) / multiplier;
    const clamped = Math.max(effectiveMin, Math.min(effectiveMax, val));
    setLocalText(String(Number((clamped * multiplier).toFixed(6))));
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
          min={effectiveMin * multiplier}
          max={effectiveMax * multiplier}
          step={effectiveStep * multiplier}
          value={localText}
          onChange={handleChange}
          onBlur={handleBlur}
          className="ui-number-input"
        />
        {effectiveUnit && (
          <span className="ui-number-unit">{effectiveUnit}</span>
        )}
      </div>
    </div>
  );
}

// Backwards-compatible alias
export const Slider = NumberInput;
export type SliderProps = NumberInputProps;
