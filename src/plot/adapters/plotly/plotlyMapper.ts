/**
 * PlotSpec to Plotly Mapper
 *
 * Transforms an engine-agnostic PlotSpec into concrete Plotly Data, Layout, and Config objects.
 */

import type { Annotations, Config, Data, Layout, Shape } from "plotly.js";
import type {
  PlotAnnotation,
  PlotPoint,
  PlotShape,
  PlotSpec,
  PlotTrace,
} from "../../spec/plotSpec";
import { clampCentroidToViewport } from "../../../core/geometry/viewport";

export interface PlotlyBundle {
  data: Data[];
  layout: Partial<Layout>;
  config: Partial<Config>;
}

export function mapTraceToPlotly(trace: PlotTrace): Data {
  const hasLabels = trace.points.some((p) => Boolean(p.labelText));
  const markers = trace.points.map((p) => p.style);

  return {
    type: trace.type,
    mode: hasLabels ? "markers+text" : "markers",
    name: trace.name,
    legendgroup: trace.population,
    showlegend: trace.showLegend,
    x: trace.points.map((p) => p.x),
    y: trace.points.map((p) => p.y),
    customdata: trace.points.map((p) => p.key),
    text: trace.points.map((p) => p.labelText ?? ""),
    textposition: "top center",
    textfont: {
      size: markers.length > 0 ? markers[0].size : 10,
      color: markers.length > 0 ? markers[0].color : "#000000",
    },
    marker: {
      color: markers.map((m) => m.color),
      size: markers.map((m) => m.size),
      symbol: markers.map((m) => m.symbol),
      opacity: 1,
      line: {
        color: markers.map((m) => m.line.color),
        width: markers.map((m) => m.line.width),
      },
    },
    hovertext: trace.points.map((p) => p.hoverText),
    hoverinfo: trace.points.length > 0 ? undefined : "skip",
    hovertemplate: "%{hovertext}<extra></extra>",
  } as Data;
}

export function mapShapeToPlotly(shape: PlotShape): Partial<Shape> {
  if (shape.type === "hull" && shape.path) {
    return {
      type: "path",
      name: shape.name,
      path: shape.path,
      fillcolor: shape.color,
      opacity: shape.opacity,
      line: { color: shape.color, width: shape.width },
      layer: "below",
      xref: "x",
      yref: "y",
    };
  }

  if (shape.type === "regression" && shape.line) {
    return {
      type: "line",
      name: shape.name,
      x0: shape.line.x0,
      y0: shape.line.y0,
      x1: shape.line.x1,
      y1: shape.line.y1,
      line: {
        color: shape.color,
        width: shape.width,
        dash: shape.dash ?? "dash",
      },
      opacity: shape.opacity,
      layer: "below",
      xref: "x",
      yref: "y",
    };
  }

  return {};
}

export function mapAnnotationToPlotly(
  ann: PlotAnnotation,
  viewport?: {
    xRange?: [number, number];
    yRange?: [number, number];
    clampEdge?: boolean;
  },
): Partial<Annotations> & { name?: string } {
  let targetX = ann.x;
  let targetY = ann.y;
  let offsetAx = ann.offset.ax;
  let offsetAy = ann.offset.ay;

  if (
    viewport?.clampEdge &&
    viewport.xRange &&
    viewport.xRange.length >= 2 &&
    viewport.yRange &&
    viewport.yRange.length >= 2 &&
    ann.kind === "population" &&
    ann.centroid
  ) {
    const { clamped, isOffscreen, edgeSide } = clampCentroidToViewport(
      ann.centroid,
      [viewport.xRange[0], viewport.xRange[1]],
      [viewport.yRange[0], viewport.yRange[1]],
    );
    if (isOffscreen) {
      targetX = clamped[0];
      targetY = clamped[1];
      // If user hasn't customized offset (offset is default ax: 22, ay: -28), position inside screen:
      if (ann.offset.ax === 22 && ann.offset.ay === -28) {
        if (edgeSide === "right") {
          offsetAx = -36;
          offsetAy = 0;
        } else if (edgeSide === "left") {
          offsetAx = 36;
          offsetAy = 0;
        } else if (edgeSide === "top") {
          offsetAx = 0;
          offsetAy = 28;
        } else if (edgeSide === "bottom") {
          offsetAx = 0;
          offsetAy = -28;
        }
      }
    }
  }

  return {
    name: ann.id,
    x: targetX,
    y: targetY,
    xref: "x",
    yref: "y",
    text: ann.text,
    showarrow: true,
    ax: offsetAx,
    ay: offsetAy,
    arrowhead: 0,
    arrowwidth: 1,
    arrowcolor: ann.connector ? ann.color : "rgba(0,0,0,0)",
    font: { size: ann.size, color: ann.color },
    opacity: ann.opacity,
    bordercolor: ann.style === "boxed" ? ann.color : "rgba(0,0,0,0)",
    borderwidth: ann.style === "boxed" ? 1 : 0,
    bgcolor: ann.style === "plain" ? "rgba(0,0,0,0)" : "rgba(255,255,255,0.9)",
    borderpad: 4,
    captureevents: true,
  };
}

