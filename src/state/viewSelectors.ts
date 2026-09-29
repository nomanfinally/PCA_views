/**
 * ViewState Selectors & Derived Query Functions
 *
 * Pure functions extracting derived data from ViewState and Datasets.
 */

import { paletteColor } from "../core/color/palettes";
import type { Dataset, Population, Sample } from "../core/models/dataset";
import type { ViewState } from "./viewState";

/**
 * Derives an effective Dataset reflecting custom per-sample group ID (FID) reassignments.
 */
export function getEffectiveDataset(
  dataset: Dataset,
  samplePopulations?: Map<number, string>,
): Dataset {
  if (!samplePopulations || samplePopulations.size === 0) {
    return dataset;
  }

  let hasChanges = false;
  for (const [key, pop] of samplePopulations.entries()) {
    const orig = dataset.samples[key];
    if (orig && orig.population !== pop) {
      hasChanges = true;
      break;
    }
  }
  if (!hasChanges) return dataset;

  const samples = dataset.samples.map((s) => {
    const custom = samplePopulations.get(s.key);
    if (custom && custom !== s.population) {
      return { ...s, population: custom };
    }
    return s;
  });

  const counts = new Map<string, number>();
  for (const s of samples) {
    counts.set(s.population, (counts.get(s.population) ?? 0) + 1);
  }

  const existingMap = new Map(dataset.populations.map((p) => [p.name, p]));
  const orderedNames: string[] = [];
  for (const p of dataset.populations) {
    if (counts.has(p.name)) {
      orderedNames.push(p.name);
    }
  }
  for (const name of counts.keys()) {
    if (!existingMap.has(name)) {
      orderedNames.push(name);
    }
  }

  const populations: Population[] = orderedNames.map((name, index) => {
    const existing = existingMap.get(name);
    return {
      name,
      count: counts.get(name) ?? 0,
      color: existing?.color ?? paletteColor(index, "solid"),
    };
  });

  return {
    ...dataset,
    samples,
    populations,
  };
}

/**
 * Filters dataset samples based on active search string, population hidden status, and sample exclusion.
 */
export function filteredSamples(dataset: Dataset, state: ViewState): Sample[] {
  const query = state.search.trim().toLowerCase();
  return dataset.samples.filter(
    (s) =>
      !state.excludedSamples?.has(s.key) &&
      !state.populations.get(s.population)?.hidden &&
      (!query ||
        s.id.toLowerCase().includes(query) ||
        s.population.toLowerCase().includes(query)),
  );
}

/**
 * Returns the list of populations that currently have at least one visible sample.
 */
export function selectVisiblePopulations(
  dataset: Dataset,
  state: ViewState,
): Population[] {
  const activeSamples = filteredSamples(dataset, state);
  const activePopNames = new Set(activeSamples.map((s) => s.population));
  return dataset.populations.filter((p) => activePopNames.has(p.name));
}

/**
 * Calculates total and visible sample counts per population.
 */
export function selectPopulationCounts(
  dataset: Dataset,
  state: ViewState,
): Map<string, { total: number; visible: number }> {
  const result = new Map<string, { total: number; visible: number }>();
  dataset.populations.forEach((p) => {
    result.set(p.name, { total: p.count, visible: 0 });
  });

  const active = filteredSamples(dataset, state);
  active.forEach((s) => {
    const entry = result.get(s.population);
    if (entry) entry.visible++;
  });

  return result;
}

/**
 * Checks whether a population is marked as hidden.
 */
export function isPopulationHidden(
  state: ViewState,
  populationName: string,
): boolean {
  return Boolean(state.populations.get(populationName)?.hidden);
}

/**
 * Computes the explained variance percentage for a chosen principal component.
 */
export function selectAxisVariance(
  dataset: Dataset,
  state: ViewState,
  pcIndex: number,
): number | null {
  const eigenvalues =
    state.spectrum.length > 0 ? state.spectrum : dataset.eigenvalues;
  if (
    !state.settings.showVariance ||
    !eigenvalues.length ||
    pcIndex >= eigenvalues.length
  ) {
    return null;
  }

  const sum = eigenvalues.reduce((a, b) => a + b, 0);
  const total = state.settings.varianceTotal ?? sum;
  if (total <= 0 || eigenvalues[pcIndex] < 0) return null;

  return (100 * eigenvalues[pcIndex]) / total;
}
