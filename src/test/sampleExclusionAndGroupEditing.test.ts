import { describe, expect, it } from "vitest";
import { parseEvec } from "../core/parsers/parseEvec";
import { initialView } from "../state/viewState";
import { viewReducer } from "../state/viewReducer";
import { filteredSamples, getEffectiveDataset } from "../state/viewSelectors";
import { samplesToCsv, samplesToEvec } from "../services/export/csvExport";
import { centroid, convexHull } from "../core/geometry/hull";

describe("Sample Exclusion & Group ID Editing", () => {
  const sampleEvec = `#eigvals: 10.5 5.2
sample1 0.10 0.20 English.DG
sample2 0.15 0.25 English.DG
sample3 0.20 0.30 English.DG
sample4 0.90 0.80 Han.DG
sample5 0.95 0.85 Han.DG`;

  it("excludes an unplotted sample from activeSamples and recalculates centroid and hull", () => {
    const dataset = parseEvec(sampleEvec, "test.evec");
    let state = initialView(dataset);

    // Initial state: all 5 samples visible
    const initialActive = filteredSamples(dataset, state);
    expect(initialActive).toHaveLength(5);

    const initialEnglish = initialActive.filter(
      (s) => s.population === "English.DG",
    );
    expect(initialEnglish).toHaveLength(3);

    const initialCentroid = centroid(
      initialEnglish.map((s) => [s.pcs[0], s.pcs[1]]),
    );
    expect(initialCentroid[0]).toBeCloseTo((0.1 + 0.15 + 0.2) / 3);
    expect(initialCentroid[1]).toBeCloseTo((0.2 + 0.25 + 0.3) / 3);

    // Exclude sample3 (key = 2)
    state = viewReducer(state, {
      type: "setSampleExcluded",
      key: 2,
      excluded: true,
    });
    expect(state.excludedSamples.has(2)).toBe(true);

    // Filtered samples should now only have 4 samples
    const activeAfterExclude = filteredSamples(dataset, state);
    expect(activeAfterExclude).toHaveLength(4);
    expect(activeAfterExclude.some((s) => s.id === "sample3")).toBe(false);

    // Recalculated centroid of English.DG without sample3
    const newEnglish = activeAfterExclude.filter(
      (s) => s.population === "English.DG",
    );
    expect(newEnglish).toHaveLength(2);
    const newCentroid = centroid(newEnglish.map((s) => [s.pcs[0], s.pcs[1]]));
    expect(newCentroid[0]).toBeCloseTo((0.1 + 0.15) / 2);
    expect(newCentroid[1]).toBeCloseTo((0.2 + 0.25) / 2);

    // Convex hull recalculation
    const hullPts = convexHull(newEnglish.map((s) => [s.pcs[0], s.pcs[1]]));
    expect(hullPts).toHaveLength(0); // 2 points have no 2D polygon hull (needs >=3)
  });

  it("dynamically creates a new group when changing group ID (FID) with proper palette and shape", () => {
    const dataset = parseEvec(sampleEvec, "test.evec");
    let state = initialView(dataset);

    // Change sample2 (key 1) from English.DG to English_o1.DG
    state = viewReducer(state, {
      type: "setSamplePopulation",
      key: 1,
      population: "English_o1.DG",
    });

    expect(state.samplePopulations.get(1)).toBe("English_o1.DG");
    expect(state.populations.has("English_o1.DG")).toBe(true);

    const newPopStyle = state.populations.get("English_o1.DG");
    expect(newPopStyle).toBeDefined();
    expect(newPopStyle?.color).toBeDefined();
    expect(newPopStyle?.symbol).toBeDefined();

    // Verify getEffectiveDataset reflects this change
    const effective = getEffectiveDataset(dataset, state.samplePopulations);
    expect(effective.samples[1].population).toBe("English_o1.DG");

    // Population list should include the new population
    const popNames = effective.populations.map((p) => p.name);
    expect(popNames).toContain("English_o1.DG");
    expect(
      effective.populations.find((p) => p.name === "English_o1.DG")?.count,
    ).toBe(1);
    expect(
      effective.populations.find((p) => p.name === "English.DG")?.count,
    ).toBe(2);
  });

  it("exports CSV with modified group IDs and appends _excluded to unplotted samples", () => {
    const dataset = parseEvec(sampleEvec, "test.evec");
    const excludedKeys = new Set([0, 3]); // sample1 (English.DG) and sample4 (Han.DG) excluded
    const samplePopulations = new Map([[1, "English_o1.DG"]]); // sample2 renamed

    const csv = samplesToCsv(dataset.samples, 2, {
      excludedKeys,
      samplePopulations,
    });

    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(6); // header + 5 samples

    // Sample1: excluded, original pop English.DG -> English.DG_excluded
    expect(lines[1]).toContain('"sample1","English.DG_excluded"');

    // Sample2: plotted, changed pop English_o1.DG -> English_o1.DG
    expect(lines[2]).toContain('"sample2","English_o1.DG"');

    // Sample3: plotted, original pop English.DG -> English.DG
    expect(lines[3]).toContain('"sample3","English.DG"');

    // Sample4: excluded, original pop Han.DG -> Han.DG_excluded
    expect(lines[4]).toContain('"sample4","Han.DG_excluded"');

    // Sample5: plotted, original pop Han.DG -> Han.DG
    expect(lines[5]).toContain('"sample5","Han.DG"');
  });

  it("exports .evec with eigenvalues header, modified group IDs, and _excluded suffix", () => {
    const dataset = parseEvec(sampleEvec, "test.evec");
    const excludedKeys = new Set([3]); // sample4 excluded
    const samplePopulations = new Map([[0, "English_mod.DG"]]); // sample1 renamed

    const evec = samplesToEvec(dataset.samples, dataset.eigenvalues, {
      excludedKeys,
      samplePopulations,
    });

    const lines = evec.trim().split("\n");
    expect(lines[0]).toMatch(/^#eigvals:\s+10\.500000\s+5\.200000/);

    // sample1: renamed to English_mod.DG
    expect(lines[1]).toContain("sample1");
    expect(lines[1]).toContain("English_mod.DG");

    // sample4: excluded, should have Han.DG_excluded
    expect(lines[4]).toContain("sample4");
    expect(lines[4]).toContain("Han.DG_excluded");
  });

  it("resets custom sample population when reverted", () => {
    const dataset = parseEvec(sampleEvec, "test.evec");
    let state = initialView(dataset);

    state = viewReducer(state, {
      type: "setSamplePopulation",
      key: 0,
      population: "CustomGroup",
    });
    expect(state.samplePopulations.get(0)).toBe("CustomGroup");

    state = viewReducer(state, {
      type: "resetSamplePopulation",
      key: 0,
    });
    expect(state.samplePopulations.has(0)).toBe(false);
  });
});

