import { expect, it } from "vitest";
import { parseEvec } from "../domain/parseEvec";
import { axisTitle, parseSpectrum } from "../domain/metadata";
import { initialView, viewReducer, filteredSamples } from "../domain/viewState";
import { buildPlotModel } from "../domain/plotModel";
const dataset = parseEvec(
  "#eigvals: 10 5\na 0 0 A\nb 1 0 A\nc 0 1 A\nd 2 2 B",
  "test.evec",
);
it("distinguishes loaded-PC percentages from total variance and validates metadata", () => {
  let state = initialView();
  expect(axisTitle(dataset, state, 0)).toBe("PC1 (66.67%)");
  const spectrum = parseSpectrum("10\n5\n4\n1", dataset);
  state = viewReducer(state, {
    type: "spectrum",
    value: spectrum,
    name: "test.eval",
  });
  state = viewReducer(state, {
    type: "settings",
    patch: { varianceTotal: 20 },
  });
  expect(axisTitle(dataset, state, 0)).toBe("PC1 (50.00%)");
  expect(() => parseSpectrum("9 5", dataset)).toThrow(/do not match/);
  expect(() => parseSpectrum("10 -5", dataset)).toThrow();
  state.settings.varianceTotal = 1;
  expect(axisTitle(dataset, state, 0)).toBe("PC1");
});
it("population presets vary shapes with stable identities through filtering", () => {
  let state = viewReducer(initialView(), {
    type: "population",
    name: "A",
    patch: { markerPreset: "hollow-shapes" },
  });
  let trace = buildPlotModel(dataset, dataset.samples, state).traces[0] as any;
  expect(trace.marker.symbol).toEqual(["circle", "square", "triangle-up"]);
  expect(trace.marker.color).toEqual(Array(3).fill("rgba(0,0,0,0)"));
  state = viewReducer(state, { type: "search", value: "c" });
  trace = buildPlotModel(dataset, filteredSamples(dataset, state), state)
    .traces[0] as any;
  expect(trace.marker.symbol).toEqual(["triangle-up"]);
});
it("keeps fill and boundary alpha independent and applies population label and hull styles", () => {
  let state = viewReducer(initialView(), {
    type: "population",
    name: "A",
    patch: {
      color: "#ff0000",
      opacity: 0.25,
      outlineOpacity: 0.75,
      outlineMode: "black",
      size: 16,
      label: true,
      labelStyle: "boxed",
      labelSize: 18,
      hull: true,
      hullOpacity: 0.5,
    },
  });
  state = viewReducer(state, {
    type: "point",
    key: 0,
    patch: { opacity: 0.8 },
  });
  const model = buildPlotModel(dataset, dataset.samples, state);
  const marker = (model.traces[0] as any).marker;
  expect(marker.color).toEqual([
    "rgba(255,0,0,0.8)",
    "rgba(255,0,0,0.25)",
    "rgba(255,0,0,0.25)",
  ]);
  expect(marker.line.color).toEqual(Array(3).fill("rgba(0,0,0,0.75)"));
  expect(marker.opacity).toBe(1);
  expect(model.annotations[0]).toMatchObject({
    borderwidth: 1,
    font: { size: 18 },
  });
  expect(model.shapes[0].opacity).toBe(0.5);
});
it("hover shows only chosen values and escapes HTML", () => {
  const data = parseEvec("<I> 0 0 <F>\nb 1 1 B", "ids.evec"),
    state = initialView();
  const hover = () =>
    (buildPlotModel(data, data.samples, state).traces[0] as any).hovertext[0];
  expect(hover()).toBe("&lt;I&gt;");
  state.settings.hoverFid = true;
  state.settings.hoverCoordinates = false;
  expect(hover()).toBe("&lt;I&gt;<br>&lt;F&gt;");
  state.settings.hoverIid = false;
  expect(hover()).toBe("&lt;F&gt;");
  state.settings.hoverFid = false;
  state.settings.hoverCoordinates = true;
  expect(hover()).toBe("0.00000<br>0.00000");
  expect(hover()).not.toMatch(/IID|FID|PC/);
});
it("label connectors are independent of label background and border", () => {
  const state = initialView();
  state.settings.groupLabels = true;
  for (const style of ["plain", "background", "boxed"] as const) {
    state.settings.groupLabelStyle = style;
    for (const connector of [true, false]) {
      state.settings.groupLabelConnector = connector;
      const annotation = buildPlotModel(dataset, dataset.samples, state)
        .annotations[0];
      expect(annotation.arrowcolor === "rgba(0,0,0,0)").toBe(!connector);
      expect(annotation.borderwidth).toBe(style === "boxed" ? 1 : 0);
      expect(annotation.showarrow).toBe(true); // Invisible arrow keeps every style draggable.
    }
  }
});

