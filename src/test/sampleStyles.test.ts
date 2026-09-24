import { expect, it } from "vitest";
import { parseEvec } from "../domain/parseEvec";
import { buildPlotModel } from "../domain/plotModel";
import { buildImageFigure, imageLegend } from "../domain/imageExport";
import {
  initialView,
  viewReducer,
  markerAppearance,
} from "../domain/viewState";
const dataset = parseEvec("a 0 0 A\nb 1 1 A", "test.evec");
it("sample shape and fill style can inherit independently without changing color", () => {
  let state = viewReducer(initialView(dataset), {
    type: "population",
    name: "A",
    patch: { symbol: "square", markerTreatment: "hollow", color: "#abcdef" },
  });
  const population = dataset.populations[0];
  const sample = { symbol: "star", markerTreatment: "inherit" } as const;
  expect(markerAppearance(population, state, sample)).toMatchObject({
    symbol: "star-open",
    color: "#abcdef",
  });
  expect(
    markerAppearance(population, state, {
      ...sample,
      markerTreatment: "filled",
    }).symbol,
  ).toBe("star");
  state = viewReducer(state, {
    type: "population",
    name: "A",
    patch: { markerTreatment: "filled" },
  });
  expect(markerAppearance(population, state, sample).symbol).toBe("star");
  // Existing archives encoded hollow markers directly in their symbol.
  expect(
    markerAppearance(population, state, { symbol: "star-open" }).symbol,
  ).toBe("star-open");
});
it("individual fill, shape, size and outline survive population changes and export", () => {
  let state = viewReducer(initialView(), {
    type: "point",
    key: 0,
    patch: {
      color: "#ffaaaa",
      symbol: "hexagon",
      size: 18,
      outlineColor: "#000088",
      marked: true,
    },
  });
  state = viewReducer(state, {
    type: "population",
    name: "A",
    patch: { color: "#abcdef", symbol: "square" },
  });
  const model = buildPlotModel(dataset, dataset.samples, state);
  const marker = (model.traces[0] as any).marker;
  expect(marker.color).toEqual(["#ffaaaa", "#abcdef"]);
  expect(marker.symbol).toEqual(["hexagon", "square"]);
  expect(marker.size).toEqual([18, 7]);
  expect(marker.line.color[0]).toBe("#000088");
  expect((model.traces[1] as any).marker.size).toEqual([24]);
  const exported = buildImageFigure(
    dataset,
    dataset.samples,
    state,
    {},
    new Map(),
  );
  expect((exported.data[0] as any).marker).toEqual(marker);
  expect(
    imageLegend(dataset, dataset.samples, state)[0].appearance,
  ).toMatchObject({
    color: "#abcdef",
    symbol: "square",
  });
  state = viewReducer(state, { type: "resetPoint", key: 0 });
  expect(
    markerAppearance(dataset.populations[0], state, state.points.get(0)),
  ).toMatchObject({ color: "#abcdef", symbol: "square", size: 7 });
});
it("supports black and darker boundaries, including custom outlines on hollow markers", () => {
  let state = initialView();
  const fill = markerAppearance(dataset.populations[0], state);
  expect(fill.line.color).not.toBe(fill.color);
  state = viewReducer(state, {
    type: "settings",
    patch: { outlineMode: "black" },
  });
  expect(markerAppearance(dataset.populations[0], state).line.color).toBe(
    "#000000",
  );
  state = viewReducer(state, {
    type: "point",
    key: 0,
    patch: { symbol: "star-open", outlineColor: "#ff0000" },
  });
  const marker = (
    buildPlotModel(dataset, dataset.samples, state).traces[0] as any
  ).marker;
  expect(marker.color[0]).toBe("rgba(0,0,0,0)");
  expect(marker.line.color[0]).toBe("#ff0000");
  expect(marker.symbol[0]).toBe("star");
});
it("click marks toggle without discarding individual styles", () => {
  let state = viewReducer(initialView(), {
    type: "point",
    key: 0,
    patch: { symbol: "diamond", size: 14 },
  });
  state = viewReducer(state, { type: "toggleMark", key: 0 });
  expect(state.points.get(0)).toEqual({
    symbol: "diamond",
    size: 14,
    marked: true,
  });
  state = viewReducer(state, { type: "toggleMark", key: 0 });
  expect(state.points.get(0)).toEqual({
    symbol: "diamond",
    size: 14,
    marked: false,
  });
  expect(state.inspector).toBeNull();
});
