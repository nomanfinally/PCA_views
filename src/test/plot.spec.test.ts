import { describe, expect, it } from "vitest";
import { defaultSettings } from "../core/models/settings";
import { parseEvec } from "../core/parsers/parseEvec";
import { buildPlotSpec, type PlotViewState } from "../plot/spec/buildPlotSpec";

const dataset = parseEvec(
  `#eigvals: 10 5
a 0 0 POP_A
b 1 0 POP_A
c 0 1 POP_A
d 2 2 POP_B`,
  "test.evec",
);

describe("plot/spec/buildPlotSpec", () => {
  it("builds a complete engine-agnostic PlotSpec", () => {
    const state: PlotViewState = {
      x: 0,
      y: 1,
      settings: defaultSettings,
      populations: new Map([
        ["POP_A", { hull: true, regression: true }],
      ]),
      points: new Map(),
      selected: new Set([0]),
    };

    const spec = buildPlotSpec(dataset, dataset.samples, state);
    expect(spec.traces).toHaveLength(2);
    expect(spec.traces[0].population).toBe("POP_A");
    expect(spec.traces[0].points).toHaveLength(3);

    // Shape checks: Hull and Regression line
    expect(spec.shapes.some((s) => s.type === "hull")).toBe(true);
    expect(spec.shapes.some((s) => s.type === "regression")).toBe(true);

    // Layout checks
    expect(spec.layout.xaxis.title).toContain("PC1");
    expect(spec.layout.yaxis.title).toContain("PC2");

    // Overlays
    expect(spec.overlays.selectionKeys).toEqual([0]);
  });

  it("adds centroid callout annotations when requested", () => {
    const state: PlotViewState = {
      x: 0,
      y: 1,
      settings: { ...defaultSettings, groupLabels: true },
      populations: new Map(),
      points: new Map(),
      selected: new Set(),
    };

    const spec = buildPlotSpec(dataset, dataset.samples, state);
    expect(spec.annotations.some((a) => a.kind === "population")).toBe(true);
    const popA = spec.annotations.find((a) => a.text === "POP_A");
    expect(popA).toBeDefined();
    expect(popA?.x).toBeCloseTo(1 / 3);
    expect(popA?.y).toBeCloseTo(1 / 3);
  });
});
