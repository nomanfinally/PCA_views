import type { Annotations } from "plotly.js";
import { mapSpecToPlotly } from "../plot/adapters/plotly/plotlyMapper";
import { buildPlotSpec } from "../plot/spec/buildPlotSpec";

/** Exercise the production spec and mapper with the older fixture vocabulary. */
export function buildPlotModel(...args: Parameters<typeof buildPlotSpec>) {
  const { data, layout } = mapSpecToPlotly(buildPlotSpec(...args));
  return {
    traces: data,
    shapes: layout.shapes ?? [],
    annotations: (layout.annotations ?? []) as (Partial<Annotations> & {
      name?: string;
    })[],
  };
}

export { annotationName, escapeHtml } from "../plot/spec/buildPlotSpec";
