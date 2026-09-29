/**
 * Spectrum Parser & Variance Title Formatter
 *
 * Parses .eval eigenvalue files and formats PC axis titles with explained variance percentages.
 */

import type { Dataset } from "../models/dataset";
import type { PlotSettings } from "../models/settings";

/**
 * Parses whitespace-delimited eigenvalues from an smartPCA .eval file.
 * Validates that values are nonnegative finite numbers matching the loaded dataset's PC count.
 */
export function parseSpectrum(text: string, dataset: Dataset): number[] {
  const values = text
    .trim()
    .split(/\s+/)
    .map((s) => Number(s.replace(/[dD]/, "e")));

  if (
    values.length < dataset.pcCount ||
    values.some((v) => !Number.isFinite(v) || v < 0) ||
    !values.some((v) => v > 0) ||
    !Number.isFinite(values.reduce((a, b) => a + b, 0))
  ) {
    throw new Error(
      "Provide an .eval file with a nonnegative eigenvalue for each PC (and any remaining PCs).",
    );
  }

  // Ensure leading eigenvalues match any eigenvalues present in the .evec header within 0.5% tolerance
  if (
    dataset.eigenvalues.some(
      (v, i) => Math.abs(v - values[i]) > Math.max(1, Math.abs(v)) * 0.005,
    )
  ) {
    throw new Error(
      "These eigenvalues do not match the loaded .evec header. Use files from the same PCA run.",
    );
  }

  return values;
}

/**
 * Generates an axis label with formatted variance percentage (e.g. "PC1 (14.2%)" or "PC1 (14.25%)").
 */
export function formatAxisTitle(
  dataset: Dataset,
  settings: Pick<PlotSettings, "showVariance" | "varianceTotal">,
  spectrum: number[],
  pc: number,
  compact = false,
): string {
  const eigenvalues = spectrum.length > 0 ? spectrum : dataset.eigenvalues;

  if (
    !settings.showVariance ||
    !eigenvalues.length ||
    eigenvalues.some((v) => v < 0)
  ) {
    return `PC${pc + 1}`;
  }

  const sum = eigenvalues.reduce((a, b) => a + b, 0);
  const total = settings.varianceTotal;

  if (!(sum > 0) || (total !== null && total < sum)) {
    return `PC${pc + 1}`;
  }

  const percentage = (100 * eigenvalues[pc]) / (total ?? sum);
  return compact
    ? `PC${pc + 1} (${percentage.toFixed(1)}%)`
    : `PC${pc + 1} (${percentage.toFixed(2)}%)`;
}

/** Legacy alias for backwards compatibility */
export const axisTitle = (
  dataset: Dataset,
  state: {
    spectrum: number[];
    settings: Pick<PlotSettings, "showVariance" | "varianceTotal">;
  },
  pc: number,
  compact = false,
) => formatAxisTitle(dataset, state.settings, state.spectrum, pc, compact);
