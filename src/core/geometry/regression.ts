/**
 * Linear Regression Geometry
 *
 * Ordinary least squares linear fit (y on x).
 */

import type { Point } from "./hull";
import { centroid } from "./hull";

/**
 * Fit an ordinary least squares regression line (y on x) across a 2D point cloud.
 * Returns the line segment endpoints spanning the minimum to maximum X values.
 * Returns null if points < 2, X variance is 0 (vertical line), or coordinates are non-finite.
 */
export function regressionLine(points: Point[]): [Point, Point] | null {
  if (points.length < 2) return null;
  const [mx, my] = centroid(points);
  let xx = 0;
  let xy = 0;
  let low = Infinity;
  let high = -Infinity;

  for (const [x, y] of points) {
    xx += (x - mx) ** 2;
    xy += (x - mx) * (y - my);
    low = Math.min(low, x);
    high = Math.max(high, x);
  }

  // Reject vertical lines or zero horizontal variance
  if (xx === 0) return null;

  const slope = xy / xx;
  const line: [Point, Point] = [
    [low, my + slope * (low - mx)],
    [high, my + slope * (high - mx)],
  ];

  return line.every((p) => p.every(Number.isFinite)) ? line : null;
}
