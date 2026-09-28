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
export function wheelPixels(delta: number, mode: number, height: number): number {
  return delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
}
