/**
 * Marker Symbols, Presets, and Shape Sequences
 *
 * Central registry for marker geometry symbols, hollow/filled treatments,
 * and deterministic sequence generators.
 */

import type {
  MarkerSymbol,
  MarkerTreatment,
  MarkerPreset,
} from "../models/settings";

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

/** Base solid symbol names without the '-open' suffix */
export const solidSymbols: MarkerSymbol[] = [
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
];

/**
 * Check whether a symbol denotes a hollow (open) stroke-only marker.
 */
export function isHollowSymbol(symbol: string): boolean {
  return symbol.endsWith("-open");
}

/**
 * Strips any '-open' suffix from a marker symbol, returning its solid base shape.
 */
export function toSolidSymbol(symbol: MarkerSymbol): MarkerSymbol {
  return symbol.replace(/-open$/, "") as MarkerSymbol;
}

/**
 * Appends '-open' to a marker symbol if not already present.
 */
export function toHollowSymbol(symbol: MarkerSymbol): MarkerSymbol {
  return (isHollowSymbol(symbol) ? symbol : `${symbol}-open`) as MarkerSymbol;
}

/**
 * Derives the base marker symbol for a given preset and sample index.
 */
export function getPresetSymbol(
  preset: MarkerPreset,
  sampleIndex = 0,
): MarkerSymbol {
  const isShapes = preset.includes("shapes");
  const isHollow = preset.startsWith("hollow");
  const base = isShapes
    ? shapeSequence[sampleIndex % shapeSequence.length]
    : ("circle" as MarkerSymbol);

  return isHollow ? toHollowSymbol(base) : base;
}

/**
 * Pure function applying a fill treatment (filled, hollow, mixed, inherit) to a symbol.
 */
export function applyTreatmentToSymbol(
  symbol: MarkerSymbol,
  treatment: MarkerTreatment,
  sampleIndex = 0,
  inheritedHollow = false,
): MarkerSymbol {
  if (treatment === "inherit") {
    return inheritedHollow ? toHollowSymbol(symbol) : toSolidSymbol(symbol);
  }
  if (treatment === "filled") {
    return toSolidSymbol(symbol);
  }
  if (treatment === "hollow") {
    return toHollowSymbol(symbol);
  }
  if (treatment === "mixed") {
    return sampleIndex % 2 === 1
      ? toHollowSymbol(symbol)
      : toSolidSymbol(symbol);
  }
  return symbol;
}