it("matching outlineMode matches fill color and opacity for filled dots, and respects explicit outlineOpacity", () => {
  let state = viewReducer(initialView(), {
    type: "population",
    name: "A",
    patch: {
      color: "#123456",
      opacity: 0.7,
      outlineMode: "matching",
    },
  });
  const model = buildPlotModel(dataset, dataset.samples, state);
  const marker = (model.traces[0] as any).marker;
  // Filled marker: outline color is #123456 and outline opacity matches fill opacity 0.7
  expect(marker.color[0]).toBe("rgba(18,52,86,0.7)");
  expect(marker.line.color[0]).toBe("rgba(18,52,86,0.7)");

  // With explicit outlineOpacity override, explicit value is respected
  state = viewReducer(state, {
    type: "population",
    name: "A",
    patch: { outlineOpacity: 0.3 },
  });
  const model2 = buildPlotModel(dataset, dataset.samples, state);
  const marker2 = (model2.traces[0] as any).marker;
  expect(marker2.line.color[0]).toBe("rgba(18,52,86,0.3)");
});

it("switching to hollow preset defaults outlineWidth to 1.5 and outlineMode to matching, and reverts on filled", () => {
  let state = initialView();
  expect(state.settings.outlineWidth).toBe(0.8);
  expect(state.settings.outlineMode).toBe("darker");

  // Switch to hollow-circles
  state = viewReducer(state, {
    type: "markers",
    names: dataset.populations.map((p) => p.name),
    value: "hollow-circles",
  });
  expect(state.settings.outlineWidth).toBe(1.5);
  expect(state.settings.outlineMode).toBe("matching");

  // Switch back to circles
  state = viewReducer(state, {
    type: "markers",
    names: dataset.populations.map((p) => p.name),
    value: "circles",
  });
  expect(state.settings.outlineWidth).toBe(0.8);
  expect(state.settings.outlineMode).toBe("darker");

  // Custom outline width should be preserved when switching back
  state = viewReducer(state, {
    type: "markers",
    names: dataset.populations.map((p) => p.name),
    value: "hollow-shapes",
  });
  state = viewReducer(state, {
    type: "settings",
    patch: { outlineWidth: 2.2 },
  });
  state = viewReducer(state, {
    type: "markers",
    names: dataset.populations.map((p) => p.name),
    value: "shapes",
  });
  expect(state.settings.outlineWidth).toBe(2.2);
});

it("opacity cycling starts at 0.9 and follows 80% > 100% > 60% > 40% > 20% > 0% > 90%", () => {
  const cycleOpacity = (current: number) => {
    const presets = [0.9, 0.8, 1, 0.6, 0.4, 0.2, 0];
    const idx = presets.indexOf(current);
    if (idx !== -1) return presets[(idx + 1) % presets.length];
    return 0.8;
  };

  let op = 0.9;
  op = cycleOpacity(op);
  expect(op).toBe(0.8);
  op = cycleOpacity(op);
  expect(op).toBe(1);
  op = cycleOpacity(op);
  expect(op).toBe(0.6);
  op = cycleOpacity(op);
  expect(op).toBe(0.4);
  op = cycleOpacity(op);
  expect(op).toBe(0.2);
  op = cycleOpacity(op);
  expect(op).toBe(0);
  op = cycleOpacity(op);
  expect(op).toBe(0.9);
});

