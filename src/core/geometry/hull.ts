/**
 * Convex Hull & Centroid Geometry
 *
 * Monotone chain algorithm producing strict convex hulls without fake areas.
 */

export type Point = [number, number];

/** 2D cross product of vector OA and OB: (A.x - O.x)*(B.y - O.y) - (A.y - O.y)*(B.x - O.x) */
const cross = (o: Point, a: Point, b: Point): number =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/**
 * Compute the 2D convex hull of a point set using Andrew's monotone chain algorithm.
 * Duplicates, collinear points, and interior points are safely excluded.
 * Returns an empty array if fewer than 3 unique non-collinear vertices exist.
 */
export function convexHull(input: Point[]): Point[] {
  const points = input
    .slice()
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);

  if (points.length < 3) return [];

  const lower: Point[] = [];
  const upper: Point[] = [];

  for (const p of points) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  for (const p of points.slice().reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Concatenate lower and upper hulls omitting the duplicate last vertex of each
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return hull.length >= 3 ? hull : [];
}

/**
 * Compute arithmetic centroid (mean point) of a set of 2D coordinates.
 */
export function centroid(points: Point[]): Point {
  if (!points.length) return [0, 0];
  return points.reduce<Point>(
    (sum, p) => [sum[0] + p[0] / points.length, sum[1] + p[1] / points.length],
    [0, 0],
  );
}
