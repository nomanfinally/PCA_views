/**
 * Viewport Coordinate Math
 *
 * Functions for range padding, fractional zoom calculation, and wheel delta normalization.
 */

/**
 * Calculate an axis domain range with 8% padding to prevent edge clipping.
 */
export function paddedRange(values: number[]): [number, number] {
  if (!values.length) return [-1, 1];
  let low = Infinity;
  let high = -Infinity;
  for (const value of values) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  const span = high - low;
  const pad = span * 0.08 || Math.max(Math.abs(low) * 0.08, 0.01);
  return [low - pad, high + pad];
}

/**
 * Zoom an axis range around a fractional cursor position [0..1] without loss of finite coordinates.
 * Guards against numerical collapse below precision limits and extreme overflow.
 */
export function zoomRange(
  range: number[],
  factor: number,
  fraction = 0.5,
): [number, number] {
  const [low, high] = range;
  const span = high - low;
  const anchor = low + span * fraction;
  const next = span * factor;

  // Stop before floating-point precision collapses the axis, or spans overflow
  if (
    !Number.isFinite(next) ||
    next <= Math.max(Math.abs(anchor), 1) * 1e-12 ||
    next > 1e12
  ) {
    return [low, high];
  }

  return [anchor - next * fraction, anchor + next * (1 - fraction)];
}

/**
 * Normalize DOM WheelEvent delta values across delta modes (0: pixel, 1: line, 2: page).
 */
export function wheelPixels(
  delta: number,
  mode: number,
  height: number,
): number {
  return delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
}

export interface ClampedCentroidResult {
  clamped: [number, number];
  isOffscreen: boolean;
  edgeSide: "left" | "right" | "top" | "bottom" | null;
}

/**
 * Clamps an arithmetic centroid to the visible plot edge along the line of sight
 * from the viewport center towards the centroid.
 * Keeps group labels visible at the chart perimeter to indicate directionality
 * when the population centroid falls outside the visible zoom window.
 */
export function clampCentroidToViewport(
  centroid: [number, number],
  xRange: [number, number],
  yRange: [number, number],
  marginRatio = 0.94,
): ClampedCentroidResult {
  const x0 = Math.min(xRange[0], xRange[1]);
  const x1 = Math.max(xRange[0], xRange[1]);
  const y0 = Math.min(yRange[0], yRange[1]);
  const y1 = Math.max(yRange[0], yRange[1]);

  const [cx, cy] = centroid;

  // Check if centroid is already inside the visible bounds
  if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
    return {
      clamped: [cx, cy],
      isOffscreen: false,
      edgeSide: null,
    };
  }

  const centerX = (x0 + x1) / 2;
  const centerY = (y0 + y1) / 2;
  const dx = cx - centerX;
  const dy = cy - centerY;

  const halfWidth = (x1 - x0) / 2;
  const halfHeight = (y1 - y0) / 2;

  const limitX = halfWidth * marginRatio;
  const limitY = halfHeight * marginRatio;

  if (dx === 0 && dy === 0) {
    return {
      clamped: [centerX, centerY],
      isOffscreen: true,
      edgeSide: null,
    };
  }

  const scaleX = dx !== 0 ? Math.abs(limitX / dx) : Infinity;
  const scaleY = dy !== 0 ? Math.abs(limitY / dy) : Infinity;
  const t = Math.min(scaleX, scaleY);

  const clampedX = centerX + dx * t;
  const clampedY = centerY + dy * t;

  let edgeSide: "left" | "right" | "top" | "bottom";
  if (t === scaleX) {
    edgeSide = dx > 0 ? "right" : "left";
  } else {
    edgeSide = dy > 0 ? "top" : "bottom";
  }

  return {
    clamped: [clampedX, clampedY],
    isOffscreen: true,
    edgeSide,
  };
}
