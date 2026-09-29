/**
 * Responsive Breakpoints
 *
 * Standardized across CSS media queries and React responsive hooks.
 */

export const BREAKPOINTS = {
  mobileMax: 640,
  tabletMin: 641,
  tabletMax: 1024,
  desktopMin: 1025,
} as const;

export type BreakpointDevice = "mobile" | "tablet" | "desktop";
