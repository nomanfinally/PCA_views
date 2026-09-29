/**
 * Cascading Style Engine
 *
 * Deterministic 3-tier style resolution:
 *   Sample Override -> Population Override -> Global Plot Settings
 *
 * Computes resolved visual properties for markers, outlines, fills, and labels
 * with zero DOM or visualization library dependencies.
 */

import { shadeColor, toRgbaString } from "../color/colorUtils";
import type { Population } from "../models/dataset";
import type {
  PlotSettings,
  PopulationStyle,
  SampleStyle,
  MarkerSymbol,
  OutlineMode,
} from "../models/settings";
import {
  getPresetSymbol,
  isHollowSymbol,
  toHollowSymbol,
  toSolidSymbol,
  applyTreatmentToSymbol,
} from "./symbols";

export interface ResolvedMarkerStyle {
  color: string;
  symbol: MarkerSymbol;
  size: number;
  fillOpacity: number;
  outlineOpacity: number;
  line: {
    color: string;
    width: number;
  };
  isHollow: boolean;
}

export interface RenderedMarkerStyle {
  color: string;
  symbol: MarkerSymbol;
  size: number;
  fillOpacity: number;
  outlineOpacity: number;
  line: {
    color: string;
    width: number;
  };
  isHollow: boolean;
}

export interface StyleResolutionParams {
  population: Population;
  settings: PlotSettings;
  populationOverride?: PopulationStyle;
  sampleOverride?: SampleStyle;
  sampleIndex?: number;
}

/**
 * Resolves the baseline appearance of a population (color and base symbol).
 */
export function resolvePopulationAppearance(
  population: Population,
  settings: PlotSettings,
  populationOverride?: PopulationStyle,
): { color: string; symbol: MarkerSymbol } {
  return {
    color: settings.grayscale
      ? "#969696"
      : (populationOverride?.color ?? population.color),
    symbol: populationOverride?.symbol ?? "circle",
  };
}

/**
 * Computes an outline color for a given mode and primary point color.
 */
export function resolveOutlineColor(mode: OutlineMode, color: string): string {
  switch (mode) {
    case "black":
      return "#000000";
    case "matching":
      return color;
    case "darker":
    default:
      return shadeColor(color, -0.42);
  }
}

/**
 * Evaluates the full 3-tier cascade to resolve the complete styling of a point.
 */
export function resolveMarkerStyle(
  params: StyleResolutionParams,
): ResolvedMarkerStyle {
  const {
    population,
    settings,
    populationOverride,
    sampleOverride,
    sampleIndex = 0,
  } = params;

  // 1. Color resolution
  const popBase = resolvePopulationAppearance(
    population,
    settings,
    populationOverride,
  );
  const color = sampleOverride?.color ?? popBase.color;

  // 2. Base symbol resolution from preset or population override
  let symbol: MarkerSymbol;
  if (populationOverride?.markerPreset) {
    symbol = getPresetSymbol(populationOverride.markerPreset, sampleIndex);
  } else if (populationOverride?.symbol) {
    symbol = populationOverride.symbol;
  } else {
    symbol = getPresetSymbol(settings.markerPreset, sampleIndex);
  }

  // 3. Population marker treatment (filled, hollow, mixed, inherit)
  if (
    populationOverride?.markerTreatment &&
    populationOverride.markerTreatment !== "inherit"
  ) {
    symbol = applyTreatmentToSymbol(
      symbol,
      populationOverride.markerTreatment,
      sampleIndex,
    );
  }

  const populationHollow = isHollowSymbol(symbol);

  // 4. Sample symbol and treatment overrides
  if (sampleOverride?.symbol) {
    symbol = sampleOverride.symbol;
  }

  if (sampleOverride?.markerTreatment) {
    symbol = applyTreatmentToSymbol(
      symbol,
      sampleOverride.markerTreatment,
      sampleIndex,
      populationHollow,
    );
  }

  const isHollow = isHollowSymbol(symbol);

  // 5. Size resolution
  const size =
    sampleOverride?.size ?? populationOverride?.size ?? settings.size;

  // 6. Fill opacity resolution
  const fillOpacity =
    sampleOverride?.opacity ?? populationOverride?.opacity ?? settings.opacity;

  // 7. Outline mode & color resolution
  const activeOutlineMode =
    sampleOverride?.outlineMode ??
    populationOverride?.outlineMode ??
    settings.outlineMode;

  const outline =
    sampleOverride?.outlineColor ??
    (sampleOverride?.outlineMode
      ? resolveOutlineColor(sampleOverride.outlineMode, color)
      : (populationOverride?.outlineColor ??
        resolveOutlineColor(activeOutlineMode, color)));

  // 8. Outline opacity resolution
  const defaultOutlineOpacity =
    activeOutlineMode === "matching" && !isHollow
      ? fillOpacity
      : settings.outlineOpacity;

  const outlineOpacity =
    sampleOverride?.outlineOpacity ??
    populationOverride?.outlineOpacity ??
    defaultOutlineOpacity;

  // 9. Outline width resolution
  const outlineWidth =
    sampleOverride?.outlineWidth ??
    populationOverride?.outlineWidth ??
    settings.outlineWidth;

  return {
    color,
    symbol,
    size,
    fillOpacity,
    outlineOpacity,
    line: {
      color: outline,
      width: outlineWidth,
    },
    isHollow,
  };
}

/**
 * Transforms a resolved marker into the rendered format required by renderers:
 * - If hollow: fill is completely transparent (rgba(0,0,0,0)), line receives outlineOpacity,
 *   and symbol has the '-open' suffix stripped so renderers don't draw double outlines.
 * - If filled: fill receives fillOpacity, line receives outlineOpacity.
 */
export function toRenderedMarker(
  resolved: ResolvedMarkerStyle,
): RenderedMarkerStyle {
  const isHollow = resolved.isHollow || isHollowSymbol(resolved.symbol);
  const baseSymbol = toSolidSymbol(resolved.symbol);

  return {
    ...resolved,
    color: isHollow
      ? "rgba(0,0,0,0)"
      : toRgbaString(resolved.color, resolved.fillOpacity),
    line: {
      ...resolved.line,
      color: toRgbaString(resolved.line.color, resolved.outlineOpacity),
    },
    symbol: isHollow ? baseSymbol : resolved.symbol,
    isHollow,
  };
}

/** Legacy adapter providing exact signature of legacy markerAppearance */
export function markerAppearance(
  population: Population,
  state: {
    settings: PlotSettings;
    populations: Map<string, PopulationStyle>;
  },
  sample?: SampleStyle,
  sampleIndex = 0,
) {
  return resolveMarkerStyle({
    population,
    settings: state.settings,
    populationOverride: state.populations.get(population.name),
    sampleOverride: sample,
    sampleIndex,
  });
}

/** Legacy adapter providing exact signature of legacy populationAppearance */
export function populationAppearance(
  population: Population,
  state: {
    settings: PlotSettings;
    populations: Map<string, PopulationStyle>;
  },
) {
  return resolvePopulationAppearance(
    population,
    state.settings,
    state.populations.get(population.name),
  );
}

/** Legacy adapter providing exact signature of legacy renderedMarker */
export function renderedMarker(
  appearance: ResolvedMarkerStyle,
): RenderedMarkerStyle {
  return toRenderedMarker(appearance);
}
