/**
 * Plot Specification Builder
 *
 * Pure transformation pipeline:
 * (Dataset, ActiveSamples, ViewState, LabelOffsets) -> PlotSpec
 *
 * Constructs a complete engine-agnostic visualization specification.
 */

import { chartContrast } from "../../core/color/contrast";
import { centroid, convexHull, type Point } from "../../core/geometry/hull";
import { regressionLine } from "../../core/geometry/regression";
import { paddedRange } from "../../core/geometry/viewport";
import type { Dataset, Sample } from "../../core/models/dataset";
import type {
  DragMode,
  GroupLabelStyle,
  PlotSettings,
  PopulationStyle,
  SampleStyle,
} from "../../core/models/settings";
import { formatAxisTitle } from "../../core/parsers/parseSpectrum";
import {
  resolveMarkerStyle,
  toRenderedMarker,
} from "../../core/style/styleResolver";
import type {
  LabelOffset,
  PlotAnnotation,
  PlotAxisSpec,
  PlotLayoutSpec,
  PlotPoint,
  PlotShape,
  PlotSpec,
  PlotTrace,
} from "./plotSpec";

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!,
  );

export const annotationName = (
  kind: "population" | "sample",
  id: string | number,
): string => JSON.stringify([kind, id]);

export interface PlotViewState {
  x: number;
  y: number;
  mode?: DragMode;
  dragMode?: DragMode;
  settings: PlotSettings;
  populations: Map<string, PopulationStyle>;
  points: Map<number, SampleStyle>;
  selected: Set<number>;
  spectrum?: number[];
}

