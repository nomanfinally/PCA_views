import type { Dataset } from "./types";
import { initialView, type ViewState } from "./viewState";
import type { LabelOffset } from "./plotModel";
import type { ImageOptions } from "./imageExport";
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
  state: Omit<ViewState, "populations" | "points" | "selected"> & {
    populations: [string, import("./viewState").PopulationStyle][];
    points: [number, import("./viewState").SampleStyle][];
    selected: number[];
  };
  viewport: ViewportSnapshot;
  imageOptions?: ImageOptions;
}
export function serializeArchive(
  dataset: Dataset,
  state: ViewState,
  viewport: ViewportSnapshot,
  imageOptions?: ImageOptions,
): Archive {
  return {
    version: 1,
    dataset,
    state: {
      ...state,
      inspector: null,
      populations: [...state.populations],
      points: [...state.points],
      selected: [...state.selected],
    },
    viewport,
    imageOptions,
  };
}
export function restoreArchiveState(archive: Archive): ViewState {
  return {
    ...initialView(archive.dataset),
    ...archive.state,
    settings: { ...initialView().settings, ...archive.state.settings },
    populations: new Map(archive.state.populations),
    points: new Map(archive.state.points),
    selected: new Set(archive.state.selected),
    inspector: null,
  };
}
export function readArchive(): Archive | null {
  if (typeof document === "undefined") return null;
  const text = document.getElementById("pca-archive")?.textContent;
  if (!text) return null;
  const data = JSON.parse(text) as Archive;
  if (data.version !== 1)
    throw new Error("Unsupported PCA Views archive version.");
  return data;
}
export const embeddedArchive = readArchive();
export function archiveHtml(
  archive: Archive,
  runtime: { js: string; css: string },
) {
  const payload = JSON.stringify(archive)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PCA Views · Interactive archive</title><style id="pca-style">${runtime.css.replace(/<\/style/gi, "<\\/style")}</style></head><body><div id="root"></div><script id="pca-archive" type="application/json">${payload}</script><script id="pca-runtime">${runtime.js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}
export async function downloadArchive(archive: Archive) {
  const inline = document.getElementById("pca-runtime");
  let runtime: { js: string; css: string };
  if (inline)
    runtime = {
      js: inline.textContent!,
      css: document.getElementById("pca-style")!.textContent!,
    };
  else {
    const response = await fetch(
      new URL("archive-runtime.json", document.baseURI),
    );
    if (!response.ok)
      throw new Error(
        "Could not load the offline viewer bundle. Please try again.",
      );
    runtime = await response.json();
  }
  const url = URL.createObjectURL(
    new Blob([archiveHtml(archive, runtime)], {
      type: "text/html;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${archive.dataset.name.replace(/\.evec$/i, "")}_interactive.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
