import { describe, expect, it } from "vitest";
import { convexHull, regressionLine } from "../domain/geometry";
import { initialView, viewReducer, filteredSamples } from "../domain/viewState";
import { parseEvec } from "../domain/parseEvec";
import { buildPlotModel } from "../domain/plotModel";
const data = parseEvec(
  "a 0 0 1 A\nb 1 0 2 A\nc 0 1 3 A\na 3 4 5 B",
  "test.evec",
);
describe("geometry", () => {
  it("excludes interior and duplicate points without modifying coordinates", () => {
    const points: [number, number][] = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [1, 1],
      [0, 0],
    ];
    expect(convexHull(points)).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
    expect(points).toHaveLength(6);
  });
  it("does not invent hulls for tiny or collinear groups", () => {
    expect(
      convexHull([
        [0, 0],
        [1, 1],
        [2, 2],
      ]),
    ).toEqual([]);
    expect(convexHull([[1, 1]])).toEqual([]);
  });
  it("fits y on x, including constant y, while rejecting constant x", () => {
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
    expect(
      regressionLine([
        [0, 4],
        [1, 4],
      ]),
    ).toEqual([
      [0, 4],
      [1, 4],
    ]);
    expect(
      regressionLine([
        [1, 1],
        [1, 2],
      ]),
    ).toBeNull();
  });
});
describe("population and point style independence", () => {
  it("preserves individual colors and marks when population colors change", () => {
    let state = viewReducer(initialView(), {
      type: "point",
      key: 0,
      patch: { color: "#123456", marked: true },
    });
    state = viewReducer(state, {
      type: "population",
      name: "A",
      patch: { color: "#ff0000", hull: true },
    });
    const model = buildPlotModel(data, data.samples, state);
    expect((model.traces[0] as any).marker.color).toEqual([
      "#123456",
      "#ff0000",
      "#ff0000",
    ]);
    expect(model.shapes[0].name).toBe("hull:A");
    expect((model.traces.at(-1) as any).customdata).toEqual([0]);
    expect((model.traces[1] as any).marker.color).not.toContain("#ff0000");
  });
  it("keeps hidden population settings and removes its geometry", () => {
    let state = viewReducer(initialView(), {
      type: "population",
      name: "A",
      patch: { hidden: true, hull: true, color: "#abcdef" },
    });
    expect(filteredSamples(data, state).map((s) => s.key)).toEqual([3]);
    expect(
      buildPlotModel(data, filteredSamples(data, state), state).shapes,
    ).toEqual([]);
    state = viewReducer(state, {
      type: "allPopulations",
      names: ["A", "B"],
      patch: { hidden: false },
    });
    expect(state.populations.get("A")).toMatchObject({
      hull: true,
      color: "#abcdef",
    });
  });
  it("recalculates hulls on changed axes and filtered rows", () => {
    let state = viewReducer(initialView(), {
      type: "population",
      name: "A",
      patch: { hull: true },
    });
    const before = buildPlotModel(data, data.samples, state).shapes[0].path;
    state = viewReducer(state, { type: "axes", x: 0, y: 2 });
    expect(
      buildPlotModel(data, data.samples, state).shapes[0].path,
    ).not.toEqual(before);
    expect(buildPlotModel(data, [data.samples[0]], state).shapes).toHaveLength(
      0,
    );
  });
  it("marks selected rows independently of duplicate IDs and clears marks without losing colors", () => {
    let state = viewReducer(initialView(), {
      type: "point",
      key: 0,
      patch: { color: "#123456" },
    });
    state = viewReducer(state, { type: "select", keys: [3] });
    state = viewReducer(state, { type: "markSelection", marked: true });
    expect(state.points.get(3)?.marked).toBe(true);
    expect(state.points.get(0)?.marked).toBeUndefined();
    state = viewReducer(state, { type: "clearMarks" });
    expect(state.points.get(0)?.color).toBe("#123456");
    expect(state.points.get(3)?.marked).toBe(false);
  });
  it("escapes user identifiers in annotations and retains keyed offsets across edits", () => {
    const unsafe = parseEvec("a 0 1 <b>A</b>\nb 1 2 <b>A</b>", "x");
    let state = initialView();
    state.settings.groupLabels = true;
    state.settings.groupLabelStyle = "background";
    const model = buildPlotModel(
      unsafe,
      unsafe.samples,
      state,
      new Map([["0:1:<b>A</b>", { ax: 50, ay: 60 }]]),
    );
    expect(model.annotations[0].text).toBe("&lt;b&gt;A&lt;/b&gt;");
    expect(model.annotations[0]).toMatchObject({ ax: 50, ay: 60 });
  });
});

it("applies palettes and marker presets without changing visibility or sample overrides", () => {
  let state = viewReducer(initialView(), {
    type: "population",
    name: "A",
    patch: { hidden: true, hull: true },
  });
  state = viewReducer(state, {
    type: "point",
    key: 0,
    patch: { color: "#123456" },
  });
  state = viewReducer(state, {
    type: "palette",
    names: ["A", "B"],
    value: "solid",
  });
  state = viewReducer(state, {
    type: "markers",
    names: ["A", "B"],
    value: "hollow-shapes",
  });
  expect(state.populations.get("A")).toMatchObject({
    hidden: true,
    hull: true,
    color: "#1f77b4",
    symbol: "circle-open",
  });
  expect(state.populations.get("B")?.symbol).toBe("square-open");
  expect(state.points.get(0)?.color).toBe("#123456");
});
