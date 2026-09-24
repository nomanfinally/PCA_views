import type { Dataset, Population } from "./types";
import { paletteColor, shadeColor, type PaletteName } from "./colors";

export type DragMode = "pan" | "zoom" | "select" | "lasso";
export type LabelMode = "none" | "sample" | "population" | "full";
export const groupLabelStyles = ["plain", "background", "boxed"] as const;
export type GroupLabelStyle = (typeof groupLabelStyles)[number];
export const aspectRatios = [
  "full",
  "1:1",
  "16:9",
  "4:3",
  "3:2",
  "4:5",
  "9:16",
] as const;
export type AspectRatio = (typeof aspectRatios)[number];
export const legendPositions = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
  "top",
  "bottom",
] as const;
export type LegendPosition = (typeof legendPositions)[number];
export const markerTreatments = [
  "inherit",
  "filled",
  "hollow",
  "mixed",
] as const;
export type MarkerTreatment = (typeof markerTreatments)[number];
export const cycleValue = <T>(values: readonly T[], current: T) =>
  values[(values.indexOf(current) + 1) % values.length];
export const shapeSequence: MarkerSymbol[] = [
  "circle",
  "square",
  "triangle-up",
  "diamond",
  "triangle-down",
  "cross",
  "x",
  "triangle-left",
  "triangle-right",
  "hexagon",
  "pentagon",
  "star",
  "octagon",
];

export const markerSymbols = [
  "circle",
  "square",
  "diamond",
  "triangle-up",
  "triangle-down",
  "triangle-left",
  "triangle-right",
  "hexagon",
  "pentagon",
  "octagon",
  "star",
  "cross",
  "x",
  "circle-open",
  "square-open",
  "diamond-open",
  "triangle-up-open",
  "triangle-down-open",
  "triangle-left-open",
  "triangle-right-open",
  "hexagon-open",
  "pentagon-open",
  "octagon-open",
  "star-open",
] as const;
export type MarkerSymbol = (typeof markerSymbols)[number];
export type OutlineMode = "darker" | "black";
export interface PopulationStyle {
  markerTreatment?: MarkerTreatment;
  markerPreset?: MarkerPreset;
  size?: number;
  opacity?: number;
  outlineOpacity?: number;
  outlineWidth?: number;
  outlineMode?: OutlineMode;
  outlineColor?: string;
  hullOpacity?: number;
  labelStyle?: GroupLabelStyle;
  labelConnector?: boolean;
  labelSize?: number;
  labelColor?: string;
  labelOpacity?: number;
  pointLabels?: LabelMode;

  hidden?: boolean;
  color?: string;
  symbol?: MarkerSymbol;
  hull?: boolean;
  regression?: boolean;
  label?: boolean;
}
export interface SampleStyle {
  markerTreatment?: "inherit" | "filled" | "hollow";
  outlineWidth?: number;
  label?: boolean;
  labelStyle?: GroupLabelStyle;
  labelConnector?: boolean;
  labelSize?: number;
  labelColor?: string;
  labelOpacity?: number;
  pointLabels?: LabelMode;
  opacity?: number;
  outlineOpacity?: number;
  symbol?: MarkerSymbol;
  size?: number;
  outlineMode?: OutlineMode;
  outlineColor?: string;
  color?: string;
  marked?: boolean;
}
export type MarkerPreset =
  "circles" | "hollow-circles" | "shapes" | "hollow-shapes";
