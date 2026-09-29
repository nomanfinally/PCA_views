/**
 * Organized Color Picker Primitive
 *
 * Implements the 10-column organized Google Docs / Sheets style color matrix:
 * - Row 1: 10 Grayscale shades (pure black to pure white)
 * - Row 2: 10 Core vibrant primary hues
 * - Rows 3-8: 6 rows of tints and shades (light pastel to deep shades)
 * - CUSTOM section with plus button to pick arbitrary colors, plus recent custom colors.
 */

import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus } from "lucide-react";

export const ORGANIZED_PALETTE_ROWS: string[][] = [
  // 1. Grayscale
  [
    "#000000",
    "#434343",
    "#666666",
    "#999999",
    "#b7b7b7",
    "#cccccc",
    "#d9d9d9",
    "#efefef",
    "#f3f3f3",
    "#ffffff",
  ],
  // 2. Base Vibrant Hues
  [
    "#980000",
    "#ff0000",
    "#ff9900",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#4a86e8",
    "#0000ff",
    "#9900ff",
    "#ff00ff",
  ],
  // 3. Very light tints
  [
    "#e6b8af",
    "#f4cccc",
    "#fce5cd",
    "#fff2cc",
    "#d9ead3",
    "#d0e0e3",
    "#c9daf8",
    "#cfe2f3",
    "#d9d2e9",
    "#ead1dc",
  ],
  // 4. Light tints
  [
    "#dd7e6b",
    "#ea9999",
    "#f9cb9c",
    "#ffe599",
    "#b6d7a8",
    "#a2c4c9",
    "#a4c2f4",
    "#9fc5e8",
    "#b4a7d6",
    "#d5a6bd",
  ],
  // 5. Medium-light tints
  [
    "#cc4125",
    "#e06666",
    "#f6b26b",
    "#ffd966",
    "#93c47d",
    "#76a5af",
    "#6d9eeb",
    "#6fa8dc",
    "#8e7cc3",
    "#c27ba0",
  ],
  // 6. Medium base shades
  [
    "#a61c00",
    "#cc0000",
    "#e69138",
    "#f1c232",
    "#6aa84f",
    "#45818e",
    "#3c78d8",
    "#3d85c6",
    "#674ea7",
    "#a64d79",
  ],
  // 7. Dark shades
  [
    "#85200c",
    "#990000",
    "#b45f06",
    "#bf9000",
    "#38761d",
    "#134f5c",
    "#1155cc",
    "#0b5394",
    "#351c75",
    "#741b47",
  ],
  // 8. Deepest shades
  [
    "#5b0f00",
    "#660000",
    "#783f04",
    "#7f6000",
    "#274e13",
    "#0c343d",
    "#1c4587",
    "#073763",
    "#20124d",
    "#4c1130",
  ],
];

const ALL_PALETTE_COLORS = new Set(
  ORGANIZED_PALETTE_ROWS.flat().map((c) => c.toLowerCase()),
);

function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith("#")) return false;
  const c = hex.slice(1);
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  return r * 0.299 + g * 0.587 + b * 0.114 > 195;
}

const CUSTOM_STORAGE_KEY = "pca_custom_dot_colors";

