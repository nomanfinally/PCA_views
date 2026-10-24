import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Layout } from "plotly.js";
import { parseEvec } from "../core/parsers/parseEvec";
import { initialView } from "../state/viewState";
import { buildPlotSpec } from "../plot/spec/buildPlotSpec";
import { PlotlyRenderer } from "../plot/adapters/plotly/plotlyRenderer";

const api = vi.hoisted(() => ({
  newPlot: vi.fn(),
  react: vi.fn(),
  relayout: vi.fn(),
  purge: vi.fn(),
  toImage: vi.fn(),
  Plots: { resize: vi.fn() },
}));
vi.mock("../plot/adapters/plotly/plotlyLoader", () => ({
  loadPlotly: async () => api,
}));

const dataset = parseEvec("#eigvals: 10 5\na 0 1 A\nb 1 0 B", "test.evec");

beforeEach(() => {
  vi.resetAllMocks();
  api.newPlot.mockImplementation(async (el, _data, layout) => {
    el.layout = layout;
  });
  api.react.mockImplementation(async (el, _data, layout) => {
    el.layout = layout;
  });
});

describe("Plotly renderer lifecycle", () => {
  it("preserves zoom when variance titles change, and resets it for a different axis pair", async () => {
    const state = initialView(dataset);
    const renderer = new PlotlyRenderer();
    const container = {
      on: vi.fn(),
      clientWidth: 800,
      clientHeight: 600,
      layout: {} as Layout,
    };
    await renderer.mount(
      container as unknown as HTMLElement,
      buildPlotSpec(dataset, dataset.samples, state),
    );
    container.layout.xaxis!.range = [0.2, 0.6];
    container.layout.yaxis!.range = [0.1, 0.5];
    state.settings = { ...state.settings, showVariance: false };
    await renderer.update(buildPlotSpec(dataset, dataset.samples, state));
    expect(container.layout.xaxis!.range).toEqual([0.2, 0.6]);
    state.x = 1;
    state.y = 0;
    await renderer.update(buildPlotSpec(dataset, dataset.samples, state));
    expect(container.layout.xaxis!.range).not.toEqual([0.2, 0.6]);
    renderer.purge();
  });

  it("reports a failed mount without declaring the renderer ready", async () => {
    const failure = new Error("GPU unavailable");
    api.newPlot.mockRejectedValueOnce(failure);
    const onError = vi.fn();
    const renderer = new PlotlyRenderer({ onError });
    const spec = buildPlotSpec(dataset, dataset.samples, initialView(dataset));
    await expect(renderer.mount({} as HTMLElement, spec)).rejects.toThrow(
      "GPU unavailable",
    );
    expect(onError).toHaveBeenCalledWith(failure);
    await expect(renderer.toImage()).rejects.toThrow(/not ready/);
    renderer.purge();
  });

  it("waits for pending changes before capturing an image", async () => {
    const renderer = new PlotlyRenderer();
    const container = { on: vi.fn(), clientWidth: 800, clientHeight: 600 };
    await renderer.mount(
      container as unknown as HTMLElement,
      buildPlotSpec(dataset, dataset.samples, initialView(dataset)),
    );
    let release!: () => void;
    api.relayout.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    api.toImage.mockResolvedValue("data:image/png;base64,example");
    const change = renderer.relayout({
      "xaxis.range": [0.2, 0.6],
    } as Partial<Layout>);
    const capture = renderer.toImage();
    await Promise.resolve();
    expect(api.toImage).not.toHaveBeenCalled();
    release();
    await change;
    expect(await capture).toBe("data:image/png;base64,example");
    renderer.purge();
  });
});