export interface PlotSettings {
  palette: PaletteName;
  markerPreset: MarkerPreset;
  size: number;
  opacity: number;
  outlineMode: OutlineMode;
  outlineWidth: number;
  labels: LabelMode;
  grid: boolean;
  chartBackground: string;
  spikes: boolean;
  hover: "closest" | "off";
  grayscale: boolean;
  equalScale: boolean;
  aspectRatio: AspectRatio;
  legendPosition: LegendPosition;
  legendColumns: number;
  outlineOpacity: number;
  hoverIid: boolean;
  hoverFid: boolean;
  hoverCoordinates: boolean;
  showVariance: boolean;
  varianceTotal: number | null;
  groupLabels: boolean;
  groupLabelStyle: GroupLabelStyle;
  groupLabelConnector: boolean;
  tickFontSize: number;
  axisLineWidth: number;
  axisTitleSize: number;
  axisTitleWeight: number;
  hullOpacity: number;
  title: string;
  subtitle: string;
  legendCounts: boolean;
}
export const defaultSettings: PlotSettings = {
  palette: "solid",
  markerPreset: "circles",
  size: 7,
  opacity: 1,
  outlineMode: "darker",
  outlineWidth: 0.8,
  labels: "none",
  grid: true,
  chartBackground: "#ffffff",
  spikes: false,
  hover: "closest",
  grayscale: false,
  equalScale: false,
  aspectRatio: "full",
  legendPosition: "top-right",
  legendColumns: 1,
  outlineOpacity: 1,
  hoverIid: true,
  hoverFid: false,
  hoverCoordinates: false,
  showVariance: true,
  varianceTotal: null,
  groupLabels: false,
  groupLabelStyle: "background",
  groupLabelConnector: true,
  tickFontSize: 12,
  axisLineWidth: 1.25,
  axisTitleSize: 14,
  axisTitleWeight: 400,
  hullOpacity: 0.15,
  title: "",
  subtitle: "",
  legendCounts: true,
};
export interface ViewState {
  populationNames: string[];
  spectrum: number[];
  spectrumName: string;
  x: number;
  y: number;
  mode: DragMode;
  search: string;
  legend: boolean;
  populations: Map<string, PopulationStyle>;
  points: Map<number, SampleStyle>;
  selected: Set<number>;
  inspector: number | null;
  settings: PlotSettings;
}
const populationDefaults = (index: number, count: number): PopulationStyle => ({
  color: paletteColor(index, "solid"),
  symbol: count > 8 ? shapeSequence[index % shapeSequence.length] : "circle",
});
export const axisThicknessPresets = [0.5, 1, 1.25, 1.5, 1.75, 2] as const;
export const hullOpacityPresets = [0.05, 0.1, 0.15, 0.3, 0.5, 0.75] as const;
export const initialView = (dataset?: Dataset): ViewState => ({
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
      populationDefaults(i, dataset.populations.length),
    ]),
  ),
  points: new Map(),
  selected: new Set(),
  inspector: null,
  settings: {
    ...defaultSettings,
    markerPreset: (dataset?.populations.length ?? 0) > 8 ? "shapes" : "circles",
  },
});
export type ViewAction =
  | { type: "resetView"; dataset: Dataset }
  | { type: "spectrum"; value: number[]; name: string }
  | { type: "palette"; names: string[]; value: PaletteName }
  | { type: "markers"; names: string[]; value: MarkerPreset }
  | { type: "axes"; x: number; y: number }
  | { type: "mode"; value: DragMode }
  | { type: "search"; value: string }
  | { type: "legend" }
  | { type: "settings"; patch: Partial<PlotSettings> }
  | { type: "population"; name: string; patch: PopulationStyle }
  | { type: "allPopulations"; names: string[]; patch: PopulationStyle }
  | { type: "isolate"; names: string[]; name: string }
  | { type: "resetPopulation"; name: string }
  | { type: "toggleMark"; key: number }
  | { type: "resetPoint"; key: number }
  | { type: "point"; key: number; patch: SampleStyle }
  | { type: "inspect"; key: number | null; mark?: boolean }
  | { type: "select"; keys: number[] }
  | { type: "markSelection"; marked: boolean }
  | { type: "clearMarks" }
  | { type: "resetAppearance" };
