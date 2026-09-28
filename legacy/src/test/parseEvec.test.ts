import { describe, expect, it } from "vitest";
import { parseEvec } from "../domain/parseEvec";
import { samplesToCsv } from "../domain/export";
import { createExample } from "../domain/example";
describe("smartPCA parsing", () => {
  it("reads whitespace, CRLF, BOM, comments, and eigenvalues", () => {
    const data = parseEvec(
      "\uFEFF  #eigvals: 2 1\r\n# comment\r\n ID:1\t -1.2e-3  +.25 Group.A\r\nID2 0 1 Group.B\r\n",
      "test.evec",
    );
    expect(data.pcCount).toBe(2);
    expect(data.eigenvalues).toEqual([2, 1]);
    expect(data.samples[0]).toMatchObject({
      id: "ID:1",
      pcs: [-0.0012, 0.25],
      population: "Group.A",
    });
  });
  it("accepts missing headers, numeric population labels, and Fortran exponents", () => {
    expect(parseEvec("a 1D-2 2d+0 123", "x").samples[0]).toMatchObject({
      pcs: [0.01, 2],
      population: "123",
    });
  });
  it("retains duplicate IDs as separate rows with a warning", () => {
    const data = parseEvec("a 0 1 B\na 2 3 A", "x");
    expect(data.samples.map((s) => s.key)).toEqual([0, 1]);
    expect(data.warnings).toHaveLength(1);
    expect(data.populations.map((p) => p.name)).toEqual(["A", "B"]);
  });
  it.each(["", "# comment", "#eigvals: 1 2"])(
    "rejects files without sample rows: %s",
    (text) => {
      expect(() => parseEvec(text, "x")).toThrow("No samples found");
    },
  );
  it.each(["NaN", "Infinity", "-Infinity", "1e999", "0xFF", "1.2oops"])(
    "rejects invalid coordinate %s",
    (value) => {
      expect(() => parseEvec(`a 1 ${value} pop`, "x")).toThrow("Line 1");
    },
  );
  it("reports mismatched row widths by line", () => {
    expect(() => parseEvec("a 1 2 3 pop\nb 1 2 pop", "x")).toThrow(
      "Line 2 (b): found 2 PCs; expected 3",
    );
  });
  it("rejects a missing population with an eigenvalue header", () => {
    expect(() => parseEvec("#eigvals: 1 2 3\na 1 2 3", "x")).toThrow(
      "header contains 3 eigenvalues",
    );
  });
  it.each(["#eigvals: -1 2", "#eigvals: nan 2", "#eigvals:"])(
    "rejects invalid headers: %s",
    (header) => {
      expect(() => parseEvec(`${header}\na 1 2 pop`, "x")).toThrow(
        "eigenvalue header",
      );
    },
  );
  it("rejects repeated headers", () => {
    expect(() =>
      parseEvec("#eigvals: 1 2\n#eigvals: 1 2\na 1 2 pop", "x"),
    ).toThrow("duplicate eigenvalue");
  });
  it("creates a repeatable, explicitly synthetic demonstration", () => {
    const first = createExample();
    expect(first).toEqual(createExample());
    expect(first.example).toBe(true);
    expect(first.samples).toHaveLength(360);
    expect(first.populations).toHaveLength(6);
  });
});
describe("CSV export", () => {
  it("exports all PC values, escapes quotes, and protects spreadsheet formulas", () => {
    const csv = samplesToCsv(
      [{ key: 0, id: "=SUM(A1)", population: 'A,"B"', pcs: [-0.1, 0.2, 0.3] }],
      3,
    );
    expect(csv).toContain('"Sample","Population","PC1","PC2","PC3"');
    expect(csv).toContain('"\'=SUM(A1)","A,""B""","-0.1","0.2","0.3"');
  });
});
