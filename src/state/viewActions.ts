/**
 * Typed ViewState Actions & Action Creators
 */

import type { PaletteName } from "../core/color/palettes";
import type { Dataset } from "../core/models/dataset";
import type {
  DragMode,
  MarkerPreset,
  PlotSettings,
  PopulationStyle,
  SampleStyle,
} from "../core/models/settings";

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
  | { type: "resetAppearance" }
  | { type: "toggleExcludeSample"; key: number }
  | { type: "setSampleExcluded"; key: number; excluded: boolean }
  | { type: "setMultipleExcluded"; keys: number[]; excluded: boolean }
  | { type: "setSamplePopulation"; key: number; population: string }
  | { type: "resetSamplePopulation"; key: number }
  | { type: "clearAllExclusions" };

// Action Creators
export const viewActions = {
  resetView: (dataset: Dataset): ViewAction => ({ type: "resetView", dataset }),
  toggleExcludeSample: (key: number): ViewAction => ({
    type: "toggleExcludeSample",
    key,
  }),
  setSampleExcluded: (key: number, excluded: boolean): ViewAction => ({
    type: "setSampleExcluded",
    key,
    excluded,
  }),
  setSamplePopulation: (key: number, population: string): ViewAction => ({
    type: "setSamplePopulation",
    key,
    population,
  }),
  resetSamplePopulation: (key: number): ViewAction => ({
    type: "resetSamplePopulation",
    key,
  }),
  setSpectrum: (value: number[], name: string): ViewAction => ({
    type: "spectrum",
    value,
    name,
  }),
  setPalette: (names: string[], value: PaletteName): ViewAction => ({
    type: "palette",
    names,
    value,
  }),
  setMarkerPreset: (names: string[], value: MarkerPreset): ViewAction => ({
    type: "markers",
    names,
    value,
  }),
  setAxes: (x: number, y: number): ViewAction => ({ type: "axes", x, y }),
  setDragMode: (value: DragMode): ViewAction => ({ type: "mode", value }),
  setSearch: (value: string): ViewAction => ({ type: "search", value }),
  toggleLegend: (): ViewAction => ({ type: "legend" }),
  patchSettings: (patch: Partial<PlotSettings>): ViewAction => ({
    type: "settings",
    patch,
  }),
  patchPopulation: (name: string, patch: PopulationStyle): ViewAction => ({
    type: "population",
    name,
    patch,
  }),
  patchAllPopulations: (
    names: string[],
    patch: PopulationStyle,
  ): ViewAction => ({ type: "allPopulations", names, patch }),
  isolatePopulation: (names: string[], name: string): ViewAction => ({
    type: "isolate",
    names,
    name,
  }),
  resetPopulation: (name: string): ViewAction => ({
    type: "resetPopulation",
    name,
  }),
  toggleMark: (key: number): ViewAction => ({ type: "toggleMark", key }),
  resetPoint: (key: number): ViewAction => ({ type: "resetPoint", key }),
  patchPoint: (key: number, patch: SampleStyle): ViewAction => ({
    type: "point",
    key,
    patch,
  }),
  inspectPoint: (key: number | null, mark?: boolean): ViewAction => ({
    type: "inspect",
    key,
    mark,
  }),
  selectPoints: (keys: number[]): ViewAction => ({ type: "select", keys }),
  markSelection: (marked: boolean): ViewAction => ({
    type: "markSelection",
    marked,
  }),
  clearMarks: (): ViewAction => ({ type: "clearMarks" }),
  resetAppearance: (): ViewAction => ({ type: "resetAppearance" }),
};
