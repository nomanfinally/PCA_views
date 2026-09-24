import type { Annotations, Data, Shape } from "plotly.js";
import type { Dataset, Sample } from "./types";
import {
  populationAppearance,
  markerAppearance,
  renderedMarker,
  type ViewState,
  type GroupLabelStyle,
} from "./viewState";
import { centroid, convexHull, regressionLine, type Point } from "./geometry";
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
// Use crisp SVG markers for ordinary datasets; keep WebGL for larger files.
export const traceType = (dataset: Dataset) =>
  dataset.samples.length > 5000 ? "scattergl" : "scatter";

export type NamedAnnotation = Partial<Annotations> & { name?: string };
export interface LabelOffset {
  ax: number;
  ay: number;
}
export const annotationName = (
  kind: "population" | "sample",
  id: string | number,
) => JSON.stringify([kind, id]);
function callout(
  name: string,
  text: string,
  center: Point,
  offset: LabelOffset | undefined,
  style: GroupLabelStyle,
  color: string,
  size: number,
  opacity: number,
  connector: boolean,
): NamedAnnotation {
  return {
    name,
    x: center[0],
    y: center[1],
    xref: "x",
    yref: "y",
    text: escapeHtml(text),
    showarrow: true,
    ax: offset?.ax ?? 22,
    ay: offset?.ay ?? -28,
    arrowhead: 0,
    arrowwidth: 1,
    arrowcolor: connector ? color : "rgba(0,0,0,0)",
    font: { size, color },
    opacity,
    bordercolor: style === "boxed" ? color : "rgba(0,0,0,0)",
    borderwidth: style === "boxed" ? 1 : 0,
    bgcolor: style === "plain" ? "rgba(0,0,0,0)" : "rgba(255,255,255,.9)",
    borderpad: 4,
    captureevents: true,
  };
}
export function buildPlotModel(
  dataset: Dataset,
  samples: Sample[],
  state: ViewState,
  offsets = new Map<string, LabelOffset>(),
) {
  const { x, y, settings } = state;
  const groups = new Map<string, Sample[]>();
  const ordinals = new Map<number, number>(),
    counts = new Map<string, number>();
  dataset.samples.forEach((s) => {
    const n = counts.get(s.population) ?? 0;
    ordinals.set(s.key, n);
    counts.set(s.population, n + 1);
  });
  samples.forEach((sample) => {
    const group = groups.get(sample.population);
    if (group) group.push(sample);
    else groups.set(sample.population, [sample]);
  });
  const traces: Data[] = [],
    shapes: Partial<Shape>[] = [],
    annotations: NamedAnnotation[] = [];
  for (const pop of dataset.populations) {
    const group = groups.get(pop.name);
    if (!group?.length) continue;
    const custom = state.populations.get(pop.name) ?? {};
    const { color } = populationAppearance(pop, state);
    const coords: Point[] = group.map((s) => [s.pcs[x], s.pcs[y]]);
    if (custom.hull) {
      const hull = convexHull(coords);
      if (hull.length)
        shapes.push({
          type: "path",
          name: `hull:${pop.name}`,
          path: `M ${hull.map((p) => p.join(",")).join(" L ")} Z`,
          fillcolor: color,
          opacity: custom.hullOpacity ?? settings.hullOpacity,
          line: { color, width: 1.2 },
          layer: "below",
          xref: "x",
          yref: "y",
        });
    }
    const pairFallback =
      !!custom.hull &&
      coords.length === 2 &&
      (coords[0][0] !== coords[1][0] || coords[0][1] !== coords[1][1]);
    if (custom.regression || pairFallback) {
      // Two distinct points define their connecting line, including vertical pairs.
      const line = pairFallback
        ? [coords[0], coords[1]]
        : regressionLine(coords);
      if (line)
        shapes.push({
          type: "line",
          name: `regression:${pop.name}`,
          x0: line[0][0],
          y0: line[0][1],
          x1: line[1][0],
          y1: line[1][1],
          line: { color, width: 1.5, dash: "dash" },
          opacity: custom.regression
            ? 1
            : (custom.hullOpacity ?? settings.hullOpacity),
          layer: "below",
        });
    }
    if (custom.label ?? settings.groupLabels) {
      const name = annotationName("population", pop.name);
      // Read old archive keys too; new keys separate population names from row IDs.
      const offset =
        offsets.get(`${x}:${y}:${name}`) ??
        offsets.get(`${x}:${y}:${pop.name}`);
      annotations.push(
        callout(
          name,
          pop.name,
          centroid(coords),
          offset,
          custom.labelStyle ?? settings.groupLabelStyle,
          custom.labelColor ?? color,
          custom.labelSize ?? 11,
          custom.labelOpacity ?? 1,
          custom.labelConnector ?? settings.groupLabelConnector,
        ),
      );
    }
    for (const sample of group) {
      const point = state.points.get(sample.key);
      if (!point?.label) continue;
      const name = annotationName("sample", sample.key);
      annotations.push(
        callout(
          name,
          sample.id,
          [sample.pcs[x], sample.pcs[y]],
          offsets.get(`${x}:${y}:${name}`),
          point.labelStyle ?? custom.labelStyle ?? settings.groupLabelStyle,
          point.labelColor ?? custom.labelColor ?? point.color ?? color,
          point.labelSize ?? custom.labelSize ?? 11,
          point.labelOpacity ?? custom.labelOpacity ?? 1,
          point.labelConnector ??
            custom.labelConnector ??
            settings.groupLabelConnector,
        ),
      );
    }
    const labels = group.map((s) => {
      const point = state.points.get(s.key);
      const mode = point?.pointLabels ?? custom.pointLabels ?? settings.labels;
      if (mode === "none" || point?.label) return "";
      return escapeHtml(
        mode === "population"
          ? s.population
          : mode === "full"
            ? `${s.population}: ${s.id}`
            : s.id,
      );
    });
    const markers = group.map((sample) =>
      renderedMarker(
        markerAppearance(
          pop,
          state,
          state.points.get(sample.key),
          ordinals.get(sample.key),
        ),
      ),
    );
    traces.push({
      type: traceType(dataset),
      mode: labels.some(Boolean) ? "markers+text" : "markers",
      name: escapeHtml(pop.name),
      legendgroup: pop.name,
      showlegend: true,
      x: coords.map((p) => p[0]),
      y: coords.map((p) => p[1]),
      customdata: group.map((s) => s.key),
      text: labels,
      hovertext: group.map((sample) => {
        const parts: string[] = [];
        if (settings.hoverIid) parts.push(escapeHtml(sample.id));
        if (settings.hoverFid) parts.push(escapeHtml(sample.population));
        if (settings.hoverCoordinates)
          parts.push(
            `${sample.pcs[x].toPrecision(6)}<br>${sample.pcs[y].toPrecision(6)}`,
          );
        return parts.join("<br>");
      }),
      textposition: "top center",
      textfont: { size: 10, color },
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
      hoverinfo: settings.hover === "off" ? "skip" : undefined,
      hovertemplate:
        settings.hover === "off" ? undefined : "%{hovertext}<extra></extra>",
    } as Data);
  }
  // Selection and persistent marks are overlays: they never alter population identity.
  for (const kind of ["selection", "marked"] as const) {
    const marked = samples.filter((s) =>
      kind === "marked"
        ? state.points.get(s.key)?.marked
        : state.selected.has(s.key),
    );
    if (marked.length)
      traces.push({
        type: traceType(dataset),
        name: kind,
        showlegend: false,
        mode: "markers",
        x: marked.map((s) => s.pcs[x]),
        y: marked.map((s) => s.pcs[y]),
        customdata: marked.map((s) => s.key),
        marker: {
          size: marked.map(
            (s) =>
              (state.points.get(s.key)?.size ??
                state.populations.get(s.population)?.size ??
                settings.size) + (kind === "marked" ? 6 : 10),
          ),
          symbol: "circle-open",
          color: kind === "marked" ? "#d13e42" : "#222222",
          line: { width: 2 },
        },
        hoverinfo: "skip",
      } as Data);
  }
  return { traces, shapes, annotations };
}
