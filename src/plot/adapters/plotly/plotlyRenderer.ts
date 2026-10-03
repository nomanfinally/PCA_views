/**
 * Concrete Plotly Renderer & Lifecycle Controller
 *
 * Encapsulates the entire Plotly lifecycle (mount, react, relayout, resize, purge)
 * and isolates external components from vendor-specific DOM operations.
 */

import type { Layout, PlotlyHTMLElement } from "plotly.js";
import type { PlotSpec } from "../../spec/plotSpec";
import { loadPlotly, type PlotlyApi } from "./plotlyLoader";
import { mapSpecToPlotly } from "./plotlyMapper";

export interface PlotlyRendererEvents {
  onSelect?: (sampleKeys: number[]) => void;
  onAnnotationOffsetChange?: (
    annotationId: string,
    offset: { ax: number; ay: number },
  ) => void;
  onRangeChange?: (xRange: [number, number], yRange: [number, number]) => void;
  onError?: (error: Error) => void;
}

export interface ViewportSnapshot {
  xRange: [number, number];
  yRange: [number, number];
  width: number;
  height: number;
}

export class PlotlyRenderer {
  private container: HTMLElement | null = null;
  private api: PlotlyApi | null = null;
  private events: PlotlyRendererEvents;
  private isDisposed = false;
  private isReady = false;
  private currentAxesKey = "";
  private currentAspectRatio?: string;
  private currentEqualScale?: boolean;

  private queue: Promise<void> = Promise.resolve();

  constructor(events: PlotlyRendererEvents = {}) {
    this.events = events;
  }

  private enqueue<T>(action: () => Promise<T>): Promise<T | void> {
    const next = this.queue.then(async () => {
      if (this.isDisposed || !this.container || !this.api || !this.isReady) {
        return;
      }
      return action();
    });
    this.queue = next.then(
      () => {},
      () => {},
    );
    return next;
  }

