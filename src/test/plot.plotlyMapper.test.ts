import { describe, expect, it } from "vitest";
import { defaultSettings } from "../core/models/settings";
import { parseEvec } from "../core/parsers/parseEvec";
import { buildPlotSpec, type PlotViewState } from "../plot/spec/buildPlotSpec";
import { mapSpecToPlotly } from "../plot/adapters/plotly/plotlyMapper";

const dataset = parseEvec(
  `#eigvals: 10 5
S1 0.1 0.2 POP_A
S2 0.3 0.4 POP_A
S3 0.5 0.6 POP_B`,
  "test.evec",
);

describe("plot/adapters/plotly/plotlyMapper", () => {
  it("maps PlotSpec to complete Plotly bundle (data, layout, config)", () => {
    const state: PlotViewState = {
      x: 0,
      y: 1,
      settings: defaultSettings,
      populations: new Map([["POP_A", { hull: true, regression: true }]]),
      points: new Map([[0, { marked: true }]]),
      selected: new Set([1]),
    };

    const spec = buildPlotSpec(dataset, dataset.samples, state);
    const bundle = mapSpecToPlotly(spec);

    expect(bundle.data).toBeDefined();
    // 2 population traces + 1 marked overlay trace + 1 selection overlay trace
    expect(bundle.data).toHaveLength(4);

    // Traces
    expect(bundle.data[0].name).toBe("POP_A");
    expect(bundle.data[1].name).toBe("POP_B");
    expect(bundle.data[2].name).toBe("marked");
    expect(bundle.data[3].name).toBe("selection");

    // Layout
    expect(bundle.layout.paper_bgcolor).toBe("transparent");
    expect(bundle.layout.plot_bgcolor).toBe(defaultSettings.chartBackground);
    expect(bundle.layout.xaxis?.title).toBeDefined();
    expect(bundle.layout.shapes?.length).toBeGreaterThan(0);

    // Config
    expect(bundle.config.displayModeBar).toBe(false);
    expect(bundle.config.scrollZoom).toBe(false);
  });

  it("clamps offscreen group labels to the edge when clampGroupLabelsToEdge is enabled", () => {
    const state: PlotViewState = {
      x: 0,
      y: 1,
      settings: {
        ...defaultSettings,
        groupLabels: true,
        clampGroupLabelsToEdge: true,
      },
      populations: new Map(),
      points: new Map(),
      selected: new Set(),
    };

    const spec = buildPlotSpec(dataset, dataset.samples, state);
    // POP_B centroid is at x = 0.5, y = 0.6
    // Simulate a zoom viewport focused on POP_A: [0, 0.35] x [0, 0.35]
    const bundleClamped = mapSpecToPlotly(spec, {
      xRange: [0, 0.35],
      yRange: [0, 0.35],
    });

    const popBClamped = bundleClamped.layout.annotations?.find(
      (a: any) => a.text === "POP_B",
    );
    expect(popBClamped).toBeDefined();
    // Clamped x should be at the upper edge of the visible x-span (inside [0, 0.35])
    expect(popBClamped!.x).toBeLessThan(0.35);
    expect(popBClamped!.x).toBeGreaterThan(0.3);

    // When clampGroupLabelsToEdge is disabled, it retains the native out-of-range centroid
    const specUnclamped = {
      ...spec,
      settings: {
        ...defaultSettings,
        groupLabels: true,
        clampGroupLabelsToEdge: false,
      },
    };
    const bundleUnclamped = mapSpecToPlotly(specUnclamped, {
      xRange: [0, 0.35],
      yRange: [0, 0.35],
    });
    const popBUnclamped = bundleUnclamped.layout.annotations?.find(
      (a: any) => a.text === "POP_B",
    );
    expect(popBUnclamped).toBeDefined();
    expect(popBUnclamped!.x).toBe(0.5);
    expect(popBUnclamped!.y).toBe(0.6);
  });
});
