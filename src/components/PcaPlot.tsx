import { chartContrast } from "../domain/colors";
import type { ViewportSnapshot } from "../domain/archive";
import type { ChartImage } from "./composePng";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Config,
  Layout,
  PlotlyHTMLElement,
  PlotSelectionEvent,
} from "plotly.js";
import type { Dataset, Sample } from "../domain/types";
import type { ViewState } from "../domain/viewState";
import {
  buildPlotModel,
  traceType,
  escapeHtml,
  type LabelOffset,
  type NamedAnnotation,
} from "../domain/plotModel";
import { buildImageFigure } from "../domain/imageExport";
import { paddedRange } from "../domain/geometry";
import { zoomRange, wheelPixels } from "../domain/viewport";

import { axisTitle } from "../domain/metadata";
import { useIsMobile } from "../hooks/useIsMobile";

type PlotlyApi = typeof import("plotly.js");
export interface PlotHandle {
  zoom: (factor: number) => void;
  reset: () => void;
  fit: () => void;
  capturePng: () => Promise<ChartImage>;
  snapshot: () => Promise<ViewportSnapshot>;
}
interface Props {
  initialViewport?: ViewportSnapshot;
  dataset: Dataset;
  samples: Sample[];
  state: ViewState;
  onMark: (key: number) => void;
  onEdit: (key: number, anchor: { x: number; y: number }) => void;
  onSelect: (keys: number[]) => void;
  isMobile?: boolean;
}
export const PcaPlot = forwardRef<PlotHandle, Props>(
  function PcaPlot(props, ref) {
    const { dataset, samples, state } = props;
    const detectedMobile = useIsMobile(640);
    const isMobile = props.isMobile ?? detectedMobile;
    const host = useRef<HTMLDivElement>(null),
      api = useRef<PlotlyApi | null>(null);
    const latest = useRef(props);
    latest.current = props;
    const queue = useRef(Promise.resolve());
    const renderRevision = useRef(0);
    const renderedAxes = useRef("");
    const offsets = useRef(
      new Map<string, LabelOffset>(props.initialViewport?.offsets),
    );
    const [ready, setReady] = useState(false),
      [error, setError] = useState("");
    const model = useMemo(
      () => buildPlotModel(dataset, samples, state, offsets.current),
      [
        dataset,
        samples,
        state.x,
        state.y,
        state.settings,
        state.populations,
        state.points,
        state.selected,
        state.spectrum,
      ],
    );
    const config: Partial<Config> = {
      displayModeBar: false,
      scrollZoom: false,
      responsive: false,
      // Repeated sample clicks toggle marks; they must not reset the viewport.
      doubleClick: false,
      showTips: false,
      edits: { annotationTail: true },
    };
    const configRef = useRef(config);
    configRef.current = config;
    useEffect(() => {
      let disposed = false;
      const element = host.current!;
      const renderer =
        traceType(dataset) === "scatter"
          ? import("plotly.js-basic-dist-min")
          : import("plotly.js-gl2d-dist-min");
      renderer
        .then(async (module) => {
          if (disposed) return;
          api.current = module.default;
          await api.current.newPlot(element, [], {}, configRef.current);
          if (disposed) {
            api.current.purge(element);
            return;
          }
          const chart = element as unknown as PlotlyHTMLElement;
          chart.on("plotly_selected", (event: PlotSelectionEvent) => {
            if (event?.points && (event.range || event.lassoPoints))
              latest.current.onSelect([
                ...new Set(
                  event.points
                    .map((p) => p.customdata)
                    .filter((key): key is number => typeof key === "number"),
                ),
              ]);
          });
          // Selection is owned by the workspace. Plotly also emits deselect
          // during programmatic redraws, so only the explicit Clear action resets it.
          chart.on("plotly_relayout", (event) => {
            if (
              !Object.keys(event).some((key) => key.startsWith("annotations["))
            )
              return;
            for (const annotation of (chart.layout.annotations ??
              []) as NamedAnnotation[]) {
              if (
                annotation.name &&
                typeof annotation.ax === "number" &&
                typeof annotation.ay === "number"
              ) {
                const { x, y } = latest.current.state;
                offsets.current.set(`${x}:${y}:${annotation.name}`, {
                  ax: annotation.ax,
                  ay: annotation.ay,
                });
              }
            }
          });
          setReady(true);
        })
        .catch(() => {
          if (!disposed)
            setError(
              "The chart could not start. Reload the page and try again.",
            );
        });
      // Hit testing is independent of Plotly hover/click events, which can be
      // disabled in selection modes or when hover information is switched off.
      const hitTest = (clientX: number, clientY: number) => {
        type Axis = {
          _offset: number;
          _length: number;
          l2p: (value: number) => number;
        };
        const full = (
          element as unknown as { _fullLayout?: { xaxis: Axis; yaxis: Axis } }
        )._fullLayout;
        const current = latest.current;
        if (
          !full ||
          renderedAxes.current !== `${current.state.x}:${current.state.y}`
        )
          return null;
        const box = element.getBoundingClientRect();
        const px = clientX - box.left - full.xaxis._offset;
        const py = clientY - box.top - full.yaxis._offset;
        if (
          px < 0 ||
          py < 0 ||
          px > full.xaxis._length ||
          py > full.yaxis._length
        )
          return null;
        let best: number | null = null,
          distance = Infinity;
        for (const sample of current.samples) {
          const sx = full.xaxis.l2p(sample.pcs[current.state.x]);
          const sy = full.yaxis.l2p(sample.pcs[current.state.y]);
          if (
            sx < 0 ||
            sy < 0 ||
            sx > full.xaxis._length ||
            sy > full.yaxis._length
          )
            continue;
          const d = Math.hypot(sx - px, sy - py);
          const radius = Math.max(
            6,
            (current.state.points.get(sample.key)?.size ??
              current.state.populations.get(sample.population)?.size ??
              current.state.settings.size) * 0.75,
          );
          if (d <= radius && d < distance) {
            best = sample.key;
            distance = d;
          }
        }
        return best;
      };
      let press: { x: number; y: number; id: number; moved: boolean } | null =
        null;
      const isAnnotation = (target: EventTarget | null) =>
        target instanceof Element && !!target.closest(".annotation");
      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || isAnnotation(event.target)) return;
        press = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
          moved: false,
        };
        element.dataset.dragging = "true";
        document.body.dataset.plotDrag = latest.current.state.mode;
      };
      const clearPress = () => {
        press = null;
        delete element.dataset.dragging;
        delete document.body.dataset.plotDrag;
      };
      const onPointerMove = (event: PointerEvent) => {
        if (
          press &&
          Math.hypot(event.clientX - press.x, event.clientY - press.y) > 4
        )
          press.moved = true;
      };
      const onPointerUp = (event: PointerEvent) => {
        const start = press;
        clearPress();
        if (
          !start ||
          start.moved ||
          start.id !== event.pointerId ||
          event.button !== 0 ||
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4
        )
          return;
        const key = hitTest(event.clientX, event.clientY);
        if (key !== null) latest.current.onMark(key);
      };
      const onContext = (event: MouseEvent) => {
        if (isAnnotation(event.target)) return;
        const key = hitTest(event.clientX, event.clientY);
        if (key === null) return;
        event.preventDefault();
        event.stopPropagation();
        latest.current.onEdit(key, {
          x: event.clientX + 8,
          y: event.clientY + 8,
        });
      };
      element.addEventListener("pointerdown", onPointerDown, true);
      element.addEventListener("contextmenu", onContext, true);
      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerup", onPointerUp, true);
      window.addEventListener("pointercancel", clearPress);
      window.addEventListener("blur", clearPress);
      // All programmatic drawing shares one queue. Wheel input is coalesced per
      // animation frame and evaluated against the latest rendered ranges.
      let frame = 0,
        delta = 0,
        cursor = { x: 0.5, y: 0.5 };
      const onWheel = (event: WheelEvent) => {
        const chart = element as unknown as PlotlyHTMLElement & {
          _fullLayout?: {
            xaxis: { _offset: number; _length: number };
            yaxis: { _offset: number; _length: number };
          };
        };
        const full = chart._fullLayout;
        if (!full || !api.current || !event.deltaY) return;
        const rect = element.getBoundingClientRect();
        const x =
          (event.clientX - rect.left - full.xaxis._offset) / full.xaxis._length;
        const y =
          1 -
          (event.clientY - rect.top - full.yaxis._offset) / full.yaxis._length;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        event.preventDefault();
        event.stopPropagation();
        cursor = { x, y };
        delta += wheelPixels(event.deltaY, event.deltaMode, full.yaxis._length);
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const factor = Math.exp(Math.max(-2, Math.min(2, delta * 0.0015)));
          const anchor = cursor;
          delta = 0;
          queue.current = queue.current
            .then(async () => {
              if (disposed || !element.isConnected) return;
              const layout = chart.layout;
              if (!layout.xaxis?.range || !layout.yaxis?.range) return;
              await api.current!.relayout(element, {
                "xaxis.range": zoomRange(
                  layout.xaxis.range.map(Number),
                  factor,
                  anchor.x,
                ),
                "yaxis.range": zoomRange(
                  layout.yaxis.range.map(Number),
                  factor,
                  anchor.y,
                ),
                "xaxis.autorange": false,
                "yaxis.autorange": false,
              });
            })
            .catch(() => {
              if (!disposed)
                setError("Unable to zoom. Try resetting the axes.");
            });
        });
      };
      element.addEventListener("wheel", onWheel, { passive: false });
      let resizeFrame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          queue.current = queue.current
            .then(async () => {
              if (
                !disposed &&
                api.current &&
                element.isConnected &&
                element.classList.contains("js-plotly-plot")
              )
                await api.current.Plots.resize(element);
            })
            .catch(() => {
              if (!disposed)
                setError("The chart could not resize. Reload the dataset.");
            });
        });
      });
      observer.observe(element);
      return () => {
        disposed = true;
        observer.disconnect();
        clearPress();
        element.removeEventListener("pointerdown", onPointerDown, true);
        element.removeEventListener("contextmenu", onContext, true);
        window.removeEventListener("pointermove", onPointerMove, true);
        window.removeEventListener("pointerup", onPointerUp, true);
        window.removeEventListener("pointercancel", clearPress);
        window.removeEventListener("blur", clearPress);
        element.removeEventListener("wheel", onWheel);
        cancelAnimationFrame(frame);
        cancelAnimationFrame(resizeFrame);
        void queue.current.finally(() => api.current?.purge(element));
      };
    }, []);
    useEffect(() => {
      if (!ready || !api.current || !host.current) return;
      const { settings, x, y, mode } = state;
      const contrast = chartContrast(settings.chartBackground);
      const tickFontSize = isMobile
        ? Math.min(9.5, settings.tickFontSize)
        : settings.tickFontSize;
      const axisTitleSize = isMobile
        ? Math.min(10.5, settings.axisTitleSize)
        : settings.axisTitleSize;
      const standoff = isMobile ? 3 : 13;

      const axis = {
        showgrid: settings.grid,
        gridcolor: contrast.grid,
        zeroline: true,
        zerolinecolor: contrast.zero,
        showline: true,
        linecolor: contrast.line,
        mirror: true,
        linewidth: settings.axisLineWidth,
        ticks: "outside" as const,
        ticklen: isMobile ? 3 : 5,
        tickcolor: "#444444",
        tickfont: { size: tickFontSize, color: "#444444" },
        automargin: false,
        showspikes: settings.spikes,
        spikemode: "across" as const,
        spikesnap: "cursor" as const,
        spikedash: "dot" as const,
        spikethickness: 1,
        spikecolor: "#888888",
      };
      const heading = [settings.title, settings.subtitle]
        .filter(Boolean)
        .map(escapeHtml)
        .join("<br>");
      const layout: Partial<Layout> = {
        autosize: true,
        showlegend: false,
        dragmode: mode,
        margin: {
          t: heading ? (isMobile ? 36 : 65) : isMobile ? 6 : 20,
          r: isMobile ? 6 : 24,
          b: isMobile
            ? Math.max(
                26,
                Math.round(tickFontSize + axisTitleSize + standoff + 4),
              )
            : Math.max(50, settings.tickFontSize + settings.axisTitleSize + 25),
          l: isMobile
            ? Math.max(
                38,
                Math.round(tickFontSize * 2.1 + axisTitleSize + standoff + 5),
              )
            : Math.max(
                70,
                settings.tickFontSize * 3 + settings.axisTitleSize + 23,
              ),
        },
        paper_bgcolor: "#fff",
        plot_bgcolor: settings.chartBackground,
        title: heading
          ? { text: heading, font: { size: isMobile ? 12 : 15 }, x: 0.5 }
          : undefined,
        font: {
          family: "Arial, Helvetica, sans-serif",
          color: "#222222",
        },
        xaxis: {
          ...axis,
          title: {
            text: axisTitle(dataset, state, x, isMobile),
            standoff,
            font: {
              size: axisTitleSize,
              weight: settings.axisTitleWeight,
            },
          },
        },
        yaxis: {
          ...axis,
          title: {
            text: axisTitle(dataset, state, y, isMobile),
            standoff,
            font: {
              size: axisTitleSize,
              weight: settings.axisTitleWeight,
            },
          },
          scaleanchor: settings.equalScale ? "x" : undefined,
          scaleratio: 1,
        },
        uirevision: `${x}:${y}`,
        selectionrevision: `${x}:${y}:${state.selected.size === 0 ? "empty" : "selection"}`,
        hovermode: settings.hover === "off" ? false : "closest",
        hoverlabel: {
          bgcolor: "#fff",
          bordercolor: "#cccccc",
          font: { size: 12, color: "#222222" },
        },
        shapes: model.shapes,
        annotations: model.annotations,
      };
      const element = host.current;
      const revision = ++renderRevision.current;
      const axesKey = `${x}:${y}`;
      queue.current = queue.current
        .then(async () => {
          if (!element.isConnected || revision !== renderRevision.current)
            return;
          const previous = (element as unknown as PlotlyHTMLElement).layout;
          // Appearance, filtering and selection must never reset the user's view.
          // Read here, after queued zooms, rather than capturing stale ranges.
          const sameAxes = renderedAxes.current === axesKey;
          for (const axis of ["xaxis", "yaxis"] as const) {
            const range = sameAxes
              ? previous[axis]?.range
              : renderedAxes.current === ""
                ? props.initialViewport?.[
                    axis === "xaxis" ? "xRange" : "yRange"
                  ]
                : undefined;
            layout[axis] = {
              ...layout[axis],
              autorange: false,
              range: range
                ? [...range]
                : paddedRange(
                    dataset.samples.map(
                      (row) => row.pcs[axis === "xaxis" ? x : y],
                    ),
                  ),
            };
          }
          // Label dragging can also happen between scheduling and rendering.
          layout.annotations = model.annotations.map((annotation) => ({
            ...annotation,
            ...offsets.current.get(`${axesKey}:${annotation.name}`),
          }));
          await api.current!.react(
            element,
            model.traces,
            layout,
            configRef.current,
          );
          renderedAxes.current = axesKey;
        })
        .catch(() =>
          setError("Unable to render these coordinates. Try another PC pair."),
        );
    }, [ready, model, state.mode, isMobile]);
    const ranges = (all: boolean) => {
      if (!api.current || !host.current) return;
      const rows = all
          ? latest.current.dataset.samples
          : latest.current.samples,
        { x, y } = latest.current.state;
      const element = host.current;
      queue.current = queue.current
        .then(async () => {
          if (!element.isConnected) return;
          await api.current!.relayout(element, {
            "xaxis.range": paddedRange(rows.map((s) => s.pcs[x])),
            "yaxis.range": paddedRange(rows.map((s) => s.pcs[y])),
            "xaxis.autorange": false,
            "yaxis.autorange": false,
          });
        })
        .catch(() => setError("Unable to reset the axes."));
    };
    const snapshot = async (): Promise<ViewportSnapshot> => {
      await queue.current;
      if (!host.current || !api.current || !ready)
        throw new Error("The chart is still loading. Please try again.");
      const chart = host.current as unknown as PlotlyHTMLElement;
      const full = (chart as any)._fullLayout;
      return {
        xRange: [...full.xaxis.range],
        yRange: [...full.yaxis.range],
        offsets: [...offsets.current],
        width: host.current.clientWidth,
        height: host.current.clientHeight,
      };
    };
    const capturePng = async (): Promise<ChartImage> => {
      const view = await snapshot();
      const current = latest.current,
        chart = host.current as unknown as PlotlyHTMLElement;
      const layout = structuredClone(chart.layout),
        full = (chart as any)._fullLayout;
      layout.width = view.width;
      layout.height = view.height;
      for (const axis of ["xaxis", "yaxis"] as const)
        layout[axis] = {
          ...layout[axis],
          range: [...full[axis].range],
          domain: [...full[axis].domain],
        };
      const figure = buildImageFigure(
        current.dataset,
        current.samples,
        current.state,
        layout,
        offsets.current,
      );
      const target = document.createElement("div");
      target.dataset.exportChart = "true";
      target.style.cssText = `position:fixed;left:-20000px;top:0;width:${figure.layout.width}px;height:${figure.layout.height}px`;
      document.body.appendChild(target);
      try {
        await api.current!.newPlot(target, figure.data, figure.layout, {
          staticPlot: true,
        });
        const rendered = (target as any)._fullLayout;
        const plotBox = {
          x: rendered.xaxis._offset,
          y: rendered.yaxis._offset,
          width: rendered.xaxis._length,
          height: rendered.yaxis._length,
        };
        const bounds = target.getBoundingClientRect();
        let left = plotBox.x,
          top = plotBox.y,
          right = left + plotBox.width,
          bottom = top + plotBox.height;
        // Include only axis decorations, not export headings or application UI.
        for (const text of target.querySelectorAll(
          ".xtick text, .ytick text, .xtitle, .ytitle",
        )) {
          const r = text.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          left = Math.min(left, r.left - bounds.left);
          top = Math.min(top, r.top - bounds.top);
          right = Math.max(right, r.right - bounds.left);
          bottom = Math.max(bottom, r.bottom - bounds.top);
        }
        const axisBounds = {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        };
        const url = await api.current!.toImage(target, {
          format: "png",
          width: figure.layout.width!,
          height: figure.layout.height!,
          scale: 2,
        });
        return {
          url,
          width: figure.layout.width!,
          height: figure.layout.height!,
          plotBox,
          axisBounds,
        };
      } finally {
        api.current!.purge(target);
        target.remove();
      }
    };
    useImperativeHandle(
      ref,
      () => ({
        zoom(factor) {
          if (!api.current || !host.current) return;
          const element = host.current;
          queue.current = queue.current
            .then(async () => {
              if (!element.isConnected) return;
              const layout = (element as unknown as PlotlyHTMLElement).layout;
              const update: Record<string, number[] | boolean> = {};
              for (const axis of ["xaxis", "yaxis"] as const) {
                const range = layout[axis]?.range;
                if (!range) continue;
                update[`${axis}.range`] = zoomRange(range.map(Number), factor);
                update[`${axis}.autorange`] = false;
              }
              await api.current!.relayout(element, update);
            })
            .catch(() => setError("Unable to zoom. Try resetting the axes."));
        },
        reset() {
          ranges(true);
        },
        fit() {
          ranges(false);
        },
        capturePng,
        snapshot,
      }),
      [ready, dataset.name, state.x, state.y],
    );
    return (
      <div
        className={`plot-container ${state.settings.aspectRatio !== "full" ? "has-ratio" : ""}`}
        style={
          {
            "--plot-ratio":
              state.settings.aspectRatio === "full"
                ? 1
                : Number(state.settings.aspectRatio.split(":")[0]) /
                  Number(state.settings.aspectRatio.split(":")[1]),
          } as React.CSSProperties
        }
      >
        <div
          ref={host}
          className="plot"
          data-tool={state.mode}
          data-editing={state.inspector !== null ? "true" : undefined}
          aria-label={`Scatter plot of PC${state.x + 1} against PC${state.y + 1}, ${samples.length} samples`}
        />
        {!ready && !error && (
          <div className="plot-message" role="status">
            Preparing plot…
          </div>
        )}
        {error && (
          <div className="plot-message" role="alert">
            {error}
          </div>
        )}
        {ready && !samples.length && (
          <div className="plot-message">
            No visible samples. Show populations in the legend or clear your
            search.
          </div>
        )}
      </div>
    );
  },
);