function getStoredCustomColors(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomColor(color: string): string[] {
  try {
    const existing = getStoredCustomColors();
    const updated = [
      color.toLowerCase(),
      ...existing.filter((c) => c.toLowerCase() !== color.toLowerCase()),
    ].slice(0, 9);
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [color];
  }
}

export interface ColorPickerProps {
  id?: string;
  label?: string;
  value?: string;
  color?: string;
  presets?: string[];
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({
  id,
  label,
  value,
  color,
  onChange,
  className = "",
}: ColorPickerProps) {
  const activeColor = value ?? color ?? "#000000";
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>(() =>
    getStoredCustomColors(),
  );

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Update floating popover position relative to trigger
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 252;
      const popoverHeight = 310;

      let top = rect.bottom + 6;
      if (top + popoverHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - popoverHeight - 6);
      }

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - popoverWidth - 8);
      }

      setPopoverPos({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", updatePosition, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, { capture: true });
    };
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectColor = (hex: string) => {
    onChange(hex);
    setIsOpen(false);
  };

  const handleCustomPicked = (hex: string) => {
    const updated = saveCustomColor(hex);
    setCustomColors(updated);
    onChange(hex);
    setIsOpen(false);
  };

  // Compile custom swatches list, ensuring active color is displayed if not in 80 palette
  const displayCustom = [...customColors];
  if (
    activeColor &&
    !ALL_PALETTE_COLORS.has(activeColor.toLowerCase()) &&
    !displayCustom.some((c) => c.toLowerCase() === activeColor.toLowerCase())
  ) {
    displayCustom.unshift(activeColor.toLowerCase());
  }

  return (
    <div
      className={`ui-color-picker color-control ${className}`.trim()}
      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
    >
      {label && (
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
      )}

      <div
        ref={triggerRef}
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <button
          type="button"
          className="color-picker-trigger-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 8px 4px 4px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
            cursor: "pointer",
            height: "29px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            transition: "all 0.15s ease",
          }}
        >
          <span
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: activeColor,
              border: isLightColor(activeColor)
                ? "1px solid #cbd5e1"
                : "1px solid rgba(0,0,0,0.15)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#334155",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {activeColor.toUpperCase()}
          </span>
          <ChevronDown
            size={12}
            color="#64748b"
            style={{
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.15s ease",
            }}
          />
        </button>

        {/* Hidden native input for programmatic label targeting and test fill compatibility */}
        <input
          id={inputId}
          aria-label={label}
          type="color"
          value={activeColor.startsWith("#") ? activeColor : "#000000"}
          onChange={(e) => {
            const hex = e.target.value;
            if (!ALL_PALETTE_COLORS.has(hex.toLowerCase())) {
              setCustomColors(saveCustomColor(hex));
            }
            onChange(hex);
          }}
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            border: 0,
          }}
        />
      </div>

      {/* Floating Popover Palette */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className="organized-color-palette-popover"
            role="dialog"
            aria-label={`${label ?? "Color"} palette`}
            style={{
              position: "fixed",
              top: popoverPos.top,
              left: popoverPos.left,
              zIndex: 99999,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              padding: "12px",
              width: "244px",
              userSelect: "none",
            }}
          >
            {/* Grayscale Row 1 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 18px)",
                gap: "4px",
                marginBottom: "6px",
              }}
            >
              {ORGANIZED_PALETTE_ROWS[0].map((hex) => {
                const isSelected =
                  hex.toLowerCase() === activeColor.toLowerCase();
                const light = isLightColor(hex);
                return (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Color ${hex}`}
                    title={hex}
                    onClick={() => handleSelectColor(hex)}
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: hex,
                      border: light
                        ? "1px solid #cbd5e1"
                        : "1px solid rgba(0,0,0,0.12)",
                      padding: 0,
                      cursor: "pointer",
                      outline: isSelected
                        ? `2px solid ${light ? "#0f172a" : "#0f172a"}`
                        : "none",
                      outlineOffset: isSelected ? "2px" : "0",
                      boxShadow: isSelected ? "0 0 0 1px #ffffff" : "none",
                      position: "relative",
                      transition: "transform 0.1s ease",
                    }}
                  />
                );
              })}
            </div>

            {/* Hues & Shades Rows 2-8 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 18px)",
                gap: "4px",
              }}
            >
              {ORGANIZED_PALETTE_ROWS.slice(1)
                .flat()
                .map((hex, i) => {
                  const isSelected =
                    hex.toLowerCase() === activeColor.toLowerCase();
                  const light = isLightColor(hex);
                  return (
                    <button
                      key={`${hex}-${i}`}
                      type="button"
                      aria-label={`Color ${hex}`}
                      title={hex}
                      onClick={() => handleSelectColor(hex)}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: hex,
                        border: light ? "1px solid rgba(0,0,0,0.12)" : "none",
                        padding: 0,
                        cursor: "pointer",
                        outline: isSelected ? "2px solid #0f172a" : "none",
                        outlineOffset: isSelected ? "2px" : "0",
                        boxShadow: isSelected ? "0 0 0 1px #ffffff" : "none",
                        position: "relative",
                        transition: "transform 0.1s ease",
                      }}
                    />
                  );
                })}
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                backgroundColor: "#f1f5f9",
                margin: "10px 0 8px 0",
              }}
            />

            {/* Custom Section */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.6px",
                  color: "#475569",
                  textTransform: "uppercase",
                }}
              >
                Custom
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                {/* Plus Button to open native color wheel */}
                <div
                  title="Add custom color"
                  style={{
                    position: "relative",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "1.5px solid #64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: "#f8fafc",
                    flexShrink: 0,
                  }}
                >
                  <Plus size={11} color="#475569" strokeWidth={2.5} />
                  <input
                    type="color"
                    aria-label="Pick custom color"
                    value={
                      activeColor.startsWith("#") ? activeColor : "#000000"
                    }
                    onChange={(e) => handleCustomPicked(e.target.value)}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                    }}
                  />
                </div>

                {/* Custom/Recent Swatches */}
                {displayCustom.map((hex) => {
                  const isSelected =
                    hex.toLowerCase() === activeColor.toLowerCase();
                  const light = isLightColor(hex);
                  return (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Custom color ${hex}`}
                      title={hex}
                      onClick={() => handleSelectColor(hex)}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: hex,
                        border: light
                          ? "1px solid #cbd5e1"
                          : "1px solid rgba(0,0,0,0.12)",
                        padding: 0,
                        cursor: "pointer",
                        outline: isSelected ? "2px solid #0f172a" : "none",
                        outlineOffset: isSelected ? "2px" : "0",
                        boxShadow: isSelected ? "0 0 0 1px #ffffff" : "none",
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
