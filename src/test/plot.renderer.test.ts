import type { Layout } from "plotly.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseEvec } from "../core/parsers/parseEvec";
import { PlotlyRenderer } from "../plot/adapters/plotly/plotlyRenderer";
import { buildPlotSpec } from "../plot/spec/buildPlotSpec";
import { initialView } from "../state/viewState";

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
  it("replaces obsolete redraws while keeping viewport commands in order", async () => {
    const renderer = new PlotlyRenderer();
    const container = {
      on: vi.fn(),
      clientWidth: 800,
      clientHeight: 600,
      layout: {} as Layout,
    };
    const state = initialView(dataset);
    const spec = () => buildPlotSpec(dataset, dataset.samples, state);
    await renderer.mount(container as unknown as HTMLElement, spec());
    state.settings.title = "obsolete";
    const first = renderer.update(spec());
    state.settings.title = "latest";
    const second = renderer.update(spec());
    await Promise.all([first, second]);
    expect(api.react).toHaveBeenCalledTimes(1);
    expect(api.react.mock.calls[0][2].title.text).toBe("latest");
    const order: string[] = [];
    api.react.mockImplementation(async (_el, _data, layout) => {
      order.push(layout.title.text);
    });
    api.relayout.mockImplementation(async () => {
      order.push("viewport");
    });
    state.settings.title = "before";
    const before = renderer.update(spec());
    const viewport = renderer.relayout({
      "xaxis.range": [0, 1],
    } as Partial<Layout>);
    state.settings.title = "after";
    const after = renderer.update(spec());
    await Promise.all([before, viewport, after]);
    expect(order).toEqual(["before", "viewport", "after"]);
    renderer.purge();
  });
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
