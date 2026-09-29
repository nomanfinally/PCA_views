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

/**
 * Serializes an array of samples and their principal component coordinates to standard CSV format.
 */
export function samplesToCsv(samples: Sample[], pcCount: number): string {
  const header = [
    "Sample",
    "Population",
    ...Array.from({ length: pcCount }, (_, i) => `PC${i + 1}`),
  ];

  const rows = [
    header.map(formatCsvCell).join(","),
    ...samples.map((sample) =>
      [sample.id, sample.population, ...sample.pcs]
        .map(formatCsvCell)
        .join(","),
    ),
  ];

  return rows.join("\r\n");
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
