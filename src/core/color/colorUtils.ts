/**
 * Color Utilities
 *
 * Pure functions for hex/rgba conversions, luminance calculations, and color shading.
 */

/**
 * Blend a hex color toward white (amount > 0) or black (amount < 0).
 * Supports both 3-digit (#fff) and 6-digit (#ffffff) hex strings.
 */
export function shadeColor(color: string, amount: number): string {
  if (!color || !color.startsWith("#")) return color;
  const hex = color.slice(1);
  const expanded = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  if (expanded.length !== 6) return color;
  const channels = [0, 2, 4].map((i) => parseInt(expanded.slice(i, i + 2), 16));
  return (
    "#" +
    channels
      .map((v) =>
        Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/**
 * Parse a hex or rgba color into numeric RGBA components.
 */
export function parseRgba(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const expanded =
      hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const r = parseInt(expanded.slice(0, 2), 16) || 0;
    const g = parseInt(expanded.slice(2, 4), 16) || 0;
    const b = parseInt(expanded.slice(4, 6), 16) || 0;
    return { r, g, b, a: 1 };
  }
  const match = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  );
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Format a hex or rgba string into a standardized rgba(r, g, b, a) CSS string.
 */
export function toRgbaString(color: string, alpha = 1): string {
  const { r, g, b, a } = parseRgba(color);
  const effectiveAlpha = Math.max(0, Math.min(1, a * alpha));
  if (effectiveAlpha === 1 && color.startsWith("#")) {
    return color;
  }
  return `rgba(${r},${g},${b},${effectiveAlpha})`;
}
