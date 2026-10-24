import type { Layout } from "plotly.js";
import type { Dataset, Sample } from "../../../core/models/dataset";
import { buildPlotSpec, type PlotViewState } from "../../spec/buildPlotSpec";
import type { LabelOffset } from "../../spec/plotSpec";
import { mapSpecToPlotly } from "./plotlyMapper";

/**
 * Builds the layout and figure for image capture without live application headings.
 */
export function buildImageFigure(
  dataset: Dataset,
  samples: Sample[],
  state: PlotViewState,
  currentLayout: Partial<Layout>,
  offsets: Map<string, LabelOffset>,
) {
  const spec = buildPlotSpec(dataset, samples, state, offsets);
  const bundle = mapSpecToPlotly(spec);

  const layout = structuredClone(currentLayout);
  const oldMargin = { t: 12, r: 24, b: 50, l: 70, ...layout.margin };
  const removedHeading = Math.max(0, oldMargin.t - 12);

  layout.width = currentLayout.width ?? 1200;
  layout.height = (currentLayout.height ?? 800) - removedHeading;
  layout.margin = { ...oldMargin, t: oldMargin.t - removedHeading };
  layout.autosize = false;
  layout.title = { text: "" };
  layout.showlegend = false;
  layout.hovermode = false;
  layout.annotations = bundle.layout.annotations;
  layout.shapes = bundle.layout.shapes;

  for (const axis of ["xaxis", "yaxis"] as const) {
    layout[axis] = {
      ...layout[axis],
      autorange: false,
      scaleanchor: false,
      automargin: false,
    };
  }

  return { data: bundle.data, layout };
}
