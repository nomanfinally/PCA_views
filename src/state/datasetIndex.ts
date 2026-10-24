import { paddedRange } from "../core/geometry/viewport";
import type { Dataset, Sample } from "../core/models/dataset";

export interface DatasetIndex {
  byKey: Map<number, Sample>;
  ordinals: Map<number, number>;
  populations: Map<string, Sample[]>;
  axisRanges: Map<number, [number, number]>;
}

// Dataset objects are immutable; their indexes disappear when the session does.
const indexes = new WeakMap<Dataset, DatasetIndex>();

export function getDatasetIndex(dataset: Dataset): DatasetIndex {
  const cached = indexes.get(dataset);
  if (cached) return cached;
  const index: DatasetIndex = {
    byKey: new Map(),
    ordinals: new Map(),
    populations: new Map(),
    axisRanges: new Map(),
  };
  for (const sample of dataset.samples) {
    const group = index.populations.get(sample.population) ?? [];
    index.byKey.set(sample.key, sample);
    index.ordinals.set(sample.key, group.length);
    group.push(sample);
    index.populations.set(sample.population, group);
  }
  indexes.set(dataset, index);
  return index;
}

export function getAxisRange(dataset: Dataset, pc: number): [number, number] {
  const index = getDatasetIndex(dataset);
  let range = index.axisRanges.get(pc);
  if (!range) {
    range = paddedRange(dataset.samples.map((sample) => sample.pcs[pc] ?? 0));
    index.axisRanges.set(pc, range);
  }
  return [...range];
}
