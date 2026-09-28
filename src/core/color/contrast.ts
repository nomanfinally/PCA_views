/**
 * Contrast & Lightness Analysis
 * 
 * Computes luminance, grid/axis contrast tones for chart backgrounds,
 * and high-contrast foreground text colors.
 */

import { shadeColor } from "./colorUtils";

export const chartBackgroundPresets = [
  { name: "White", color: "#ffffff" },
  { name: "Light gray", color: "#f1f2f3" },
  { name: "Ivory", color: "#faf5e9" },
  { name: "Ice blue", color: "#edf4fa" },
  { name: "Lavender", color: "#f3eff9" },
  { name: "Charcoal", color: "#252a31" },
] as const;

export interface ChartContrastTheme {
  grid: string;
  zero: string;
  line: string;
  isDark: boolean;
}

/**
 * Compute relative luminance and derive grid, zero-line, and axis stroke colors
 * tailored to any arbitrary chart background color.
 */
export function chartContrast(background: string): ChartContrastTheme {
  const hex = background.startsWith("#") ? background.slice(1) : background;
  const expanded = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const channels = [0, 2, 4].map(
    (i) => parseInt(expanded.slice(i, i + 2), 16) / 255,
  );
  
  // ITU-R BT.709 relative luminance formula
  const lightness =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const isDark = lightness < 0.5;

  return {
    grid: shadeColor(background, isDark ? 0.22 : -0.1),
    zero: shadeColor(background, isDark ? 0.4 : -0.22),
    line: isDark ? "#cdd3db" : "#444444",
    isDark,
  };
}

/**
 * Returns either '#ffffff' or '#000000' to guarantee accessible text contrast against a background.
 */
export function getReadableTextColor(background: string): string {
  const theme = chartContrast(background);
  return theme.isDark ? "#ffffff" : "#111827";
}
