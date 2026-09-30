/**
 * Pure Canvas 2D PNG Image Composer
 *
 * Renders high-resolution publication-quality PNG figures with headings,
 * chart graphics, and vector-rendered legend swatches.
 * Eliminates react-dom/server from the client bundle.
 */

import { toRgbaString } from "../../core/color/colorUtils";
import type { Dataset, Sample } from "../../core/models/dataset";
import type { PlotSettings } from "../../core/models/settings";
import { isHollowSymbol, toSolidSymbol } from "../../core/style/symbols";
import {
  resolveMarkerStyle,
  type ResolvedMarkerStyle,
} from "../../core/style/styleResolver";
import {
  buildPlotSpec,
  type PlotViewState,
} from "../../plot/spec/buildPlotSpec";
import { mapSpecToPlotly } from "../../plot/adapters/plotly/plotlyMapper";
import type { LabelOffset } from "../../plot/spec/plotSpec";
import type { Layout } from "plotly.js";

export interface ImageOptions {
  scale?: number;
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

export function defaultImageOptions(settings: PlotSettings): ImageOptions {
  const p = settings.legendPosition;
  return {
    scale: 2,
    includeLegend: true,
    legendPosition: p.includes("left")
      ? "left"
      : p === "top" || p === "bottom"
        ? p
        : "right",
    legendColumns: settings.legendColumns,
    legendFontSize: 12,
    legendFontWeight: 400,
    legendRowGap: 5,
    legendColumnGap: 20,
    legendBorder: false,
    title: settings.title,
    subtitle: settings.subtitle,
    titleSize: 22,
    titleWeight: 600,
    subtitleSize: 15,
    subtitleWeight: 400,
  };
}

export interface ImageLegendEntry {
  name: string;
  appearance: ResolvedMarkerStyle;
}

export function imageLegend(
  dataset: Dataset,
  samples: Sample[],
  state: PlotViewState,
): ImageLegendEntry[] {
  const visiblePopulations = new Set(samples.map((s) => s.population));
  return dataset.populations
    .filter((p) => visiblePopulations.has(p.name))
    .map((p) => ({
      name: p.name,
      appearance: resolveMarkerStyle({
        population: p,
        settings: state.settings,
        populationOverride: state.populations.get(p.name),
      }),
    }));
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

/**
 * Pure layout calculation: sizes and positions chart, headings, and legend grids.
 */
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
    Math.min(Math.round(options.legendColumns || 1), count || 1),
  );
  const rows = Math.ceil(count / columns);
  const padding = count ? 10 : 0;
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

  let legendX = plotBox.x + (plotBox.width - legendWidth) / 2;
  let legendY = plotBox.y;

  if (options.legendPosition === "right") {
    legendX = Math.max(chartWidth, axisBounds.x + axisBounds.width) + gap;
    legendY = plotBox.y;
  } else if (options.legendPosition === "left") {
    legendX = Math.min(0, axisBounds.x) - gap - legendWidth;
    legendY = plotBox.y;
  } else if (options.legendPosition === "top") {
    legendY = Math.min(0, axisBounds.y) - gap - legendHeight;
  } else {
    legendY = Math.max(chartHeight, axisBounds.y + axisBounds.height) + gap;
  }

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

  const hasTitle = Boolean(options.title?.trim());
  const hasSubtitle = Boolean(options.subtitle?.trim());
  const titleLineHeight = hasTitle ? Math.round(options.titleSize * 1.3) : 0;
  const subtitleLineHeight = hasSubtitle
    ? Math.round(options.subtitleSize * 1.3)
    : 0;
  const titlePadTop = hasTitle || hasSubtitle ? 14 : 0;
  const titleSubGap = hasTitle && hasSubtitle ? 6 : 0;
  const headingBottomMargin = hasTitle || hasSubtitle ? 14 : 0;