export function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "resetView":
      return initialView(action.dataset);
    case "spectrum":
      return { ...state, spectrum: action.value, spectrumName: action.name };
    case "palette": {
      const populations = new Map(state.populations);
      action.names.forEach((name, index) =>
        populations.set(name, {
          ...populations.get(name),
          color: paletteColor(index, action.value),
        }),
      );
      return {
        ...state,
        populations,
        settings: { ...state.settings, palette: action.value },
      };
    }
    case "markers": {
      const populations = new Map(state.populations);
      const shapes = shapeSequence;
      action.names.forEach((name, index) => {
        const base = action.value.includes("shapes")
          ? shapes[index % shapes.length]
          : "circle";
        populations.set(name, {
          ...populations.get(name),
          markerPreset: undefined,
          markerTreatment: undefined,
          symbol: (base +
            (action.value.startsWith("hollow") ? "-open" : "")) as MarkerSymbol,
        });
      });
      return {
        ...state,
        populations,
        settings: { ...state.settings, markerPreset: action.value },
      };
    }

    case "axes":
      return { ...state, x: action.x, y: action.y, selected: new Set() };
    case "mode":
      return { ...state, mode: action.value };
    case "search":
      return { ...state, search: action.value };
    case "legend":
      return { ...state, legend: !state.legend };
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "population": {
      const populations = new Map(state.populations);
      populations.set(action.name, {
        ...populations.get(action.name),
        ...action.patch,
      });
      return { ...state, populations };
    }
    case "allPopulations": {
      const populations = new Map(state.populations);
      action.names.forEach((name) =>
        populations.set(name, { ...populations.get(name), ...action.patch }),
      );
      return { ...state, populations };
    }
    case "isolate": {
      const populations = new Map(state.populations);
      action.names.forEach((name) =>
        populations.set(name, {
          ...populations.get(name),
          hidden: name !== action.name,
        }),
      );
      return { ...state, populations };
    }
    case "resetPopulation": {
      const populations = new Map(state.populations);
      const hidden = populations.get(action.name)?.hidden;
      const index = state.populationNames.indexOf(action.name);
      populations.set(action.name, {
        ...(index >= 0
          ? populationDefaults(index, state.populationNames.length)
          : {}),
        hidden,
      });
      return { ...state, populations };
    }
    case "toggleMark": {
      const points = new Map(state.points);
      points.set(action.key, {
        ...points.get(action.key),
        marked: !points.get(action.key)?.marked,
      });
      return { ...state, points };
    }
    case "resetPoint": {
      const points = new Map(state.points);
      points.delete(action.key);
      return { ...state, points };
    }
    case "point": {
      const points = new Map(state.points);
      points.set(action.key, { ...points.get(action.key), ...action.patch });
      return { ...state, points };
    }
    case "inspect": {
      const points = new Map(state.points);
      if (action.key !== null && action.mark)
        points.set(action.key, { ...points.get(action.key), marked: true });
      return { ...state, inspector: action.key, points };
    }
    case "select":
      return { ...state, selected: new Set(action.keys) };
    case "markSelection": {
      const points = new Map(state.points);
      state.selected.forEach((key) =>
        points.set(key, { ...points.get(key), marked: action.marked }),
      );
      return { ...state, points };
    }
    case "clearMarks":
      return {
        ...state,
        points: new Map(
          [...state.points].map(([key, style]) => [
            key,
            { ...style, marked: false },
          ]),
        ),
        selected: new Set(),
      };
    case "resetAppearance":
      return {
        ...state,
        settings: {
          ...defaultSettings,
          markerPreset: state.populationNames.length > 8 ? "shapes" : "circles",
        },
        populations: new Map(
          (state.populationNames.length
            ? state.populationNames
            : [...state.populations.keys()]
          ).map((name, index) => [
            name,
            {
              ...(state.populationNames.length
                ? populationDefaults(index, state.populationNames.length)
                : {}),
              hidden: state.populations.get(name)?.hidden,
            },
          ]),
        ),
        points: new Map(),
        selected: new Set(),
      };
  }
}
export function filteredSamples(dataset: Dataset, state: ViewState) {
  const query = state.search.trim().toLowerCase();
  return dataset.samples.filter(
    (s) =>
      !state.populations.get(s.population)?.hidden &&
      (!query ||
        s.id.toLowerCase().includes(query) ||
        s.population.toLowerCase().includes(query)),
  );
}

