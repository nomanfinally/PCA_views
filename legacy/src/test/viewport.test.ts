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
