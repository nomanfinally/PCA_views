/**
 * Plot & Style Settings Models
 *
 * Defines all configuration options, marker presets, symbol sets,
 * and default visual parameters for the PCA visualization.
 */

import type { PaletteName } from "../color/palettes";

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

export const hullOpacityPresets = [0.05, 0.1, 0.15, 0.3, 0.5, 0.75] as const;

export { chartBackgroundPresets } from "../color/contrast";

export const axisThicknessPresets = [0.5, 1, 1.25, 1.5, 1.75, 2] as const;

export const axisFramePresets = ["enclosed", "standard"] as const;
export type AxisFrame = (typeof axisFramePresets)[number];

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

export const markerPresets = [
  "circles",
  "hollow-circles",
  "shapes",
  "hollow-shapes",
] as const;
export type MarkerPreset = (typeof markerPresets)[number];

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

export type OutlineMode = "matching" | "darker" | "black";

/** Overrides applied at the individual population level */
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
  pointLabelSize?: number;
  hidden?: boolean;
  color?: string;
  symbol?: MarkerSymbol;
  hull?: boolean;
  regression?: boolean;
  label?: boolean;
}

/** Overrides applied at the individual sample level */
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
  pointLabelSize?: number;
  opacity?: number;
  outlineOpacity?: number;
  symbol?: MarkerSymbol;
  size?: number;
  outlineMode?: OutlineMode;
  outlineColor?: string;
  color?: string;
  marked?: boolean;
}

/** Global plot settings controlling canvas layout, defaults, and themes */
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
  pointLabelSize: number;
  groupLabelSize: number;
  clampGroupLabelsToEdge: boolean;
  axisFrame: AxisFrame;
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
  clampGroupLabelsToEdge: true,
  axisFrame: "enclosed",
  tickFontSize: 12,
  axisLineWidth: 1.25,
  axisTitleSize: 14,
  axisTitleWeight: 400,
  hullOpacity: 0.15,
  title: "",
  subtitle: "",
  legendCounts: true,
  pointLabelSize: 10,
  groupLabelSize: 11,
};
