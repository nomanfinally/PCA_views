/**
 * Interactive HTML Archive Service
 *
 * Packages the dataset, complete view state, viewport ranges, and application runtime
 * into a single-file, self-contained, offline-runnable HTML file.
 */

import type { Dataset } from "../../core/models/dataset";
import type { PopulationStyle, SampleStyle } from "../../core/models/settings";
import type { LabelOffset } from "../../plot/spec/plotSpec";
import type { ImageOptions } from "./canvasComposer";
import { downloadBlob } from "./csvExport";

export interface ViewportSnapshot {
  xRange: number[];
  yRange: number[];
  offsets: [string, LabelOffset][];
  width: number;
  height: number;
}

export interface Archive {
  version: 1;
  dataset: Dataset;
  state: any;
  viewport: ViewportSnapshot;
  imageOptions?: ImageOptions;
}

/**
 * Serializes the complete application state into an Archive object.
 */
export function serializeArchive(
  dataset: Dataset,
  state: any,
  viewport: ViewportSnapshot,
  imageOptions?: ImageOptions,
): Archive {
  return {
    version: 1,
    dataset,
    state: {
      ...state,
      inspector: null,
      populations:
        state.populations instanceof Map
          ? [...state.populations]
          : state.populations,
      points: state.points instanceof Map ? [...state.points] : state.points,
      selected:
        state.selected instanceof Set ? [...state.selected] : state.selected,
    },
    viewport,
    imageOptions,
  };
}

/**
 * Deserializes an Archive object back into live state with Maps and Sets.
 */
export function restoreArchiveState(archive: Archive): any {
  return {
    ...archive.state,
    populations: new Map<string, PopulationStyle>(archive.state.populations),
    points: new Map<number, SampleStyle>(archive.state.points),
    selected: new Set<number>(archive.state.selected),
    inspector: null,
  };
}

/**
 * Reads any embedded archive data payload injected into the current HTML document.
 * Safe to call in browser environments; returns null in headless or SSR environments.
 */
export function readEmbeddedArchive(): Archive | null {
  if (typeof document === "undefined") return null;
  const element = document.getElementById("pca-archive");
  if (!element?.textContent) return null;

  try {
    const data = JSON.parse(element.textContent) as Archive;
    if (data.version !== 1) {
      throw new Error("Unsupported PCA Views archive version.");
    }
    return data;
  } catch (err) {
    console.error("Failed to parse embedded PCA archive:", err);
    return null;
  }
}

/**
 * Compiles a self-contained offline HTML document containing the JSON archive payload
 * and the minified runtime scripts.
 */
export function generateArchiveHtml(
  archive: Archive,
  runtime: { js: string; css: string },
): string {
  // Prevent JSON from breaking out of script tags or containing line separators
  const payload = JSON.stringify(archive)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");

  const safeCss = runtime.css.replace(/<\/style/gi, "<\\/style");
  const safeJs = runtime.js.replace(/<\/script/gi, "<\\/script");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>PCA Views · Interactive archive</title>
  <style id="pca-style">${safeCss}</style>
</head>
<body>
  <div id="root"></div>
  <script id="pca-archive" type="application/json">${payload}</script>
  <script id="pca-runtime">${safeJs}</script>
</body>
</html>`;
}

/**
 * Downloads the current view as an interactive single-file HTML archive.
 */
export async function downloadArchive(archive: Archive): Promise<void> {
  const inlineRuntime = document.getElementById("pca-runtime");
  let runtime: { js: string; css: string };

  if (inlineRuntime?.textContent) {
    runtime = {
      js: inlineRuntime.textContent,
      css: document.getElementById("pca-style")?.textContent ?? "",
    };
  } else {
    const response = await fetch(
      new URL("archive-runtime.json", document.baseURI),
    );
    if (!response.ok) {
      throw new Error(
        "Could not load the offline viewer bundle. Please try again.",
      );
    }
    runtime = await response.json();
  }

  const html = generateArchiveHtml(archive, runtime);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const filename = `${archive.dataset.name.replace(/\.evec$/i, "")}_interactive.html`;

  downloadBlob(blob, filename);
}