  const headingContentHeight =
    titleLineHeight + titleSubGap + subtitleLineHeight;
  const headingHeight =
    headingContentHeight > 0
      ? titlePadTop + headingContentHeight + headingBottomMargin
      : 0;

  const headingWidth =
    Math.max(
      hasTitle
        ? measure(options.title, options.titleSize, options.titleWeight)
        : 0,
      hasSubtitle
        ? measure(
            options.subtitle,
            options.subtitleSize,
            options.subtitleWeight,
          )
        : 0,
    ) + 32;

  const width = Math.ceil(Math.max(bodyWidth, headingWidth));
  const height = Math.ceil(bodyHeight + headingHeight + 16);

  if (
    width * 2 > 16000 ||
    height * 2 > 16000 ||
    width * height * 4 > 64000000
  ) {
    throw new Error(
      "This image is too large. Use more legend columns, smaller text, or fewer visible populations.",
    );
  }

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

/**
 * Draws a marker symbol directly onto a 2D Canvas context.
 * Replaces react-dom/server SVG rasterization.
 */
export function drawMarkerSwatch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  appearance: ResolvedMarkerStyle,
): void {
  const isHollow = appearance.isHollow || isHollowSymbol(appearance.symbol);
  const base = toSolidSymbol(appearance.symbol);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();

  const drawRegularPolygon = (sides: number, startAngle = -Math.PI / 2) => {
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / sides;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  switch (base) {
    case "circle":
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      break;
    case "square":
      ctx.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
      break;
    case "diamond":
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      break;
    case "triangle-up":
      drawRegularPolygon(3, -Math.PI / 2);
      break;
    case "triangle-down":
      drawRegularPolygon(3, Math.PI / 2);
      break;
    case "triangle-left":
      drawRegularPolygon(3, Math.PI);
      break;
    case "triangle-right":
      drawRegularPolygon(3, 0);
      break;
    case "pentagon":
      drawRegularPolygon(5, -Math.PI / 2);
      break;
    case "hexagon":
      drawRegularPolygon(6, -Math.PI / 2);
      break;
    case "octagon":
      drawRegularPolygon(8, -Math.PI / 2);
      break;
    case "cross": {
      const w = r * 0.35;
      ctx.moveTo(-w, -r);
      ctx.lineTo(w, -r);
      ctx.lineTo(w, -w);
      ctx.lineTo(r, -w);
      ctx.lineTo(r, w);
      ctx.lineTo(w, w);
      ctx.lineTo(w, r);
      ctx.lineTo(-w, r);
      ctx.lineTo(-w, w);
      ctx.lineTo(-r, w);
      ctx.lineTo(-r, -w);
      ctx.lineTo(-w, -w);
      ctx.closePath();
      break;
    }
    case "x": {
      const arm = r * 0.75;
      const w = r * 0.3;
      ctx.moveTo(-arm, -arm + w);
      ctx.lineTo(-w, 0);
      ctx.lineTo(-arm, arm - w);
      ctx.lineTo(-arm + w, arm);
      ctx.lineTo(0, w);
      ctx.lineTo(arm - w, arm);
      ctx.lineTo(arm, arm - w);
      ctx.lineTo(w, 0);
      ctx.lineTo(arm, -arm + w);
      ctx.lineTo(arm - w, -arm);
      ctx.lineTo(0, -w);
      ctx.lineTo(-arm + w, -arm);
      ctx.closePath();
      break;
    }
    case "star": {
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const radius = i % 2 ? r * 0.45 : r;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    default:
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      break;
  }

  // Fill
  if (!isHollow) {
    ctx.fillStyle = toRgbaString(appearance.color, appearance.fillOpacity);
    ctx.fill();
  }

  // Stroke
  ctx.strokeStyle = toRgbaString(
    appearance.line.color,
    appearance.outlineOpacity,
  );
  ctx.lineWidth = Math.max(1, appearance.line.width * 1.5);
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.restore();
}

export interface ChartImage {
  url: string;
  width: number;
  height: number;
  plotBox: ImageBox;
  axisBounds: ImageBox;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (url: string) => {
  const cached = imageCache.get(url);
  if (cached) return cached;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageCache.delete(url);
      reject(new Error("Unable to render image."));
    };
    image.src = url;
    if (image.complete && image.naturalWidth > 0) {
      resolve(image);
    }
  });
  imageCache.set(url, p);
  return p;
};

