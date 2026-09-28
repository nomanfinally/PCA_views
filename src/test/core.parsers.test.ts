import { describe, expect, it } from "vitest";
import { parseEvec } from "../core/parsers/parseEvec";
import { parseSpectrum, formatAxisTitle } from "../core/parsers/parseSpectrum";
import { createExample } from "../core/parsers/example";
import { defaultSettings } from "../core/models/settings";

describe("core/parsers/parseEvec", () => {
  it("parses valid .evec files with eigenvalues and comments", () => {
    const raw = `
      #eigvals: 15.5 8.2
      # Some comment
      S1 0.12 -0.34 POP_A
      S2 0.56 0.78 POP_B
    `;
    const dataset = parseEvec(raw, "test.evec");
    expect(dataset.name).toBe("test.evec");
    expect(dataset.pcCount).toBe(2);
    expect(dataset.eigenvalues).toEqual([15.5, 8.2]);
    expect(dataset.samples).toHaveLength(2);
    expect(dataset.populations.map((p) => p.name)).toEqual(["POP_A", "POP_B"]);
  });

  it("handles Fortran scientific exponents (D/d)", () => {
    const dataset = parseEvec("S1 1.25D-02 -3.45d+01 POP_A", "test.evec");
    expect(dataset.samples[0].pcs[0]).toBeCloseTo(0.0125);
    expect(dataset.samples[0].pcs[1]).toBeCloseTo(-34.5);
  });

  it("sorts populations alphabetically and assigns unique keys", () => {
    const raw = `
      S1 1 2 POP_Z
      S2 3 4 POP_A
      S3 5 6 POP_M
    `;
    const dataset = parseEvec(raw, "test.evec");
    expect(dataset.populations.map((p) => p.name)).toEqual(["POP_A", "POP_M", "POP_Z"]);
    expect(dataset.samples.map((s) => s.key)).toEqual([0, 1, 2]);
  });
});

describe("core/parsers/parseSpectrum", () => {
  it("parses valid .eval files matching dataset eigenvalues", () => {
    const dataset = parseEvec("#eigvals: 10 5\nS1 1 2 POP_A", "test.evec");
    const spectrum = parseSpectrum("10.0 5.0 2.5 1.0", dataset);
    expect(spectrum).toEqual([10, 5, 2.5, 1]);
  });

  it("rejects spectrum with fewer PCs than dataset", () => {
    const dataset = parseEvec("S1 1 2 3 POP_A", "test.evec");
    expect(() => parseSpectrum("10 5", dataset)).toThrow("Provide an .eval file");
  });

  it("formats axis titles with accurate percentage", () => {
    const dataset = parseEvec("#eigvals: 60 40\nS1 1 2 POP_A", "test.evec");
    const title = formatAxisTitle(dataset, defaultSettings, dataset.eigenvalues, 0);
    expect(title).toBe("PC1 (60.00%)");
    const compact = formatAxisTitle(dataset, defaultSettings, dataset.eigenvalues, 0, true);
    expect(compact).toBe("PC1 (60.0%)");
  });
});

describe("core/parsers/example", () => {
  it("generates deterministic synthetic dataset", () => {
    const ex1 = createExample();
    const ex2 = createExample();
    expect(ex1).toEqual(ex2);
    expect(ex1.samples).toHaveLength(360);
    expect(ex1.populations).toHaveLength(6);
  });
});
