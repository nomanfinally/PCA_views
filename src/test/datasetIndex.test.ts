import { describe, expect, it } from "vitest";
import { parseEvec } from "../core/parsers/parseEvec";
import { getAxisRange, getDatasetIndex } from "../state/datasetIndex";
import { getEffectiveDataset } from "../state/viewSelectors";

describe("immutable dataset indexing", () => {
  it("retains duplicate IDs by row key and stable population ordinals", () => {
    const data = parseEvec("same 0 1 A\nsame 1 2 B\nthird 2 3 A", "test.evec");
    const index = getDatasetIndex(data);
    expect(getDatasetIndex(data)).toBe(index);
    expect(index.byKey.size).toBe(3);
    expect(index.ordinals.get(2)).toBe(1);
    const range = getAxisRange(data, 0);
    range[0] = 99;
    expect(getAxisRange(data, 0)).toEqual([-0.16, 2.16]);
  });
  it("resolves stable keys even when rows are reordered", () => {
    const data = parseEvec("a 0 1 A\nb 1 2 B", "test.evec");
    const reordered = { ...data, samples: [...data.samples].reverse() };
    const effective = getEffectiveDataset(reordered, new Map([[0, "NEW"]]));
    expect(effective.samples.find((s) => s.key === 0)?.population).toBe("NEW");
    expect(effective.samples.find((s) => s.key === 1)?.population).toBe("B");
  });
});
