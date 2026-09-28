import type { Sample } from "./types";
function cell(value: string | number): string {
  let text = String(value);
  // Prevent spreadsheet formulas in user-controlled sample and population names.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function samplesToCsv(samples: Sample[], pcCount: number): string {
  return [
    [
      "Sample",
      "Population",
      ...Array.from({ length: pcCount }, (_, i) => `PC${i + 1}`),
    ],
  ]
    .map((row) => row.map(cell).join(","))
    .concat(
      samples.map((sample) =>
        [sample.id, sample.population, ...sample.pcs].map(cell).join(","),
      ),
    )
    .join("\r\n");
}
export function downloadText(text: string, name: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
