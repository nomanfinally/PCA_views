import { describe, expect, it } from "vitest";
import { wheelPixels, zoomRange } from "../domain/viewport";

describe("cursor anchored zoom", () => {
  it("keeps the coordinate under the pointer fixed", () => {
    const range = zoomRange([-10, 30], 0.5, 0.25);
    expect(range).toEqual([-5, 15]);
    expect(range[0] + (range[1] - range[0]) * 0.25).toBe(0);
  });
  it("reverses repeated wheel zoom without drifting", () => {
    let range = [-0.14, 0.22];
    for (let i = 0; i < 30; i++)
      range = zoomRange(range, Math.exp(-0.12), 0.37);
    for (let i = 0; i < 30; i++) range = zoomRange(range, Math.exp(0.12), 0.37);
    expect(range[0]).toBeCloseTo(-0.14, 12);
    expect(range[1]).toBeCloseTo(0.22, 12);
  });
  it("guards against collapsed ranges and overflow", () => {
    expect(zoomRange([1, 1 + 1e-12], 0.001)).toEqual([1, 1 + 1e-12]);
    expect(zoomRange([-1, 1], Infinity)).toEqual([-1, 1]);
  });
  it("normalizes mouse and trackpad delta units", () => {
    expect(wheelPixels(2, 0, 800)).toBe(2);
    expect(wheelPixels(2, 1, 800)).toBe(32);
    expect(wheelPixels(2, 2, 800)).toBe(1600);
  });
});

describe("clampCentroidToViewport", () => {
  it("leaves on-screen centroids untouched", async () => {
    const { clampCentroidToViewport } =
      await import("../core/geometry/viewport");
    const result = clampCentroidToViewport([2, 3], [0, 10], [0, 10]);
    expect(result.isOffscreen).toBe(false);
    expect(result.clamped).toEqual([2, 3]);
    expect(result.edgeSide).toBeNull();
  });

  it("clamps offscreen centroids to the right edge with directionality", async () => {
    const { clampCentroidToViewport } =
      await import("../core/geometry/viewport");
    const result = clampCentroidToViewport([50, 5], [0, 10], [0, 10], 0.94);
    expect(result.isOffscreen).toBe(true);
    expect(result.edgeSide).toBe("right");
    expect(result.clamped[0]).toBeCloseTo(5 + 5 * 0.94, 4);
    expect(result.clamped[1]).toBeCloseTo(5, 4);
  });

  it("clamps offscreen centroids to the top edge", async () => {
    const { clampCentroidToViewport } =
      await import("../core/geometry/viewport");
    const result = clampCentroidToViewport([5, 80], [0, 10], [0, 10], 0.94);
    expect(result.isOffscreen).toBe(true);
    expect(result.edgeSide).toBe("top");
    expect(result.clamped[0]).toBeCloseTo(5, 4);
    expect(result.clamped[1]).toBeCloseTo(5 + 5 * 0.94, 4);
  });

  it("handles reversed axis ranges correctly", async () => {
    const { clampCentroidToViewport } =
      await import("../core/geometry/viewport");
    const result = clampCentroidToViewport([-30, 5], [10, 0], [10, 0], 0.94);
    expect(result.isOffscreen).toBe(true);
    expect(result.edgeSide).toBe("left");
    expect(result.clamped[0]).toBeCloseTo(5 - 5 * 0.94, 4);
  });
});
