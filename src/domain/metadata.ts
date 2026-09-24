import type { Dataset } from "./types";
import type { ViewState } from "./viewState";
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
  )
    throw new Error(
      "Provide an .eval file with a nonnegative eigenvalue for each PC (and any remaining PCs).",
    );
  if (
    dataset.eigenvalues.some(
      (v, i) => Math.abs(v - values[i]) > Math.max(1, Math.abs(v)) * 0.005,
    )
  )
    throw new Error(
      "These eigenvalues do not match the loaded .evec header. Use files from the same PCA run.",
    );
  return values;
}
export function axisTitle(dataset: Dataset, state: ViewState, pc: number) {
  const eigenvalues = state.spectrum.length
    ? state.spectrum
    : dataset.eigenvalues;
  if (
    !state.settings.showVariance ||
    !eigenvalues.length ||
    eigenvalues.some((v) => v < 0)
  )
    return `PC${pc + 1}`;
  const sum = eigenvalues.reduce((a, b) => a + b, 0);
  const total = state.settings.varianceTotal;
  if (!(sum > 0) || (total !== null && total < sum)) return `PC${pc + 1}`;
  const percentage = (100 * eigenvalues[pc]) / (total ?? sum);
  return `PC${pc + 1} (${percentage.toFixed(2)}%)`;
}