export function mapSpecToPlotly(
  spec: PlotSpec,
  currentViewport?: {
    xRange?: [number, number];
    yRange?: [number, number];
  },
): PlotlyBundle {
  const data: Data[] = spec.traces.map(mapTraceToPlotly);

  // Overlay Traces: Marked points and Selection
  const allPoints = spec.traces.flatMap((t) => t.points);
  const pointMap = new Map(allPoints.map((p) => [p.key, p]));

  // 1. Marked points overlay
  if (spec.overlays.markedKeys.length > 0) {
    const markedPoints = spec.overlays.markedKeys
      .map((k) => pointMap.get(k))
      .filter((p): p is (typeof allPoints)[0] => Boolean(p));

    if (markedPoints.length > 0) {
      data.push({
        type: spec.traces[0]?.type ?? "scatter",
        name: "marked",
        showlegend: false,
        mode: "markers",
        x: markedPoints.map((p) => p.x),
        y: markedPoints.map((p) => p.y),
        customdata: markedPoints.map((p) => p.key),
        marker: {
          size: markedPoints.map((p) => p.style.size + 6),
          symbol: "circle-open",
          color: "#d13e42",
          line: { width: 2 },
        },
        hoverinfo: "skip",
      } as Data);
    }
  }

  // 2. Selection overlay
  if (spec.overlays.selectionKeys.length > 0) {
    const selectedPoints = spec.overlays.selectionKeys
      .map((k) => pointMap.get(k))
      .filter((p): p is (typeof allPoints)[0] => Boolean(p));

    if (selectedPoints.length > 0) {
      data.push({
        type: spec.traces[0]?.type ?? "scatter",
        name: "selection",
        showlegend: false,
        mode: "markers",
        x: selectedPoints.map((p) => p.x),
        y: selectedPoints.map((p) => p.y),
        customdata: selectedPoints.map((p) => p.key),
        marker: {
          size: selectedPoints.map((p) => p.style.size + 10),
          symbol: "circle-open",
          color: "#222222",
          line: { width: 2 },
        },
        hoverinfo: "skip",
      } as Data);
    }
  }

  const shapes: Partial<Shape>[] = spec.shapes.map(mapShapeToPlotly);
  const clampEdge = spec.settings?.clampGroupLabelsToEdge ?? true;
  const xRange = currentViewport?.xRange ?? spec.layout.xaxis.range;
  const yRange = currentViewport?.yRange ?? spec.layout.yaxis.range;

  const annotations: Partial<Annotations>[] = spec.annotations.map((ann) =>
    mapAnnotationToPlotly(ann, {
      xRange,
      yRange,
      clampEdge,
    }),
  );

  const layout: Partial<Layout> = {
    autosize: true,
    paper_bgcolor: "transparent",
    plot_bgcolor: spec.layout.background,
    margin: spec.layout.margin,
    dragmode: spec.layout.dragMode,
    hovermode: spec.layout.hoverMode === "off" ? false : "closest",
    xaxis: {
      range: spec.layout.xaxis.range ? [...spec.layout.xaxis.range] : undefined,
      autorange: false,
      title: {
        text: spec.layout.xaxis.title,
        font: {
          size: spec.layout.xaxis.titleSize,
          weight: spec.layout.xaxis.titleWeight,
          color: spec.layout.xaxis.lineColor,
        },
      },
      showgrid: spec.layout.xaxis.grid,
      gridcolor: spec.layout.xaxis.gridColor,
      zeroline: spec.layout.xaxis.zeroLine,
      zerolinecolor: spec.layout.xaxis.zeroLineColor,
      linecolor: spec.layout.xaxis.lineColor,
      linewidth: spec.layout.xaxis.lineWidth,
      showline: true,
      mirror: spec.layout.xaxis.mirror ?? true,
      tickfont: {
        size: spec.layout.xaxis.tickFontSize,
        color: spec.layout.xaxis.lineColor,
      },
      showspikes: spec.layout.xaxis.spikes,
      spikethickness: 1,
      spikedash: "dot",
      spikecolor: spec.layout.xaxis.lineColor,
      spikemode: "across",
    },
    yaxis: {
      range: spec.layout.yaxis.range ? [...spec.layout.yaxis.range] : undefined,
      autorange: false,
      title: {
        text: spec.layout.yaxis.title,
        font: {
          size: spec.layout.yaxis.titleSize,
          weight: spec.layout.yaxis.titleWeight,
          color: spec.layout.yaxis.lineColor,
        },
      },
      showgrid: spec.layout.yaxis.grid,
      gridcolor: spec.layout.yaxis.gridColor,
      zeroline: spec.layout.yaxis.zeroLine,
      zerolinecolor: spec.layout.yaxis.zeroLineColor,
      linecolor: spec.layout.yaxis.lineColor,
      linewidth: spec.layout.yaxis.lineWidth,
      showline: true,
      mirror: spec.layout.yaxis.mirror ?? true,
      tickfont: {
        size: spec.layout.yaxis.tickFontSize,
        color: spec.layout.yaxis.lineColor,
      },
      showspikes: spec.layout.yaxis.spikes,
      spikethickness: 1,
      spikedash: "dot",
      spikecolor: spec.layout.yaxis.lineColor,
      spikemode: "across",
      scaleanchor: spec.layout.yaxis.scaleAnchor,
    },
    shapes,
    annotations,
    showlegend: false, // Controlled through native LegendDock component
  };

  const config: Partial<Config> = {
    displayModeBar: false,
    scrollZoom: false,
    responsive: false,
    doubleClick: false,
    showTips: false,
    edits: { annotationTail: true },
  };

  return { data, layout, config };
}
