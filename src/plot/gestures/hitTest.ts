/**
 * Spatial Hit-Testing Engine
 * 
 * High-performance 2D spatial search for point selection and hover detection.
 */

import type { PlotPoint } from "../spec/plotSpec";

export interface HitResult {
  point: PlotPoint;
  distance: number;
}

/**
 * Finds the closest point to a given coordinate within a specified tolerance radius.
 * Coordinates can be in data space or screen space.
 */
export function findClosestPoint(
  x: number,
  y: number,
  points: PlotPoint[],
  tolerance = 15,
  distanceFn?: (p: PlotPoint, x: number, y: number) => number,
): HitResult | null {
  let closest: PlotPoint | null = null;
  let minDistance = Infinity;

  const getDistance =
    distanceFn ??
    ((p: PlotPoint, targetX: number, targetY: number) =>
      Math.hypot(p.x - targetX, p.y - targetY));

  for (const point of points) {
    const dist = getDistance(point, x, y);
    if (dist < minDistance && dist <= tolerance) {
      minDistance = dist;
      closest = point;
    }
  }

  return closest ? { point: closest, distance: minDistance } : null;
}

/**
 * Filters all points located within a rectangular selection box [minX, minY, maxX, maxY].
 */
export function findPointsInRect(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  points: PlotPoint[],
): PlotPoint[] {
  const left = Math.min(minX, maxX);
  const right = Math.max(minX, maxX);
  const bottom = Math.min(minY, maxY);
  const top = Math.max(minY, maxY);

  return points.filter(
    (p) => p.x >= left && p.x <= right && p.y >= bottom && p.y <= top,
  );
}
