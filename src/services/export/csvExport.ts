/**
 * CSV Export Service
 *
 * Formula-safe serialization of biological sample coordinates to CSV format.
 */

import type { Sample } from "../../core/models/dataset";

/**
 * Escapes CSV cell content, preventing formula injection vulnerabilities in spreadsheets
 * by prefixing dangerous formula trigger characters (=, +, -, @, \t, \r) with an apostrophe.
 */
export function formatCsvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export interface SampleExportOptions {
  excludedKeys?: Set<number>;
  samplePopulations?: Map<number, string>;
}

/**
 * Serializes an array of samples and their principal component coordinates to standard CSV format.
 * Applies formula-safety and appends '_excluded' for unplotted samples if options provided.
 */
export function samplesToCsv(
  samples: Sample[],
  pcCount: number,
  options?: SampleExportOptions,
): string {
  const header = [
    "Sample",
    "Population",
    ...Array.from({ length: pcCount }, (_, i) => `PC${i + 1}`),
  ];

  const rows = [
    header.map(formatCsvCell).join(","),
    ...samples.map((sample) => {
      const customPop = options?.samplePopulations?.get(sample.key);
      const basePop = customPop ?? sample.population;
      const isExcluded = Boolean(options?.excludedKeys?.has(sample.key));
      const pop =
        isExcluded && !basePop.endsWith("_excluded")
          ? `${basePop}_excluded`
          : basePop;

      return [sample.id, pop, ...sample.pcs].map(formatCsvCell).join(",");
    }),
  ];

  return rows.join("\r\n");
}

/**
 * Serializes samples to smartPCA .evec format.
 * Format:
 * #eigvals:  val1  val2 ...
 * SAMPLE_ID   PC1   PC2 ...  POPULATION
 * Excluded samples retain their row with '_excluded' appended to their population.
 */
export function samplesToEvec(
  samples: Sample[],
  eigenvalues: number[] = [],
  options?: SampleExportOptions,
): string {
  const lines: string[] = [];
  if (eigenvalues && eigenvalues.length > 0) {
    lines.push(`#eigvals: ${eigenvalues.map((v) => v.toFixed(6)).join("  ")}`);
  }

  for (const sample of samples) {
    const customPop = options?.samplePopulations?.get(sample.key);
    const basePop = customPop ?? sample.population;
    const isExcluded = Boolean(options?.excludedKeys?.has(sample.key));
    const pop =
      isExcluded && !basePop.endsWith("_excluded")
        ? `${basePop}_excluded`
        : basePop;

    const pcsStr = sample.pcs
      .map((val) => val.toFixed(6).padStart(12, " "))
      .join(" ");

    lines.push(`${sample.id.padEnd(20, " ")} ${pcsStr}  ${pop}`);
  }

  return lines.join("\n") + "\n";
}

/**
 * Triggers a browser download of a given text content.
 */
export function downloadText(
  text: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Triggers a browser download of a given Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
