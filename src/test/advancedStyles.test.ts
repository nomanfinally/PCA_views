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
