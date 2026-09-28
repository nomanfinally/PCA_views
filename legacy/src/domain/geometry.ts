export type Point = [number, number];
const cross = (o: Point, a: Point, b: Point) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
/** Monotone chain. Duplicate and collinear coordinates never form a fake area. */
export function convexHull(input: Point[]): Point[] {
  const points = input
    .slice()
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  if (points.length < 3) return [];
  const lower: Point[] = [],
    upper: Point[] = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0)
      lower.pop();
    lower.push(p);
  }
  for (const p of points.slice().reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0)
      upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return hull.length >= 3 ? hull : [];
}
export function centroid(points: Point[]): Point {
  return points.reduce<Point>(
    (sum, p) => [sum[0] + p[0] / points.length, sum[1] + p[1] / points.length],
    [0, 0],
  );
}
/** Ordinary least squares y on x. Vertical/constant-x groups have no such fit. */
export function regressionLine(points: Point[]): [Point, Point] | null {
  if (points.length < 2) return null;
  const [mx, my] = centroid(points);
  let xx = 0,
    xy = 0,
    low = Infinity,
    high = -Infinity;
  for (const [x, y] of points) {
    xx += (x - mx) ** 2;
    xy += (x - mx) * (y - my);
    low = Math.min(low, x);
    high = Math.max(high, x);
  }
  if (xx === 0) return null;
  const slope = xy / xx;
  const line: [Point, Point] = [
    [low, my + slope * (low - mx)],
    [high, my + slope * (high - mx)],
  ];
  return line.every((p) => p.every(Number.isFinite)) ? line : null;
}
export function paddedRange(values: number[]): [number, number] {
  if (!values.length) return [-1, 1];
  let low = Infinity,
    high = -Infinity;
  for (const value of values) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  const pad = (high - low) * 0.08 || Math.max(Math.abs(low) * 0.08, 0.01);
  return [low - pad, high + pad];
}