  /**
   * Mounts the plot onto a container element with an initial PlotSpec.
   */
  public async mount(
    container: HTMLElement,
    spec: PlotSpec,
    sampleCount = 0,
  ): Promise<void> {
    this.container = container;
    this.isDisposed = false;

    try {
      this.api = await loadPlotly(sampleCount);
      if (this.isDisposed || !this.container) return;

      const { data, layout, config } = mapSpecToPlotly(spec);
      this.currentAxesKey = `${spec.layout.xaxis.title}:${spec.layout.yaxis.title}`;
      this.currentAspectRatio = spec.layout.aspectRatio;
      this.currentEqualScale = spec.layout.yaxis.scaleAnchor === "x";
      await this.api.newPlot(this.container, data, layout, config);

      if (this.isDisposed) {
        this.purge();
        return;
      }

      this.bindEvents();
      this.isReady = true;
    } catch (err) {
      if (!this.isDisposed) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.events.onError?.(error);
      }
    }
  }

  /**
   * Efficiently reconciles and redraws changes using Plotly.react.
   */
  public async update(spec: PlotSpec): Promise<void> {
    await this.enqueue(async () => {
      try {
        const chart = this.container as unknown as PlotlyHTMLElement;
        const previous = chart?.layout;

        const newAxesKey = `${spec.layout.xaxis.title}:${spec.layout.yaxis.title}`;
        const sameAxes = this.currentAxesKey === newAxesKey;
        const sameRatio = this.currentAspectRatio === spec.layout.aspectRatio;
        const sameEqualScale =
          this.currentEqualScale === (spec.layout.yaxis.scaleAnchor === "x");

        this.currentAxesKey = newAxesKey;
        this.currentAspectRatio = spec.layout.aspectRatio;
        this.currentEqualScale = spec.layout.yaxis.scaleAnchor === "x";

        // Viewport ranges can only be reused if axes, aspect ratio, and equalScale constraints are unchanged.
        // Changing aspect ratio or scale constraints necessitates re-fitting from base domain bounds to prevent
        // cumulative range compounding and plot implosion.
        const canReuseRanges =
          sameAxes &&
          sameRatio &&
          sameEqualScale &&
          Boolean(previous?.xaxis?.range) &&
          Boolean(previous?.yaxis?.range);

        const previousRanges = canReuseRanges
          ? {
              xRange: previous.xaxis.range as [number, number],
              yRange: previous.yaxis.range as [number, number],
            }
          : undefined;

        const { data, layout, config } = mapSpecToPlotly(spec, previousRanges);

        if (canReuseRanges && previous?.xaxis?.range && previous?.yaxis?.range) {
          layout.xaxis = {
            ...layout.xaxis,
            range: [...previous.xaxis.range],
            autorange: false,
          };
          layout.yaxis = {
            ...layout.yaxis,
            range: [...previous.yaxis.range],
            autorange: false,
          };
        }

        await this.api!.react(this.container!, data, layout, config);
      } catch (err) {
        if (!this.isDisposed) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.events.onError?.(error);
        }
      }
    });
  }

  /**
   * Directly updates layout properties without redrawing traces.
   */
  public async relayout(layoutUpdate: Partial<Layout>): Promise<void> {
    await this.enqueue(async () => {
      try {
        await this.api!.relayout(this.container!, layoutUpdate);
      } catch (err) {
        if (!this.isDisposed) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.events.onError?.(error);
        }
      }
    });
  }

  /**
   * Forces a resize recalculation when the container dimensions change.
   */
  public async resize(): Promise<void> {
    await this.enqueue(async () => {
      try {
        await this.api!.Plots.resize(this.container!);
      } catch {
        // Ignore transient resize errors
      }
    });
  }

  /**
   * Captures the current visible coordinate viewport ranges and dimensions.
   */
  public getViewportSnapshot(): ViewportSnapshot | null {
    if (!this.container) return null;
    const chart = this.container as any;
    const full = chart._fullLayout || chart.layout;
    const xRange = full?.xaxis?.range || chart?.layout?.xaxis?.range;
    const yRange = full?.yaxis?.range || chart?.layout?.yaxis?.range;

    if (!xRange || !yRange) return null;

    return {
      xRange: [xRange[0], xRange[1]],
      yRange: [yRange[0], yRange[1]],
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }

  /**
   * Retrieves the current layout of the rendered plot.
   */
  public getLayout(): Layout | null {
    if (!this.container) return null;
    const chart = this.container as unknown as PlotlyHTMLElement;
    return chart.layout || null;
  }

  /**
   * Captures a high-resolution raster image of the current plot.
   */
  public async toImage(
    options: {
      format?: "png" | "jpeg" | "webp" | "svg";
      width?: number;
      height?: number;
      scale?: number;
    } = {},
  ): Promise<string> {
    if (!this.container || !this.api || !this.isReady) {
      throw new Error("PlotlyRenderer is not ready for image capture.");
    }
    return await this.api.toImage(this.container, {
      format: options.format ?? "png",
      width: options.width ?? this.container.clientWidth,
      height: options.height ?? this.container.clientHeight,
      scale: options.scale ?? 2,
    });
  }

  /**
   * Tears down the plot instance and unbinds listeners.
   */
  public purge(): void {
    this.isDisposed = true;
    this.isReady = false;
    this.queue = Promise.resolve();

    if (this.container && this.api) {
      try {
        this.api.purge(this.container);
      } catch {
        // Safe to ignore purge cleanup failures
      }
    }

    this.container = null;
    this.api = null;
  }

  private bindEvents(): void {
    if (!this.container) return;
    const chart = this.container as unknown as PlotlyHTMLElement;

    // Selection box / lasso event
    chart.on?.("plotly_selected", (event: any) => {
      if (event?.points && (event.range || event.lassoPoints)) {
        const keys: number[] = Array.from(
          new Set(
            event.points
              .map((p: any) => p.customdata)
              .filter((key: any): key is number => typeof key === "number"),
          ),
        );
        this.events.onSelect?.(keys);
      }
    });

    // Annotation drag event & Range change events
    chart.on?.("plotly_relayout", (event: any) => {
      if (!event || typeof event !== "object") return;
      const hasAnnotationChange = Object.keys(event).some((k) =>
        k.startsWith("annotations["),
      );

      if (hasAnnotationChange && chart.layout.annotations) {
        for (const annotation of chart.layout.annotations as any[]) {
          if (
            annotation.name &&
            typeof annotation.ax === "number" &&
            typeof annotation.ay === "number"
          ) {
            this.events.onAnnotationOffsetChange?.(annotation.name, {
              ax: annotation.ax,
              ay: annotation.ay,
            });
          }
        }
      }

      const isRangeChange = Object.keys(event).some(
        (k) =>
          k.startsWith("xaxis.range") ||
          k.startsWith("yaxis.range") ||
          k === "xaxis.autorange" ||
          k === "yaxis.autorange",
      );

      if (isRangeChange) {
        const snap = this.getViewportSnapshot();
        if (snap) {
          this.events.onRangeChange?.(snap.xRange, snap.yRange);
        }
      }
    });
  }
}
