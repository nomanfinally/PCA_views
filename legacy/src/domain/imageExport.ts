import type { Layout } from "plotly.js";
import type { Dataset, Sample } from "./types";
import { markerAppearance, type ViewState } from "./viewState";
import { buildPlotModel, type LabelOffset } from "./plotModel";

export interface ImageOptions {
  includeLegend: boolean;
  legendPosition: "right" | "left" | "top" | "bottom";
  legendColumns: number;
  legendFontSize: number;
  legendFontWeight: number;
  legendRowGap: number;
  legendColumnGap: number;
  legendBorder: boolean;
  title: string;
  subtitle: string;
  titleSize: number;
  titleWeight: number;
  subtitleSize: number;
  subtitleWeight: number;
}
export function defaultImageOptions(state: ViewState): ImageOptions {
  const p = state.settings.legendPosition;
  return {
    includeLegend: true,
    legendPosition: p.includes("left")
      ? "left"
      : p === "top" || p === "bottom"
        ? p
        : "right",
    legendColumns: state.settings.legendColumns,
    legendFontSize: 12,
    legendFontWeight: 400,
    legendRowGap: 5,
    legendColumnGap: 20,
    legendBorder: false,
    title: state.settings.title,
    subtitle: state.settings.subtitle,
    titleSize: 22,
    titleWeight: 600,
    subtitleSize: 15,
    subtitleWeight: 400,
  };
}
export function imageLegend(
  dataset: Dataset,
  samples: Sample[],
  state: ViewState,
) {
  const visible = new Set(samples.map((s) => s.population));
  return dataset.populations
    .filter((p) => visible.has(p.name))
    .map((p) => ({
      name: p.name,
      appearance: markerAppearance(p, state),
    }));
}
export type ImageLegend = ReturnType<typeof imageLegend>;

/** Capture the same plot pixels and ranges. Decorations are composed outside this figure. */
export function buildImageFigure(
  dataset: Dataset,
  samples: Sample[],
  state: ViewState,
  currentLayout: Partial<Layout>,
  offsets: Map<string, LabelOffset>,
) {
  const model = buildPlotModel(dataset, samples, state, offsets);
  const layout = structuredClone(currentLayout);
  const oldMargin = { t: 20, r: 24, b: 50, l: 70, ...layout.margin };
  // Remove the live heading's space without changing the plot's inner dimensions.
  const removedHeading = Math.max(0, oldMargin.t - 20);
  layout.width = currentLayout.width ?? 1200;
  layout.height = (currentLayout.height ?? 800) - removedHeading;
  layout.margin = { ...oldMargin, t: oldMargin.t - removedHeading };
  layout.autosize = false;
  layout.title = { text: "" };
  layout.showlegend = false;
  layout.hovermode = false;
  layout.annotations = model.annotations;
  layout.shapes = model.shapes;
  for (const axis of ["xaxis", "yaxis"] as const) {
    layout[axis] = {
      ...layout[axis],
      autorange: false,
      scaleanchor: false,
      automargin: false,
    };
  }
  return { data: model.traces, layout };
}

export interface ImageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface ImagePlacement {
  width: number;
  height: number;
  chart: ImageBox;
  plotBox: ImageBox;
  legend: {
    x: number;
    y: number;
    width: number;
    height: number;
    columns: number;
    rows: number;
    columnWidths: number[];
    rowHeight: number;
  };
  headingHeight: number;
}
/** Pure layout: text metrics are supplied by the browser, while chart pixels stay fixed. */
export function arrangeImage(
  chartWidth: number,
  chartHeight: number,
  names: string[],
  options: ImageOptions,
  measure: (text: string, size: number, weight: number) => number,
  plotBox: ImageBox = { x: 0, y: 0, width: chartWidth, height: chartHeight },
  axisBounds: ImageBox = plotBox,
): ImagePlacement {
  const count = options.includeLegend ? names.length : 0;
  const columns = Math.max(
    1,
    Math.min(Math.round(options.legendColumns), count || 1),
  );
  const rows = Math.ceil(count / columns),
    padding = count ? 10 : 0;
  const rowHeight = Math.max(16, options.legendFontSize * 1.25);
  const columnWidths = Array<number>(columns).fill(0);
  names.forEach((name, index) => {
    const col = index % columns;
    columnWidths[col] = Math.max(
      columnWidths[col],
      measure(name, options.legendFontSize, options.legendFontWeight) + 24,
    );
  });
  const legendWidth = count
    ? columnWidths.reduce((a, b) => a + b, 0) +
      (columns - 1) * options.legendColumnGap +
      padding * 2
    : 0;
  const legendHeight = count
    ? rows * rowHeight + (rows - 1) * options.legendRowGap + padding * 2
    : 0;
  const gap = 16;
  // Locate the legend in plot-image coordinates, using the frame rather than
  // the image margins. Axis text can extend beyond the frame and needs clearance.
  let legendX = plotBox.x + (plotBox.width - legendWidth) / 2;
  let legendY = plotBox.y;
  if (options.legendPosition === "right")
    legendX = axisBounds.x + axisBounds.width + gap;
  else if (options.legendPosition === "left")
    legendX = axisBounds.x - gap - legendWidth;
  else if (options.legendPosition === "top")
    legendY = axisBounds.y - gap - legendHeight;
  else legendY = axisBounds.y + axisBounds.height + gap;
  if (!count) {
    legendX = 0;
    legendY = 0;
  }
  const minX = Math.floor(Math.min(0, legendX) * 2) / 2;
  const minY = Math.floor(Math.min(0, legendY) * 2) / 2;
  const bodyWidth = Math.ceil(
    Math.max(chartWidth, legendX + legendWidth) - minX,
  );
  const bodyHeight = Math.ceil(
    Math.max(chartHeight, legendY + legendHeight) - minY,
  );
  const titleHeight = options.title ? options.titleSize * 1.3 + 8 : 0;
  const subtitleHeight = options.subtitle ? options.subtitleSize * 1.3 + 8 : 0;
  const headingHeight = Math.ceil(titleHeight + subtitleHeight);
  const headingWidth =
    Math.max(
      measure(options.title, options.titleSize, options.titleWeight),
      measure(options.subtitle, options.subtitleSize, options.subtitleWeight),
    ) + 32;
  const width = Math.ceil(Math.max(bodyWidth, headingWidth)),
    height = Math.ceil(bodyHeight + headingHeight + 16);
  if (width * 2 > 16000 || height * 2 > 16000 || width * height * 4 > 64000000)
    throw new Error(
      "This image is too large. Use more legend columns, smaller text, or fewer visible populations.",
    );
  // Both offsets are multiples of half a CSS pixel, keeping the 2× captured
  // chart aligned to physical pixels while the outer canvas grows around it.
  const chart = {
    x: (width - bodyWidth) / 2 - minX,
    y: headingHeight - minY,
    width: chartWidth,
    height: chartHeight,
  };
  const legend = {
    x: chart.x + legendX,
    y: chart.y + legendY,
    width: legendWidth,
    height: legendHeight,
    columns,
    rows,
    columnWidths,
    rowHeight,
  };
  return {
    width,
    height,
    chart,
    legend,
    headingHeight,
    plotBox: { ...plotBox, x: chart.x + plotBox.x, y: chart.y + plotBox.y },
  };
}
