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
  onAnnotationOffsetChange?: (annotationId: string, offset: { ax: number; ay: number }) => void;
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

  constructor(events: PlotlyRendererEvents = {}) {
    this.events = events;
  }

  /**
   * Mounts the plot onto a container element with an initial PlotSpec.
   */
  public async mount(container: HTMLElement, spec: PlotSpec, sampleCount = 0): Promise<void> {
    this.container = container;
    this.isDisposed = false;

    try {
      this.api = await loadPlotly(sampleCount);
      if (this.isDisposed || !this.container) return;

      const { data, layout, config } = mapSpecToPlotly(spec);
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
    if (!this.container || !this.api || !this.isReady || this.isDisposed) return;

    try {
      const { data, layout, config } = mapSpecToPlotly(spec);
      await this.api.react(this.container, data, layout, config);
    } catch (err) {
      if (!this.isDisposed) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.events.onError?.(error);
      }
    }
  }

  /**
   * Directly updates layout properties without redrawing traces.
   */
  public async relayout(layoutUpdate: Partial<Layout>): Promise<void> {
    if (!this.container || !this.api || !this.isReady || this.isDisposed) return;

    try {
      await this.api.relayout(this.container, layoutUpdate);
    } catch (err) {
      if (!this.isDisposed) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.events.onError?.(error);
      }
    }
  }

  /**
   * Forces a resize recalculation when the container dimensions change.
   */
  public async resize(): Promise<void> {
    if (!this.container || !this.api || !this.isReady || this.isDisposed) return;

    try {
      await this.api.Plots.resize(this.container);
    } catch {
      // Ignore transient resize errors
    }
  }

  /**
   * Captures the current visible coordinate viewport ranges and dimensions.
   */
  public getViewportSnapshot(): ViewportSnapshot | null {
    if (!this.container) return null;
    const chart = this.container as unknown as PlotlyHTMLElement;
    const layout = chart.layout;

    if (!layout?.xaxis?.range || !layout?.yaxis?.range) return null;

    return {
      xRange: [layout.xaxis.range[0], layout.xaxis.range[1]],
      yRange: [layout.yaxis.range[0], layout.yaxis.range[1]],
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
  public async toImage(options: {
    format?: "png" | "jpeg" | "webp" | "svg";
    width?: number;
    height?: number;
    scale?: number;
  } = {}): Promise<string> {
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

    // Annotation drag event
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
    });
  }
}
