/**
 * Engine-Agnostic Plot Specification Models
 *
 * Formal data structures defining a complete 2D PCA visualization.
 * Independent of rendering libraries (Plotly, Canvas 2D, WebGL, SVG).
 */

import type { Point } from "../../core/geometry/hull";
import type {
  AspectRatio,
  DragMode,
  GroupLabelStyle,
} from "../../core/models/settings";
import type { RenderedMarkerStyle } from "../../core/style/styleResolver";

export interface PlotPoint {
  x: number;
  y: number;
  key: number;
  sampleId: string;
  population: string;
  style: RenderedMarkerStyle;
  labelText?: string;
  hoverText: string;
}

export interface PlotTrace {
  name: string;
  population: string;
  points: PlotPoint[];
  type: "scatter" | "scattergl";
  showLegend: boolean;
}

export interface PlotShape {
  id: string;
  type: "hull" | "regression";
  name: string;
  path?: string;
  polygon?: Point[];
  line?: { x0: number; y0: number; x1: number; y1: number };
  color: string;
  opacity: number;
  width: number;
  dash?: "solid" | "dash" | "dot";
}

export interface LabelOffset {
  ax: number;
  ay: number;
}

export interface PlotAnnotation {
  id: string;
  kind: "population" | "sample";
  targetKey: string | number;
  text: string;
  x: number;
  y: number;
  offset: LabelOffset;
  style: GroupLabelStyle;
  color: string;
  size: number;
  opacity: number;
  connector: boolean;
}

export interface PlotAxisSpec {
  title: string;
  titleSize: number;
  titleWeight: number;
  range?: [number, number];
  grid: boolean;
  gridColor: string;
  zeroLine: boolean;
  zeroLineColor: string;
  lineColor: string;
  lineWidth: number;
  tickFontSize: number;
  spikes: boolean;
  scaleAnchor?: "x" | "y";
}

export interface PlotLayoutSpec {
  title: string;
  subtitle: string;
  background: string;
  aspectRatio: AspectRatio;
  margin: { l: number; r: number; t: number; b: number };
  xaxis: PlotAxisSpec;
  yaxis: PlotAxisSpec;
  dragMode: DragMode;
  hoverMode: "closest" | "off";
}

export interface PlotOverlay {
  selectionKeys: number[];
  markedKeys: number[];
}

export interface PlotSpec {
  traces: PlotTrace[];
  shapes: PlotShape[];
  annotations: PlotAnnotation[];
  layout: PlotLayoutSpec;
  overlays: PlotOverlay;
}
