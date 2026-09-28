/**
 * smartPCA .evec Parser
 * 
 * High-performance, robust streaming parser for smartPCA eigenvector files.
 * Validates dimensions, eigenvalues, Fortran numeric formats, and duplicates.
 */

import { populationColor } from "../color/palettes";
import type { Dataset, Sample } from "../models/dataset";

const NUMERIC_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eEdD][+-]?\d+)?$/;

function parseNumericToken(token: string): number {
  return NUMERIC_PATTERN.test(token) ? Number(token.replace(/[dD]/, "e")) : NaN;
}

/**
 * Parses smartPCA .evec file content into a typed Dataset.
 * 
 * Supports:
 * - UTF-8 Byte Order Marks (\uFEFF)
 * - Both CRLF (\r\n) and LF (\n) line endings
 * - Optional `#eigvals:` header containing eigenvalues for each PC
 * - Arbitrary comment lines starting with `#`
 * - Fortran scientific notation (e.g. 1.2D-3 or 2.5d+0)
 * - Duplicate sample IDs (tracked with warnings and assigned unique numeric keys)
 * - Automatic alphabetical population sorting with assigned palette colors
 */
export function parseEvec(text: string, name: string): Dataset {
  const samples: Sample[] = [];
  const eigenvalues: number[] = [];
  const populationCounts = new Map<string, number>();
  const seenIds = new Set<string>();
  const warnings: string[] = [];

  let pcCount = 0;
  let duplicateCount = 0;

  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    if (!rawLine) continue;

    // Handle comment and header lines
    if (rawLine.startsWith("#")) {
      if (/^#\s*eigvals\s*:/i.test(rawLine)) {
        if (eigenvalues.length > 0) {
          throw new Error(`Line ${lineIndex + 1}: duplicate eigenvalue header.`);
        }
        const values = rawLine
          .slice(rawLine.indexOf(":") + 1)
          .trim()
          .split(/\s+/)
          .map(parseNumericToken);

        if (
          !values.length ||
          values.some((v) => !Number.isFinite(v) || v < 0)
        ) {
          throw new Error(
            `Line ${lineIndex + 1}: the eigenvalue header must contain finite, nonnegative numbers.`,
          );
        }
        eigenvalues.push(...values);
      }
      continue;
    }

    // Split row into whitespace-delimited fields
    const fields = rawLine.split(/\s+/);
    if (fields.length < 4) {
      throw new Error(
        `Line ${lineIndex + 1}: expected a sample ID, at least two PC values, and a population label.`,
      );
    }

    const id = fields[0];
    const population = fields[fields.length - 1];
    const pcTokens = fields.slice(1, -1);
    const pcs = pcTokens.map(parseNumericToken);

    if (pcs.some((v) => !Number.isFinite(v))) {
      throw new Error(
        `Line ${lineIndex + 1} (${id}): invalid PC value. Coordinates must be finite numbers.`,
      );
    }

    if (pcCount === 0) {
      pcCount = pcs.length;
    } else if (pcs.length !== pcCount) {
      throw new Error(
        `Line ${lineIndex + 1} (${id}): found ${pcs.length} PCs; expected ${pcCount}. Check for missing values or a missing population label.`,
      );
    }

    if (seenIds.has(id)) {
      duplicateCount++;
    }
    seenIds.add(id);

    samples.push({
      key: samples.length,
      id,
      population,
      pcs,
    });

    populationCounts.set(
      population,
      (populationCounts.get(population) ?? 0) + 1,
    );
  }

  if (samples.length === 0) {
    throw new Error(
      "No samples found. Choose a smartPCA .evec file containing at least two PCs.",
    );
  }

  if (eigenvalues.length > 0 && eigenvalues.length !== pcCount) {
    throw new Error(
      `The header contains ${eigenvalues.length} eigenvalues, but sample rows contain ${pcCount} PCs.`,
    );
  }

  if (duplicateCount > 0) {
    warnings.push(
      `${duplicateCount} repeated sample ID${duplicateCount === 1 ? "" : "s"} found. Every row is retained and can be selected independently.`,
    );
  }

  return {
    name,
    samples,
    pcCount,
    eigenvalues,
    warnings,
    populations: Array.from(populationCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([popName, count], idx) => ({
        name: popName,
        count,
        color: populationColor(idx),
      })),
  };
}
