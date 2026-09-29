import { describe, expect, it } from "vitest";
import { convexHull, centroid } from "../core/geometry/hull";
import { regressionLine } from "../core/geometry/regression";
import { paddedRange, zoomRange, wheelPixels } from "../core/geometry/viewport";

describe("core/geometry/hull", () => {
  it("computes strict 2D convex hull via monotone chain", () => {
    const points: [number, number][] = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [1, 1], // interior
      [0, 0], // duplicate
    ];
    expect(convexHull(points)).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
  });

  it("returns empty array for collinear or fewer than 3 vertices", () => {
    expect(
      convexHull([
        [0, 0],
        [1, 1],
        [2, 2],
      ]),
    ).toEqual([]);
    expect(convexHull([[5, 5]])).toEqual([]);
    expect(convexHull([])).toEqual([]);
  });

  it("computes accurate arithmetic centroid", () => {
    expect(
      centroid([
        [0, 0],
        [3, 0],
        [0, 3],
      ]),
    ).toEqual([1, 1]);
    expect(centroid([])).toEqual([0, 0]);
  });
});

describe("core/geometry/regression", () => {
  it("fits y on x for standard slopes", () => {
    expect(
      regressionLine([
        [0, 1],
        [1, 3],
        [2, 5],
      ]),
    ).toEqual([
      [0, 1],
      [2, 5],
    ]);
  });

  it("fits horizontal line (constant y)", () => {
    expect(
      regressionLine([
        [0, 4],
        [1, 4],
      ]),
    ).toEqual([
      [0, 4],
      [1, 4],
    ]);
  });

  it("rejects constant x (vertical lines) and single point sets", () => {
    expect(
      regressionLine([
        [1, 1],
        [1, 2],
      ]),
    ).toBeNull();
    expect(regressionLine([[1, 2]])).toBeNull();
  });
});

describe("core/geometry/viewport", () => {
  it("pads coordinate range by 8%", () => {
    const [low, high] = paddedRange([0, 100]);
    expect(low).toBeCloseTo(-8);
    expect(high).toBeCloseTo(108);
  });

  it("anchors cursor coordinate during zoom", () => {
    const range = zoomRange([-10, 30], 0.5, 0.25);
    expect(range).toEqual([-5, 15]);
  });

  it("normalizes wheel delta modes", () => {
    expect(wheelPixels(2, 0, 800)).toBe(2);
    expect(wheelPixels(2, 1, 800)).toBe(32);
    expect(wheelPixels(2, 2, 800)).toBe(1600);
  });
});
