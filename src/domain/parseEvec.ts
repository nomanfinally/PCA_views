import { populationColor } from "./colors";
import type { Dataset, Sample } from "./types";

const numeric = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eEdD][+-]?\d+)?$/;
function number(token: string): number {
  return numeric.test(token) ? Number(token.replace(/[dD]/, "e")) : NaN;
}
/** Strict smartPCA reader: ID, two or more PC coordinates, population label. */
export function parseEvec(text: string, name: string): Dataset {
  const samples: Sample[] = [];
  const eigenvalues: number[] = [];
  const counts = new Map<string, number>();
  const ids = new Set<string>();
  const warnings: string[] = [];
  let pcCount = 0;
  let duplicates = 0;
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      if (/^#\s*eigvals\s*:/i.test(line)) {
        if (eigenvalues.length)
          throw new Error(`Line ${i + 1}: duplicate eigenvalue header.`);
        const values = line
          .slice(line.indexOf(":") + 1)
          .trim()
          .split(/\s+/)
          .map(number);
        if (
          !values.length ||
          values.some((v) => !Number.isFinite(v) || v < 0)
        ) {
          throw new Error(
            `Line ${i + 1}: the eigenvalue header must contain finite, nonnegative numbers.`,
          );
        }
        eigenvalues.push(...values);
      }
      continue;
    }
    const fields = line.split(/\s+/);
    if (fields.length < 4)
      throw new Error(
        `Line ${i + 1}: expected a sample ID, at least two PC values, and a population label.`,
      );
    const [id, ...rest] = fields;
    const population = rest.pop()!;
    const pcs = rest.map(number);
    if (pcs.some((v) => !Number.isFinite(v)))
      throw new Error(
        `Line ${i + 1} (${id}): invalid PC value. Coordinates must be finite numbers.`,
      );
    if (!pcCount) pcCount = pcs.length;
    if (pcs.length !== pcCount)
      throw new Error(
        `Line ${i + 1} (${id}): found ${pcs.length} PCs; expected ${pcCount}. Check for missing values or a missing population label.`,
      );
    if (ids.has(id)) duplicates++;
    ids.add(id);
    samples.push({ key: samples.length, id, population, pcs });
    counts.set(population, (counts.get(population) ?? 0) + 1);
  }
  if (!samples.length)
    throw new Error(
      "No samples found. Choose a smartPCA .evec file containing at least two PCs.",
    );
  if (eigenvalues.length && eigenvalues.length !== pcCount) {
    throw new Error(
      `The header contains ${eigenvalues.length} eigenvalues, but sample rows contain ${pcCount} PCs.`,
    );
  }
  if (duplicates)
    warnings.push(
      `${duplicates} repeated sample ID${duplicates === 1 ? "" : "s"} found. Every row is retained and can be selected independently.`,
    );
  return {
    name,
    samples,
    pcCount,
    eigenvalues,
    warnings,
    populations: [...counts]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count], i) => ({ name, count, color: populationColor(i) })),
  };
}
