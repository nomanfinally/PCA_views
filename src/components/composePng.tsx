import { renderToStaticMarkup } from "react-dom/server";
import { MarkerSwatch } from "./MarkerSwatch";
import {
  arrangeImage,
  type ImageOptions,
  type ImageBox,
  type ImageLegend,
} from "../domain/imageExport";
export interface ChartImage {
  url: string;
  width: number;
  height: number;
  plotBox: ImageBox;
  axisBounds: ImageBox;
}
const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to render image."));
    image.src = url;
  });
export async function composePng(
  chart: ChartImage,
  entries: ImageLegend,
  options: ImageOptions,
) {
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
  canvas.width = placement.width * 2;
  canvas.height = placement.height * 2;
  ctx.scale(2, 2);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, placement.width, placement.height);
  ctx.drawImage(
    await loadImage(chart.url),
    placement.chart.x,
    placement.chart.y,
    chart.width,
    chart.height,
  );
  ctx.fillStyle = "#222";
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  let y = 4;
  for (const [text, size, weight] of [
    [options.title, options.titleSize, options.titleWeight],
    [options.subtitle, options.subtitleSize, options.subtitleWeight],
  ] as const) {
    if (!text) continue;
    ctx.font = `${weight} ${size}px Arial`;
    ctx.fillText(text, placement.width / 2, y);
    y += size * 1.3 + 8;
  }
  if (options.includeLegend && entries.length) {
    const box = placement.legend;
    if (options.legendBorder) {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.width - 1, box.height - 1);
    }
    const swatches = await Promise.all(
      entries.map(async (e) => {
        const svg = renderToStaticMarkup(
          <MarkerSwatch {...e.appearance} />,
        ).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
        const url = URL.createObjectURL(
          new Blob([svg], { type: "image/svg+xml" }),
        );
        try {
          return await loadImage(url);
        } finally {
          URL.revokeObjectURL(url);
        }
      }),
    );
    ctx.font = `${options.legendFontWeight} ${options.legendFontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    entries.forEach((entry, i) => {
      const col = i % box.columns,
        row = Math.floor(i / box.columns);
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
      ctx.drawImage(swatches[i], x, y - 7, 14, 14);
      ctx.fillText(entry.name, x + 24, y);
    });
  }
  return { url: canvas.toDataURL("image/png"), placement };
}
