/** Zoom around a fractional cursor position without losing finite coordinates. */
export function zoomRange(
  range: number[],
  factor: number,
  fraction = 0.5,
): [number, number] {
  const [low, high] = range;
  const span = high - low;
  const anchor = low + span * fraction;
  const next = span * factor;
  // Stop before floating-point precision collapses the axis, or spans overflow.
  if (
    !Number.isFinite(next) ||
    next <= Math.max(Math.abs(anchor), 1) * 1e-12 ||
    next > 1e12
  )
    return [low, high];
  return [anchor - next * fraction, anchor + next * (1 - fraction)];
}

export function wheelPixels(delta: number, mode: number, height: number) {
  return delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
}
