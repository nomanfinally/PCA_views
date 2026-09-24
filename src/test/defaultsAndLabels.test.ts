import { expect, it } from "vitest";
import {
  initialView,
  viewReducer,
  markerAppearance,
} from "../domain/viewState";
import { parseEvec } from "../domain/parseEvec";
import {
  paletteColor,
  chartBackgroundPresets,
  chartContrast,
} from "../domain/colors";
import { annotationName, buildPlotModel } from "../domain/plotModel";
import { serializeArchive, restoreArchiveState } from "../domain/archive";
it("sets dataset-aware defaults and restores them after customization", () => {
  for (const count of [2, 7, 8, 9, 14]) {
    const data = parseEvec(
      Array.from({ length: count }, (_, i) => `i${i} ${i} ${i} P${i}`).join(
        "\n",
      ),
      "test.evec",
    );
    const state = initialView(data);
    expect(state.settings).toMatchObject({
      palette: "solid",
      hoverIid: true,
      hoverFid: false,
      hoverCoordinates: false,
      tickFontSize: 12,
      axisLineWidth: 1.25,
      axisTitleSize: 14,
      aspectRatio: "full",
      markerPreset: count > 8 ? "shapes" : "circles",
    });
    expect(markerAppearance(data.populations[1], state)).toMatchObject({
      color: paletteColor(1, "solid"),
      symbol: count > 8 ? "square" : "circle",
    });
    let edited = viewReducer(state, {
      type: "point",
      key: 0,
      patch: { label: true, color: "#123456" },
    });
    edited = viewReducer(edited, {
      type: "settings",
      patch: { chartBackground: "#252a31" },
    });
    edited = viewReducer(edited, {
      type: "population",
      name: "P0",
      patch: { hidden: true },
    });
    expect(viewReducer(edited, { type: "resetView", dataset: data })).toEqual(
      state,
    );
  }
});
it("individual marker and label styling survives archive roundtrip, using row IDs for duplicate IIDs", () => {
  const data = parseEvec("same 0 1 A\nsame 1 2 A", "test.evec");
  let state = initialView(data);
  state = viewReducer(state, {
    type: "point",
    key: 0,
    patch: {
      symbol: "diamond",
      markerTreatment: "hollow",
      outlineWidth: 2.4,
      outlineColor: "#123456",
      opacity: 0.25,
      outlineOpacity: 0.75,
      label: true,
      labelStyle: "boxed",
      labelColor: "#000000",
      labelSize: 18,
      labelOpacity: 0.6,
      labelConnector: true,
    },
  });
  state = viewReducer(state, {
    type: "point",
    key: 1,
    patch: { label: true, labelConnector: false },
  });
  const name = annotationName("sample", 0),
    offsets = new Map([[`0:1:${name}`, { ax: 80, ay: 50 }]]);
  const archive = serializeArchive(data, state, {
    xRange: [-1, 1],
    yRange: [0, 2],
    width: 800,
    height: 600,
    offsets: [...offsets],
  });
  const restored = restoreArchiveState(JSON.parse(JSON.stringify(archive)));
  expect(restored).toEqual(state);
  const model = buildPlotModel(
    data,
    data.samples,
    restored,
    new Map(archive.viewport.offsets),
  );
  expect(model.annotations[0]).toMatchObject({
    name,
    text: "same",
    ax: 80,
    ay: 50,
    font: { size: 18, color: "#000000" },
    opacity: 0.6,
    borderwidth: 1,
    arrowcolor: "#000000",
  });
  expect(model.annotations[1].name).not.toBe(name);
  expect(model.annotations[1].arrowcolor).toBe("rgba(0,0,0,0)");
  const marker = markerAppearance(
    data.populations[0],
    state,
    state.points.get(0),
  );
  expect(marker).toMatchObject({
    symbol: "diamond-open",
    line: { width: 2.4, color: "#123456" },
    fillOpacity: 0.25,
    outlineOpacity: 0.75,
  });
});
it("hulls fall back to one connecting line for two distinct points including vertical pairs", () => {
  for (const coords of ["a 0 0 A\nb 1 1 A", "a 1 0 A\nb 1 2 A"]) {
    const data = parseEvec(coords, "pair.evec");
    let state = initialView(data);
    state = viewReducer(state, {
      type: "population",
      name: "A",
      patch: { hull: true },
    });
    let model = buildPlotModel(data, data.samples, state);
    expect(model.shapes).toHaveLength(1);
    expect(model.shapes[0]).toMatchObject({
      type: "line",
      name: "regression:A",
      opacity: 0.15,
    });
    state = viewReducer(state, {
      type: "population",
      name: "A",
      patch: { regression: true },
    });
    model = buildPlotModel(data, data.samples, state);
    expect(model.shapes).toHaveLength(1);
    expect(model.shapes[0].opacity).toBe(1);
  }
  const duplicates = parseEvec("a 1 1 A\nb 1 1 A", "dup.evec");
  const state = viewReducer(initialView(duplicates), {
    type: "population",
    name: "A",
    patch: { hull: true },
  });
  expect(
    buildPlotModel(duplicates, duplicates.samples, state).shapes,
  ).toHaveLength(0);
});
it("background presets get contrasting grids and adapt for custom colors", () => {
  for (const preset of chartBackgroundPresets) {
    const colors = chartContrast(preset.color);
    expect(colors.grid).not.toBe(preset.color);
    expect(colors.zero).not.toBe(colors.grid);
  }
  expect(chartContrast("#000000").line).toBe("#cdd3db");
  expect(chartContrast("#ffffff").line).toBe("#444444");
});

it("an individual boundary mode overrides a custom population boundary", () => {
  const data = parseEvec("a 0 0 A\nb 1 1 A", "test.evec");
  let state = initialView(data);
  state = viewReducer(state, {
    type: "population",
    name: "A",
    patch: { outlineColor: "#abcdef" },
  });
  state = viewReducer(state, {
    type: "point",
    key: 0,
    patch: { outlineMode: "black" },
  });
  expect(
    markerAppearance(data.populations[0], state, state.points.get(0)).line
      .color,
  ).toBe("#000000");
  expect(markerAppearance(data.populations[0], state).line.color).toBe(
    "#abcdef",
  );
});