/** Shared by the on-screen legend, traces, and exported legend. */
export function populationAppearance(population: Population, state: ViewState) {
  const custom = state.populations.get(population.name);
  return {
    color: state.settings.grayscale
      ? "#969696"
      : (custom?.color ?? population.color),
    symbol: custom?.symbol ?? "circle",
  };
}

/** One source of truth for plot markers, legend swatches, editors and exports. */
export function markerAppearance(
  population: Population,
  state: ViewState,
  sample?: SampleStyle,
  sampleIndex = 0,
) {
  const inherited = populationAppearance(population, state);
  const color = sample?.color ?? inherited.color;
  const custom = state.populations.get(population.name);
  let symbol = inherited.symbol;
  if (custom?.markerPreset) {
    const base = custom.markerPreset.includes("shapes")
      ? shapeSequence[sampleIndex % shapeSequence.length]
      : "circle";
    symbol = (base +
      (custom.markerPreset.startsWith("hollow")
        ? "-open"
        : "")) as MarkerSymbol;
  }
  if (custom?.markerTreatment && custom.markerTreatment !== "inherit") {
    const base = symbol.replace(/-open$/, "");
    symbol = (base +
      (custom.markerTreatment === "hollow" ||
      (custom.markerTreatment === "mixed" && sampleIndex % 2)
        ? "-open"
        : "")) as MarkerSymbol;
  }
  const populationHollow = symbol.endsWith("-open");
  symbol = sample?.symbol ?? symbol;
  if (sample?.markerTreatment) {
    symbol = (symbol.replace(/-open$/, "") +
      (sample.markerTreatment === "hollow" ||
      (sample.markerTreatment === "inherit" && populationHollow)
        ? "-open"
        : "")) as MarkerSymbol;
  }
  const outlineFor = (mode: OutlineMode) =>
    mode === "black" ? "#000000" : shadeColor(color, -0.42);
  const outline =
    sample?.outlineColor ??
    (sample?.outlineMode
      ? outlineFor(sample.outlineMode)
      : (custom?.outlineColor ??
        outlineFor(custom?.outlineMode ?? state.settings.outlineMode)));
  return {
    color,
    symbol,
    size: sample?.size ?? custom?.size ?? state.settings.size,
    fillOpacity: sample?.opacity ?? custom?.opacity ?? state.settings.opacity,
    outlineOpacity:
      sample?.outlineOpacity ??
      custom?.outlineOpacity ??
      state.settings.outlineOpacity,
    line: {
      color: outline,
      width:
        sample?.outlineWidth ??
        custom?.outlineWidth ??
        state.settings.outlineWidth,
    },
  };
}

/** Plotly open symbols ignore marker.line.color; a transparent filled shape
 * gives hollow markers the same independently editable outline in both renderers. */
export function renderedMarker(
  appearance: ReturnType<typeof markerAppearance>,
) {
  const open = appearance.symbol.endsWith("-open");
  return {
    ...appearance,
    color: open
      ? "rgba(0,0,0,0)"
      : alphaColor(appearance.color, appearance.fillOpacity),
    line: {
      ...appearance.line,
      color: alphaColor(appearance.line.color, appearance.outlineOpacity),
    },
    symbol: open ? appearance.symbol.slice(0, -5) : appearance.symbol,
  };
}

export function alphaColor(hex: string, opacity: number) {
  if (opacity === 1) return hex;
  const value = hex.slice(1);
  const rgb = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return `rgba(${rgb.join(",")},${opacity})`;
}
