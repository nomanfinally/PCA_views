/**
 * Application ViewState Models & Initialization
 *
 * Defines the core persistent view state for PCA visualization,
 * including active PC axes, global settings, population overrides,
 * sample overrides, selection, and search filters.
 */

import { paletteColor } from "../core/color/palettes";
import type { Dataset, Population } from "../core/models/dataset";
import {
  defaultSettings,
  type DragMode,
  type PlotSettings,
  type PopulationStyle,
  type SampleStyle,
} from "../core/models/settings";
import { shapeSequence } from "../core/style/symbols";

export interface ViewState {
  /** Array of all population names present in the active dataset */
  populationNames: string[];
  /** Optional custom spectrum eigenvalues loaded from an .eval file */
  spectrum: number[];
  /** Filename of the loaded spectrum file */
  spectrumName: string;
  /** Index of the principal component mapped to the horizontal X axis */
  x: number;
  /** Index of the principal component mapped to the vertical Y axis */
  y: number;
  /** Active plot canvas interaction mode */
  mode: DragMode;
  /** Search filter string for sample and population matching */
  search: string;
  /** Visibility toggle for the legend dock */
  legend: boolean;
  /** Map of per-population style and visibility overrides */
  populations: Map<string, PopulationStyle>;
  /** Map of per-sample style and highlight overrides (keyed by Sample.key) */
  points: Map<number, SampleStyle>;
  /** Set of currently highlighted or selected sample keys */
  selected: Set<number>;
  /** Sample key currently opened in the inspector popover, or null */
  inspector: number | null;
  /** Global plot appearance and canvas layout settings */
  settings: PlotSettings;
}

/**
 * Computes deterministic default styling for a population index.
 * Automatically distributes diverse marker shapes when more than 8 populations are present.
 */
export function populationDefaults(
  index: number,
  totalPopulations: number,
): PopulationStyle {
  return {
    color: paletteColor(index, "solid"),
    symbol:
      totalPopulations > 8
        ? shapeSequence[index % shapeSequence.length]
        : "circle",
  };
}

/**
 * Creates an initial clean ViewState from a dataset.
 */
export function initialView(dataset?: Dataset): ViewState {
  const popCount = dataset?.populations.length ?? 0;

  return {
    populationNames: dataset?.populations.map((p) => p.name) ?? [],
    spectrum: [],
    spectrumName: "",
    x: 0,
    y: 1,
    mode: "pan",
    search: "",
    legend: true,
    populations: new Map(
      dataset?.populations.map((p, i) => [
        p.name,
        populationDefaults(i, popCount),
      ]),
    ),
    points: new Map(),
    selected: new Set(),
    inspector: null,
    settings: {
      ...defaultSettings,
      markerPreset: popCount > 8 ? "shapes" : "circles",
    },
  };
}