export function buildPlotSpec(
  dataset: Dataset,
  samples: Sample[],
  state: PlotViewState,
  offsets = new Map<string, LabelOffset>(),
): PlotSpec {
  const { x, y, settings } = state;
  const groups = new Map<string, Sample[]>();
  const ordinals = new Map<number, number>();
  const counts = new Map<string, number>();

  // Count ordinals within populations across the entire dataset
  dataset.samples.forEach((s) => {
    const currentCount = counts.get(s.population) ?? 0;
    ordinals.set(s.key, currentCount);
    counts.set(s.population, currentCount + 1);
  });

  // Group active samples by population
  samples.forEach((sample) => {
    const group = groups.get(sample.population);
    if (group) {
      group.push(sample);
    } else {
      groups.set(sample.population, [sample]);
    }
  });

  const traces: PlotTrace[] = [];
  const shapes: PlotShape[] = [];
  const annotations: PlotAnnotation[] = [];
  const isLargeDataset = dataset.samples.length > 5000;

  for (const pop of dataset.populations) {
    const group = groups.get(pop.name);
    if (!group?.length) continue;

    const popOverride = state.populations.get(pop.name);
    const coords: Point[] = group.map((s) => [s.pcs[x], s.pcs[y]]);

    // 1. Convex Hull Shape
    if (popOverride?.hull) {
      const hull = convexHull(coords);
      if (hull.length >= 3) {
        shapes.push({
          id: `hull:${pop.name}`,
          type: "hull",
          name: `hull:${pop.name}`,
          polygon: hull,
          path: `M ${hull.map((p) => p.join(",")).join(" L ")} Z`,
          color: popOverride.color ?? pop.color,
          opacity: popOverride.hullOpacity ?? settings.hullOpacity,
          width: 1.2,
          dash: "solid",
        });
      }
    }

    // 2. Linear Regression Line (including 2-point fallback)
    const pairFallback =
      !!popOverride?.hull &&
      coords.length === 2 &&
      (coords[0][0] !== coords[1][0] || coords[0][1] !== coords[1][1]);

    if (popOverride?.regression || pairFallback) {
      const line = pairFallback
        ? [coords[0], coords[1]]
        : regressionLine(coords);

      if (line) {
        shapes.push({
          id: `regression:${pop.name}`,
          type: "regression",
          name: `regression:${pop.name}`,
          line: {
            x0: line[0][0],
            y0: line[0][1],
            x1: line[1][0],
            y1: line[1][1],
          },
          color: popOverride?.color ?? pop.color,
          opacity: popOverride?.regression
            ? 1
            : (popOverride?.hullOpacity ?? settings.hullOpacity),
          width: 1.5,
          dash: "dash",
        });
      }
    }

    // 3. Population Centroid Annotation
    if (popOverride?.label ?? settings.groupLabels) {
      const name = annotationName("population", pop.name);
      const offset = offsets.get(`${x}:${y}:${name}`) ??
        offsets.get(`${x}:${y}:${pop.name}`) ?? { ax: 22, ay: -28 };

      annotations.push({
        id: name,
        kind: "population",
        targetKey: pop.name,
        text: pop.name,
        x: centroid(coords)[0],
        y: centroid(coords)[1],
        offset,
        style: popOverride?.labelStyle ?? settings.groupLabelStyle,
        color: popOverride?.labelColor ?? popOverride?.color ?? pop.color,
        size: popOverride?.labelSize ?? settings.groupLabelSize ?? 11,
        opacity: popOverride?.labelOpacity ?? 1,
        connector: popOverride?.labelConnector ?? settings.groupLabelConnector,
      });
    }

    // 4. Per-Sample Callout Annotations
    for (const sample of group) {
      const sampleOverride = state.points.get(sample.key);
      if (!sampleOverride?.label) continue;

      const name = annotationName("sample", sample.key);
      const offset = offsets.get(`${x}:${y}:${name}`) ?? { ax: 22, ay: -28 };

      annotations.push({
        id: name,
        kind: "sample",
        targetKey: sample.key,
        text: sample.id,
        x: sample.pcs[x],
        y: sample.pcs[y],
        offset,
        style:
          sampleOverride.labelStyle ??
          popOverride?.labelStyle ??
          settings.groupLabelStyle,
        color:
          sampleOverride.labelColor ??
          popOverride?.labelColor ??
          sampleOverride.color ??
          popOverride?.color ??
          pop.color,
        size:
          sampleOverride.labelSize ??
          popOverride?.labelSize ??
          settings.groupLabelSize ??
          11,
        opacity: sampleOverride.labelOpacity ?? popOverride?.labelOpacity ?? 1,
        connector:
          sampleOverride.labelConnector ??
          popOverride?.labelConnector ??
          settings.groupLabelConnector,
      });
    }

    // 5. Trace Points & Hover text
    const points: PlotPoint[] = group.map((sample) => {
      const sampleOverride = state.points.get(sample.key);
      const resolved = resolveMarkerStyle({
        population: pop,
        settings,
        populationOverride: popOverride,
        sampleOverride,
        sampleIndex: ordinals.get(sample.key) ?? 0,
      });
      const rendered = toRenderedMarker(resolved);

      // Point label determination
      const labelMode =
        sampleOverride?.pointLabels ??
        popOverride?.pointLabels ??
        settings.labels;

      let labelText: string | undefined;
      if (labelMode !== "none" && !sampleOverride?.label) {
        labelText =
          labelMode === "population"
            ? sample.population
            : labelMode === "full"
              ? `${sample.population}: ${sample.id}`
              : sample.id;
      }

      // Hover text parts
      const hoverParts: string[] = [];
      if (settings.hoverIid) hoverParts.push(escapeHtml(sample.id));
      if (settings.hoverFid) hoverParts.push(escapeHtml(sample.population));
      if (settings.hoverCoordinates) {
        hoverParts.push(
          `${sample.pcs[x].toPrecision(6)}<br>${sample.pcs[y].toPrecision(6)}`,
        );
      }

      return {
        x: sample.pcs[x],
        y: sample.pcs[y],
        key: sample.key,
        sampleId: sample.id,
        population: sample.population,
        style: rendered,
        labelText,
        hoverText: hoverParts.join("<br>"),
      };
    });

    traces.push({
      name: pop.name,
      population: pop.name,
      points,
      type: isLargeDataset ? "scattergl" : "scatter",
      showLegend: true,
    });
  }

  // 6. Layout Specification
  const theme = chartContrast(settings.chartBackground);
  const spectrum = state.spectrum ?? [];

  const xaxis: PlotAxisSpec = {
    title: formatAxisTitle(dataset, settings, spectrum, x),
    titleSize: settings.axisTitleSize,
    titleWeight: settings.axisTitleWeight,
    range: paddedRange(dataset.samples.map((s) => s.pcs[x] ?? 0)),
    grid: settings.grid,
    gridColor: theme.grid,
    zeroLine: true,
    zeroLineColor: theme.zero,
    lineColor: theme.line,
    lineWidth: settings.axisLineWidth,
    tickFontSize: settings.tickFontSize,
    spikes: settings.spikes,
  };

  const yaxis: PlotAxisSpec = {
    title: formatAxisTitle(dataset, settings, spectrum, y),
    titleSize: settings.axisTitleSize,
    titleWeight: settings.axisTitleWeight,
    range: paddedRange(dataset.samples.map((s) => s.pcs[y] ?? 0)),
    grid: settings.grid,
    gridColor: theme.grid,
    zeroLine: true,
    zeroLineColor: theme.zero,
    lineColor: theme.line,
    lineWidth: settings.axisLineWidth,
    tickFontSize: settings.tickFontSize,
    spikes: settings.spikes,
    scaleAnchor: settings.equalScale ? "x" : undefined,
  };

  const layout: PlotLayoutSpec = {
    title: settings.title,
    subtitle: settings.subtitle,
    background: settings.chartBackground,
    aspectRatio: settings.aspectRatio,
    margin: { l: 60, r: 24, t: 40, b: 60 },
    xaxis,
    yaxis,
    dragMode: state.mode ?? state.dragMode ?? "pan",
    hoverMode: settings.hover,
  };

  // 7. Overlays
  const markedKeys = samples
    .filter((s) => state.points.get(s.key)?.marked)
    .map((s) => s.key);

  const selectionKeys = Array.from(state.selected);

  return {
    traces,
    shapes,
    annotations,
    layout,
    overlays: {
      selectionKeys,
      markedKeys,
    },
  };
}
