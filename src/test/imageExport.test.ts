import { expect, it } from "vitest";
import {
  buildImageFigure,
  imageLegend,
  arrangeImage,
  defaultImageOptions,
} from "../domain/imageExport";
import { initialView, viewReducer, filteredSamples } from "../domain/viewState";
import { parseEvec } from "../domain/parseEvec";
const dataset = parseEvec("a 0 0 A\nb 1 1 A\nc 2 3 B", "test.evec");
it("legend swatches inherit population style independently of point overrides and hidden rows", () => {
  let state = viewReducer(initialView(), {
    type: "population",
    name: "A",
    patch: { color: "#39786b", symbol: "diamond" },
  });
  state = viewReducer(state, {
    type: "point",
    key: 0,
    patch: { color: "#ff0000", marked: true },
  });
  state = viewReducer(state, {
    type: "population",
    name: "B",
    patch: { hidden: true },
  });
  const entries = imageLegend(dataset, filteredSamples(dataset, state), state);
  expect(entries).toHaveLength(1);
  expect(entries[0].appearance).toMatchObject({
    color: "#39786b",
    symbol: "diamond",
  });
});
it("captures unchanged inner pixels, styles, ranges and label offsets without mutating the live figure", () => {
  const state = initialView();
  state.settings.groupLabels = true;
  state.settings.subtitle = "Subtitle";
  const layout = {
    width: 1200,
    height: 800,
    margin: { l: 70, r: 24, t: 65, b: 50 },
    xaxis: { range: [0.1, 0.9], autorange: true },
    yaxis: { range: [0.2, 0.8], autorange: true },
  };
  const figure = buildImageFigure(
    dataset,
    dataset.samples,
    state,
    layout,
    new Map([["0:1:A", { ax: 90, ay: -50 }]]),
  );
  expect(
    figure.layout.width! - figure.layout.margin!.l! - figure.layout.margin!.r!,
  ).toBe(1106);
  expect(
    figure.layout.height! - figure.layout.margin!.t! - figure.layout.margin!.b!,
  ).toBe(685);
  expect(figure.layout.xaxis).toMatchObject({
    range: [0.1, 0.9],
    autorange: false,
    scaleanchor: false,
  });
  expect(figure.layout.annotations![0]).toMatchObject({ ax: 90, ay: -50 });
  expect(figure.layout.title).toEqual({ text: "" });
  figure.layout.xaxis!.range![0] = 999;
  expect(layout.xaxis.range).toEqual([0.1, 0.9]);
});
it("headings and legends grow the canvas without resizing the chart in any arrangement", () => {
  const options = defaultImageOptions(initialView());
  const measure = (text: string, size: number) => text.length * size * 0.5;
  for (const legendPosition of ["top", "bottom", "left", "right"] as const) {
    for (const legendColumns of [1, 2, 6]) {
      const layout = arrangeImage(
        800,
        600,
        ["Short", "A longer group", "C"],
        {
          ...options,
          legendPosition,
          legendColumns,
          title: "Heading",
          subtitle: "Subtitle",
          legendFontSize: 20,
          legendRowGap: 12,
          legendColumnGap: 30,
        },
        measure,
      );
      expect(layout.chart.width).toBe(800);
      expect(layout.chart.height).toBe(600);
      const a = layout.chart,
        b = layout.legend;
      expect(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y,
      ).toBe(true);
      expect(a.y).toBeGreaterThanOrEqual(layout.headingHeight);
      expect(b.x + b.width).toBeLessThanOrEqual(layout.width);
    }
  }
  const compact = arrangeImage(800, 600, ["A"], options, measure);
  expect(compact.legend.width).toBe(50); // Measured text + marker + padding; no application tools.
});

it("anchors legends to the plot frame, with clearance for axis text", () => {
  const frame = { x: 150, y: 80, width: 460, height: 360 };
  const axes = { x: 92, y: 75, width: 524, height: 413 };
  const measure = (text: string, size: number) => text.length * size * 0.5;
  for (const position of ["right", "left", "top", "bottom"] as const) {
    for (const title of ["", "A heading much wider than the plot".repeat(4)]) {
      const layout = arrangeImage(
        800,
        600,
        ["A", "Long population", "C"],
        {
          ...defaultImageOptions(initialView()),
          legendPosition: position,
          title,
        },
        measure,
        frame,
        axes,
      );
      const { plotBox: p, legend: l, chart: c } = layout;
      if (position === "right" || position === "left") {
        expect(l.y).toBe(p.y);
        if (position === "right")
          expect(l.x).toBeCloseTo(c.x + axes.x + axes.width + 16);
        else expect(l.x + l.width).toBeCloseTo(c.x + axes.x - 16);
      } else {
        expect(l.x + l.width / 2).toBeCloseTo(p.x + p.width / 2);
        if (position === "top")
          expect(l.y + l.height).toBeCloseTo(c.y + axes.y - 16);
        else expect(l.y).toBeCloseTo(c.y + axes.y + axes.height + 16);
      }
      expect(c.width).toBe(800);
      expect(c.height).toBe(600);
      expect(c.x * 2).toBe(Math.round(c.x * 2));
      expect(c.y * 2).toBe(Math.round(c.y * 2));
      expect(l.x).toBeGreaterThanOrEqual(0);
      expect(l.y).toBeGreaterThanOrEqual(layout.headingHeight);
      expect(l.x + l.width).toBeLessThanOrEqual(layout.width);
      expect(l.y + l.height).toBeLessThanOrEqual(layout.height);
    }
  }
});