export interface ComposedPngResult {
  blob: Blob;
  placement: ImagePlacement;
}

/**
 * Composes a full exported figure onto a high-DPI Canvas 2D and returns a PNG Blob and layout placement.
 */
export async function composePng(
  chart: ChartImage,
  entries: ImageLegendEntry[],
  options: ImageOptions,
): Promise<ComposedPngResult> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const measure = (text: string, size: number, weight: number) => {
    ctx.font = `${weight} ${size}px Arial`;
    return ctx.measureText(text).width;
  };

  const placement = arrangeImage(
    chart.width,
    chart.height,
    entries.map((e) => e.name),
    options,
    measure,
    chart.plotBox,
    chart.axisBounds,
  );

  // Resolution scaling (DPI multiplier)
  const scale = Math.max(1, Math.min(6, options.scale ?? 2));
  canvas.width = placement.width * scale;
  canvas.height = placement.height * scale;
  ctx.scale(scale, scale);

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, placement.width, placement.height);

  // Draw plot chart image
  const chartImg = await loadImage(chart.url);
  ctx.drawImage(
    chartImg,
    placement.chart.x,
    placement.chart.y,
    chart.width,
    chart.height,
  );

  // Draw Title & Subtitle
  if (options.title?.trim() || options.subtitle?.trim()) {
    ctx.fillStyle = "#222222";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    let curHeadingY = 14;

    if (options.title?.trim()) {
      ctx.font = `${options.titleWeight} ${options.titleSize}px Arial`;
      ctx.fillText(options.title.trim(), placement.width / 2, curHeadingY);
      curHeadingY +=
        Math.round(options.titleSize * 1.3) +
        (options.subtitle?.trim() ? 6 : 0);
    }

    if (options.subtitle?.trim()) {
      ctx.font = `${options.subtitleWeight} ${options.subtitleSize}px Arial`;
      ctx.fillText(options.subtitle.trim(), placement.width / 2, curHeadingY);
    }
  }

  // Draw Legend Grid
  if (options.includeLegend && entries.length > 0) {
    const box = placement.legend;
    if (options.legendBorder) {
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.width - 1, box.height - 1);
    }

    ctx.font = `${options.legendFontWeight} ${options.legendFontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    entries.forEach((entry, i) => {
      const col = i % box.columns;
      const row = Math.floor(i / box.columns);
      const x =
        box.x +
        10 +
        box.columnWidths.slice(0, col).reduce((a, b) => a + b, 0) +
        col * options.legendColumnGap;
      const y =
        box.y +
        10 +
        row * (box.rowHeight + options.legendRowGap) +
        box.rowHeight / 2;

      // Draw vector marker swatch directly with Canvas 2D
      drawMarkerSwatch(ctx, x + 6, y, 6, entry.appearance);

      // Draw population name text
      ctx.fillStyle = "#222222";
      ctx.fillText(entry.name, x + 18, y);
    });
  }

  try {
    if (typeof canvas.toBlob === "function") {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Unable to create PNG export blob."));
        }, "image/png");
      });
      return { blob, placement };
    }
    const dataUrl = canvas.toDataURL("image/png");
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([array], { type: mime });
    return { blob, placement };
  } catch (err) {
    throw new Error("Unable to create PNG export: " + String(err));
  }
}

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
  const oldMargin = { t: 20, r: 24, b: 50, l: 70, ...layout.margin };
  const removedHeading = Math.max(0, oldMargin.t - 20);

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
