import { describe, expect, it } from "vitest";
import { parseEvec } from "../core/parsers/parseEvec";
import { initialView } from "../state/viewState";
import { viewActions } from "../state/viewActions";
import { viewReducer } from "../state/viewReducer";
import {
  filteredSamples,
  selectPopulationCounts,
  selectAxisVariance,
} from "../state/viewSelectors";

const dataset = parseEvec(
  `#eigvals: 40 10
S1 0 0 POP_A
S2 1 1 POP_A
S3 2 2 POP_B
S4 3 3 POP_C`,
  "test.evec",
);

describe("state/viewState & initialView", () => {
  it("initializes with dataset-aware settings", () => {
    const state = initialView(dataset);
    expect(state.populationNames).toEqual(["POP_A", "POP_B", "POP_C"]);
    expect(state.settings.markerPreset).toBe("circles");
    expect(state.populations.size).toBe(3);
    expect(state.populations.get("POP_A")?.color).toBe("#1f77b4");
  });
});

describe("state/viewReducer", () => {
  it("clears selection when changing axes", () => {
    let state = initialView(dataset);
    state = viewReducer(state, viewActions.selectPoints([0, 1]));
    expect(state.selected.size).toBe(2);

    state = viewReducer(state, viewActions.setAxes(1, 0));
    expect(state.selected.size).toBe(0);
    expect(state.x).toBe(1);
    expect(state.y).toBe(0);
  });

  it("updates outline modes and widths when switching to hollow presets", () => {
    let state = initialView(dataset);
    expect(state.settings.outlineWidth).toBe(0.8);
    expect(state.settings.outlineMode).toBe("darker");

    state = viewReducer(state, viewActions.setMarkerPreset(state.populationNames, "hollow-circles"));
    expect(state.settings.outlineWidth).toBe(1.5);
    expect(state.settings.outlineMode).toBe("matching");

    // Switching back to solid restores 0.8 / darker
    state = viewReducer(state, viewActions.setMarkerPreset(state.populationNames, "circles"));
    expect(state.settings.outlineWidth).toBe(0.8);
    expect(state.settings.outlineMode).toBe("darker");
  });

  it("isolates a single population", () => {
    let state = initialView(dataset);
    state = viewReducer(state, viewActions.isolatePopulation(state.populationNames, "POP_B"));

    expect(state.populations.get("POP_A")?.hidden).toBe(true);
    expect(state.populations.get("POP_B")?.hidden).toBe(false);
    expect(state.populations.get("POP_C")?.hidden).toBe(true);
  });

  it("preserves hidden flags when resetting population appearance", () => {
    let state = initialView(dataset);
    state = viewReducer(state, viewActions.patchPopulation("POP_A", { color: "#ff0000", hidden: true }));
    state = viewReducer(state, viewActions.resetPopulation("POP_A"));

    expect(state.populations.get("POP_A")?.color).toBe("#1f77b4");
    expect(state.populations.get("POP_A")?.hidden).toBe(true);
  });

  it("manages point marks and batch mark selection", () => {
    let state = initialView(dataset);
    state = viewReducer(state, viewActions.toggleMark(0));
    expect(state.points.get(0)?.marked).toBe(true);

    state = viewReducer(state, viewActions.selectPoints([1, 2]));
    state = viewReducer(state, viewActions.markSelection(true));
    expect(state.points.get(1)?.marked).toBe(true);
    expect(state.points.get(2)?.marked).toBe(true);

    state = viewReducer(state, viewActions.clearMarks());
    expect(state.points.get(0)?.marked).toBe(false);
    expect(state.points.get(1)?.marked).toBe(false);
    expect(state.selected.size).toBe(0);
  });
});

describe("state/viewSelectors", () => {
  it("filters samples based on search query and population visibility", () => {
    let state = initialView(dataset);
    expect(filteredSamples(dataset, state)).toHaveLength(4);

    state = viewReducer(state, viewActions.setSearch("S1"));
    expect(filteredSamples(dataset, state)).toHaveLength(1);

    state = viewReducer(state, viewActions.setSearch(""));
    state = viewReducer(state, viewActions.patchPopulation("POP_A", { hidden: true }));
    expect(filteredSamples(dataset, state)).toHaveLength(2); // Only S3 (POP_B) and S4 (POP_C)
  });

  it("calculates accurate total and visible population counts", () => {
    let state = initialView(dataset);
    state = viewReducer(state, viewActions.patchPopulation("POP_B", { hidden: true }));

    const counts = selectPopulationCounts(dataset, state);
    expect(counts.get("POP_A")).toEqual({ total: 2, visible: 2 });
    expect(counts.get("POP_B")).toEqual({ total: 1, visible: 0 });
    expect(counts.get("POP_C")).toEqual({ total: 1, visible: 1 });
  });

  it("computes variance percentages accurately", () => {
    const state = initialView(dataset);
    const pc1Var = selectAxisVariance(dataset, state, 0); // 40 / 50 = 80%
    const pc2Var = selectAxisVariance(dataset, state, 1); // 10 / 50 = 20%

    expect(pc1Var).toBeCloseTo(80);
    expect(pc2Var).toBeCloseTo(20);
  });
});
